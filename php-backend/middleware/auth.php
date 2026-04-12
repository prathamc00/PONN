<?php
/**
 * Auth middleware
 * Replaces auth.middleware.js — protect(), optionalAuth(), adminOnly(), staffOnly()
 *
 * Sets $GLOBALS['authUser'] on success (equivalent to req.user in Express).
 */

// ── Global auth user storage ──────────────────────────────────────────────────
$GLOBALS['authUser'] = null;

function getAuthUser(): ?array {
    return $GLOBALS['authUser'];
}

function setAuthUser(?array $user): void {
    $GLOBALS['authUser'] = $user;
}

// ── Load user from DB by ID ───────────────────────────────────────────────────
function loadUserById(int $id): ?array {
    $db   = getDb();
    $stmt = $db->prepare('SELECT id, name, email, college, branch, semester, phone, role, approvalStatus, aadhaarVerified, aadhaarCardPath, createdAt FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch() ?: null;
    if ($user) {
        $user['_id'] = (string) $user['id'];
    }
    return $user;
}

// ── Verify and load user from Bearer token ────────────────────────────────────
function loadUserFromToken(string $token): array {
    $decoded = jwtVerify($token); // throws RuntimeException on failure
    $user    = loadUserById((int) $decoded['id']);

    if (!$user) {
        errorResponse('User not found', 401);
    }

    return $user;
}

// ── Check instructor approval ─────────────────────────────────────────────────
function ensureApprovedAccess(array $user): void {
    $approvalStatus = $user['approvalStatus'] ?? 'approved';
    if ($user['role'] === 'instructor' && $approvalStatus !== 'approved') {
        $message = $approvalStatus === 'rejected'
            ? 'Your instructor account has been rejected. Please contact the admin.'
            : 'Your instructor account is pending admin approval.';
        errorResponse($message, 403);
    }
}

// ── protect() — require valid JWT ────────────────────────────────────────────
function protect(): void {
    $token = getBearerToken();
    if (!$token) {
        errorResponse('Not authorized, no token', 401);
    }

    try {
        $user = loadUserFromToken($token);
        ensureApprovedAccess($user);
        setAuthUser($user);
    } catch (RuntimeException $e) {
        errorResponse($e->getMessage() ?: 'Not authorized, token invalid', $e->getCode() ?: 401);
    }
}

// ── optionalAuth() — load user if token exists, don't block if missing ────────
function optionalAuth(): void {
    $token = getBearerToken();
    if (!$token) return;

    try {
        $user = loadUserFromToken($token);
        ensureApprovedAccess($user);
        setAuthUser($user);
    } catch (RuntimeException $e) {
        setAuthUser(null);
    }
}

// ── adminOnly() ───────────────────────────────────────────────────────────────
function adminOnly(): void {
    $user = getAuthUser();
    if (!$user || $user['role'] !== 'admin') {
        errorResponse('Access denied. Admin only.', 403);
    }
}

// ── staffOnly() (admin OR approved instructor) ────────────────────────────────
function staffOnly(): void {
    $user = getAuthUser();
    if (!$user) {
        errorResponse('Access denied.', 403);
    }
    $approvalStatus = $user['approvalStatus'] ?? 'approved';
    if ($user['role'] === 'admin') return;
    if ($user['role'] === 'instructor' && $approvalStatus === 'approved') return;
    errorResponse('Access denied. Approved instructors or admins only.', 403);
}

// ── roleIn() ─────────────────────────────────────────────────────────────────
function roleIn(string ...$roles): void {
    $user = getAuthUser();
    if (!$user || !in_array($user['role'], $roles, true)) {
        errorResponse('Access denied. Required role(s): ' . implode(', ', $roles), 403);
    }
}
