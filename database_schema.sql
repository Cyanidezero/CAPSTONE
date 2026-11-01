-- ClimaYield-X Complete Database Schema (for InfinityFree phpMyAdmin)
-- Instructions: In phpMyAdmin, click your database 'if0_43286056_climayield', click 'SQL' tab, paste this and click 'Go'.

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Farmers Table (User accounts for Farmer Portal)
CREATE TABLE IF NOT EXISTS `farmers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `age` int(11) NOT NULL DEFAULT 25,
  `phone` varchar(30) NOT NULL DEFAULT '',
  `farm_location` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Developers Table (User accounts for Developer Portal)
CREATE TABLE IF NOT EXISTS `developers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `age` int(11) NOT NULL DEFAULT 28,
  `phone` varchar(30) NOT NULL DEFAULT '',
  `organization` varchar(255) DEFAULT '',
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Weather & Agricultural Alerts (DevSide -> FarmerSide)
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_name` varchar(100) NOT NULL DEFAULT 'Dev Team',
  `alert_type` varchar(50) NOT NULL DEFAULT 'Weather Warning',
  `severity` varchar(20) NOT NULL DEFAULT 'medium',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `target_region` varchar(100) NOT NULL DEFAULT 'All Regions',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Announcements & System Bulletins
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_name` varchar(100) NOT NULL DEFAULT 'Admin',
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'General',
  `priority` varchar(20) NOT NULL DEFAULT 'normal',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. AI Predictions & Hybrid Forecasts
CREATE TABLE IF NOT EXISTS `predictions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `model_type` varchar(50) NOT NULL DEFAULT 'hybrid',
  `steps` int(11) NOT NULL DEFAULT 30,
  `prediction_data` longtext DEFAULT NULL,
  `summary` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Crop Yield Forecasts
CREATE TABLE IF NOT EXISTS `forecasts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `crop_name` varchar(100) NOT NULL DEFAULT 'Pechay',
  `target_date` varchar(50) NOT NULL,
  `predicted_yield` decimal(8,2) NOT NULL DEFAULT 0.00,
  `confidence_interval_low` decimal(8,2) NOT NULL DEFAULT 0.00,
  `confidence_interval_high` decimal(8,2) NOT NULL DEFAULT 0.00,
  `mae` decimal(8,2) NOT NULL DEFAULT 0.00,
  `rmse` decimal(8,2) NOT NULL DEFAULT 0.00,
  `mape` decimal(8,2) NOT NULL DEFAULT 0.00,
  `accuracy_score` decimal(8,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Weather Data (CSV uploads)
CREATE TABLE IF NOT EXISTS `weather_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date_recorded` varchar(50) DEFAULT NULL,
  `rainfall` decimal(8,2) NOT NULL DEFAULT 0.00,
  `max_temp` decimal(8,2) NOT NULL DEFAULT 0.00,
  `min_temp` decimal(8,2) NOT NULL DEFAULT 0.00,
  `humidity` decimal(8,2) NOT NULL DEFAULT 0.00,
  `wind_speed` decimal(8,2) NOT NULL DEFAULT 0.00,
  `source` varchar(100) DEFAULT 'upload',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Crop Yield Data (CSV uploads)
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

-- 9. Merged Agricultural Data
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

SET FOREIGN_KEY_CHECKS = 1;
