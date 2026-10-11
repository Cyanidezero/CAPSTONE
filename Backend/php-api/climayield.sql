-- phpMyAdmin SQL Dump
-- ClimaYield-X — Clean Schema + Seed Data
-- Import via phpMyAdmin: Import tab -> choose this file -> Go
-- Creates the `climayield` database with farmers, developers, agricultural_data, and predictions tables.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `climayield`
--
CREATE DATABASE IF NOT EXISTS `climayield` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `climayield`;

-- --------------------------------------------------------

--
-- Table structure for table `farmers`
--
DROP TABLE IF EXISTS `farmers`;
CREATE TABLE `farmers` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `age` INT(11) NOT NULL DEFAULT 25,
  `farm_location` VARCHAR(255) NOT NULL DEFAULT '',
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `developers`
--
DROP TABLE IF EXISTS `developers`;
CREATE TABLE `developers` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `age` INT(11) NOT NULL DEFAULT 28,
  `organization` VARCHAR(255) DEFAULT '',
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agricultural_data`
--
DROP TABLE IF EXISTS `agricultural_data`;
CREATE TABLE `agricultural_data` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `date_recorded` VARCHAR(50) DEFAULT NULL,
  `rainfall` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `max_temp` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `min_temp` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `humidity` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `crop_yield` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `predictions`
--
DROP TABLE IF EXISTS `predictions`;
CREATE TABLE `predictions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `model_type` VARCHAR(50) NOT NULL,
  `steps` INT(11) NOT NULL DEFAULT 30,
  `prediction_data` LONGTEXT DEFAULT NULL,
  `summary` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Seed data for `farmers`
--
INSERT INTO `farmers` (`id`, `name`, `age`, `farm_location`, `email`, `password`) VALUES
(1, 'John Farmer', 35, 'Quezon City, Diliman', 'farmer@demo.com', '$2b$10$0uubsuJscCOeMfpFZzmN8.O1VcrpOOiHI2yisqFjJ3L00YoWPz.kS'),
(2, 'John Miller', 38, 'Green Valley Organic Farms', 'farmer@agri.coop', '$2b$10$T9x9XRCT1ycAoen82.DA/.LlGDouBW3ikMgnu7of/9flN7/cJkIcy');

-- --------------------------------------------------------

--
-- Seed data for `developers`
--
INSERT INTO `developers` (`id`, `name`, `age`, `organization`, `email`, `password`) VALUES
(1, 'Alex Developer', 28, 'AgriTech AI Labs', 'dev@demo.com', '$2b$10$9ZhBf0LDGZxEbjPOnukeWeGpTgYqQdJTRULjKckLyXOxuAVoBcLL.'),
(2, 'Alex Chen', 29, 'AgriTech AI Research Labs', 'dev@agri.coop', '$2b$10$T9x9XRCT1ycAoen82.DA/.LlGDouBW3ikMgnu7of/9flN7/cJkIcy');

-- --------------------------------------------------------

--
-- Seed data for `agricultural_data`
--
INSERT INTO `agricultural_data` (`date_recorded`, `rainfall`, `max_temp`, `min_temp`, `humidity`, `crop_yield`) VALUES
('2024-01-01', 12.50, 28.30, 22.10, 65.00, 4.20),
('2024-01-02', 8.20, 29.10, 23.40, 58.00, 4.50),
('2024-01-03', 0.00, 31.20, 24.80, 45.00, 4.80),
('2024-01-04', 15.80, 27.50, 21.90, 72.00, 3.90),
('2024-01-05', 5.30, 30.40, 23.70, 55.00, 4.60),
('2024-01-06', 2.10, 32.00, 25.10, 48.00, 4.90),
('2024-01-07', 0.00, 33.10, 25.50, 42.00, 5.10),
('2024-01-08', 18.40, 26.80, 21.20, 78.00, 3.80),
('2024-01-09', 10.20, 28.00, 22.50, 68.00, 4.30),
('2024-01-10', 4.50, 29.50, 23.00, 60.00, 4.70),
('2024-01-11', 0.00, 31.80, 24.20, 50.00, 4.90),
('2024-01-12', 7.60, 28.90, 22.80, 62.00, 4.40),
('2024-01-13', 14.10, 27.20, 21.50, 74.00, 4.00),
('2024-01-14', 3.20, 30.10, 23.60, 56.00, 4.70),
('2024-01-15', 0.00, 32.50, 24.90, 46.00, 5.00),
('2024-01-16', 9.50, 28.40, 22.30, 64.00, 4.50),
('2024-01-17', 16.20, 26.90, 21.00, 76.00, 3.90),
('2024-01-18', 6.80, 29.80, 23.20, 58.00, 4.60),
('2024-01-19', 1.50, 31.50, 24.50, 52.00, 4.80),
('2024-01-20', 0.00, 33.00, 25.30, 44.00, 5.20);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;