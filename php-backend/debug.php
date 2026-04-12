<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>PHP is working! ✅</h2>";
echo "<p>PHP Version: " . phpversion() . "</p>";

// Test .env file
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    echo "<p style='color:green'>✅ .env file found</p>";
} else {
    echo "<p style='color:red'>❌ .env file NOT found</p>";
}

// Test DB connection
$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$env = [];
foreach ($lines as $line) {
    if (strpos($line, '=') !== false && strpos(trim($line), '#') !== 0) {
        [$k, $v] = explode('=', $line, 2);
        $env[trim($k)] = trim($v);
    }
}

echo "<p>DB_HOST: " . ($env['DB_HOST'] ?? 'NOT SET') . "</p>";
echo "<p>DB_NAME: " . ($env['DB_NAME'] ?? 'NOT SET') . "</p>";
echo "<p>DB_USER: " . ($env['DB_USER'] ?? 'NOT SET') . "</p>";

try {
    $pdo = new PDO(
        "mysql:host={$env['DB_HOST']};dbname={$env['DB_NAME']};charset=utf8mb4",
        $env['DB_USER'],
        $env['DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "<p style='color:green'>✅ Database connection successful!</p>";
    $count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    echo "<p style='color:green'>✅ Users in DB: $count</p>";
} catch (Exception $e) {
    echo "<p style='color:red'>❌ DB Error: " . $e->getMessage() . "</p>";
}

// Test Firebase JWT files
$jwtFile = __DIR__ . '/helpers/Firebase/JWT/JWT.php';
if (file_exists($jwtFile)) {
    echo "<p style='color:green'>✅ Firebase JWT files found</p>";
} else {
    echo "<p style='color:red'>❌ Firebase JWT files NOT found</p>";
}

// Test PHPMailer files
$mailerFile = __DIR__ . '/helpers/PHPMailer/PHPMailer.php';
if (file_exists($mailerFile)) {
    echo "<p style='color:green'>✅ PHPMailer files found</p>";
} else {
    echo "<p style='color:red'>❌ PHPMailer files NOT found</p>";
}
