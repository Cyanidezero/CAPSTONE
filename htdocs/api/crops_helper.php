<?php
/**
 * ClimaYield-X - Shared Database Schema, State & Rich Vegetable Helper
 * Ensures all MySQL tables exist and synchronizes Developer datasets & AI models with Farmer Portal.
 */

function ensureClimaYieldTables(PDO $pdo) {
    static $ensured = false;
    if ($ensured) return;
    $ensured = true;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `weather_data` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `date_recorded` varchar(50) DEFAULT NULL,
            `rainfall` decimal(8,2) NOT NULL DEFAULT 0.00,
            `max_temp` decimal(8,2) NOT NULL DEFAULT 0.00,
            `min_temp` decimal(8,2) NOT NULL DEFAULT 0.00,
            `humidity` decimal(8,2) NOT NULL DEFAULT 0.00,
            `wind_speed` decimal(8,2) NOT NULL DEFAULT 1.50,
            `source` varchar(100) DEFAULT 'upload',
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS `crop_yield_data` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `date_recorded` varchar(50) DEFAULT NULL,
            `crop_name` varchar(100) NOT NULL DEFAULT 'Pechay',
            `crop_yield` decimal(8,2) NOT NULL DEFAULT 0.00,
            `unit` varchar(50) DEFAULT 'tons/ha',
            `source` varchar(100) DEFAULT 'upload',
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS `agricultural_data` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `date_recorded` varchar(50) DEFAULT NULL,
            `crop_name` varchar(100) NOT NULL DEFAULT 'Pechay',
            `rainfall` decimal(8,2) NOT NULL DEFAULT 0.00,
            `max_temp` decimal(8,2) NOT NULL DEFAULT 0.00,
            `min_temp` decimal(8,2) NOT NULL DEFAULT 0.00,
            `humidity` decimal(8,2) NOT NULL DEFAULT 0.00,
            `crop_yield` decimal(8,2) NOT NULL DEFAULT 0.00,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS `predictions` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `model_type` varchar(50) NOT NULL DEFAULT 'hybrid',
            `steps` int(11) NOT NULL DEFAULT 30,
            `prediction_data` longtext DEFAULT NULL,
            `summary` text DEFAULT NULL,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS `ai_model_state` (
            `state_key` varchar(64) NOT NULL,
            `state_value` longtext NOT NULL,
            `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`state_key`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
}

function getStateValue(PDO $pdo, string $key, $default = null) {
    ensureClimaYieldTables($pdo);
    try {
        $stmt = $pdo->prepare("SELECT state_value FROM ai_model_state WHERE state_key = ? LIMIT 1");
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        if ($row && isset($row['state_value'])) {
            $decoded = json_decode($row['state_value'], true);
            return ($decoded !== null) ? $decoded : $default;
        }
    } catch (Exception $e) {
        // Ignore and return default
    }
    return $default;
}

function setStateValue(PDO $pdo, string $key, $value) {
    ensureClimaYieldTables($pdo);
    $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = $pdo->prepare("
        INSERT INTO ai_model_state (state_key, state_value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE state_value = VALUES(state_value), updated_at = CURRENT_TIMESTAMP
    ");
    $stmt->execute([$key, $json]);
}

function getKnownVegetablesCatalog(): array {
    return [
        'alugbati' => ['id' => 'alugbati', 'name' => 'Malabar Spinach', 'filipinoName' => 'Alugbati', 'icon' => '🌿', 'daysToGrowEn' => '30–45 days', 'daysToGrowFil' => '30–45 araw', 'stageEn' => 'Vegetative Vine & Leaf Growth', 'stageFil' => 'Paglaki ng Baging at Dahon', 'stageStep' => 2, 'progressPercent' => 45, 'aliases' => ['alugbati', 'malabar spinach']],
        'ampalaya' => ['id' => 'ampalaya', 'name' => 'Bitter Gourd', 'filipinoName' => 'Ampalaya', 'icon' => '🥒', 'daysToGrowEn' => '60–75 days', 'daysToGrowFil' => '60–75 araw', 'stageEn' => 'Fruit & Tendril Development', 'stageFil' => 'Paglaki ng Bunga at Gapang sa Balag', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['ampalaya', 'ampalaya fruit', 'ampalaya fruit [bitter gourd]', 'bitter gourd', 'bitter melon']],
        'asparagus' => ['id' => 'asparagus', 'name' => 'Asparagus', 'filipinoName' => 'Asparagus', 'icon' => '🌱', 'daysToGrowEn' => '70–90 days', 'daysToGrowFil' => '70–90 araw', 'stageEn' => 'Spear Emergence & Harvest', 'stageFil' => 'Pagsibol ng mga Talbos ng Asparagus', 'stageStep' => 5, 'progressPercent' => 90, 'aliases' => ['asparagus', 'esparago']],
        'basil' => ['id' => 'basil', 'name' => 'Basil', 'filipinoName' => 'Balanoy', 'icon' => '🌿', 'daysToGrowEn' => '30–40 days', 'daysToGrowFil' => '30–40 araw', 'stageEn' => 'Foliage & Branching Growth', 'stageFil' => 'Pagsasanga ng Mababangong Dahon', 'stageStep' => 2, 'progressPercent' => 50, 'aliases' => ['basil', 'balanoy', 'sweet basil']],
        'beets' => ['id' => 'beets', 'name' => 'Beets', 'filipinoName' => 'Remolatsa', 'icon' => '🥔', 'daysToGrowEn' => '50–65 days', 'daysToGrowFil' => '50–65 araw', 'stageEn' => 'Root Bulbing & Swelling', 'stageFil' => 'Pagbilog ng Mapulang Ugat sa Lupa', 'stageStep' => 3, 'progressPercent' => 60, 'aliases' => ['beets', 'beet', 'beetroot', 'remolatsa']],
        'broccoli' => ['id' => 'broccoli', 'name' => 'Broccoli', 'filipinoName' => 'Brokoli', 'icon' => '🥦', 'daysToGrowEn' => '60–75 days', 'daysToGrowFil' => '60–75 araw', 'stageEn' => 'Head & Floret Formation', 'stageFil' => 'Pagbuo ng Berdeng Kumpol ng Bulaklak', 'stageStep' => 3, 'progressPercent' => 70, 'aliases' => ['broccoli', 'brokoli']],
        'cabbage' => ['id' => 'cabbage', 'name' => 'Cabbage', 'filipinoName' => 'Repolyo', 'icon' => '🥬', 'daysToGrowEn' => '65–80 days', 'daysToGrowFil' => '65–80 araw', 'stageEn' => 'Firm Head Cupping & Maturation', 'stageFil' => 'Pagbuo at Pagbilog ng Makapal na Ulo', 'stageStep' => 4, 'progressPercent' => 80, 'aliases' => ['cabbage', 'repolyo']],
        'carrot' => ['id' => 'carrot', 'name' => 'Carrot', 'filipinoName' => 'Karot', 'icon' => '🥕', 'daysToGrowEn' => '65–75 days', 'daysToGrowFil' => '65–75 araw', 'stageEn' => 'Taproot Elongation & Sweetening', 'stageFil' => 'Paghaba at Pagtamis ng Kulay Kahel na Ugat', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['carrot', 'karot']],
        'cauliflower' => ['id' => 'cauliflower', 'name' => 'Cauliflower', 'filipinoName' => 'Koliplor', 'icon' => '🥦', 'daysToGrowEn' => '60–75 days', 'daysToGrowFil' => '60–75 araw', 'stageEn' => 'Curd Blanching & Formation', 'stageFil' => 'Pagbuo ng Puting Curd o Kumpol', 'stageStep' => 3, 'progressPercent' => 70, 'aliases' => ['cauliflower', 'koliplor']],
        'celery' => ['id' => 'celery', 'name' => 'Celery', 'filipinoName' => 'Kintsay', 'icon' => '🌿', 'daysToGrowEn' => '80–95 days', 'daysToGrowFil' => '80–95 araw', 'stageEn' => 'Petiole Stalk Thickening', 'stageFil' => 'Pagkapal ng Malutong na Tangkay', 'stageStep' => 3, 'progressPercent' => 65, 'aliases' => ['celery', 'kintsay malalapad', 'seleri']],
        'chinese_cabbage' => ['id' => 'chinese_cabbage', 'name' => 'Chinese Cabbage', 'filipinoName' => 'Pechay Baguio', 'icon' => '🥬', 'daysToGrowEn' => '50–65 days', 'daysToGrowFil' => '50–65 araw', 'stageEn' => 'Elongated Head Tightening', 'stageFil' => 'Paghaba at Pagkumpol ng Pechay Baguio', 'stageStep' => 3, 'progressPercent' => 70, 'aliases' => ['chinese cabbage', 'wongbok', 'pechay baguio', 'chinese cabbage (wongbok, pechay baguio)', 'napa cabbage']],
        'chives' => ['id' => 'chives', 'name' => 'Chives', 'filipinoName' => 'Kutsay', 'icon' => '🌱', 'daysToGrowEn' => '30–45 days', 'daysToGrowFil' => '30–45 araw', 'stageEn' => 'Slender Hollow Leaf Growth', 'stageFil' => 'Pagtubo ng Matutulis na Dahon ng Kutsay', 'stageStep' => 2, 'progressPercent' => 50, 'aliases' => ['chives', 'kutsay']],
        'coriander' => ['id' => 'coriander', 'name' => 'Coriander / Cilantro', 'filipinoName' => 'Wansoy', 'icon' => '🌿', 'daysToGrowEn' => '30–40 days', 'daysToGrowFil' => '30–40 araw', 'stageEn' => 'Feathery Foliage Emergence', 'stageFil' => 'Pag-usbong ng Mabangong Dahon ng Wansoy', 'stageStep' => 2, 'progressPercent' => 45, 'aliases' => ['coriander', 'wansoy', 'cilantro']],
        'cowpea' => ['id' => 'cowpea', 'name' => 'Cowpea (Green)', 'filipinoName' => 'Paayap', 'icon' => '🫛', 'daysToGrowEn' => '45–55 days', 'daysToGrowFil' => '45–55 araw', 'stageEn' => 'Pod Filling & Maturation', 'stageFil' => 'Pamumunga at Paghaba ng Pod ng Paayap', 'stageStep' => 4, 'progressPercent' => 80, 'aliases' => ['cowpea, green', 'cowpea', 'paayap']],
        'cucumber' => ['id' => 'cucumber', 'name' => 'Cucumber', 'filipinoName' => 'Pipino', 'icon' => '🥒', 'daysToGrowEn' => '45–50 days', 'daysToGrowFil' => '45–50 araw', 'stageEn' => 'Fruit Development', 'stageFil' => 'Paglaki ng Bunga', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['cucumber', 'pipino']],
        'eggplant' => ['id' => 'eggplant', 'name' => 'Eggplant', 'filipinoName' => 'Talong', 'icon' => '🍆', 'daysToGrowEn' => '65–75 days', 'daysToGrowFil' => '65–75 araw', 'stageEn' => 'Vegetative & Stalk Growth', 'stageFil' => 'Paglaki ng Sangay at Tangkay', 'stageStep' => 2, 'progressPercent' => 50, 'aliases' => ['eggplant', 'talong', 'aubergine']],
        'gisantes' => ['id' => 'gisantes', 'name' => 'Garden Pea', 'filipinoName' => 'Gisantes', 'icon' => '🫛', 'daysToGrowEn' => '55–65 days', 'daysToGrowFil' => '55–65 araw', 'stageEn' => 'Pod Swelling & Sugar Filling', 'stageFil' => 'Pagbilog at Pagtamis ng Buto sa Pod', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['gisantes', 'gisantes [garden pea]', 'garden pea']],
        'habitchuelas' => ['id' => 'habitchuelas', 'name' => 'Snap Beans', 'filipinoName' => 'Habitchuelas', 'icon' => '🫛', 'daysToGrowEn' => '45–55 days', 'daysToGrowFil' => '45–55 araw', 'stageEn' => 'Crisp Tender Pod Elongation', 'stageFil' => 'Paghaba ng Malulutong na Baguio Beans', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['habitchuelas', 'habitchuelas [snap beans]', 'snap beans', 'baguio beans']],
        'kangkong' => ['id' => 'kangkong', 'name' => 'Water Spinach', 'filipinoName' => 'Kangkong', 'icon' => '🌿', 'daysToGrowEn' => '20–25 days', 'daysToGrowFil' => '20–25 araw', 'stageEn' => 'Vegetative Shoot Growth', 'stageFil' => 'Paglaki ng Dahon at Tangkay', 'stageStep' => 2, 'progressPercent' => 45, 'aliases' => ['kangkong', 'kangkong [swamp cabbage]', 'water spinach', 'swamp cabbage']],
        'kinchay' => ['id' => 'kinchay', 'name' => 'Chinese Celery', 'filipinoName' => 'Kinchay', 'icon' => '🌿', 'daysToGrowEn' => '40–50 days', 'daysToGrowFil' => '40–50 araw', 'stageEn' => 'Aromatic Leaf Clump Development', 'stageFil' => 'Mabangong Pagsibol ng Kinchay', 'stageStep' => 2, 'progressPercent' => 55, 'aliases' => ['kinchay', 'chinese celery']],
        'kulitis' => ['id' => 'kulitis', 'name' => 'Amaranth Greens', 'filipinoName' => 'Kulitis', 'icon' => '🌿', 'daysToGrowEn' => '25–35 days', 'daysToGrowFil' => '25–35 araw', 'stageEn' => 'Leafy Foliage Flurry', 'stageFil' => 'Mabilis na Pagsibol ng Masustansyang Dahon', 'stageStep' => 2, 'progressPercent' => 45, 'aliases' => ['kulitis', 'amaranth', 'uray']],
        'lettuce' => ['id' => 'lettuce', 'name' => 'Lettuce', 'filipinoName' => 'Letsugas', 'icon' => '🥗', 'daysToGrowEn' => '25–35 days', 'daysToGrowFil' => '25–35 araw', 'stageEn' => 'Head Formation', 'stageFil' => 'Pagbuo ng Kumpol ng Dahon', 'stageStep' => 3, 'progressPercent' => 65, 'aliases' => ['lettuce', 'letsugas']],
        'mustasa' => ['id' => 'mustasa', 'name' => 'Mustard Greens', 'filipinoName' => 'Mustasa', 'icon' => '🥬', 'daysToGrowEn' => '25–32 days', 'daysToGrowFil' => '25–32 araw', 'stageEn' => 'Ready for Harvest', 'stageFil' => 'Handa nang Anihin', 'stageStep' => 5, 'progressPercent' => 100, 'aliases' => ['mustard', 'mustasa', 'mustard greens']],
        'okra' => ['id' => 'okra', 'name' => 'Okra', 'filipinoName' => 'Okra', 'icon' => '🌱', 'daysToGrowEn' => '45–50 days', 'daysToGrowFil' => '45–50 araw', 'stageEn' => 'Pod Setting', 'stageFil' => 'Pamumunga ng Daliri ng Okra', 'stageStep' => 3, 'progressPercent' => 70, 'aliases' => ['okra', "okra [lady's finger]", 'lady finger', 'ladyfinger']],
        'onion_leeks' => ['id' => 'onion_leeks', 'name' => 'Onion Leeks', 'filipinoName' => 'Dahon ng Sibuyas', 'icon' => '🌱', 'daysToGrowEn' => '60–75 days', 'daysToGrowFil' => '60–75 araw', 'stageEn' => 'Stem Thickening & Blanched Sheaths', 'stageFil' => 'Pagkapal ng Puting Tangkay', 'stageStep' => 3, 'progressPercent' => 65, 'aliases' => ['onion leeks', 'leeks', 'leek']],
        'parsley' => ['id' => 'parsley', 'name' => 'Parsley', 'filipinoName' => 'Pasli', 'icon' => '🌿', 'daysToGrowEn' => '45–60 days', 'daysToGrowFil' => '45–60 araw', 'stageEn' => 'Bushy Herb Clustering', 'stageFil' => 'Makapal na Kumpol ng Dahon ng Parsley', 'stageStep' => 2, 'progressPercent' => 50, 'aliases' => ['parsley', 'pasli']],
        'patola' => ['id' => 'patola', 'name' => 'Sponge Gourd', 'filipinoName' => 'Patola', 'icon' => '🥒', 'daysToGrowEn' => '50–65 days', 'daysToGrowFil' => '50–65 araw', 'stageEn' => 'Tender Gourd Hanging & Sizing', 'stageFil' => 'Lumalaking Bunga sa Balag', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['patola', 'sponge gourd', 'luffa']],
        'pechay' => ['id' => 'pechay', 'name' => 'Pechay / Bok Choy', 'filipinoName' => 'Pechay', 'icon' => '🥬', 'daysToGrowEn' => '25–30 days', 'daysToGrowFil' => '25–30 araw', 'stageEn' => 'Vegetative Foliage Growth', 'stageFil' => 'Paglaki ng Dahon at Tangkay', 'stageStep' => 2, 'progressPercent' => 40, 'aliases' => ['pechay', 'petsay', 'bok choy', 'bokchoy']],
        'pechay_native' => ['id' => 'pechay_native', 'name' => 'Native Pechay', 'filipinoName' => 'Pechay Tagalog', 'icon' => '🥬', 'daysToGrowEn' => '25–30 days', 'daysToGrowFil' => '25–30 araw', 'stageEn' => 'Crisp Petiole & Leaf Spread', 'stageFil' => 'Paglapad ng Puting Tangkay ng Pechay Tagalog', 'stageStep' => 2, 'progressPercent' => 45, 'aliases' => ['pechay, native', 'native pechay', 'pechay tagalog', 'pechay native']],
        'pepper' => ['id' => 'pepper', 'name' => 'Chili Pepper', 'filipinoName' => 'Sili', 'icon' => '🌶️', 'daysToGrowEn' => '60–70 days', 'daysToGrowFil' => '60–70 araw', 'stageEn' => 'Flowering & Fruiting', 'stageFil' => 'Pamumulaklak at Pamumunga', 'stageStep' => 3, 'progressPercent' => 65, 'aliases' => ['pepper', 'sili', 'chili pepper', 'chili']],
        'bell_pepper' => ['id' => 'bell_pepper', 'name' => 'Bell Pepper', 'filipinoName' => 'Siling Atsara', 'icon' => '🫑', 'daysToGrowEn' => '65–80 days', 'daysToGrowFil' => '65–80 araw', 'stageEn' => 'Blocky Fruit Expansion & Color Turn', 'stageFil' => 'Paglaki at Pagkapal ng Bunga ng Bell Pepper', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['pepper, bell', 'bell pepper', 'sweet pepper', 'siling atsara']],
        'finger_pepper' => ['id' => 'finger_pepper', 'name' => 'Finger Pepper', 'filipinoName' => 'Siling Haba', 'icon' => '🌶️', 'daysToGrowEn' => '55–65 days', 'daysToGrowFil' => '55–65 araw', 'stageEn' => 'Elongated Green Pod Maturation', 'stageFil' => 'Paghaba ng Berdeng Siling Panigang', 'stageStep' => 4, 'progressPercent' => 80, 'aliases' => ['pepper, finger', 'finger pepper', 'siling haba', 'siling panigang']],
        'radish' => ['id' => 'radish', 'name' => 'White Radish', 'filipinoName' => 'Labanos', 'icon' => '🥕', 'daysToGrowEn' => '40–45 days', 'daysToGrowFil' => '40–45 araw', 'stageEn' => 'Root Bulking & Expansion', 'stageFil' => 'Paglaki ng Ugat sa Ilalim ng Lupa', 'stageStep' => 3, 'progressPercent' => 60, 'aliases' => ['radish', 'white radish', 'labanos', 'daikon']],
        'saluyot' => ['id' => 'saluyot', 'name' => 'Jute Mallow', 'filipinoName' => 'Saluyot', 'icon' => '🌿', 'daysToGrowEn' => '30–45 days', 'daysToGrowFil' => '30–45 araw', 'stageEn' => 'Vigorous Tender Leaf Flushing', 'stageFil' => 'Mabilis na Pagdami ng Masustansyang Dahon', 'stageStep' => 2, 'progressPercent' => 50, 'aliases' => ['saluyot', 'jute mallow']],
        'sigarilyas' => ['id' => 'sigarilyas', 'name' => 'Winged Beans', 'filipinoName' => 'Sigarilyas', 'icon' => '🫛', 'daysToGrowEn' => '60–75 days', 'daysToGrowFil' => '60–75 araw', 'stageEn' => 'Four-Winged Pod Formation', 'stageFil' => 'Pagbuo ng Kulot na Bunga ng Sigarilyas', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['sigarilyas', 'sigarilyas [winged beans]', 'winged beans', 'winged bean']],
        'singkamas' => ['id' => 'singkamas', 'name' => 'Turnip / Jicama', 'filipinoName' => 'Singkamas', 'icon' => '🥔', 'daysToGrowEn' => '75–90 days', 'daysToGrowFil' => '75–90 araw', 'stageEn' => 'Crisp Tuberous Root Swelling', 'stageFil' => 'Pagbilog at Pagtamis ng Lamang-Ugat', 'stageStep' => 4, 'progressPercent' => 80, 'aliases' => ['singkamas', 'singkamas [turnip]', 'turnip', 'jicama']],
        'sitaw' => ['id' => 'sitaw', 'name' => 'String Beans', 'filipinoName' => 'Sitaw', 'icon' => '🫛', 'daysToGrowEn' => '45–55 days', 'daysToGrowFil' => '45–55 araw', 'stageEn' => 'Pod Development', 'stageFil' => 'Paglaki ng Pod', 'stageStep' => 4, 'progressPercent' => 80, 'aliases' => ['sitaw', 'sitao', 'sitao [stringbeans]', 'string beans', 'stringbeans', 'yardlong bean']],
        'spinach' => ['id' => 'spinach', 'name' => 'Spinach', 'filipinoName' => 'Espinaka', 'icon' => '🥬', 'daysToGrowEn' => '30–40 days', 'daysToGrowFil' => '30–40 araw', 'stageEn' => 'Rosette Leaf Expansion', 'stageFil' => 'Paglapad ng Malulusog na Dahon', 'stageStep' => 2, 'progressPercent' => 50, 'aliases' => ['spinach', 'espinaka']],
        'spring_onion' => ['id' => 'spring_onion', 'name' => 'Spring Onion', 'filipinoName' => 'Dahon ng Sibuyas', 'icon' => '🌱', 'daysToGrowEn' => '35–45 days', 'daysToGrowFil' => '35–45 araw', 'stageEn' => 'Tubular Green Shoot Multiplication', 'stageFil' => 'Pagtubo ng Sariwang Dahon ng Sibuyas', 'stageStep' => 3, 'progressPercent' => 65, 'aliases' => ['spring onion', 'scallion', 'green onion']],
        'squash' => ['id' => 'squash', 'name' => 'Squash', 'filipinoName' => 'Kalabasa', 'icon' => '🎃', 'daysToGrowEn' => '70–85 days', 'daysToGrowFil' => '70–85 araw', 'stageEn' => 'Fruit Swelling & Rind Hardening', 'stageFil' => 'Pagbilog at Pagtigas ng Kalabasa', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['squash', 'squash fruit', 'kalabasa', 'pumpkin']],
        'sweet_peas' => ['id' => 'sweet_peas', 'name' => 'Sweet Peas', 'filipinoName' => 'Sitsaro', 'icon' => '🫛', 'daysToGrowEn' => '55–65 days', 'daysToGrowFil' => '55–65 araw', 'stageEn' => 'Flat Crisp Pod Sweetening', 'stageFil' => 'Paglapad ng Matamis na Sitsaro', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['sweet peas', 'sitsaro', 'snow peas', 'chicharo']],
        'talinum' => ['id' => 'talinum', 'name' => 'Talinum', 'filipinoName' => 'Talinum', 'icon' => '🌿', 'daysToGrowEn' => '25–35 days', 'daysToGrowFil' => '25–35 araw', 'stageEn' => 'Succulent Stem & Leaf Growth', 'stageFil' => 'Mabilis na Pagsibol ng Talbos ng Talinum', 'stageStep' => 2, 'progressPercent' => 50, 'aliases' => ['talinum', 'philippine spinach', 'waterleaf']],
        'tomato' => ['id' => 'tomato', 'name' => 'Tomato', 'filipinoName' => 'Kamatis', 'icon' => '🍅', 'daysToGrowEn' => '60–70 days', 'daysToGrowFil' => '60–70 araw', 'stageEn' => 'Fruit Development', 'stageFil' => 'Lumalaking Bunga', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['tomato', 'kamatis']],
        'upo' => ['id' => 'upo', 'name' => 'Bottle Gourd', 'filipinoName' => 'Upo', 'icon' => '🥒', 'daysToGrowEn' => '60–75 days', 'daysToGrowFil' => '60–75 araw', 'stageEn' => 'Elongated Gourd Hanging', 'stageFil' => 'Paghaba ng Bunga ng Upo sa Balag', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['upo', 'upo [bottle gourd]', 'bottle gourd']],
        'watercress' => ['id' => 'watercress', 'name' => 'Watercress', 'filipinoName' => 'Watercress', 'icon' => '🌿', 'daysToGrowEn' => '25–35 days', 'daysToGrowFil' => '25–35 araw', 'stageEn' => 'Aquatic Shoot Proliferation', 'stageFil' => 'Pagsibol sa Mamasa-masang Kama', 'stageStep' => 2, 'progressPercent' => 55, 'aliases' => ['watercress', 'untong']],
        'young_corn' => ['id' => 'young_corn', 'name' => 'Young Corn', 'filipinoName' => 'Batang Mais', 'icon' => '🌽', 'daysToGrowEn' => '45–55 days', 'daysToGrowFil' => '45–55 araw', 'stageEn' => 'Silking & Baby Ear Emergence', 'stageFil' => 'Paglabas ng Murang Puso ng Mais', 'stageStep' => 4, 'progressPercent' => 80, 'aliases' => ['young corn', 'baby corn', 'batang mais']],
        'zucchini' => ['id' => 'zucchini', 'name' => 'Zucchini', 'filipinoName' => 'Zucchini', 'icon' => '🥒', 'daysToGrowEn' => '45–55 days', 'daysToGrowFil' => '45–55 araw', 'stageEn' => 'Tender Cylindrical Squash Growth', 'stageFil' => 'Mabilis na Paglaki ng Bunga ng Zucchini', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['zucchini', 'courgette']],
        'sayote' => ['id' => 'sayote', 'name' => 'Chayote', 'filipinoName' => 'Sayote', 'icon' => '🍐', 'daysToGrowEn' => '60–75 days', 'daysToGrowFil' => '60–75 araw', 'stageEn' => 'Vine & Fruit Growth', 'stageFil' => 'Paglaki ng Bunga ng Sayote', 'stageStep' => 4, 'progressPercent' => 75, 'aliases' => ['chayote', 'sayote']],
        'malunggay' => ['id' => 'malunggay', 'name' => 'Moringa', 'filipinoName' => 'Malunggay', 'icon' => '🌿', 'daysToGrowEn' => '45–60 days', 'daysToGrowFil' => '45–60 araw', 'stageEn' => 'Leafy Branching', 'stageFil' => 'Paglago ng Dahon ng Malunggay', 'stageStep' => 3, 'progressPercent' => 70, 'aliases' => ['malunggay', 'moringa']]
    ];
}

function detectRichCrops(array $rawCropNames): array {
    $catalog = getKnownVegetablesCatalog();
    $found = [];
    $seenRaw = [];

    foreach ($rawCropNames as $item) {
        if (is_array($item) && isset($item['id']) && isset($item['name'])) {
            $found[$item['id']] = $item;
            continue;
        }
        $rawStr = trim(is_string($item) ? $item : ($item['name'] ?? ''));
        $val = strtolower($rawStr);
        if (empty($val) || isset($seenRaw[$val])) continue;
        $seenRaw[$val] = true;

        $matchedKey = null;

        // 1. Exact alias match first (so "pechay, native" matches pechay_native before pechay)
        foreach ($catalog as $key => $veg) {
            foreach ($veg['aliases'] as $alias) {
                if ($val === $alias) {
                    $matchedKey = $key;
                    break 2;
                }
            }
        }

        // 2. Substring alias match if no exact match
        if ($matchedKey === null) {
            foreach ($catalog as $key => $veg) {
                foreach ($veg['aliases'] as $alias) {
                    if (strpos($val, $alias) !== false) {
                        $matchedKey = $key;
                        break 2;
                    }
                }
            }
        }

        if ($matchedKey !== null) {
            if (!isset($found[$matchedKey])) {
                $cleanVeg = $catalog[$matchedKey];
                unset($cleanVeg['aliases']);
                $found[$matchedKey] = $cleanVeg;
            } else {
                // Distinct cultivar in CSV that shares a base vegetable: preserve as its own variety
                $customId = preg_replace('/[^a-z0-9]+/', '_', $val);
                $customId = trim($customId, '_');
                if (!empty($customId) && !isset($found[$customId])) {
                    $cleanVeg = $catalog[$matchedKey];
                    unset($cleanVeg['aliases']);
                    $cleanVeg['id'] = $customId;
                    $cleanVeg['name'] = $rawStr;
                    $found[$customId] = $cleanVeg;
                }
            }
        } else {
            // 3. Fallback for any valid custom vegetable in the CSV so no crop is ever dropped
            $customId = preg_replace('/[^a-z0-9]+/', '_', $val);
            $customId = trim($customId, '_');
            if (!empty($customId) && !isset($found[$customId])) {
                $displayName = ucwords($rawStr);
                $found[$customId] = [
                    'id'              => $customId,
                    'name'            => $displayName,
                    'filipinoName'    => $displayName,
                    'icon'            => '🌱',
                    'daysToGrowEn'    => '35–45 days',
                    'daysToGrowFil'   => '35–45 araw',
                    'stageEn'         => 'Active Plant Development',
                    'stageFil'        => 'Aktibong Paglaki ng Pananim',
                    'stageStep'       => 3,
                    'progressPercent' => 55
                ];
            }
        }
    }

    return array_values($found);
}

function getDetectedCropsFromDatabase(PDO $pdo): array {
    ensureClimaYieldTables($pdo);

    // 1. Check if crop_yield_data has records
    $cCount = (int)$pdo->query("SELECT COUNT(*) FROM crop_yield_data")->fetchColumn();
    if ($cCount > 0) {
        $stmt = $pdo->query("SELECT crop_name FROM crop_yield_data WHERE crop_name IS NOT NULL AND crop_name != '' GROUP BY crop_name ORDER BY MIN(id) ASC");
        $names = $stmt ? $stmt->fetchAll(PDO::FETCH_COLUMN) : [];
        $rich = detectRichCrops($names);
        if (!empty($rich)) {
            setStateValue($pdo, 'detected_crops', $rich);
            return $rich;
        }
    }

    // 2. Check if crops are stored in ai_model_state
    $savedState = getStateValue($pdo, 'detected_crops');
    if (!empty($savedState)) {
        if (is_array($savedState) && count($savedState) > 0) {
            return $savedState;
        }
        $decoded = json_decode((string)$savedState, true);
        if (is_array($decoded) && count($decoded) > 0) {
            return $decoded;
        }
    }

    return [];
}

function syncAgriculturalData(PDO $pdo): int {
    ensureClimaYieldTables($pdo);

    $wRows = $pdo->query("SELECT date_recorded, rainfall, max_temp, min_temp, humidity, wind_speed FROM weather_data ORDER BY id ASC LIMIT 500")->fetchAll();
    $cRows = $pdo->query("SELECT date_recorded, crop_name, crop_yield FROM crop_yield_data ORDER BY id ASC LIMIT 500")->fetchAll();

    if (empty($wRows) && empty($cRows)) {
        $pdo->exec("TRUNCATE TABLE agricultural_data");
        setStateValue($pdo, 'detected_crops', []);
        return 0;
    }

    $merged = [];
    $maxCount = max(count($wRows), count($cRows));
    $wLen = count($wRows);
    $cLen = count($cRows);

    for ($i = 0; $i < $maxCount; $i++) {
        $w = $wLen > 0 ? $wRows[$i % $wLen] : ['date_recorded' => date('Y-m-d'), 'rainfall' => 10.5, 'max_temp' => 31.2, 'min_temp' => 24.0, 'humidity' => 76.0];
        $c = $cLen > 0 ? $cRows[$i % $cLen] : ['date_recorded' => $w['date_recorded'], 'crop_name' => 'Pechay', 'crop_yield' => 5.92];

        $merged[] = [
            'date_recorded' => $c['date_recorded'] ?: ($w['date_recorded'] ?: date('Y-m-d')),
            'crop_name'     => $c['crop_name'] ?: 'Pechay',
            'rainfall'      => (float)($w['rainfall'] ?? 0),
            'max_temp'      => (float)($w['max_temp'] ?? 31),
            'min_temp'      => (float)($w['min_temp'] ?? 24),
            'humidity'      => (float)($w['humidity'] ?? 75),
            'crop_yield'    => (float)($c['crop_yield'] ?? 5.92)
        ];
    }

    try {
        $pdo->exec("TRUNCATE TABLE agricultural_data");
        $stmt = $pdo->prepare("INSERT INTO agricultural_data (date_recorded, crop_name, rainfall, max_temp, min_temp, humidity, crop_yield) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $pdo->beginTransaction();
        foreach ($merged as $m) {
            $stmt->execute([
                $m['date_recorded'],
                $m['crop_name'],
                $m['rainfall'],
                $m['max_temp'],
                $m['min_temp'],
                $m['humidity'],
                $m['crop_yield']
            ]);
        }
        $pdo->commit();
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
    }

    // Query ALL distinct crop names across the entire crop_yield_data table (not just the first 500 rows)
    $stmtAllCrops = $pdo->query("SELECT crop_name FROM crop_yield_data WHERE crop_name IS NOT NULL AND crop_name != '' GROUP BY crop_name ORDER BY MIN(id) ASC");
    $allCropNames = $stmtAllCrops ? $stmtAllCrops->fetchAll(PDO::FETCH_COLUMN) : [];
    if (!empty($allCropNames)) {
        $rich = detectRichCrops($allCropNames);
        setStateValue($pdo, 'detected_crops', $rich);
    } else {
        setStateValue($pdo, 'detected_crops', []);
    }

    return count($merged);
}

