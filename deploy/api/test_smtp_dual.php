<?php
header('Content-Type: application/json');
require_once __DIR__ . '/index.php';

$db = getDb();

// Test first email (OTP)
$res1 = sendSmtpEmail('dsah56631@gmail.com', 'Director Test', 'Test 1: OTP Email', 'Testing OTP email delivery', $db);

// Wait 1 second
sleep(1);

// Test second email (Device Alert)
$res2 = sendSmtpEmail('dsah56631@gmail.com', 'Director Test', 'Test 2: Device Alert Email', 'Testing Device Alert delivery', $db);

$result = [
    'email_1_otp' => $res1,
    'email_2_device' => $res2
];

file_put_contents(__DIR__ . '/test_result.json', json_encode($result, JSON_PRETTY_PRINT));
echo json_encode($result);
