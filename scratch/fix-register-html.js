const fs = require('fs');

function updateRegisterFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let html = fs.readFileSync(filePath, 'utf8');

    // 1. Enable phone in dev branch
    html = html.replace(
        /if \(phoneGroup\) phoneGroup\.style\.display = 'none';\s*if \(phoneInput\) \{\s*phoneInput\.required = false;\s*phoneInput\.value = '';\s*\}\s*if \(pillPhone\) pillPhone\.style\.display = 'none';/,
        `if (phoneGroup) phoneGroup.style.display = 'block';
      if (phoneInput) {
        phoneInput.required = true;
        phoneInput.placeholder = '09171234567 or +639171234567';
      }
      if (pillPhone) pillPhone.style.display = 'inline-block';
      const devPhoneHint = document.getElementById('phoneHint');
      if (devPhoneHint) devPhoneHint.textContent = '📱 For Pocket Alert mobile notifications & security OTPs';`
    );

    // 2. Back link to login.html
    html = html.replace(/backLink\.href = '\/dev\/';/g, "backLink.href = 'login.html';");
    html = html.replace(/backLink\.href = '\/farmer\/';/g, "backLink.href = 'login.html';");
    html = html.replace(/href="\/farmer\/" class="back-link"/g, 'href="login.html" class="back-link"');
    html = html.replace(/href="\/dev\/" class="back-link"/g, 'href="login.html" class="back-link"');

    // 3. Enable phone validation for both roles (remove !isDev check)
    html = html.replace(
        /if \(!isDev && pillPhone && phoneInput\)/g,
        'if (pillPhone && phoneInput)'
    );

    // 4. Require valid phone number for both roles on submit
    html = html.replace(
        /let cleanPhone = '';\s*if \(!isDev\) \{\s*const enteredPhone = phoneInput \? sanitizeText\(phoneInput\.value\) : '';\s*cleanPhone = enteredPhone\.replace\(\/\[\\s\\-\(\)\]\/g, ''\);\s*if \(!cleanPhone \|\| \(!\/\^\(09\|\\\+639\|639\)\\d\{9\}\$\/\.test\(cleanPhone\) && \(cleanPhone\.length < 10 \|\| cleanPhone\.length > 15\)\)\) \{\s*resultBox\.style\.display = 'block';\s*resultBox\.className = 'error';\s*resultBox\.innerHTML = '[^']+';\s*return;\s*\}\s*\}/,
        `const enteredPhone = phoneInput ? sanitizeText(phoneInput.value) : '';
      const cleanPhone = enteredPhone.replace(/[\\s\\-()]/g, '');
      if (!cleanPhone || (!/^(09|\\+639|639)\\d{9}$/.test(cleanPhone) && (cleanPhone.length < 10 || cleanPhone.length > 15))) {
        resultBox.style.display = 'block';
        resultBox.className = 'error';
        resultBox.innerHTML = '<strong>⚠️ Invalid Mobile Number.</strong> Please enter a valid mobile number for alert notifications and OTPs (09171234567 or +639171234567).';
        return;
      }`
    );

    // 5. Send phone in payload for both roles
    html = html.replace(/phone:\s*!isDev \? cleanPhone : undefined,/g, 'phone: cleanPhone,');
    html = html.replace(/phone:\s*!isDev \? cleanPhone : null,/g, 'phone: cleanPhone,');

    // 6. Redirect to index.html after registration
    html = html.replace(/const portalBase = isDev \? '\/dev\/' : '\/farmer\/';/g, "const portalBase = isDev ? '/dev/index.html' : '/farmer/index.html';");

    fs.writeFileSync(filePath, html, 'utf8');
    console.log('Updated register.html:', filePath);
}

const files = [
    'htdocs/farmer/register.html',
    'htdocs/dev/register.html',
    'htdocs/register.html',
    'farmer/register.html',
    'dev/register.html',
    'Frontend/farmer/register.html',
    'Frontend/dev/register.html',
    'Frontend/public/register.html'
];

files.forEach(updateRegisterFile);
console.log('All register.html files updated with phone number and confirm password for both sides!');

