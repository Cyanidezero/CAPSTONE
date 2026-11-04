<?php
/**
 * ClimaYield-X - Telecom SMS Gateway Dispatcher
 * Delivers real SMS alert notifications and security OTPs directly to mobile phone Messages
 * via Infobip (https://infobip.com) and fallback Philippine telecom carriers.
 * 
 * Supported Providers:
 * 1. Infobip (https://api.infobip.com) - Direct carrier delivery to phone Messages app
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
            $intlPhone = '63' . $m[1];
        } elseif (preg_match('/^(0?9\d{9})$/', $cleanPhone, $m)) {
            $phNumber = strlen($m[1]) === 10 ? '0' . $m[1] : $m[1];
            $intlPhone = '63' . (strlen($m[1]) === 10 ? substr($m[1], 1) : $m[1]);
        } else {
            $phNumber = $cleanPhone;
            $intlPhone = ltrim($cleanPhone, '+');
        }

        $result = [
            'sent'     => false,
            'provider' => 'none',
            'phone'    => $phNumber,
            'intlPhone'=> $intlPhone,
            'error'    => null
        ];

        // Provider 0: Infobip (https://api.infobip.com/sms/3/messages)
        // Delivers physical SMS directly to the recipient's phone Messages app
        $infobipKey = defined('INFOBIP_API_KEY') && INFOBIP_API_KEY ? INFOBIP_API_KEY : (getenv('INFOBIP_API_KEY') ?: '08d165ab955ad8f77052004bde267653-c500206b-4324-4f84-bad6-9b184efaff68');
        $infobipBase = defined('INFOBIP_BASE_URL') && INFOBIP_BASE_URL ? INFOBIP_BASE_URL : (getenv('INFOBIP_BASE_URL') ?: 'api.infobip.com');
        $infobipSender = defined('INFOBIP_SENDER') && INFOBIP_SENDER ? INFOBIP_SENDER : (getenv('INFOBIP_SENDER') ?: 'ClimaYield');

        if (!empty($infobipKey)) {
            $infobipPayload = json_encode([
                'messages' => [
                    [
                        'sender' => $infobipSender,
                        'destinations' => [
                            ['to' => $intlPhone]
                        ],
                        'content' => [
                            'text' => $message
                        ]
                    ]
                ]
            ]);

            $ch = curl_init("https://{$infobipBase}/sms/3/messages");
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: App ' . $infobipKey,
                'Content-Type: application/json',
                'Accept: application/json'
            ]);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $infobipPayload);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $resp = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErr = curl_error($ch);
            curl_close($ch);

            $decoded = json_decode($resp, true);
            if ($httpCode >= 200 && $httpCode < 300 && !empty($decoded['messages'])) {
                $result['sent'] = true;
                $result['provider'] = 'infobip';
                $result['phone'] = $intlPhone;
                $result['response'] = $decoded;
                return $result;
            } else {
                $result['error'] = "Infobip HTTP {$httpCode}: " . ($curlErr ?: $resp);
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
