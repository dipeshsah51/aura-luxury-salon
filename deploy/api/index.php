<?php
/**
 * AURA Luxury Salon API - Self-Contained PHP Backend
 * Compatible with Apache & Shared PHP Hosting (InfinityFree, cPanel, etc.)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbFile = __DIR__ . '/salon_db.json';

function getDb() {
    global $dbFile;
    if (!file_exists($dbFile)) {
        return [
            'salonInfo' => [],
            'workingHours' => [],
            'blockedDates' => [],
            'services' => [],
            'staff' => [],
            'appointments' => [],
            'customers' => [],
            'users' => [],
            'notifications' => []
        ];
    }
    $content = file_get_contents($dbFile);
    return json_decode($content, true) ?: [];
}

function saveDb($db) {
    global $dbFile;
    file_put_contents($dbFile, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function generateBookingCode() {
    return 'AUR-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 4)) . '-' . rand(100, 999);
}

function recordNotification(&$db, $type, $recipient, $message, $meta = []) {
    if (!isset($db['notifications'])) {
        $db['notifications'] = [];
    }
    $notif = [
        'id' => 'notif-' . round(microtime(true) * 1000) . '-' . rand(10, 99),
        'type' => $type,
        'recipient' => $recipient,
        'message' => $message,
        'status' => 'sent',
        'sentAt' => gmdate('Y-m-d\TH:i:s\Z'),
        'meta' => $meta
    ];
    array_unshift($db['notifications'], $notif);
    return $notif;
}

function sendSmtpEmail($toEmail, $toName, $subject, $bodyText, &$db, $plainText = '') {
    $cfg = $db['smtpConfig'] ?? [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'user' => 'dipeshkumarsah2061@gmail.com',
        'pass' => getenv('SMTP_PASS') ?: ($db['smtpConfig']['pass'] ?? 'YOUR_GMAIL_APP_PASSWORD')
    ];

    $delivered = false;
    $method = 'none';
    $logMsg = '';
    $isHtml = (strpos($bodyText, '<html') !== false || strpos($bodyText, '<div') !== false || strpos($bodyText, '<table') !== false);

    if (empty($plainText)) {
        if ($isHtml) {
            $plainText = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</div>', '</tr>', '</td>'], "\n", $bodyText));
            $plainText = preg_replace("/\n{3,}/", "\n\n", trim($plainText));
        } else {
            $plainText = $bodyText;
        }
    }

    $boundary = "----=_Part_" . md5(uniqid((string)microtime(true), true));
    $dateStr = date('r');
    $msgId = "<" . time() . "." . bin2hex(random_bytes(8)) . "@auraa.kesug.com>";
    $fromHeader = "AURA Salon <" . $cfg['user'] . ">";
    $cleanToName = preg_replace('/[^\w\s]/', '', $toName ?: 'User');
    $toHeader = $cleanToName . " <" . $toEmail . ">";

    // If Google App Password is provided, send via live SMTP socket with TLS
    if (!empty($cfg['user']) && !empty($cfg['pass'])) {
        $host = !empty($cfg['host']) ? $cfg['host'] : 'smtp.gmail.com';
        $port = !empty($cfg['port']) ? intval($cfg['port']) : 587;

        $fp = @fsockopen($host, $port, $errno, $errstr, 10);
        if ($fp) {
            $banner = fgets($fp, 512);
            fputs($fp, "EHLO auraa.kesug.com\r\n");
            while($line = fgets($fp, 512)) { if(substr($line, 3, 1) == " ") break; }

            fputs($fp, "STARTTLS\r\n");
            $tls_resp = fgets($fp, 512);
            @stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

            fputs($fp, "EHLO auraa.kesug.com\r\n");
            while($line = fgets($fp, 512)) { if(substr($line, 3, 1) == " ") break; }

            fputs($fp, "AUTH LOGIN\r\n");
            $prompt1 = fgets($fp, 512);

            fputs($fp, base64_encode($cfg['user']) . "\r\n");
            $prompt2 = fgets($fp, 512);

            fputs($fp, base64_encode(str_replace(' ', '', $cfg['pass'])) . "\r\n");
            $auth_result = fgets($fp, 512);

            if (strpos($auth_result, "235") !== false) {
                // AUTH Successful! Deliver directly to user's Gmail
                fputs($fp, "MAIL FROM:<" . $cfg['user'] . ">\r\n");
                $m1 = fgets($fp, 512);
                fputs($fp, "RCPT TO:<" . $toEmail . ">\r\n");
                $m2 = fgets($fp, 512);
                fputs($fp, "DATA\r\n");
                $m3 = fgets($fp, 512);

                if ($isHtml) {
                    $headers = "From: " . $fromHeader . "\r\n" .
                               "To: " . $toHeader . "\r\n" .
                               "Reply-To: " . $cfg['user'] . "\r\n" .
                               "Date: " . $dateStr . "\r\n" .
                               "Message-ID: " . $msgId . "\r\n" .
                               "Subject: " . $subject . "\r\n" .
                               "MIME-Version: 1.0\r\n" .
                               "Auto-Submitted: auto-generated\r\n" .
                               "X-Auto-Response-Suppress: All\r\n" .
                               "X-Mailer: AURA-Auth-Service/1.0\r\n" .
                               "Content-Type: multipart/alternative; boundary=\"" . $boundary . "\"\r\n\r\n";

                    $mimeBody = "--" . $boundary . "\r\n" .
                                "Content-Type: text/plain; charset=UTF-8\r\n" .
                                "Content-Transfer-Encoding: 7bit\r\n\r\n" .
                                $plainText . "\r\n\r\n" .
                                "--" . $boundary . "\r\n" .
                                "Content-Type: text/html; charset=UTF-8\r\n" .
                                "Content-Transfer-Encoding: 7bit\r\n\r\n" .
                                $bodyText . "\r\n\r\n" .
                                "--" . $boundary . "--\r\n";
                } else {
                    $headers = "From: " . $fromHeader . "\r\n" .
                               "To: " . $toHeader . "\r\n" .
                               "Reply-To: " . $cfg['user'] . "\r\n" .
                               "Date: " . $dateStr . "\r\n" .
                               "Message-ID: " . $msgId . "\r\n" .
                               "Subject: " . $subject . "\r\n" .
                               "MIME-Version: 1.0\r\n" .
                               "Auto-Submitted: auto-generated\r\n" .
                               "X-Auto-Response-Suppress: All\r\n" .
                               "X-Mailer: AURA-Auth-Service/1.0\r\n" .
                               "Content-Type: text/plain; charset=UTF-8\r\n\r\n";

                    $mimeBody = $plainText . "\r\n";
                }

                $fullMessage = $headers . $mimeBody;
                $normalizedBody = str_replace(["\r\n", "\r", "\n"], "\r\n", $fullMessage);
                fputs($fp, $normalizedBody . "\r\n.\r\n");
                $data_res = fgets($fp, 512);
                fputs($fp, "QUIT\r\n");
                fclose($fp);

                if (strpos($data_res, "250") !== false) {
                    $delivered = true;
                    $method = 'gmail_smtp';
                    $logMsg = 'Delivered to ' . $toEmail . ' via Gmail SMTP';
                } else {
                    $logMsg = 'Data rejected: ' . trim($data_res);
                }
            } else {
                $logMsg = 'Auth failed: ' . trim($auth_result);
                fputs($fp, "QUIT\r\n");
                fclose($fp);
            }
        } else {
            $logMsg = 'SMTP connect failed: ' . $errstr;
        }
    }

    // Fallback: Attempt PHP mail()
    if (!$delivered) {
        $headers = "From: " . $fromHeader . "\r\n" .
                   "Reply-To: " . $cfg['user'] . "\r\n" .
                   "Date: " . $dateStr . "\r\n" .
                   "Message-ID: " . $msgId . "\r\n" .
                   "MIME-Version: 1.0\r\n" .
                   "Auto-Submitted: auto-generated\r\n" .
                   "X-Mailer: PHP/" . phpversion() . "\r\n";

        if ($isHtml) {
            $headers .= "Content-Type: multipart/alternative; boundary=\"" . $boundary . "\"";
            $bodyToSend = $mimeBody;
        } else {
            $headers .= "Content-Type: text/plain; charset=UTF-8";
            $bodyToSend = $plainText;
        }

        $mailSuccess = @mail($toEmail, $subject, $bodyToSend, $headers);
        if ($mailSuccess) {
            $delivered = true;
            $method = 'php_mail';
        }
    }

    return [
        'delivered' => $delivered,
        'method' => $method,
        'log' => $logMsg
    ];
}



// Parse request path
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Normalize uri: extract portion after /api
$pos = strpos($requestUri, '/api');
$path = ($pos !== false) ? substr($requestUri, $pos + 4) : $requestUri;
$path = '/' . trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Router
try {
    $db = getDb();

    // DIAGNOSTIC ROUTE
    if ($path === '/debug/network') {
        $ch = curl_init('https://httpbin.org/get');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 4);
        $curl_res = curl_exec($ch);
        $curl_err = curl_error($ch);
        curl_close($ch);

        $fp587 = @fsockopen('smtp.gmail.com', 587, $errno587, $errstr587, 4);
        $sock587 = $fp587 ? true : false;
        if ($fp587) fclose($fp587);

        $fp465 = @fsockopen('ssl://smtp.gmail.com', 465, $errno465, $errstr465, 4);
        $sock465 = $fp465 ? true : false;
        if ($fp465) fclose($fp465);

        $smtpAuthResult = "failed_to_connect";
        $fp = @fsockopen('smtp.gmail.com', 587, $errno, $errstr, 4);
        if ($fp) {
            $banner = fgets($fp, 512);
            fputs($fp, "EHLO auraa.kesug.com\r\n");
            while($line = fgets($fp, 512)) { if(substr($line, 3, 1) == " ") break; }
            fputs($fp, "STARTTLS\r\n");
            $tls_res = fgets($fp, 512);
            @stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            fputs($fp, "EHLO auraa.kesug.com\r\n");
            while($line = fgets($fp, 512)) { if(substr($line, 3, 1) == " ") break; }
            fputs($fp, "AUTH LOGIN\r\n");
            $auth_prompt = fgets($fp, 512);
            fputs($fp, base64_encode("dsah56631@gmail.com") . "\r\n");
            $user_resp = fgets($fp, 512);
            fputs($fp, base64_encode("REDACTED_PASSWORD") . "\r\n");
            $pass_resp = fgets($fp, 512);
            fputs($fp, "QUIT\r\n");
            fclose($fp);
            $smtpAuthResult = [
                'auth_prompt' => trim($auth_prompt),
                'user_resp' => trim($user_resp),
                'pass_resp' => trim($pass_resp)
            ];
        }

        echo json_encode([
            'curl_https' => !empty($curl_res),
            'curl_error' => $curl_err,
            'smtp_auth_result' => $smtpAuthResult
        ]);
        exit;
    }

    // 1. SALON INFO
    if ($path === '/salon') {
        if ($method === 'GET') {
            echo json_encode(['salonInfo' => $db['salonInfo'], 'workingHours' => $db['workingHours']]);
            exit;
        } elseif ($method === 'PUT') {
            $db['salonInfo'] = array_merge($db['salonInfo'], $input);
            saveDb($db);
            echo json_encode(['message' => 'Salon information updated', 'salonInfo' => $db['salonInfo']]);
            exit;
        }
    }

    // 2. AUTHENTICATION
    if ($path === '/auth/login' && $method === 'POST') {
        $email = strtolower(trim($input['email'] ?? ''));
        $password = $input['password'] ?? '';
        $found = null;
        foreach ($db['users'] as $u) {
            if (strtolower($u['email']) === $email && $u['password'] === $password) {
                $found = $u;
                break;
            }
        }
        if (!$found) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid email or password.']);
            exit;
        }

        // MANDATORY 2FA OTP VERIFICATION FOR DIRECTOR / ADMIN
        if (($found['role'] ?? '') === 'admin' || $email === 'dsah56631@gmail.com') {
            $otpCode = (string)rand(100000, 999999);
            $expiresAt = time() + 600; // 10 minutes

            if (!isset($db['otps'])) $db['otps'] = [];
            $db['otps'] = array_values(array_filter($db['otps'], fn($item) => strtolower($item['email'] ?? '') !== $email));
            $db['otps'][] = [
                'email' => $email,
                'code' => $otpCode,
                'purpose' => 'admin_login',
                'expiresAt' => $expiresAt,
                'createdAt' => time(),
                'attempts' => 0
            ];

            // Send Security OTP directly to the Director Gmail
            $subject = "Your AURA verification code is " . $otpCode;
            $emailPlain = "Hello " . ($found['name'] ?? 'Salon Director') . ",\n\n"
                . "Your AURA verification code is: " . $otpCode . "\n\n"
                . "This verification code is valid for 10 minutes.\n"
                . "For your security, do not share this code with anyone.\n\n"
                . "Warm regards,\n"
                . "AURA Luxury Salon & Bridal Lounge\n"
                . "Ramapuram, Chennai 600089\n"
                . "Helpline: +91 9360449096";

            $emailHtml = '<!DOCTYPE html>'
                . '<html lang="en">'
                . '<head><meta charset="utf-8"><title>AURA Verification Code</title></head>'
                . '<body style="margin:0;padding:24px 12px;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.5;">'
                . '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">'
                . '<tr><td style="padding:24px 20px 18px;text-align:center;background-color:#0f172a;border-bottom:3px solid #d4af37;">'
                . '<h1 style="margin:0;font-family:Georgia,serif;font-size:24px;letter-spacing:6px;color:#d4af37;text-transform:uppercase;">A U R A</h1>'
                . '<p style="margin:4px 0 0;font-size:11px;letter-spacing:2px;color:#cbd5e1;text-transform:uppercase;">Luxury Salon &amp; Bridal Lounge</p>'
                . '</td></tr>'
                . '<tr><td style="padding:28px 24px 20px;">'
                . '<p style="margin:0 0 14px;font-size:16px;font-weight:600;color:#0f172a;">Hello ' . htmlspecialchars($found['name'] ?? 'Salon Director') . ',</p>'
                . '<p style="margin:0 0 18px;font-size:14px;color:#475569;line-height:1.6;">Use the following verification code to complete your login to <strong>AURA Salon</strong>:</p>'
                . '<div style="text-align:center;margin:24px 0;">'
                . '<div style="display:inline-block;padding:14px 32px;background:#f8fafc;border:2px solid #cbd5e1;border-radius:10px;font-size:36px;font-weight:700;letter-spacing:8px;color:#0f172a;font-family:\'Courier New\',Courier,monospace;">'
                . $otpCode
                . '</div>'
                . '</div>'
                . '<p style="margin:18px 0 6px;font-size:13px;color:#64748b;line-height:1.5;text-align:center;">This code will expire in <strong>10 minutes</strong>.<br>If you did not request this code, you can safely ignore this email.</p>'
                . '</td></tr>'
                . '<tr><td style="padding:16px 20px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;line-height:1.5;">'
                . 'AURA Luxury Salon &amp; Bridal Lounge • Ramapuram, Chennai 600089<br>'
                . 'Secure Helpline: +91 9360449096'
                . '</td></tr>'
                . '</table></body></html>';

            // ONLY deliver the single 6-digit Security OTP directly to the Director Gmail
            sendSmtpEmail($email, $found['name'] ?? 'Salon Director', $subject, $emailHtml, $db, $emailPlain);

            saveDb($db);

            echo json_encode([
                'success' => true,
                'requiresOtp' => true,
                'email' => $email,
                'role' => 'admin',
                'user' => [
                    'id' => $found['id'],
                    'name' => $found['name'],
                    'email' => $found['email'],
                    'role' => 'admin'
                ],
                'message' => 'Director Two-Factor verification code dispatched to your Gmail (' . $email . ').'
            ]);
            exit;
        }

        unset($found['password']);
        echo json_encode([
            'token' => 'aura-token-' . $found['id'] . '-' . time(),
            'user' => $found
        ]);
        exit;
    }

    if ($path === '/auth/register' && $method === 'POST') {
        $name = trim($input['name'] ?? '');
        $email = strtolower(trim($input['email'] ?? ''));
        $password = $input['password'] ?? '';
        $phone = trim($input['phone'] ?? '');

        if (!$name || !$email || !$password) {
            http_response_code(400);
            echo json_encode(['message' => 'Name, email, and password are required.']);
            exit;
        }

        foreach ($db['users'] as $u) {
            if (strtolower($u['email']) === $email) {
                http_response_code(400);
                echo json_encode(['message' => 'An account with this email already exists.']);
                exit;
            }
        }

        $newUser = [
            'id' => 'usr-cust-' . round(microtime(true) * 1000),
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'phone' => $phone,
            'role' => 'customer'
        ];
        $db['users'][] = $newUser;

        // Ensure customer directory record
        $custExists = false;
        foreach ($db['customers'] as $c) {
            if (strtolower($c['email']) === $email) {
                $custExists = true;
                break;
            }
        }
        if (!$custExists) {
            $db['customers'][] = [
                'id' => 'cust-' . round(microtime(true) * 1000),
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'totalVisits' => 0,
                'totalSpent' => 0,
                'lastVisit' => null,
                'vipStatus' => false,
                'notes' => 'Newly registered member'
            ];
        }

        saveDb($db);
        unset($newUser['password']);
        http_response_code(201);
        echo json_encode([
            'token' => 'aura-token-' . $newUser['id'] . '-' . time(),
            'user' => $newUser
        ]);
        exit;
    }

    // 2B. OTP AUTHENTICATION & VERIFICATION
    if ($path === '/auth/send-otp' && $method === 'POST') {
        $email = strtolower(trim($input['email'] ?? ''));
        $purpose = trim($input['purpose'] ?? 'register');
        $name = trim($input['name'] ?? '');

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['message' => 'A valid email address is required.']);
            exit;
        }

        if ($purpose === 'register') {
            foreach ($db['users'] as $u) {
                if (strtolower($u['email']) === $email) {
                    http_response_code(400);
                    echo json_encode(['message' => 'An account with this email already exists. Please sign in instead.']);
                    exit;
                }
            }
        }

        if ($purpose === 'login' || $purpose === 'admin_login') {
            $foundUser = false;
            foreach ($db['users'] as $u) {
                if (strtolower($u['email']) === $email) {
                    $foundUser = true;
                    if (!$name && !empty($u['name'])) $name = $u['name'];
                    break;
                }
            }
            if (!$foundUser) {
                http_response_code(404);
                echo json_encode(['message' => 'No account found with this email. Please check your credentials.']);
                exit;
            }
        }

        // Generate 6-digit OTP code
        $otpCode = (string)rand(100000, 999999);
        $expiresAt = time() + (10 * 60); // 10 minutes

        if (!isset($db['otps'])) {
            $db['otps'] = [];
        }

        // Clear previous OTP for this email
        $db['otps'] = array_values(array_filter($db['otps'], function($item) use ($email) {
            return strtolower($item['email'] ?? '') !== $email;
        }));

        $db['otps'][] = [
            'email' => $email,
            'code' => $otpCode,
            'purpose' => $purpose,
            'expiresAt' => $expiresAt,
            'createdAt' => time(),
            'attempts' => 0
        ];

        $subject = "Your AURA verification code is " . $otpCode;
        $clientName = $name ? $name : ($purpose === 'admin_login' ? 'Salon Director' : ($purpose === 'login' ? 'Valued Client' : 'Member'));

        $emailPlain = "Hello " . $clientName . ",\n\n"
            . "Your AURA verification code is: " . $otpCode . "\n\n"
            . "This verification code is valid for 10 minutes.\n"
            . "For your security, do not share this code with anyone.\n\n"
            . "Warm regards,\n"
            . "AURA Luxury Salon & Bridal Lounge\n"
            . "Ramapuram, Chennai 600089\n"
            . "Helpline: +91 9360449096";

        $emailHtml = '<!DOCTYPE html>'
            . '<html lang="en">'
            . '<head><meta charset="utf-8"><title>AURA Verification Code</title></head>'
            . '<body style="margin:0;padding:24px 12px;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.5;">'
            . '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">'
            . '<tr><td style="padding:24px 20px 18px;text-align:center;background-color:#0f172a;border-bottom:3px solid #d4af37;">'
            . '<h1 style="margin:0;font-family:Georgia,serif;font-size:24px;letter-spacing:6px;color:#d4af37;text-transform:uppercase;">A U R A</h1>'
            . '<p style="margin:4px 0 0;font-size:11px;letter-spacing:2px;color:#cbd5e1;text-transform:uppercase;">Luxury Salon &amp; Bridal Lounge</p>'
            . '</td></tr>'
            . '<tr><td style="padding:28px 24px 20px;">'
            . '<p style="margin:0 0 14px;font-size:16px;font-weight:600;color:#0f172a;">Hello ' . htmlspecialchars($clientName) . ',</p>'
            . '<p style="margin:0 0 18px;font-size:14px;color:#475569;line-height:1.6;">Use the following verification code to complete your verification with <strong>AURA Salon</strong>:</p>'
            . '<div style="text-align:center;margin:24px 0;">'
            . '<div style="display:inline-block;padding:14px 32px;background:#f8fafc;border:2px solid #cbd5e1;border-radius:10px;font-size:36px;font-weight:700;letter-spacing:8px;color:#0f172a;font-family:\'Courier New\',Courier,monospace;">'
            . $otpCode
            . '</div>'
            . '</div>'
            . '<p style="margin:18px 0 6px;font-size:13px;color:#64748b;line-height:1.5;text-align:center;">This code will expire in <strong>10 minutes</strong>.<br>If you did not request this code, you can safely ignore this email.</p>'
            . '</td></tr>'
            . '<tr><td style="padding:16px 20px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;line-height:1.5;">'
            . 'AURA Luxury Salon &amp; Bridal Lounge • Ramapuram, Chennai 600089<br>'
            . 'Secure Helpline: +91 9360449096'
            . '</td></tr>'
            . '</table></body></html>';

        // Dispatch email directly to the user's Gmail address (NOT admin)
        $deliveryResult = sendSmtpEmail($email, $clientName, $subject, $emailHtml, $db, $emailPlain);
        saveDb($db);

        // DO NOT return the OTP code to the browser; user must open Gmail to see it
        echo json_encode([
            'success' => true,
            'message' => 'Verification code sent to ' . $email . '. Please check your Gmail inbox.',
            'email' => $email,
            'delivered' => $deliveryResult['delivered'],
            'deliveryMethod' => $deliveryResult['method'],
            'deliveryLog' => $deliveryResult['log'],
            'expiresInSeconds' => 600
        ]);
        exit;
    }

    if ($path === '/auth/verify-otp-register' && $method === 'POST') {
        $name = trim($input['name'] ?? '');
        $email = strtolower(trim($input['email'] ?? ''));
        $password = $input['password'] ?? '';
        $phone = trim($input['phone'] ?? '');
        $otp = trim($input['otp'] ?? '');

        if (!$email || !$otp) {
            http_response_code(400);
            echo json_encode(['message' => 'Email and OTP code are required.']);
            exit;
        }

        if (!isset($db['otps'])) $db['otps'] = [];

        $otpIndex = -1;
        foreach ($db['otps'] as $idx => $record) {
            if (strtolower($record['email'] ?? '') === $email) {
                $otpIndex = $idx;
                break;
            }
        }

        if ($otpIndex === -1) {
            http_response_code(400);
            echo json_encode(['message' => 'No verification code requested or code expired. Please request a new code.']);
            exit;
        }

        $record = $db['otps'][$otpIndex];
        if (time() > ($record['expiresAt'] ?? 0)) {
            array_splice($db['otps'], $otpIndex, 1);
            saveDb($db);
            http_response_code(400);
            echo json_encode(['message' => 'Verification code has expired. Please request a new code.']);
            exit;
        }

        if (($record['code'] ?? '') !== $otp) {
            $db['otps'][$otpIndex]['attempts'] = ($record['attempts'] ?? 0) + 1;
            if ($db['otps'][$otpIndex]['attempts'] >= 5) {
                array_splice($db['otps'], $otpIndex, 1);
                saveDb($db);
                http_response_code(400);
                echo json_encode(['message' => 'Too many failed attempts. Please request a new code.']);
                exit;
            }
            saveDb($db);
            http_response_code(400);
            echo json_encode(['message' => 'Incorrect verification code. Please check your email and try again.']);
            exit;
        }

        // Remove used OTP
        array_splice($db['otps'], $otpIndex, 1);

        foreach ($db['users'] as $u) {
            if (strtolower($u['email']) === $email) {
                http_response_code(400);
                echo json_encode(['message' => 'An account with this email already exists.']);
                exit;
            }
        }

        $newUser = [
            'id' => 'usr-cust-' . round(microtime(true) * 1000),
            'name' => $name ?: 'Haute Member',
            'email' => $email,
            'password' => $password ?: 'AuraClient@2026',
            'phone' => $phone,
            'role' => 'customer',
            'emailVerified' => true
        ];
        $db['users'][] = $newUser;

        $custExists = false;
        foreach ($db['customers'] as $c) {
            if (strtolower($c['email']) === $email) {
                $custExists = true;
                break;
            }
        }
        if (!$custExists) {
            $db['customers'][] = [
                'id' => 'cust-' . round(microtime(true) * 1000),
                'name' => $newUser['name'],
                'email' => $email,
                'phone' => $phone,
                'totalVisits' => 0,
                'totalSpent' => 0,
                'lastVisit' => null,
                'vipStatus' => false,
                'notes' => 'Newly registered member (Email Verified via OTP)'
            ];
        }

        saveDb($db);
        unset($newUser['password']);
        echo json_encode([
            'success' => true,
            'message' => 'Email successfully verified. Welcome to AURA!',
            'token' => 'aura-token-' . $newUser['id'] . '-' . time(),
            'user' => $newUser
        ]);
        exit;
    }

    if ($path === '/auth/verify-otp-login' && $method === 'POST') {
        $email = strtolower(trim($input['email'] ?? ''));
        $otp = trim($input['otp'] ?? '');

        if (!$email || !$otp) {
            http_response_code(400);
            echo json_encode(['message' => 'Email and OTP code are required.']);
            exit;
        }

        if (!isset($db['otps'])) $db['otps'] = [];

        $otpIndex = -1;
        foreach ($db['otps'] as $idx => $record) {
            if (strtolower($record['email'] ?? '') === $email) {
                $otpIndex = $idx;
                break;
            }
        }

        if ($otpIndex === -1) {
            http_response_code(400);
            echo json_encode(['message' => 'No verification code requested or code expired. Please request a new code.']);
            exit;
        }

        $record = $db['otps'][$otpIndex];
        if (time() > ($record['expiresAt'] ?? 0)) {
            array_splice($db['otps'], $otpIndex, 1);
            saveDb($db);
            http_response_code(400);
            echo json_encode(['message' => 'Verification code has expired. Please request a new code.']);
            exit;
        }

        if (($record['code'] ?? '') !== $otp) {
            $db['otps'][$otpIndex]['attempts'] = ($record['attempts'] ?? 0) + 1;
            if ($db['otps'][$otpIndex]['attempts'] >= 5) {
                array_splice($db['otps'], $otpIndex, 1);
                saveDb($db);
                http_response_code(400);
                echo json_encode(['message' => 'Too many failed attempts. Please request a new code.']);
                exit;
            }
            saveDb($db);
            http_response_code(400);
            echo json_encode(['message' => 'Incorrect verification code. Please check your email and try again.']);
            exit;
        }

        // Remove used OTP
        array_splice($db['otps'], $otpIndex, 1);
        saveDb($db);

        $found = null;
        foreach ($db['users'] as $u) {
            if (strtolower($u['email']) === $email) {
                $found = $u;
                break;
            }
        }

        if (!$found) {
            http_response_code(404);
            echo json_encode(['message' => 'User account not found.']);
            exit;
        }

        unset($found['password']);



        echo json_encode([
            'success' => true,
            'message' => 'Authentication successful.',
            'token' => 'aura-token-' . $found['id'] . '-' . time(),
            'user' => $found
        ]);
        exit;
    }

    // 3. SERVICES
    if ($path === '/services' && $method === 'GET') {
        echo json_encode($db['services']);
        exit;
    }

    if ($path === '/services' && $method === 'POST') {
        $newService = array_merge([
            'id' => 'srv-' . round(microtime(true) * 1000),
            'name' => 'New Salon Service',
            'category' => 'Hair',
            'price' => 1000,
            'duration' => 60,
            'description' => '',
            'image' => 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
            'popular' => false,
            'rating' => 5.0,
            'reviewsCount' => 0
        ], $input);
        $db['services'][] = $newService;
        saveDb($db);
        http_response_code(201);
        echo json_encode($newService);
        exit;
    }

    if (preg_match('#^/services/([^/]+)$#', $path, $matches)) {
        $id = $matches[1];
        if ($method === 'PUT') {
            foreach ($db['services'] as &$srv) {
                if ($srv['id'] === $id) {
                    $srv = array_merge($srv, $input);
                    saveDb($db);
                    echo json_encode($srv);
                    exit;
                }
            }
            http_response_code(404);
            echo json_encode(['message' => 'Service not found.']);
            exit;
        } elseif ($method === 'DELETE') {
            $initial = count($db['services']);
            $db['services'] = array_values(array_filter($db['services'], fn($s) => $s['id'] !== $id));
            if (count($db['services']) === $initial) {
                http_response_code(404);
                echo json_encode(['message' => 'Service not found.']);
                exit;
            }
            saveDb($db);
            echo json_encode(['message' => 'Service deleted successfully.']);
            exit;
        }
    }

    // 4. STAFF
    if ($path === '/staff' && $method === 'GET') {
        $serviceId = $_GET['serviceId'] ?? null;
        if ($serviceId) {
            $filtered = array_values(array_filter($db['staff'], function($s) use ($serviceId) {
                return !empty($s['specialties']) && in_array($serviceId, $s['specialties']);
            }));
            echo json_encode($filtered);
            exit;
        }
        echo json_encode($db['staff']);
        exit;
    }

    if ($path === '/staff' && $method === 'POST') {
        $newStaff = array_merge([
            'id' => 'stf-' . round(microtime(true) * 1000),
            'name' => 'New Stylist',
            'title' => 'Stylist Artisan',
            'rating' => 4.9,
            'reviewsCount' => 0,
            'image' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            'specialties' => [],
            'workingDays' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            'workingHours' => ['start' => '09:00', 'end' => '20:00']
        ], $input);
        $db['staff'][] = $newStaff;
        saveDb($db);
        http_response_code(201);
        echo json_encode($newStaff);
        exit;
    }

    if (preg_match('#^/staff/([^/]+)$#', $path, $matches)) {
        $id = $matches[1];
        if ($method === 'PUT') {
            foreach ($db['staff'] as &$stf) {
                if ($stf['id'] === $id) {
                    $stf = array_merge($stf, $input);
                    saveDb($db);
                    echo json_encode($stf);
                    exit;
                }
            }
            http_response_code(404);
            echo json_encode(['message' => 'Staff not found.']);
            exit;
        } elseif ($method === 'DELETE') {
            $initial = count($db['staff']);
            $db['staff'] = array_values(array_filter($db['staff'], fn($s) => $s['id'] !== $id));
            if (count($db['staff']) === $initial) {
                http_response_code(404);
                echo json_encode(['message' => 'Staff not found.']);
                exit;
            }
            saveDb($db);
            echo json_encode(['message' => 'Staff removed successfully.']);
            exit;
        }
    }

    // 5. SCHEDULE
    if ($path === '/schedule/working-hours') {
        if ($method === 'GET') {
            echo json_encode($db['workingHours']);
            exit;
        } elseif ($method === 'PUT') {
            $db['workingHours'] = array_merge($db['workingHours'], $input);
            saveDb($db);
            echo json_encode(['message' => 'Working hours updated successfully', 'workingHours' => $db['workingHours']]);
            exit;
        }
    }

    if ($path === '/schedule/blocked-dates') {
        if ($method === 'GET') {
            echo json_encode($db['blockedDates']);
            exit;
        } elseif ($method === 'POST') {
            if (empty($input['date'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Date is required.']);
                exit;
            }
            $newBlock = [
                'id' => 'block-' . round(microtime(true) * 1000),
                'date' => $input['date'],
                'reason' => $input['reason'] ?? 'Salon Maintenance / Holiday',
                'staffId' => $input['staffId'] ?? null
            ];
            $db['blockedDates'][] = $newBlock;
            saveDb($db);
            http_response_code(201);
            echo json_encode($newBlock);
            exit;
        }
    }

    if (preg_match('#^/schedule/blocked-dates/([^/]+)$#', $path, $matches) && $method === 'DELETE') {
        $id = $matches[1];
        $initial = count($db['blockedDates']);
        $db['blockedDates'] = array_values(array_filter($db['blockedDates'], fn($b) => $b['id'] !== $id));
        if (count($db['blockedDates']) === $initial) {
            http_response_code(404);
            echo json_encode(['message' => 'Blocked date not found.']);
            exit;
        }
        saveDb($db);
        echo json_encode(['message' => 'Date unblocked successfully.']);
        exit;
    }

    // 6. AVAILABILITY
    if ($path === '/availability' && $method === 'GET') {
        $date = $_GET['date'] ?? null;
        $staffId = $_GET['staffId'] ?? null;
        $serviceDuration = intval($_GET['serviceDuration'] ?? 60);

        if (!$date) {
            http_response_code(400);
            echo json_encode(['message' => "Query parameter 'date' (YYYY-MM-DD) is required."]);
            exit;
        }

        // Check if salon is blocked
        foreach ($db['blockedDates'] as $b) {
            if ($b['date'] === $date && empty($b['staffId'])) {
                echo json_encode([
                    'isOpen' => false,
                    'reason' => 'Salon is closed on this date (' . ($b['reason'] ?? 'Holiday or Private Event') . ').',
                    'operatingHours' => 'Closed',
                    'slots' => []
                ]);
                exit;
            }
        }

        $timestamp = strtotime($date);
        $dayName = date('l', $timestamp);
        $salonDayHours = $db['workingHours'][$dayName] ?? null;

        if (!$salonDayHours || empty($salonDayHours['isOpen'])) {
            echo json_encode([
                'isOpen' => false,
                'reason' => "Salon is closed on {$dayName}s.",
                'operatingHours' => 'Closed',
                'slots' => []
            ]);
            exit;
        }

        $staffMember = null;
        if (!empty($staffId) && $staffId !== 'any' && $staffId !== 'undefined' && $staffId !== 'null') {
            foreach ($db['staff'] as $s) {
                if ($s['id'] === $staffId) {
                    $staffMember = $s;
                    break;
                }
            }

            if ($staffMember) {
                // Check if staff has blocked date
                foreach ($db['blockedDates'] as $b) {
                    if ($b['date'] === $date && ($b['staffId'] ?? null) === $staffId) {
                        echo json_encode([
                            'isOpen' => false,
                            'reason' => "{$staffMember['name']} is off duty on this date.",
                            'operatingHours' => 'Stylist Off Duty',
                            'stylistUnavailable' => true,
                            'slots' => []
                        ]);
                        exit;
                    }
                }

                // Check if staff works on this day
                if (!in_array($dayName, $staffMember['workingDays'] ?? [])) {
                    echo json_encode([
                        'isOpen' => false,
                        'reason' => "{$staffMember['name']} does not take bookings on {$dayName}s.",
                        'operatingHours' => 'Stylist Off Duty',
                        'stylistUnavailable' => true,
                        'slots' => []
                    ]);
                    exit;
                }
            }
        }

        $startTimeStr = ($staffMember && !empty($staffMember['workingHours']['start'])) ? $staffMember['workingHours']['start'] : $salonDayHours['open'];
        $endTimeStr = ($staffMember && !empty($staffMember['workingHours']['end'])) ? $staffMember['workingHours']['end'] : $salonDayHours['close'];

        list($startHour, $startMin) = explode(':', $startTimeStr);
        list($endHour, $endMin) = explode(':', $endTimeStr);
        $startTotalMins = intval($startHour) * 60 + intval($startMin);
        $endTotalMins = intval($endHour) * 60 + intval($endMin);

        $activeBookings = array_filter($db['appointments'], function($a) use ($date) {
            return ($a['date'] === $date && ($a['status'] ?? '') !== 'cancelled');
        });

        $slotInterval = 30;
        $slots = [];
        $todayDate = date('Y-m-d');
        $currentMins = intval(date('H')) * 60 + intval(date('i'));

        for ($mins = $startTotalMins; $mins <= $endTotalMins - $serviceDuration; $mins += $slotInterval) {
            $slotHour = floor($mins / 60);
            $slotMinute = $mins % 60;
            $rawTime = sprintf('%02d:%02d', $slotHour, $slotMinute);
            $formattedTime = date('g:i A', strtotime("{$rawTime}:00"));

            $slotEndMins = $mins + $serviceDuration;
            $isConflict = false;

            // If booking for today, past slots cannot be booked
            if ($date === $todayDate && $mins <= ($currentMins + 15)) {
                $isConflict = true;
            }

            if (!$isConflict) {
                if ($staffMember) {
                    foreach ($activeBookings as $booking) {
                        if (($booking['staffId'] ?? '') !== $staffMember['id']) continue;
                        if (empty($booking['timeSlot'])) continue;
                        $bTime = $booking['timeSlot'];
                        $bHour = intval(date('H', strtotime($bTime)));
                        $bMin = intval(date('i', strtotime($bTime)));
                        $bStartMins = $bHour * 60 + $bMin;
                        $bDuration = intval($booking['duration'] ?? $booking['serviceDuration'] ?? 60);
                        $bEndMins = $bStartMins + $bDuration;

                        if ($mins < $bEndMins && $slotEndMins > $bStartMins) {
                            $isConflict = true;
                            break;
                        }
                    }
                } else {
                    // Check if at least one qualified staff member working today is free
                    $qualifiedStaff = array_filter($db['staff'], function($st) use ($dayName, $date, $db) {
                        if (!in_array($dayName, $st['workingDays'] ?? [])) return false;
                        foreach ($db['blockedDates'] as $b) {
                            if ($b['date'] === $date && ($b['staffId'] ?? null) === $st['id']) return false;
                        }
                        return true;
                    });

                    if (empty($qualifiedStaff)) {
                        $isConflict = true;
                    } else {
                        $hasFreeStaff = false;
                        foreach ($qualifiedStaff as $st) {
                            $stConflict = false;
                            foreach ($activeBookings as $booking) {
                                if (($booking['staffId'] ?? '') !== $st['id']) continue;
                                if (empty($booking['timeSlot'])) continue;
                                $bTime = $booking['timeSlot'];
                                $bHour = intval(date('H', strtotime($bTime)));
                                $bMin = intval(date('i', strtotime($bTime)));
                                $bStartMins = $bHour * 60 + $bMin;
                                $bDuration = intval($booking['duration'] ?? $booking['serviceDuration'] ?? 60);
                                $bEndMins = $bStartMins + $bDuration;

                                if ($mins < $bEndMins && $slotEndMins > $bStartMins) {
                                    $stConflict = true;
                                    break;
                                }
                            }
                            if (!$stConflict) {
                                $hasFreeStaff = true;
                                break;
                            }
                        }
                        $isConflict = !$hasFreeStaff;
                    }
                }
            }

            $period = 'morning';
            if ($slotHour >= 12 && $slotHour < 17) {
                $period = 'afternoon';
            } elseif ($slotHour >= 17) {
                $period = 'evening';
            }

            $slots[] = [
                'time' => $formattedTime,
                'raw' => $rawTime,
                'period' => $period,
                'available' => !$isConflict
            ];
        }

        echo json_encode([
            'isOpen' => true,
            'date' => $date,
            'day' => $dayName,
            'hours' => ['open' => $startTimeStr, 'close' => $endTimeStr],
            'operatingHours' => "{$startTimeStr} - {$endTimeStr}",
            'slots' => $slots
        ]);
        exit;
    }

    // 7. APPOINTMENTS
    if ($path === '/appointments' && $method === 'GET') {
        $customerEmail = $_GET['customerEmail'] ?? null;
        $dateFilter = $_GET['date'] ?? null;
        $staffFilter = $_GET['staffId'] ?? null;
        $statusFilter = $_GET['status'] ?? null;
        $search = strtolower($_GET['search'] ?? '');

        $results = array_filter($db['appointments'], function($a) use ($customerEmail, $dateFilter, $staffFilter, $statusFilter, $search) {
            if ($customerEmail && strtolower($a['customerEmail']) !== strtolower($customerEmail)) return false;
            if ($dateFilter && $a['date'] !== $dateFilter) return false;
            if ($staffFilter && $a['staffId'] !== $staffFilter) return false;
            if ($statusFilter && $a['status'] !== $statusFilter) return false;
            if ($search) {
                $haystack = strtolower(($a['customerName'] ?? '') . ' ' . ($a['customerPhone'] ?? '') . ' ' . ($a['bookingCode'] ?? '') . ' ' . ($a['serviceName'] ?? ''));
                if (strpos($haystack, $search) === false) return false;
            }
            return true;
        });

        // Sort descending
        usort($results, function($a, $b) {
            return strcmp($b['date'] . ' ' . $b['timeSlot'], $a['date'] . ' ' . $a['timeSlot']);
        });

        echo json_encode(array_values($results));
        exit;
    }

    if ($path === '/appointments' && $method === 'POST') {
        $serviceId = $input['serviceId'] ?? null;
        $staffId = $input['staffId'] ?? null;
        $date = $input['date'] ?? date('Y-m-d');
        $timeSlot = $input['timeSlot'] ?? date('g:i A');
        $customerName = trim($input['customerName'] ?? 'Valued Client');
        $customerEmail = trim($input['customerEmail'] ?? '');
        $customerPhone = trim($input['customerPhone'] ?? '+91 9360449096');
        $notes = $input['notes'] ?? '';
        $source = $input['source'] ?? ($input['bookingType'] ?? 'online');
        $status = $input['status'] ?? 'confirmed';
        $paymentStatus = $input['paymentStatus'] ?? ($status === 'completed' ? 'paid_at_salon' : 'pay_at_salon');

        $service = null;
        if ($serviceId) {
            foreach ($db['services'] as $s) {
                if ($s['id'] === $serviceId) {
                    $service = $s;
                    break;
                }
            }
        }
        if (!$service && !empty($db['services'])) {
            $service = $db['services'][0];
        }

        $chosenStaff = null;
        if (!empty($staffId) && $staffId !== 'any' && $staffId !== 'undefined' && $staffId !== 'null') {
            foreach ($db['staff'] as $st) {
                if ($st['id'] === $staffId) {
                    $chosenStaff = $st;
                    break;
                }
            }
        }
        if (!$chosenStaff && !empty($db['staff'])) {
            $chosenStaff = $db['staff'][0];
        }

        $bookingCode = generateBookingCode();
        $servicePrice = floatval($service['price'] ?? $input['servicePrice'] ?? 0);
        $taxAmount = round($servicePrice * 0.18); // 18% GST

        $newAppointment = [
            'id' => 'apt-' . round(microtime(true) * 1000),
            'bookingCode' => $bookingCode,
            'serviceId' => $service['id'] ?? 'srv-1',
            'serviceName' => $service['name'] ?? ($input['serviceName'] ?? 'Luxury Salon Service'),
            'servicePrice' => $servicePrice,
            'serviceDuration' => intval($service['duration'] ?? $input['duration'] ?? 60),
            'staffId' => $chosenStaff['id'] ?? 'staff-1',
            'staffName' => $chosenStaff['name'] ?? 'Senior Stylist',
            'customerName' => $customerName,
            'customerEmail' => $customerEmail,
            'customerPhone' => $customerPhone,
            'date' => $date,
            'timeSlot' => $timeSlot,
            'notes' => $notes,
            'status' => $status,
            'source' => $source,
            'paymentStatus' => $paymentStatus,
            'totalAmount' => $servicePrice,
            'taxAmount' => $taxAmount,
            'createdAt' => gmdate('Y-m-d\TH:i:s\Z')
        ];

        $db['appointments'][] = $newAppointment;

        // Customer loyalty and directory synchronization
        $foundCust = false;
        $custEmail = strtolower($customerEmail);
        foreach ($db['customers'] as &$cust) {
            $emailMatch = !empty($custEmail) && strtolower($cust['email'] ?? '') === $custEmail;
            $phoneMatch = !empty($customerPhone) && ($cust['phone'] ?? '') === $customerPhone;
            if ($emailMatch || $phoneMatch) {
                if ($status === 'completed') {
                    $cust['totalVisits'] = intval($cust['totalVisits'] ?? 0) + 1;
                    $cust['totalSpent'] = floatval($cust['totalSpent'] ?? 0) + $newAppointment['totalAmount'];
                    $cust['lastVisit'] = $newAppointment['date'];
                }
                $foundCust = true;
                break;
            }
        }
        if (!$foundCust) {
            $isCompleted = ($status === 'completed');
            $db['customers'][] = [
                'id' => 'cust-' . round(microtime(true) * 1000),
                'name' => $customerName,
                'email' => $customerEmail ?: "guest_{$customerPhone}@auraa.kesug.com",
                'phone' => $customerPhone,
                'totalVisits' => $isCompleted ? 1 : 0,
                'totalSpent' => $isCompleted ? $newAppointment['totalAmount'] : 0,
                'lastVisit' => $isCompleted ? $newAppointment['date'] : null,
                'vipStatus' => false,
                'notes' => $source === 'offline' ? 'Offline Walk-In Guest' : 'Registered online'
            ];
        }

        // Prepare notifications
        $smsMsg = "Namaste {$newAppointment['customerName']}! Your appointment at AURA Salon Chennai is confirmed. Code: {$bookingCode}. Service: {$newAppointment['serviceName']} with {$newAppointment['staffName']} on {$newAppointment['date']} at {$newAppointment['timeSlot']}. Concierge: +91 9360449096";
        $emailMsg = "Dear {$newAppointment['customerName']},\n\nWe are delighted to confirm your booking at AURA Haute Coiffure & Luxury Bridal Lounge Chennai.\n\nBooking Code: {$bookingCode}\nService: {$newAppointment['serviceName']}\nStylist: {$newAppointment['staffName']}\nDate & Time: {$newAppointment['date']} at {$newAppointment['timeSlot']}\nTotal: ₹{$newAppointment['totalAmount']}\n\nLocation: Ramapuram, Chennai 600089\nHelpline: +91 9360449096";

        recordNotification($db, 'sms', $newAppointment['customerPhone'], $smsMsg, ['appointmentId' => $newAppointment['id']]);
        recordNotification($db, 'email', $newAppointment['customerEmail'], $emailMsg, ['appointmentId' => $newAppointment['id'], 'subject' => "Appointment Confirmed [{$bookingCode}] • AURA Salon"]);

        saveDb($db);
        http_response_code(201);
        echo json_encode([
            'appointment' => $newAppointment,
            'notifications' => [
                ['type' => 'sms', 'recipient' => $newAppointment['customerPhone'], 'content' => $smsMsg],
                ['type' => 'email', 'recipient' => $newAppointment['customerEmail'], 'content' => $emailMsg]
            ],
            'message' => 'Appointment successfully booked!'
        ]);
        exit;
    }

    if (preg_match('#^/appointments/([^/]+)/reschedule$#', $path, $matches) && $method === 'PUT') {
        $id = $matches[1];
        foreach ($db['appointments'] as &$apt) {
            if ($apt['id'] === $id) {
                $apt['date'] = $input['date'] ?? $apt['date'];
                $apt['timeSlot'] = $input['timeSlot'] ?? $apt['timeSlot'];
                $apt['status'] = 'pending';
                $apt['updatedAt'] = gmdate('Y-m-d\TH:i:s\Z');
                saveDb($db);
                echo json_encode($apt);
                exit;
            }
        }
        http_response_code(404);
        echo json_encode(['message' => 'Appointment not found.']);
        exit;
    }

    if (preg_match('#^/appointments/([^/]+)/cancel$#', $path, $matches) && $method === 'PUT') {
        $id = $matches[1];
        foreach ($db['appointments'] as &$apt) {
            if ($apt['id'] === $id) {
                if (($apt['status'] ?? '') === 'completed') {
                    http_response_code(400);
                    echo json_encode(['message' => 'Completed appointments cannot be cancelled.']);
                    exit;
                }
                $apt['status'] = 'cancelled';
                $apt['cancellationReason'] = $input['reason'] ?? 'Customer request';
                $apt['cancelledAt'] = gmdate('Y-m-d\TH:i:s\Z');
                saveDb($db);
                echo json_encode($apt);
                exit;
            }
        }
        http_response_code(404);
        echo json_encode(['message' => 'Appointment not found.']);
        exit;
    }

    if (preg_match('#^/appointments/([^/]+)/status$#', $path, $matches) && $method === 'PUT') {
        $id = $matches[1];
        $newStatus = $input['status'] ?? '';
        foreach ($db['appointments'] as &$apt) {
            if ($apt['id'] === $id) {
                $oldStatus = $apt['status'] ?? 'pending';
                if ($oldStatus === 'completed' && $newStatus === 'cancelled') {
                    http_response_code(400);
                    echo json_encode(['message' => 'Completed appointments cannot be cancelled.']);
                    exit;
                }
                $apt['status'] = $newStatus;
                $apt['updatedAt'] = gmdate('Y-m-d\TH:i:s\Z');

                // If marked completed, update or create customer record in real time!
                if ($newStatus === 'completed' && $oldStatus !== 'completed') {
                    $foundCust = false;
                    $custEmail = strtolower($apt['customerEmail'] ?? '');
                    $custPhone = trim($apt['customerPhone'] ?? '');
                    $aptAmount = floatval($apt['totalAmount'] ?? $apt['servicePrice'] ?? 0);

                    foreach ($db['customers'] as &$cust) {
                        $emailMatch = !empty($custEmail) && strtolower($cust['email'] ?? '') === $custEmail;
                        $phoneMatch = !empty($custPhone) && ($cust['phone'] ?? '') === $custPhone;
                        if ($emailMatch || $phoneMatch) {
                            $cust['totalVisits'] = intval($cust['totalVisits'] ?? 0) + 1;
                            $cust['totalSpent'] = floatval($cust['totalSpent'] ?? 0) + $aptAmount;
                            $cust['lastVisit'] = $apt['date'];
                            $foundCust = true;
                            break;
                        }
                    }
                    if (!$foundCust) {
                        $db['customers'][] = [
                            'id' => 'cust-' . round(microtime(true) * 1000),
                            'name' => $apt['customerName'],
                            'email' => $apt['customerEmail'] ?: "guest_{$custPhone}@auraa.kesug.com",
                            'phone' => $apt['customerPhone'],
                            'totalVisits' => 1,
                            'totalSpent' => $aptAmount,
                            'lastVisit' => $apt['date'],
                            'vipStatus' => false,
                            'notes' => ($apt['source'] ?? '') === 'offline' ? 'Offline Walk-In Guest' : 'Completed booking ' . ($apt['bookingCode'] ?? '')
                        ];
                    }
                }

                saveDb($db);
                echo json_encode($apt);
                exit;
            }
        }
        http_response_code(404);
        echo json_encode(['message' => 'Appointment not found.']);
        exit;
    }

    // 8. CUSTOMERS
    if ($path === '/customers' && $method === 'GET') {
        echo json_encode(array_values($db['customers']));
        exit;
    }

    if ($path === '/customers' && $method === 'POST') {
        $name = trim($input['name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        if (!$name) {
            http_response_code(400);
            echo json_encode(['message' => 'Customer name is required.']);
            exit;
        }

        $email = trim($input['email'] ?? '');
        if (!$email) {
            $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
            $email = 'walkin_' . ($cleanPhone ?: round(microtime(true) * 1000)) . '@salon.internal';
        }

        $newCustomer = [
            'id' => 'cust-' . round(microtime(true) * 1000),
            'name' => $name,
            'email' => $email,
            'phone' => $phone ?: '+91 98400 00000',
            'totalVisits' => intval($input['totalVisits'] ?? 1),
            'totalSpent' => floatval($input['totalSpent'] ?? 0),
            'lastVisit' => $input['lastVisit'] ?? date('Y-m-d'),
            'vipStatus' => !empty($input['vipStatus']),
            'notes' => trim($input['notes'] ?? 'Offline / Walk-in guest')
        ];

        $db['customers'][] = $newCustomer;
        saveDb($db);
        http_response_code(201);
        echo json_encode($newCustomer);
        exit;
    }

    if (preg_match('#^/customers/([^/]+)$#', $path, $matches) && $method === 'PUT') {
        $id = $matches[1];
        foreach ($db['customers'] as &$cust) {
            if ($cust['id'] === $id) {
                $cust = array_merge($cust, $input);
                saveDb($db);
                echo json_encode($cust);
                exit;
            }
        }
        http_response_code(404);
        echo json_encode(['message' => 'Customer not found.']);
        exit;
    }

    if (preg_match('#^/customers/([^/]+)$#', $path, $matches) && $method === 'DELETE') {
        $id = $matches[1];
        $initial = count($db['customers']);
        $db['customers'] = array_values(array_filter($db['customers'], fn($c) => $c['id'] !== $id));
        if (count($db['customers']) === $initial) {
            http_response_code(404);
            echo json_encode(['message' => 'Customer not found.']);
            exit;
        }
        saveDb($db);
        echo json_encode(['message' => 'Customer removed successfully.']);
        exit;
    }

    // 9. REVENUE ANALYTICS (REAL DATABASE DRIVEN)
    if ($path === '/analytics/revenue' && $method === 'GET') {
        $appointments = $db['appointments'] ?? [];

        // ONLY REAL COMPLETED APPOINTMENTS COUNT AS REVENUE
        $completedAppts = array_values(array_filter($appointments, fn($a) => ($a['status'] ?? '') === 'completed'));

        // Separate Online and Offline Completed Revenue
        $onlineCompleted = array_values(array_filter($completedAppts, fn($a) => ($a['source'] ?? 'online') !== 'offline'));
        $offlineCompleted = array_values(array_filter($completedAppts, fn($a) => ($a['source'] ?? '') === 'offline'));

        $onlineRevenue = array_reduce($onlineCompleted, fn($carry, $a) => $carry + floatval($a['totalAmount'] ?? $a['servicePrice'] ?? 0), 0);
        $offlineRevenue = array_reduce($offlineCompleted, fn($carry, $a) => $carry + floatval($a['totalAmount'] ?? $a['servicePrice'] ?? 0), 0);
        $totalRevenue = $onlineRevenue + $offlineRevenue;

        // Status counts including confirmed, completed, cancelled, pending
        $statusCounts = [
            'total' => count($appointments),
            'confirmed' => count(array_filter($appointments, fn($a) => ($a['status'] ?? '') === 'confirmed')),
            'pending' => count(array_filter($appointments, fn($a) => ($a['status'] ?? '') === 'pending')),
            'completed' => count($completedAppts),
            'cancelled' => count(array_filter($appointments, fn($a) => ($a['status'] ?? '') === 'cancelled')),
            'online' => count(array_filter($appointments, fn($a) => ($a['source'] ?? 'online') !== 'offline')),
            'offline' => count(array_filter($appointments, fn($a) => ($a['source'] ?? '') === 'offline')),
            'onlineCompleted' => count($onlineCompleted),
            'offlineCompleted' => count($offlineCompleted)
        ];

        // Store persistent revenueSummary in database
        $db['revenueSummary'] = [
            'totalRevenue' => $totalRevenue,
            'onlineRevenue' => $onlineRevenue,
            'offlineRevenue' => $offlineRevenue,
            'completedCount' => count($completedAppts),
            'onlineCompletedCount' => count($onlineCompleted),
            'offlineCompletedCount' => count($offlineCompleted),
            'confirmedCount' => $statusCounts['confirmed'],
            'cancelledCount' => $statusCounts['cancelled'],
            'pendingCount' => $statusCounts['pending'],
            'lastUpdated' => gmdate('Y-m-d\TH:i:s\Z')
        ];
        saveDb($db);

        // Top services from completed appointments
        $serviceMap = [];
        foreach ($completedAppts as $a) {
            $name = $a['serviceName'] ?? 'Service';
            if (!isset($serviceMap[$name])) {
                $serviceMap[$name] = ['name' => $name, 'count' => 0, 'revenue' => 0];
            }
            $serviceMap[$name]['count']++;
            $serviceMap[$name]['revenue'] += floatval($a['totalAmount'] ?? $a['servicePrice'] ?? 0);
        }
        $topServices = array_values($serviceMap);
        usort($topServices, fn($x, $y) => $y['revenue'] <=> $x['revenue']);
        $topServices = array_slice($topServices, 0, 5);

        // Top stylists from completed appointments
        $staffMap = [];
        foreach ($completedAppts as $a) {
            $name = $a['staffName'] ?? 'Stylist';
            if (!isset($staffMap[$name])) {
                $staffMap[$name] = ['name' => $name, 'count' => 0, 'revenue' => 0];
            }
            $staffMap[$name]['count']++;
            $staffMap[$name]['revenue'] += floatval($a['totalAmount'] ?? $a['servicePrice'] ?? 0);
        }
        $topStaff = array_values($staffMap);
        usort($topStaff, fn($x, $y) => $y['count'] <=> $x['count']);

        // Monthly revenue calculated purely from completed appointments
        $monthsMap = [];
        foreach ($completedAppts as $a) {
            $month = date('M', strtotime($a['date'] ?? 'now'));
            if (!isset($monthsMap[$month])) {
                $monthsMap[$month] = ['month' => $month, 'revenue' => 0, 'onlineRevenue' => 0, 'offlineRevenue' => 0, 'bookings' => 0];
            }
            $amt = floatval($a['totalAmount'] ?? $a['servicePrice'] ?? 0);
            $monthsMap[$month]['revenue'] += $amt;
            if (($a['source'] ?? 'online') === 'offline') {
                $monthsMap[$month]['offlineRevenue'] += $amt;
            } else {
                $monthsMap[$month]['onlineRevenue'] += $amt;
            }
            $monthsMap[$month]['bookings']++;
        }
        $monthlyRevenue = array_values($monthsMap);
        if (empty($monthlyRevenue)) {
            $currentMonth = date('M');
            $monthlyRevenue = [
                ['month' => $currentMonth, 'revenue' => 0, 'onlineRevenue' => 0, 'offlineRevenue' => 0, 'bookings' => 0]
            ];
        }

        $averageTicket = count($completedAppts) > 0 ? round($totalRevenue / count($completedAppts)) : 0;
        $onlineAvgTicket = count($onlineCompleted) > 0 ? round($onlineRevenue / count($onlineCompleted)) : 0;
        $offlineAvgTicket = count($offlineCompleted) > 0 ? round($offlineRevenue / count($offlineCompleted)) : 0;

        echo json_encode([
            'totalRevenue' => $totalRevenue,
            'onlineRevenue' => $onlineRevenue,
            'offlineRevenue' => $offlineRevenue,
            'completedCount' => count($completedAppts),
            'onlineCompletedCount' => count($onlineCompleted),
            'offlineCompletedCount' => count($offlineCompleted),
            'confirmedCount' => $statusCounts['confirmed'],
            'cancelledCount' => $statusCounts['cancelled'],
            'pendingCount' => $statusCounts['pending'],
            'totalBookings' => count($appointments),
            'averageTicketValue' => $averageTicket,
            'onlineAverageTicket' => $onlineAvgTicket,
            'offlineAverageTicket' => $offlineAvgTicket,
            'totalCustomers' => count($db['customers']),
            'statusCounts' => $statusCounts,
            'revenueSummary' => $db['revenueSummary'],
            'topServices' => $topServices,
            'topStaff' => $topStaff,
            'monthlyRevenue' => $monthlyRevenue
        ]);
        exit;
    }

    // 10. NOTIFICATIONS
    if ($path === '/notifications' && $method === 'GET') {
        echo json_encode($db['notifications'] ?? []);
        exit;
    }

    // 11. GMAIL SMTP SETTINGS & TEST
    if ($path === '/settings/smtp') {
        if ($method === 'GET') {
            $smtp = $db['smtpConfig'] ?? [
                'host' => 'smtp.gmail.com',
                'port' => 587,
                'user' => 'dsah56631@gmail.com',
                'pass' => ''
            ];
            echo json_encode([
                'host' => $smtp['host'] ?? 'smtp.gmail.com',
                'port' => $smtp['port'] ?? 587,
                'user' => $smtp['user'] ?? 'dsah56631@gmail.com',
                'hasPass' => !empty($smtp['pass'])
            ]);
            exit;
        } elseif ($method === 'POST') {
            if (!isset($db['smtpConfig'])) {
                $db['smtpConfig'] = [];
            }
            $db['smtpConfig']['host'] = trim($input['host'] ?? 'smtp.gmail.com');
            $db['smtpConfig']['port'] = intval($input['port'] ?? 587);
            $db['smtpConfig']['user'] = trim($input['user'] ?? 'dsah56631@gmail.com');
            if (isset($input['pass']) && trim($input['pass']) !== '') {
                $db['smtpConfig']['pass'] = trim($input['pass']);
            }
            saveDb($db);
            echo json_encode([
                'success' => true,
                'message' => 'Gmail SMTP settings saved successfully.',
                'settings' => [
                    'host' => $db['smtpConfig']['host'],
                    'port' => $db['smtpConfig']['port'],
                    'user' => $db['smtpConfig']['user'],
                    'hasPass' => !empty($db['smtpConfig']['pass'])
                ]
            ]);
            exit;
        }
    }

    if ($path === '/settings/test-smtp' && $method === 'POST') {
        $testEmail = strtolower(trim($input['testEmail'] ?? ''));
        if (!$testEmail || !filter_var($testEmail, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['message' => 'A valid recipient email address is required.']);
            exit;
        }

        $testSubject = "AURA Salon - Live Gmail SMTP Delivery Test";
        $testBody = "Vanakkam,\n\nThis is a live verification email sent from AURA Luxury Salon & Bridal Lounge via Gmail SMTP.\n\nTime: " . date('Y-m-d H:i:s') . "\nRecipient: " . $testEmail . "\n\nIf you see this email, Gmail SMTP outbound delivery is working properly!\n\nWarm regards,\nAURA Concierge Team\nRamapuram, Chennai 600089\nContact: +91 9360449096";

        $res = sendSmtpEmail($testEmail, "Valued Client", $testSubject, $testBody, $db);
        if ($res['delivered']) {
            echo json_encode([
                'success' => true,
                'method' => $res['method'],
                'message' => 'Test email successfully delivered to ' . $testEmail . ' via ' . $res['method'] . '!'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to deliver test email to ' . $testEmail . '. Error: ' . ($res['log'] ?: 'SMTP error')
            ]);
        }
        exit;
    }

    // Fallback 404
    http_response_code(404);
    echo json_encode(['message' => "Endpoint not found: {$path}"]);
    exit;

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}
