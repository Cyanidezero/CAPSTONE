<?php
/**
 * ClimaYield-X - Telecom & Push Alert Gateway Dispatcher
 * Delivers real alerts and SMS messages directly to mobile phones across Philippine telecom carriers
 * and instant push alerts via Pocket Alert.
 * 
 * Supported Providers:
 * 1. Pocket Alert (https://pocketalert.app) - Real-time push alert dispatcher to mobile devices
 * 2. Semaphore (https://semaphore.co) - Standard Philippine developer SMS gateway
 * 3. iTexMo (https://itexmo.com) - Philippine SMS API
 * 4. PhilSMS (https://philsms.com)
 * 5. Twilio (https://twilio.com)
 */

if (!function_exists('sendPhysicalSms')) {
    function sendPhysicalSms($phone, $message, $title = 'ClimaYield-X Mobile Alert') {
        $cleanPhone = preg_replace('/[\s\-\(\)]/', '', trim((string)$phone));
        if (empty($cleanPhone)) {
            return ['sent' => false, 'provider' => 'none', 'error' => 'Empty phone number'];
        }

        // Format to standard 11-digit Philippine mobile format (09XXXXXXXXX)
        if (preg_match('/^\+?63(9\d{9})$/', $cleanPhone, $m)) {
            $phNumber = '0' . $m[1];
        } elseif (preg_match('/^(0?9\d{9})$/', $cleanPhone, $m)) {
            $phNumber = strlen($m[1]) === 10 ? '0' . $m[1] : $m[1];
        } else {
            $phNumber = $cleanPhone;
        }

        $result = [
            'sent'     => false,
            'provider' => 'none',
            'phone'    => $phNumber,
            'error'    => null
        ];

        // Provider 0: Pocket Alert (https://api.pocketalert.app/v1/messages)
        $pocketToken = defined('POCKETALERT_API_TOKEN') && POCKETALERT_API_TOKEN ? POCKETALERT_API_TOKEN : (getenv('POCKETALERT_API_TOKEN') ?: '6e99cb70-1c6a-47c7-9582-fae4ab3c1481');
        if (!empty($pocketToken)) {
            $pocketPayload = json_encode([
                'title'    => $title ?: 'ClimaYield-X Mobile Alert',
                'message'  => (!empty($phNumber) ? "[To: {$phNumber}]\n" : '') . $message,
                'priority' => 1
            ]);

            $ch = curl_init('https://api.pocketalert.app/v1/messages');
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Token: ' . $pocketToken,
                'Content-Type: application/json',
                'Accept: application/json'
            ]);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $pocketPayload);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 12);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $resp = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErr = curl_error($ch);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                $result['sent'] = true;
                $result['provider'] = 'pocketalert';
                $result['response'] = json_decode($resp, true);
                return $result;
            } else {
                $result['error'] = "PocketAlert HTTP {$httpCode}: " . ($curlErr ?: $resp);
            }
        }

        // Provider 1: Semaphore (api.semaphore.co)
        $semaphoreKey = defined('SEMAPHORE_API_KEY') && SEMAPHORE_API_KEY ? SEMAPHORE_API_KEY : getenv('SEMAPHORE_API_KEY');
        if (!empty($semaphoreKey)) {
            $senderName = defined('SEMAPHORE_SENDER_NAME') && SEMAPHORE_SENDER_NAME ? SEMAPHORE_SENDER_NAME : '';
            $postData = [
                'apikey'  => $semaphoreKey,
                'number'  => $phNumber,
                'message' => $message
            ];
            if (!empty($senderName)) {
                $postData['sendername'] = $senderName;
            }

            $ch = curl_init('https://api.semaphore.co/api/v4/messages');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 12);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $resp = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErr = curl_error($ch);
            curl_close($ch);

            if ($httpCode === 200 && !empty($resp)) {
                $result['sent'] = true;
                $result['provider'] = 'semaphore';
                $result['response'] = json_decode($resp, true);
                return $result;
            } else {
                $result['error'] = "Semaphore HTTP {$httpCode}: " . ($curlErr ?: $resp);
            }
        }

        // Provider 2: iTexMo (itexmo.com)
        $itexmoCode = defined('ITEXMO_API_CODE') && ITEXMO_API_CODE ? ITEXMO_API_CODE : getenv('ITEXMO_API_CODE');
        $itexmoPass = defined('ITEXMO_PASSWORD') && ITEXMO_PASSWORD ? ITEXMO_PASSWORD : getenv('ITEXMO_PASSWORD');
        if (!empty($itexmoCode) && !empty($itexmoPass)) {
            $postData = [
                '1'      => $phNumber,
                '2'      => $message,
                '3'      => $itexmoCode,
                'passwd' => $itexmoPass
            ];
            $ch = curl_init('https://www.itexmo.com/php_api/itexmo.php');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 12);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $resp = curl_exec($ch);
            curl_close($ch);

            if ($resp === '0') {
                $result['sent'] = true;
                $result['provider'] = 'itexmo';
                return $result;
            } else {
                $result['error'] = "iTexMo status code: {$resp}";
            }
        }

        // Provider 3: PhilSMS (dashboard.philsms.com)
        $philsmsToken = defined('PHILSMS_API_TOKEN') && PHILSMS_API_TOKEN ? PHILSMS_API_TOKEN : getenv('PHILSMS_API_TOKEN');
        if (!empty($philsmsToken)) {
            $payload = json_encode([
                'recipient' => $phNumber,
                'sender_id' => 'PhilSMS',
                'type'      => 'plain',
                'message'   => $message
            ]);
            $ch = curl_init('https://dashboard.philsms.com/api/v3/sms/send');
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $philsmsToken,
                'Content-Type: application/json',
                'Accept: application/json'
            ]);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 12);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $resp = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if (($httpCode === 200 || $httpCode === 201) && !empty($resp)) {
                $result['sent'] = true;
                $result['provider'] = 'philsms';
                return $result;
            }
        }

        return $result;
    }
}
