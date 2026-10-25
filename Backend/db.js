const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'climayield',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00'
};

const pool = mysql.createPool(dbConfig);

// Test database connection and ensure tables exist
async function initDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log(`[Database] Connected successfully to XAMPP MySQL database "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}`);
        
        // Ensure tables exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS farmers (
                id INT(11) NOT NULL AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                age INT(11) NOT NULL DEFAULT 25,
                farm_location VARCHAR(255) NOT NULL DEFAULT '',
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS developers (
                id INT(11) NOT NULL AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                age INT(11) NOT NULL DEFAULT 28,
                organization VARCHAR(255) DEFAULT '',
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS weather_data (
                id INT(11) NOT NULL AUTO_INCREMENT,
                date_recorded VARCHAR(50) DEFAULT NULL,
                rainfall DECIMAL(8,2) NOT NULL DEFAULT 0.00,
                max_temp DECIMAL(8,2) NOT NULL DEFAULT 0.00,
                min_temp DECIMAL(8,2) NOT NULL DEFAULT 0.00,
                humidity DECIMAL(8,2) NOT NULL DEFAULT 0.00,
                wind_speed DECIMAL(8,2) NOT NULL DEFAULT 0.00,
                source VARCHAR(100) DEFAULT 'upload',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS crop_yield_data (
                id INT(11) NOT NULL AUTO_INCREMENT,
                date_recorded VARCHAR(50) DEFAULT NULL,
                crop_name VARCHAR(100) NOT NULL DEFAULT 'Pechay',
                crop_yield DECIMAL(8,2) NOT NULL DEFAULT 0.00,
                unit VARCHAR(20) DEFAULT 'tons/ha',
                source VARCHAR(100) DEFAULT 'upload',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS agricultural_data (
                id INT(11) NOT NULL AUTO_INCREMENT,
                date_recorded VARCHAR(50) DEFAULT NULL,
                crop_name VARCHAR(100) NOT NULL DEFAULT 'Pechay',
                rainfall DECIMAL(8,2) NOT NULL DEFAULT 0.00,
                max_temp DECIMAL(8,2) NOT NULL DEFAULT 0.00,
                min_temp DECIMAL(8,2) NOT NULL DEFAULT 0.00,
                humidity DECIMAL(8,2) NOT NULL DEFAULT 0.00,
                crop_yield DECIMAL(8,2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS predictions (
                id INT(11) NOT NULL AUTO_INCREMENT,
                model_type VARCHAR(50) NOT NULL,
                steps INT(11) NOT NULL DEFAULT 30,
                prediction_data LONGTEXT DEFAULT NULL,
                summary TEXT DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        try {
            await connection.query(`ALTER TABLE agricultural_data ADD COLUMN crop_name VARCHAR(100) NOT NULL DEFAULT 'Pechay' AFTER date_recorded`);
        } catch (colErr) {
            // Column already exists or table freshly created
        }

        connection.release();
        return true;
    } catch (err) {
        console.error('[Database] Failed to connect to MySQL in XAMPP:', err.message);
        console.error('[Database] Please verify XAMPP MySQL is running on port 3306 with database "climayield".');
        return false;
    }
}

module.exports = {
    pool,
    initDatabase
};
