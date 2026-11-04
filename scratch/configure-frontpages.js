const fs = require('fs');

// 1. Update .htaccess
let htaccess = fs.readFileSync('htdocs/.htaccess', 'utf8');
if (!htaccess.includes('DirectoryIndex index.php login.html index.html')) {
    htaccess = htaccess.replace(/DirectoryIndex[^\r\n]+/, 'DirectoryIndex index.php login.html index.html');
}
if (!htaccess.includes('login\\.htm')) {
    const rewriteRules = `
    # Auto-redirect .htm typos to .html
    RewriteRule ^(farmer|dev)/login\\.htm$ /$1/login.html [R=301,L]
    RewriteRule ^login\\.htm$ /login.html [R=301,L]
`;
    htaccess = htaccess.replace(/RewriteBase \//, 'RewriteBase /\n' + rewriteRules);
}
fs.writeFileSync('htdocs/.htaccess', htaccess, 'utf8');
console.log('Updated: htdocs/.htaccess');

// 2. Update htdocs/index.php
let indexPhp = fs.readFileSync('htdocs/index.php', 'utf8');
indexPhp = indexPhp.replace(/href="\/farmer\/"/g, 'href="/farmer/login.html"');
indexPhp = indexPhp.replace(/href="\/dev\/"/g, 'href="/dev/login.html"');
fs.writeFileSync('htdocs/index.php', indexPhp, 'utf8');
console.log('Updated: htdocs/index.php');

// 3. Update dest in login.html files
function updateLoginDest(filePath, isDev) {
    if (!fs.existsSync(filePath)) return;
    let html = fs.readFileSync(filePath, 'utf8');
    const destUrl = isDev ? '/dev/index.html' : '/farmer/index.html';
    html = html.replace(/const dest = data\.user\.role === 'dev' \? '\/dev\/' : '\/farmer\/';/g, `const dest = '${destUrl}';`);
    html = html.replace(/window\.location\.href = accRole === 'dev' \? '\/dev\/' : '\/farmer\/';/g, `window.location.href = '${destUrl}';`);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('Updated dest in:', filePath);
}

[
    'htdocs/farmer/login.html',
    'farmer/login.html',
    'Frontend/farmer/login.html'
].forEach(f => updateLoginDest(f, false));

[
    'htdocs/dev/login.html',
    'dev/login.html',
    'Frontend/dev/login.html'
].forEach(f => updateLoginDest(f, true));

// 4. Update index.html files to redirect to login.html if logged out
function updateIndexRedirect(filePath, isDev) {
    if (!fs.existsSync(filePath)) return;
    let html = fs.readFileSync(filePath, 'utf8');
    const storageKey = isDev ? 'climayield_dev_user' : 'climayield_farmer_user';
    const redirectScript = `
    // Frontpage auth gate: redirect to dedicated login frontpage if not logged in
    try {
        var _u = localStorage.getItem('${storageKey}') || sessionStorage.getItem('${storageKey}');
        var _isAuto = window.location.search.indexOf('autologin') !== -1;
        if (!_u && !_isAuto) {
            window.location.replace('login.html');
        }
    } catch(e) {}
`;

    if (!html.includes(storageKey)) {
        html = html.replace(/<script>/i, '<script>' + redirectScript);
        fs.writeFileSync(filePath, html, 'utf8');
        console.log('Added auth gate to:', filePath);
    }
}

[
    'htdocs/farmer/index.html',
    'farmer/index.html',
    'Frontend/build/index.html'
].forEach(f => updateIndexRedirect(f, false));

[
    'htdocs/dev/index.html',
    'dev/index.html'
].forEach(f => updateIndexRedirect(f, true));

console.log('All frontpage configurations successfully applied!');

