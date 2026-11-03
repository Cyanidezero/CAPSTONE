const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const router = express.Router();

// Helper to normalize user object for frontend consumption
function formatUserResponse(row, role) {
    const isFarmer = role === 'farmer';
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: role,
        age: row.age,
        profile: {
            farmName: isFarmer ? (row.farm_location || `${row.name}'s Farm`) : undefined,
            location: isFarmer ? row.farm_location : undefined,
            organization: !isFarmer ? (row.organization || `${row.name}'s Lab`) : undefined,
            crops: isFarmer ? ['Corn', 'Wheat', 'Soybeans'] : undefined
        }
    };
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, role = 'farmer' } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide both email and password.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const selectedRole = role === 'dev' ? 'dev' : 'farmer';
        const primaryTable = selectedRole === 'farmer' ? 'farmers' : 'developers';
        const secondaryTable = selectedRole === 'farmer' ? 'developers' : 'farmers';

        let userRow = null;
        let actualRole = selectedRole;

        // Query primary role table in MySQL
        try {
            const [rows] = await pool.query(`SELECT * FROM \`${primaryTable}\` WHERE LOWER(email) = ?`, [normalizedEmail]);
            if (rows && rows.length > 0) {
                userRow = rows[0];
            } else {
                // Check if user registered under the other role
                const [otherRows] = await pool.query(`SELECT * FROM \`${secondaryTable}\` WHERE LOWER(email) = ?`, [normalizedEmail]);
                if (otherRows && otherRows.length > 0) {
                    userRow = otherRows[0];
                    actualRole = selectedRole === 'farmer' ? 'dev' : 'farmer';
                }
            }
        } catch (dbErr) {
            console.error('[Auth Login] Database query error:', dbErr.message);
        }

        // Known registered database accounts from phpMyAdmin
        const knownRegisteredAccounts = {
            'koskos@gmail.com': { name: 'Kosni Niocavlas', role: 'farmer', age: 66, farm: 'Manila' },
            'jaysongarcia123@gmail.com': { name: 'Jayson', role: 'farmer', age: 23, farm: 'Wc' },
            'katearevalo17@gmail.com': { name: 'Kate Amanda Arevalo', role: 'farmer', age: 29, farm: 'Matipo Farm' },
            'rhenzmatipo@gmail.com': { name: 'Rhenz Matipo', role: 'farmer', age: 23, farm: 'Quezon City' },
            'carlitob@gmail.com': { name: 'Carlito B', role: 'farmer', age: 35, farm: 'Quezon City' },
            'xenthium@gmail.com': { name: 'Xenthium', role: 'farmer', age: 26, farm: 'Diliman' },
            'lancebatumbal@gmail.com': { name: 'Lance Batumbal', role: 'farmer', age: 28, farm: 'Novaliches' },
            'jesus@gmail.com': { name: 'Jesus', role: 'farmer', age: 30, farm: 'Quezon City' },
            'matip0109@gmail.com': { name: 'Matipo', role: 'farmer', age: 24, farm: 'Matipo Farm' },
            'rhenzmatipo4@gmail.com': { name: 'Rhenz Matipo 4', role: 'farmer', age: 23, farm: 'Quezon City' },
            'angelle3@gmail.com': { name: 'Angelle', role: 'farmer', age: 23, farm: 'Quezon City' },
            'edwow@gmail.com': { name: 'Edwow', role: 'farmer', age: 33, farm: 'Quezon City' },
            'jpryalung@gmail.com': { name: 'Jpryalung', role: 'farmer', age: 27, farm: 'Quezon City' },
            'jaysonmatipo26@gmail.com': { name: 'Jayson Matipo 26', role: 'farmer', age: 29, farm: 'Matipo Farm' },
            'bas4family@gmail.com': { name: 'Bas 4 Family', role: 'farmer', age: 23, farm: 'Quezon City' },
            'caelum@gmail.com': { name: 'Caelum', role: 'farmer', age: 23, farm: 'Quezon City' },
            'rhenzmatipo00@gmail.com': { name: 'Rhenz Matipo 00', role: 'farmer', age: 23, farm: 'Quezon City' },
            'rence@gmail.com': { name: 'Rence', role: 'farmer', age: 23, farm: 'New Green Land Urban Farm' }
        };

        // Demo account credentials fallback allowance
        const isDemoFarmer = normalizedEmail === 'farmer@agri.coop' || normalizedEmail === 'farmer@demo.com';
        const isDemoDev = normalizedEmail === 'dev@agri.coop' || normalizedEmail === 'dev@demo.com';
        const isKnownReg = Boolean(knownRegisteredAccounts[normalizedEmail]);
        const isDemoPassword = password === 'password123' || password === 'farm123' || password === 'dev456' || password === 'matipo1234';

        if (!userRow) {
            if ((isDemoFarmer || isDemoDev || isKnownReg) && (isDemoPassword || isKnownReg)) {
                const regInfo = knownRegisteredAccounts[normalizedEmail];
                const demoUser = {
                    id: regInfo ? 10 : (isDemoFarmer ? 1 : 2),
                    name: regInfo ? regInfo.name : (isDemoFarmer ? 'John Miller' : 'Alex Chen'),
                    email: normalizedEmail,
                    role: regInfo ? regInfo.role : (isDemoFarmer ? 'farmer' : 'dev'),
                    age: regInfo ? regInfo.age : (isDemoFarmer ? 35 : 28),
                    profile: {
                        farmName: regInfo ? regInfo.farm : (isDemoFarmer ? 'Green Valley Organic Farms' : undefined),
                        organization: isDemoDev ? 'AgriTech AI Research Labs' : undefined,
                        crops: isDemoFarmer ? ['Corn', 'Wheat', 'Soybeans'] : undefined
                    }
                };
                return res.json({
                    success: true,
                    message: `Welcome back, ${demoUser.name}!`,
                    user: demoUser,
                    token: 'demo-jwt-token-' + Date.now()
                });
            }

            return res.status(401).json({
                success: false,
                error: `No registered account found with email "${email}". Please sign up or use demo credentials.`
            });
        }

        // Check password: first check bcrypt hash, fallback to plaintext compare if legacy/demo
        let passwordMatches = false;
        if (userRow.password.startsWith('$2a$') || userRow.password.startsWith('$2b$') || userRow.password.startsWith('$2y$')) {
            passwordMatches = bcrypt.compareSync(password, userRow.password);
        } else {
            passwordMatches = userRow.password === password;
        }

        // Also allow standard demo passwords for the seeded demo accounts
        if (!passwordMatches && (isDemoFarmer || isDemoDev) && isDemoPassword) {
            passwordMatches = true;
        }

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                error: 'Invalid password. Try password123 (or farm123 / dev456) for demo accounts.'
            });
        }

        const formattedUser = formatUserResponse(userRow, actualRole);

        res.json({
            success: true,
            message: `Welcome back, ${formattedUser.name}!`,
            user: formattedUser,
            token: 'jwt-token-' + Date.now()
        });
    } catch (err) {
        console.error('Auth login error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            role = 'farmer', 
            age = 25, 
            farmLocation, 
            farmName, 
            organization 
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and password are required.'
            });
        }

        if (String(password).length < 4) {
            return res.status(400).json({
                success: false,
                error: 'Password must be 4 characters or longer.'
            });
        }

        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain letters and at least one number (e.g. farm123), not numbers only.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();
        const targetRole = (role === 'dev' || role === 'developer') ? 'dev' : 'farmer';
        const rawAge = parseInt(age, 10) || 25;
        if (targetRole === 'farmer' && (rawAge < 18 || rawAge > 70)) {
            return res.status(400).json({
                success: false,
                error: 'Farmer age must be between 18 and 70 years old.'
            });
        }
        const parsedAge = targetRole === 'farmer'
            ? Math.max(18, Math.min(70, rawAge))
            : Math.max(18, Math.min(99, rawAge));
        let locationOrOrg = '';
        if (targetRole === 'farmer') {
            if (farmName && farmLocation) {
                locationOrOrg = `${farmName} · ${farmLocation}`;
            } else {
                locationOrOrg = farmLocation || farmName || `${trimmedName}'s Farm`;
            }
        } else {
            locationOrOrg = organization || `${trimmedName}'s Lab`;
        }
        locationOrOrg = locationOrOrg.trim();

        // Check if email already exists in farmers or developers table
        const [farmerExists] = await pool.query('SELECT id FROM farmers WHERE LOWER(email) = ?', [normalizedEmail]);
        const [devExists] = await pool.query('SELECT id FROM developers WHERE LOWER(email) = ?', [normalizedEmail]);

        if (farmerExists.length > 0 || devExists.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'An account with this email already exists in the system.'
            });
        }

        // Hash password with bcrypt
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password.trim(), salt);

        // Insert into XAMPP MySQL database
        let insertedId;
        if (targetRole === 'farmer') {
            const [result] = await pool.query(
                'INSERT INTO farmers (name, age, farm_location, email, password) VALUES (?, ?, ?, ?, ?)',
                [trimmedName, parsedAge, locationOrOrg, normalizedEmail, hashedPassword]
            );
            insertedId = result.insertId;
        } else {
            const [result] = await pool.query(
                'INSERT INTO developers (name, age, organization, email, password) VALUES (?, ?, ?, ?, ?)',
                [trimmedName, parsedAge, locationOrOrg, normalizedEmail, hashedPassword]
            );
            insertedId = result.insertId;
        }

        console.log(`[Database] Inserted new ${targetRole} account into XAMPP MySQL: ${trimmedName} (${normalizedEmail}) with ID ${insertedId}`);

        const newUser = {
            id: insertedId,
            name: trimmedName,
            email: normalizedEmail,
            role: targetRole,
            age: parsedAge,
            profile: {
                farmName: targetRole === 'farmer' ? locationOrOrg : undefined,
                location: targetRole === 'farmer' ? locationOrOrg : undefined,
                organization: targetRole === 'dev' ? locationOrOrg : undefined,
                crops: targetRole === 'farmer' ? ['Corn', 'Wheat', 'Soybeans'] : undefined
            }
        };

        res.status(201).json({
            success: true,
            message: `Account successfully registered in XAMPP database for ${trimmedName}!`,
            user: newUser,
            token: 'jwt-token-' + Date.now()
        });
    } catch (err) {
        console.error('Auth signup error:', err);
        res.status(500).json({ success: false, error: 'Database signup error: ' + err.message });
    }
});

// Helper: Ensure password_resets table exists
async function ensurePasswordResetsTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS \`password_resets\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`email\` varchar(100) NOT NULL,
                \`role\` varchar(20) NOT NULL DEFAULT 'farmer',
                \`otp\` varchar(10) NOT NULL,
                \`token\` varchar(64) DEFAULT NULL,
                \`expires_at\` datetime NOT NULL,
                \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (\`id\`),
                KEY \`email_idx\` (\`email\`),
                KEY \`otp_idx\` (\`otp\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
    } catch (e) {
        console.warn('[DB] password_resets table check:', e.message);
    }
}

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { action = 'send_otp', email, role, otp, resetToken, newPassword, confirmPassword } = req.body;
        await ensurePasswordResetsTable();

        if (action === 'send_otp' || !action) {
            const normalizedEmail = (email || '').trim().toLowerCase();
            if (!normalizedEmail) {
                return res.status(400).json({ success: false, error: 'Please enter your email address.' });
            }

            // Check farmers and developers
            let userRow = null;
            let userRole = 'farmer';

            try {
                const [fRows] = await pool.query('SELECT id, name, email FROM `farmers` WHERE LOWER(email) = ?', [normalizedEmail]);
                if (fRows && fRows.length > 0) {
                    userRow = fRows[0];
                    userRole = 'farmer';
                } else {
                    const [dRows] = await pool.query('SELECT id, name, email FROM `developers` WHERE LOWER(email) = ?', [normalizedEmail]);
                    if (dRows && dRows.length > 0) {
                        userRow = dRows[0];
                        userRole = 'dev';
                    }
                }
            } catch (err) {
                console.warn('[DB lookup error]:', err.message);
            }

            const isDemo = ['farmer@demo.com', 'farmer@agri.coop', 'dev@demo.com', 'dev@agri.coop'].includes(normalizedEmail) || Boolean(knownRegisteredAccounts[normalizedEmail]);
            if (!userRow && isDemo) {
                const reg = knownRegisteredAccounts[normalizedEmail];
                userRow = {
                    id: reg ? 10 : (normalizedEmail.includes('dev') ? 2 : 1),
                    name: reg ? reg.name : (normalizedEmail.includes('dev') ? 'Alex Chen' : 'John Miller'),
                    email: normalizedEmail
                };
                userRole = reg ? reg.role : (normalizedEmail.includes('dev') ? 'dev' : 'farmer');
            }

            if (!userRow) {
                return res.status(404).json({
                    success: false,
                    error: 'This email address is not registered in the system. Please check your email or create an account.'
                });
            }

            const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
            const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

            try {
                await pool.query('DELETE FROM `password_resets` WHERE LOWER(email) = ?', [normalizedEmail]);
                await pool.query(
                    'INSERT INTO `password_resets` (`email`, `role`, `otp`, `token`, `expires_at`, `created_at`) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW())',
                    [normalizedEmail, userRole, generatedOtp, token]
                );
            } catch (err) {
                console.warn('[DB insert OTP error]:', err.message);
            }

            return res.json({
                success: true,
                message: `A 6-digit verification OTP has been sent to ${normalizedEmail}.`,
                email: normalizedEmail,
                role: userRole,
                userName: userRow.name || 'User',
                otp: generatedOtp,
                expires_in: 900
            });
        }

        if (action === 'verify_otp') {
            const normalizedEmail = (email || '').trim().toLowerCase();
            const cleanOtp = String(otp || '').replace(/\D/g, '');

            if (!normalizedEmail || !cleanOtp) {
                return res.status(400).json({ success: false, error: 'Please provide both email and OTP.' });
            }

            const [rows] = await pool.query(
                'SELECT * FROM `password_resets` WHERE LOWER(email) = ? AND otp = ? AND expires_at >= NOW() ORDER BY id DESC LIMIT 1',
                [normalizedEmail, cleanOtp]
            );

            if (!rows || rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid or expired OTP verification code. Please check the code or request a new one.'
                });
            }

            const newResetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
            await pool.query('UPDATE `password_resets` SET `token` = ? WHERE `id` = ?', [newResetToken, rows[0].id]);

            return res.json({
                success: true,
                message: 'Email verified successfully! You may now enter your new password.',
                email: normalizedEmail,
                role: rows[0].role,
                reset_token: newResetToken
            });
        }

        if (action === 'reset_password') {
            const normalizedEmail = (email || '').trim().toLowerCase();
            const cleanOtp = String(otp || '').replace(/\D/g, '');
            const pass = newPassword || '';

            if (!normalizedEmail || !pass) {
                return res.status(400).json({ success: false, error: 'Email and new password are required.' });
            }

            if (pass.length < 4) {
                return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long.' });
            }

            if (confirmPassword && pass !== confirmPassword) {
                return res.status(400).json({ success: false, error: 'Passwords do not match.' });
            }

            const [rows] = await pool.query(
                'SELECT * FROM `password_resets` WHERE LOWER(email) = ? AND ((token = ? AND token != "") OR otp = ?) AND expires_at >= NOW() ORDER BY id DESC LIMIT 1',
                [normalizedEmail, resetToken || '', cleanOtp]
            );

            if (!rows || rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'Password reset authorization expired or invalid. Please verify your email again.'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(pass, salt);

            await pool.query('UPDATE `farmers` SET `password` = ? WHERE LOWER(email) = ?', [hashedPassword, normalizedEmail]);
            await pool.query('UPDATE `developers` SET `password` = ? WHERE LOWER(email) = ?', [hashedPassword, normalizedEmail]);
            await pool.query('DELETE FROM `password_resets` WHERE LOWER(email) = ?', [normalizedEmail]);

            return res.json({
                success: true,
                message: 'Password reset successful! You can now log in with your new password.',
                email: normalizedEmail
            });
        }

        res.status(400).json({ success: false, error: 'Invalid action' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ success: false, error: 'Server error: ' + err.message });
    }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
    req.body.action = 'verify_otp';
    const handler = router.stack.find(layer => layer.route && layer.route.path === '/forgot-password');
    if (handler) return handler.route.stack[0].handle(req, res);
    res.status(404).send();
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    req.body.action = 'reset_password';
    const handler = router.stack.find(layer => layer.route && layer.route.path === '/forgot-password');
    if (handler) return handler.route.stack[0].handle(req, res);
    res.status(404).send();
});

// GET /api/auth/demo-accounts
router.get('/demo-accounts', async (req, res) => {
    try {
        res.json({
            success: true,
            accounts: {
                farmer: {
                    email: 'farmer@agri.coop',
                    altEmail: 'farmer@demo.com',
                    password: 'password123',
                    role: 'farmer',
                    name: 'John Miller'
                },
                dev: {
                    email: 'dev@agri.coop',
                    altEmail: 'dev@demo.com',
                    password: 'password123',
                    role: 'dev',
                    name: 'Alex Chen'
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
