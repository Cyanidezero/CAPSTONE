<?php
require_once __DIR__ . '/../bootstrap.php';

$QC_LAT = 14.6760;
$QC_LON = 121.0437;
$url = "https://api.open-meteo.com/v1/forecast?latitude={$QC_LAT}&longitude={$QC_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&timezone=Asia%2FManila&forecast_days=7";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 6);
curl_setopt($ch, CURLOPT_USERAGENT, 'ClimaYield-X-InfinityFree/1.0');

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response && $httpCode === 200) {
    $data = json_decode($response, true);
    sendResponse(['success' => true, 'source' => 'live', 'data' => $data]);
} else {
    // Return safe fallback
    sendResponse([
        'success' => false,
        'message' => 'Unable to fetch external live weather. Client fallback will be used.'
    ]);
}
