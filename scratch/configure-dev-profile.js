const fs = require('fs');
const cp = require('child_process');

// 1. Get the exact base code from 8873e784 for dev/register.html
let devRegisterCode = cp.execSync('git show 8873e784:htdocs/dev/register.html', { encoding: 'utf8' });

// Ensure currentRole defaults to 'dev' in dev/register.html
devRegisterCode = devRegisterCode.replace(
    "let currentRole = 'farmer';",
    "let currentRole = 'dev';"
);

// Ensure backLink defaults to login.html
devRegisterCode = devRegisterCode.replace(
    /backLink\.href = '\/dev\/';/g,
    "backLink.href = 'login.html';"
);
devRegisterCode = devRegisterCode.replace(
    /<a href="\/farmer\/" class="back-link" id="backLink">← Back to Farmer Login<\/a>/,
    '<a href="login.html" class="back-link" id="backLink">← Back to Developer Login</a>'
);
devRegisterCode = devRegisterCode.replace(
    /const portalBase = isDev \? '\/dev\/' : '\/farmer\/';/,
    "const portalBase = isDev ? 'index.html' : 'index.html';"
);

// Write to all dev register paths
const devRegisterPaths = [
    'htdocs/dev/register.html',
    'dev/register.html',
    'Frontend/dev/register.html'
];

devRegisterPaths.forEach(p => {
    fs.writeFileSync(p, devRegisterCode, 'utf8');
    console.log('Restored exact developer registration page in:', p);
});

// 2. Update all login.html files for the modal
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

    // Ensure the modal adjusts visibility based on isDev:
    // When isDev is true: hide Farm Location and hide Mobile Phone
    // When isDev is false: show Farm Location and show Mobile Phone
    const openModalSearch = "function openModal() {";
    if (html.includes(openModalSearch) && !html.includes("// DEV_MODAL_FIELDS_VISIBILITY")) {
        const replacement = `function openModal() {
            // DEV_MODAL_FIELDS_VISIBILITY
            const farmGroupEl = signupFarm ? signupFarm.closest('.input-group') : null;
            const phoneGroupEl = signupPhone ? signupPhone.closest('.input-group') : null;
            if (isDev) {
                if (farmGroupEl) farmGroupEl.style.display = 'none';
                if (phoneGroupEl) phoneGroupEl.style.display = 'none';
                if (signupFarm) signupFarm.required = false;
                if (signupPhone) signupPhone.required = false;
            } else {
                if (farmGroupEl) farmGroupEl.style.display = 'block';
                if (phoneGroupEl) phoneGroupEl.style.display = 'block';
                if (signupFarm) signupFarm.required = true;
                if (signupPhone) signupPhone.required = true;
            }`;
        html = html.replace(openModalSearch, replacement);
    }

    // Update handleSignup validation so dev does NOT require farm or phone
    const oldValidate = "if (!name || !age || !farm || !email || !password || !phone || !confirmPass) {";
    const newValidate = `// Validation: Farmer requires phone and farm location; Dev requires name, age, email, password, confirmPass
            if (isDev) {
                if (!name || !age || !email || !password || !confirmPass) {
                    alert('⚠️ Please fill in all fields (Full Name, Age, Email, Password, and Confirm Password).');
                    return;
                }
            } else {
                if (!name || !age || !farm || !email || !password || !phone || !confirmPass) {
                    alert('⚠️ Please fill in all fields including Mobile Phone Number and Confirm Password.');
                    return;
                }
            }`;
    if (html.includes(oldValidate)) {
        html = html.replace(oldValidate, newValidate);
    }

    // Update phone check so it only validates phone if !isDev OR if phone was entered
    const oldPhoneCheck = "if (!/^(09|\\+639|639)\\d{9}$/.test(cleanPhone) && (cleanPhone.length < 10 || cleanPhone.length > 15)) {";
    const newPhoneCheck = `if (!isDev || cleanPhone) {
                if (!/^(09|\\+639|639)\\d{9}$/.test(cleanPhone) && (cleanPhone.length < 10 || cleanPhone.length > 15)) {
                    alert('⚠️ Please enter a valid mobile phone number for alerts (e.g. 09171234567 or +639171234567).');
                    return;
                }
            }`;
    if (html.includes(oldPhoneCheck)) {
        html = html.replace(oldPhoneCheck, newPhoneCheck);
    }

    fs.writeFileSync(file, html, 'utf8');
    console.log('Updated modal in:', file);
});

console.log('All Dev Profile and Farmer Profile modal and registration updates completed!');

