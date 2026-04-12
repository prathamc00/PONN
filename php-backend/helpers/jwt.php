<?php
/**
 * JWT helpers — wraps firebase/php-jwt (installed via Composer)
 * Equivalent to jsonwebtoken usage in auth.controller.js and auth.middleware.js
 */

require_once __DIR__ . '/Firebase/JWT/JWTExceptionWithPayloadInterface.php';
require_once __DIR__ . '/Firebase/JWT/BeforeValidException.php';
require_once __DIR__ . '/Firebase/JWT/ExpiredException.php';
require_once __DIR__ . '/Firebase/JWT/SignatureInvalidException.php';
require_once __DIR__ . '/Firebase/JWT/Key.php';
require_once __DIR__ . '/Firebase/JWT/JWT.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

/**
 * Sign a JWT token — equivalent to jwt.sign({ id }, secret, { expiresIn })
 */
function jwtSign(int $userId, string $expiresIn = '7d'): string
{
    $secret = env('JWT_SECRET', 'change_me_in_production');

    // Parse "7d", "15m" style expiry strings
    $seconds = parseExpiry($expiresIn);

    $payload = [
        'id' => $userId,
        'iat' => time(),
        'exp' => time() + $seconds,
    ];

    return JWT::encode($payload, $secret, 'HS256');
}

/**
 * Verify a JWT token — equivalent to jwt.verify(token, secret)
 * Returns decoded payload array or throws on failure.
 */
function jwtVerify(string $token): array
{
    $secret = env('JWT_SECRET', 'change_me_in_production');
    try {
        $decoded = JWT::decode($token, new Key($secret, 'HS256'));
        return (array) $decoded;
    } catch (ExpiredException $e) {
        throw new RuntimeException('Token expired', 401);
    } catch (SignatureInvalidException $e) {
        throw new RuntimeException('Invalid token signature', 401);
    } catch (Exception $e) {
        throw new RuntimeException('Invalid token', 401);
    }
}

/**
 * Decode WITHOUT verifying (for password reset flow)
 * Equivalent to jwt.decode(token)
 */
function jwtDecode(string $token): ?array
{
    try {
        $parts = explode('.', $token);
        if (count($parts) !== 3)
            return null;
        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
        return $payload ?: null;
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Sign with a custom secret (for password reset tokens)
 * Equivalent to jwt.sign({ id }, secret + user.password, { expiresIn: '15m' })
 */
function jwtSignWithSecret(int $userId, string $customSecret, string $expiresIn = '15m'): string
{
    $seconds = parseExpiry($expiresIn);
    $payload = [
        'id' => $userId,
        'iat' => time(),
        'exp' => time() + $seconds,
    ];
    return JWT::encode($payload, $customSecret, 'HS256');
}

/**
 * Verify with a custom secret (for password reset validation)
 * Equivalent to jwt.verify(token, secret + user.password)
 */
function jwtVerifyWithSecret(string $token, string $customSecret): array
{
    try {
        $decoded = JWT::decode($token, new Key($customSecret, 'HS256'));
        return (array) $decoded;
    } catch (Exception $e) {
        throw new RuntimeException('Invalid or expired reset token', 400);
    }
}

/**
 * Parse duration strings like "7d", "15m", "1h" into seconds
 */
function parseExpiry(string $expiry): int
{
    if (is_numeric($expiry))
        return (int) $expiry;
    $unit = strtolower(substr($expiry, -1));
    $value = (int) substr($expiry, 0, -1);
    return match ($unit) {
        's' => $value,
        'm' => $value * 60,
        'h' => $value * 3600,
        'd' => $value * 86400,
        'w' => $value * 604800,
        default => 7 * 86400,
    };
}
