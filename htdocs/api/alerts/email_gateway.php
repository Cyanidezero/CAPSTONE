<?php
/**
 * ClimaYield-X - Email Gateway (Resend.com HTTPS API)
 * Dispatches transactional emails and OTP codes directly via Resend over HTTPS (port 443).
 * Compatible with InfinityFree hosting.
 */

if (!function_exists('sendResendEmail')) {
    function sendResendEmail($toEmail, $subject, $htmlContent, $textFallback = '') {
        $cleanEmail = trim((string)$toEmail);
        if (empty($cleanEmail) || !filter_var($cleanEmail, FILTER_VALIDATE_EMAIL)) {
            return ['sent' => false, 'error' => 'Invalid recipient email address'];
        }

        $apiKey = defined('RESEND_API_KEY') && RESEND_API_KEY ? RESEND_API_KEY : (getenv('RESEND_API_KEY') ?: '');
        if (empty($apiKey)) {
            return ['sent' => false, 'error' => 'Missing Resend API key'];
        }

        $from = defined('RESEND_FROM_EMAIL') && RESEND_FROM_EMAIL ? RESEND_FROM_EMAIL : 'ClimaYield-X <onboarding@resend.dev>';

        $payload = json_encode([
            'from'    => $from,
            'to'      => [$cleanEmail],
            'subject' => $subject,
            'html'    => $htmlContent,
            'text'    => $textFallback ?: strip_tags($htmlContent)
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

        if ($httpCode >= 200 && $httpCode < 300 && !empty($decoded['id'])) {
            return [
                'sent'     => true,
                'provider' => 'resend',
                'emailId'  => $decoded['id'],
                'to'       => $cleanEmail
            ];
        }

        return [
            'sent'     => false,
            'provider' => 'resend',
            'error'    => $decoded['message'] ?? ($curlErr ?: "Resend HTTP {$httpCode}: {$resp}"),
            'to'       => $cleanEmail
        ];
    }
}

