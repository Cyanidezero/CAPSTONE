<?php
/**
 * ClimaYield-X Database Seeder & Live Checker
 * Visit this in your browser: http://climayieldx.infinityfree.me/seed.php
 */
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/bootstrap.php';

echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Database Seeder - ClimaYield-X</title>";
echo "<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; line-height: 1.6; }
.card { background: #1e293b; border-radius: 12px; padding: 30px; max-width: 780px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #334155; }
h1 { color: #38bdf8; margin-top: 0; font-size: 26px; border-bottom: 2px solid #334155; padding-bottom: 12px; }
.badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 13px; font-weight: bold; }
.badge-success { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e; }
.badge-error { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; }
.badge-info { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #0284c7; }
table { width: 100%; border-collapse: collapse; margin-top: 15px; background: #0f172a; border-radius: 8px; overflow: hidden; }
th, td { border: 1px solid #334155; padding: 10px 14px; text-align: left; font-size: 14px; }
th { background: #1e293b; color: #38bdf8; font-weight: 600; }
tr:nth-child(even) { background: rgba(255,255,255,0.02); }
.cta-box { background: rgba(56, 189, 248, 0.08); border-left: 4px solid #38bdf8; padding: 16px; margin-top: 25px; border-radius: 4px; }
a.btn { display: inline-block; background: #0284c7; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px; margin-right: 10px; }
a.btn:hover { background: #0369a1; }
</style>";
echo "</head><body><div class='card'>";

echo "<h1>🌾 ClimaYield-X Live Database Setup & Seeder</h1>";

try {
    if (!isset($pdo) || !$pdo) {
        throw new Exception("PDO database connection is null. Please check your DB credentials in config.php.");
    }

    echo "<p><span class='badge badge-success'>Connected</span> Successfully connected to MySQL: <strong>" . DB_NAME . "</strong></p>";

    // Ensure farmers table exists
    $pdo->exec("
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
    ");

    // Ensure developers table exists
    $pdo->exec("
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
    ");

    // Seed Farmers if empty
    $fCount = (int)$pdo->query("SELECT COUNT(*) FROM farmers")->fetchColumn();
    if ($fCount === 0) {
        $hash = password_hash('password123', PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO farmers (name, age, farm_location, email, password) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['John Miller', 42, 'Green Valley Organic Farm, Benguet', 'farmer@agri.coop', $hash]);
        $stmt->execute(['Maria Santos', 38, 'Central Luzon High-Yield Plots, Nueva Ecija', 'farmer@demo.com', $hash]);
        echo "<p><span class='badge badge-success'>Seeded</span> Added 2 demo Farmer accounts into <code>farmers</code> table.</p>";
    } else {
        echo "<p><span class='badge badge-info'>Active</span> <code>farmers</code> table has <strong>{$fCount}</strong> accounts.</p>";
    }

    // Seed Developers if empty
    $dCount = (int)$pdo->query("SELECT COUNT(*) FROM developers")->fetchColumn();
    if ($dCount === 0) {
        $hash = password_hash('password123', PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO developers (name, age, organization, email, password) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['Dr. Alex Chen', 35, 'AgriTech AI Research Labs', 'dev@agri.coop', $hash]);
        $stmt->execute(['Sarah Jenkins', 29, 'Climate Data Modeling Institute', 'dev@demo.com', $hash]);
        echo "<p><span class='badge badge-success'>Seeded</span> Added 2 demo Developer accounts into <code>developers</code> table.</p>";
    } else {
        echo "<p><span class='badge badge-info'>Active</span> <code>developers</code> table has <strong>{$dCount}</strong> accounts.</p>";
    }

    // Display Farmers
    echo "<h3 style='color:#38bdf8; margin-top:25px;'>👨‍🌾 Registered Farmers (Live in phpMyAdmin):</h3>";
    $farmers = $pdo->query("SELECT id, name, email, farm_location, created_at FROM farmers ORDER BY id DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($farmers)) {
        echo "<table><tr><th>ID</th><th>Name</th><th>Email</th><th>Farm Location</th><th>Created At</th></tr>";
        foreach ($farmers as $f) {
            echo "<tr><td>{$f['id']}</td><td>" . htmlspecialchars($f['name']) . "</td><td>" . htmlspecialchars($f['email']) . "</td><td>" . htmlspecialchars($f['farm_location']) . "</td><td>{$f['created_at']}</td></tr>";
        }
        echo "</table>";
    }

    // Display Developers
    echo "<h3 style='color:#38bdf8; margin-top:25px;'>💻 Registered Developers (Live in phpMyAdmin):</h3>";
    $devs = $pdo->query("SELECT id, name, email, organization, created_at FROM developers ORDER BY id DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($devs)) {
        echo "<table><tr><th>ID</th><th>Name</th><th>Email</th><th>Organization</th><th>Created At</th></tr>";
        foreach ($devs as $d) {
            echo "<tr><td>{$d['id']}</td><td>" . htmlspecialchars($d['name']) . "</td><td>" . htmlspecialchars($d['email']) . "</td><td>" . htmlspecialchars($d['organization']) . "</td><td>{$d['created_at']}</td></tr>";
        }
        echo "</table>";
    }

    echo "<div class='cta-box'>";
    echo "<h4 style='margin:0 0 8px 0; color:#38bdf8;'>🚀 Database is Live & Ready!</h4>";
    echo "<p style='margin:0 0 12px 0;'>Now switch to your <strong>phpMyAdmin</strong> tab and click <strong>Refresh</strong> — both <code>farmers</code> and <code>developers</code> will show all data!</p>";
    echo "<a href='/farmer/' class='btn'>Go to Farmer Portal</a>";
    echo "<a href='/dev/' class='btn'>Go to Developer Portal</a>";
    echo "</div>";

} catch (Throwable $e) {
    echo "<p><span class='badge badge-error'>Error</span> " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "</div></body></html>";
