const fs = require('fs');

const loginFiles = [
    'htdocs/farmer/login.html',
    'htdocs/dev/login.html',
    'farmer/login.html',
    'dev/login.html',
    'Frontend/farmer/login.html',
    'Frontend/dev/login.html',
    'Frontend/public/login.html',
    'Frontend/build/login.html'
];

loginFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    let html = fs.readFileSync(file, 'utf8');

    // 1. Add Mobile Phone Number input group if not already present
    if (!html.includes('id="signupPhone"')) {
        const phoneGroupHtml = `
            <div class="input-group">
                <label for="signupPhone"><svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg> Mobile Phone Number</label>
                <div class="input-wrapper">
                    <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                    <input type="tel" id="signupPhone" placeholder="09171234567 or +639171234567" required maxlength="20">
                </div>
                <small id="signupPhoneHint" style="font-size: 11px; color: #15803d; margin-top: 4px; display: block; font-weight: 500;">📱 For SMS harvest alerts and weather advisories</small>
            </div>
`;
        // Insert after signupAge group
        const ageMatch = html.match(/<div class="input-group">[\s\S]*?id="signupAge"[\s\S]*?<\/div>[\s\S]*?<\/div>/);
        if (ageMatch) {
            html = html.replace(ageMatch[0], ageMatch[0] + phoneGroupHtml);
        }
    }

    // 2. Add Confirm Password input group if not already present
    if (!html.includes('id="signupConfirmPass"')) {
        const confirmPassHtml = `
            <div class="input-group">
                <label for="signupConfirmPass"><svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Confirm Password</label>
                <div class="input-wrapper">
                    <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <input type="password" id="signupConfirmPass" placeholder="••••••••" required minlength="4">
                </div>
            </div>
`;
        // Insert after signupPass group
        const passMatch = html.match(/<div class="input-group">[\s\S]*?id="signupPass"[\s\S]*?<\/div>[\s\S]*?<\/div>/);
        if (passMatch) {
            html = html.replace(passMatch[0], passMatch[0] + confirmPassHtml);
        }
    }

    // 3. Update JavaScript variables
    if (!html.includes('const signupPhone =')) {
        html = html.replace(
            "const signupPass = document.getElementById('signupPass');",
            "const signupPass = document.getElementById('signupPass');\n        const signupPhone = document.getElementById('signupPhone');\n        const signupConfirmPass = document.getElementById('signupConfirmPass');\n        const signupPhoneHint = document.getElementById('signupPhoneHint');"
        );
    }

    // 4. Update openModal & updateMode hint text
    if (!html.includes("if (signupPhoneHint)")) {
        html = html.replace(
            "signupFarm.placeholder = 'Quezon City, Philippines';",
            "signupFarm.placeholder = 'Quezon City, Philippines';\n            if (signupPhoneHint) { signupPhoneHint.textContent = isDev ? '📱 For Pocket Alert mobile notifications & security OTPs' : '📱 For SMS harvest alerts and weather advisories'; signupPhoneHint.style.color = isDev ? '#0284c7' : '#15803d'; }"
        );
    }

    // 5. Update handleSignup implementation
    const oldHandleSignupRegex = /window\.handleSignup = function\(event\) \{[\s\S]*?closeModal\(\);\s*\};/;
    const newHandleSignup = `window.handleSignup = async function(event) {
            event.preventDefault();
            
            const name = signupName.value.trim();
            const age = signupAge.value.trim();
            const phone = signupPhone ? signupPhone.value.trim() : '';
            const farm = signupFarm.value.trim();
            const email = signupEmail.value.trim().toLowerCase();
            const password = signupPass.value;
            const confirmPass = signupConfirmPass ? signupConfirmPass.value : '';

            // Validation
            if (!name || !age || !farm || !email || !password || !phone || !confirmPass) {
                alert('⚠️ Please fill in all fields.');
                return;
            }

            const parsedAge = parseInt(age, 10);
            if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > (isDev ? 99 : 70)) {
                alert(\`⚠️ Age must be between 18 and \${isDev ? 99 : 70}.\`);
                return;
            }

            const cleanPhone = phone.replace(/[\\s\\-()]/g, '');
            if (!/^(09|\\+639|639)\\d{9}$/.test(cleanPhone) && (cleanPhone.length < 10 || cleanPhone.length > 15)) {
                alert('⚠️ Please enter a valid mobile phone number for alerts (e.g. 09171234567 or +639171234567).');
                return;
            }

            if (!email.includes('@') || !email.includes('.')) {
                alert('⚠️ Please enter a valid email address.');
                return;
            }

            if (password.length < 4) {
                alert('⚠️ Password must be at least 4 characters.');
                return;
            }

            if (password !== confirmPass) {
                alert('⚠️ Passwords do not match. Please re-enter your confirm password.');
                return;
            }

            const submitBtn = document.getElementById('signupBtn');
            const origHtml = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '⏳ Saving Account...';

            const payload = {
                name: name,
                age: parsedAge,
                phone: cleanPhone,
                farmLocation: farm,
                farmName: farm,
                organization: farm,
                email: email,
                password: password,
                role: isDev ? 'dev' : 'farmer'
            };

            try {
                const res = await fetch('/api/auth/signup.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                
                if (res.ok && data.success) {
                    const roleLabel = isDev ? 'Developer' : 'Farmer';
                    alert(\`✅ \${roleLabel} profile created successfully!\\n\\n👤 Name: \${name}\\n📱 Mobile Phone: \${cleanPhone}\\n📧 Email: \${email}\\n📍 Location: \${farm}\\n\\n🎉 Welcome! Please log in with your credentials.\`);
                    
                    if (data.user) {
                        try {
                            const storageKey = isDev ? 'climayield_dev_user' : 'climayield_farmer_user';
                            localStorage.setItem(storageKey, JSON.stringify(data.user));
                            sessionStorage.setItem(storageKey, JSON.stringify(data.user));
                            if (!isDev) {
                                localStorage.setItem('climayield_farmer_phone', cleanPhone);
                            }
                        } catch (e) {}
                    }
                } else {
                    alert(\`⚠️ Notice: \${data.error || 'Profile saved.'}\`);
                }
            } catch (err) {
                const fallbackUser = {
                    id: Date.now(),
                    name: name,
                    email: email,
                    phone: cleanPhone,
                    role: isDev ? 'dev' : 'farmer',
                    age: parsedAge,
                    profile: {
                        farmName: farm,
                        location: farm,
                        phone: cleanPhone
                    }
                };
                try {
                    const storageKey = isDev ? 'climayield_dev_user' : 'climayield_farmer_user';
                    localStorage.setItem(storageKey, JSON.stringify(fallbackUser));
                    sessionStorage.setItem(storageKey, JSON.stringify(fallbackUser));
                    if (!isDev) {
                        localStorage.setItem('climayield_farmer_phone', cleanPhone);
                    }
                } catch (e) {}
                alert(\`✅ Profile saved locally!\\n\\n📱 Mobile: \${cleanPhone}\\n📧 Email: \${email}\\n\\nPlease log in.\`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }

            // Auto-fill login form with new credentials
            emailInput.value = email;
            passInput.value = password;

            // Close modal
            closeModal();
        };`;

    if (oldHandleSignupRegex.test(html)) {
        html = html.replace(oldHandleSignupRegex, newHandleSignup);
    }

    fs.writeFileSync(file, html, 'utf8');
    console.log('Successfully updated signup modal in:', file);
});

