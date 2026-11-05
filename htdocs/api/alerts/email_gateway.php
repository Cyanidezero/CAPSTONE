<?php
/**
 * ClimaYield-X - Email Gateway (Resend.com HTTPS API)
 * Dispatches transactional emails and OTP codes directly via Resend over HTTPS (port 443).
 * Compatible with InfinityFree hosting.
 */

if (!function_exists('sendResendEmail')) {
    function sendResendEmail($toEmail, $subject, $htmlContent, $textFallback = '', $recipientName = '') {
        $cleanEmail = trim(strtolower((string)$toEmail));
        if (empty($cleanEmail) || !filter_var($cleanEmail, FILTER_VALIDATE_EMAIL)) {
            return ['sent' => false, 'error' => 'Invalid recipient email address'];
        }

        $apiKey = defined('RESEND_API_KEY') && RESEND_API_KEY ? RESEND_API_KEY : (getenv('RESEND_API_KEY') ?: '');
        if (empty($apiKey)) {
            return ['sent' => false, 'error' => 'Missing Resend API key'];
        }

        $from = defined('RESEND_FROM_EMAIL') && RESEND_FROM_EMAIL ? RESEND_FROM_EMAIL : 'ClimaYield-X <onboarding@resend.dev>';
        $adminOwnerEmail = 'rhenzmatipo4@gmail.com';

        $executeResendCall = function($targetEmail, $emailSubject, $emailHtml) use ($from, $apiKey) {
            $payload = json_encode([
                'from'    => $from,
                'to'      => [$targetEmail],
                'subject' => $emailSubject,
                'html'    => $emailHtml,
                'text'    => strip_tags($emailHtml)
            ]);

            $ch = curl_init('https://api.resend.com/emails');
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
                'Accept: application/json',
                'User-Agent: ClimaYield-App'
            ]);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $resp = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErr = curl_error($ch);
            curl_close($ch);

            $decoded = json_decode($resp, true);
            return [
                'httpCode' => $httpCode,
                'decoded'  => $decoded,
                'raw'      => $resp,
                'curlErr'  => $curlErr
            ];
        };

        // 1. Attempt direct delivery to recipient email ($cleanEmail)
        $call1 = $executeResendCall($cleanEmail, $subject, $htmlContent);
        if ($call1['httpCode'] >= 200 && $call1['httpCode'] < 300 && !empty($call1['decoded']['id'])) {
            return [
                'sent'     => true,
                'provider' => 'resend',
                'emailId'  => $call1['decoded']['id'],
                'to'       => $cleanEmail,
                'mode'     => 'direct'
            ];
        }

        // 2. If Resend blocked because account is on test domain onboarding@resend.dev:
        // Automatically dispatch to verified Resend owner email with clear recipient context
        if ($cleanEmail !== $adminOwnerEmail) {
            $fallbackSubject = "[ClimaYield-X OTP for {$cleanEmail}] " . $subject;
            $fallbackHtml = "
            <div style='background:#fef3c7;border:1px solid #f59e0b;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-family:Arial,sans-serif;color:#92400e;font-size:13px;'>
                <strong>📬 Registered Recipient:</strong> <code>{$cleanEmail}</code> (" . htmlspecialchars($recipientName ?: 'Registered Farmer') . ")<br>
                <em>This security verification code was routed to your verified Resend email so logins and tests are never blocked.</em>
            </div>" . $htmlContent;

            $call2 = $executeResendCall($adminOwnerEmail, $fallbackSubject, $fallbackHtml);
            if ($call2['httpCode'] >= 200 && $call2['httpCode'] < 300 && !empty($call2['decoded']['id'])) {
                return [
                    'sent'     => true,
                    'provider' => 'resend',
                    'emailId'  => $call2['decoded']['id'],
                    'to'       => $adminOwnerEmail,
                    'target'   => $cleanEmail,
                    'mode'     => 'routed_to_owner'
                ];
            }
        }

        return [
            'sent'     => false,
            'provider' => 'resend',
            'error'    => $call1['decoded']['message'] ?? ($call1['curlErr'] ?: "Resend HTTP {$call1['httpCode']}: {$call1['raw']}"),
            'to'       => $cleanEmail
        ];
    }
}

