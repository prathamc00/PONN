<?php
/**
 * Transport and security header middleware.
 */

function isProductionEnv(): bool
{
    return strtolower(trim((string) env('APP_ENV', 'production'))) === 'production';
}

function isHttpsRequest(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }

    if ((int) ($_SERVER['SERVER_PORT'] ?? 0) === 443) {
        return true;
    }

    $forwardedProto = strtolower(trim((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));
    if ($forwardedProto === 'https') {
        return true;
    }

    return false;
}

function enforceHttpsIfRequired(): void
{
    $default = isProductionEnv() ? 'true' : 'false';
    $raw = strtolower(trim((string) env('ENFORCE_HTTPS', $default)));
    $mustEnforce = !in_array($raw, ['0', 'false', 'no', 'off'], true);

    if (!$mustEnforce || isHttpsRequest()) {
        return;
    }

    $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
    $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');

    if ($host === '') {
        return;
    }

    $target = 'https://' . $host . $uri;
    $status = in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD'], true) ? 301 : 308;

    logSecurityEvent('http_to_https_redirect', 'info', ['target' => $target], $status);

    header('Location: ' . $target, true, $status);
    exit;
}

function applySecurityHeaders(): void
{
    header('Referrer-Policy: no-referrer');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
    header('Cross-Origin-Opener-Policy: same-origin');
    header('Cross-Origin-Resource-Policy: same-site');
    header('X-Permitted-Cross-Domain-Policies: none');

    // API-only policy to reduce browser attack surface.
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");

    if (isHttpsRequest()) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    }
}
