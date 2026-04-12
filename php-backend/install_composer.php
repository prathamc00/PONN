<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Installing Composer Dependencies...</h1>";

// 1. Download Composer
echo "<p>Downloading Composer...</p>";
$installer = file_get_contents('https://getcomposer.org/installer');
file_put_contents('composer-setup.php', $installer);

// 2. Run the installer
echo "<p>Installing Composer...</p>";
$output = [];
exec('php composer-setup.php 2>&1', $output);
echo "<pre>" . implode("\n", $output) . "</pre>";

// 3. Run composer install
echo "<p>Running 'composer install'...</p>";
putenv('COMPOSER_HOME=' . __DIR__ . '/.composer');
$output2 = [];
exec('php composer.phar install 2>&1', $output2);
echo "<pre>" . implode("\n", $output2) . "</pre>";

echo "<h2>Done! If everything above looks good, your backend is ready!</h2>";
?>
