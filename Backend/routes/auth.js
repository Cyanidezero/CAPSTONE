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

        // Demo account credentials fallback allowance
        const isDemoFarmer = normalizedEmail === 'farmer@agri.coop' || normalizedEmail === 'farmer@demo.com';
        const isDemoDev = normalizedEmail === 'dev@agri.coop' || normalizedEmail === 'dev@demo.com';
        const isDemoPassword = password === 'password123' || password === 'farm123' || password === 'dev456';

        if (!userRow) {
            if ((isDemoFarmer || isDemoDev) && isDemoPassword) {
                // Return demo user structure even if DB is still empty
                const demoUser = {
                    id: isDemoFarmer ? 1 : 2,
                    name: isDemoFarmer ? 'John Miller' : 'Alex Chen',
                    email: normalizedEmail,
                    role: isDemoFarmer ? 'farmer' : 'dev',
                    age: isDemoFarmer ? 35 : 28,
                    profile: {
                        farmName: isDemoFarmer ? 'Green Valley Organic Farms' : undefined,
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

        const normalizedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();
        const parsedAge = Math.max(18, Math.min(99, parseInt(age, 10) || 25));
        const targetRole = role === 'dev' ? 'dev' : 'farmer';
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
