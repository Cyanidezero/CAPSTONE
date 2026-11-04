const fs = require('fs');

function cleanFile(filePath, isDev) {
    if (!fs.existsSync(filePath)) return;
    let html = fs.readFileSync(filePath, 'utf8');

    // Title
    const title = isDev ? 'ClimaYield-X · Developer Suite Login' : 'ClimaYield-X · Farmer Portal Login';
    html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);

    // Body theme
    if (isDev) {
        html = html.replace(/<body[^>]*>/i, '<body class="theme-dev">');
    } else {
        html = html.replace(/<body[^>]*>/i, '<body class="theme-farmer">');
    }

    // Replace everything between headerSub closing </div> and <!-- SINGLE PANEL -->
    const badgeHtml = isDev
        ? `<!-- DEDICATED DEVELOPER SUITE BADGE -->
    <div class="portal-badge-fixed dev-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><rect x="3" y="4" width="18" height="12" rx="1"></rect><path d="M9 9l-2 2 2 2"></path><path d="M15 9l2 2-2 2"></path><path d="M2 20h20"></path></svg>
        <span>💻 Developer &amp; Research Suite</span>
    </div>\n\n    `
        : `<!-- DEDICATED FARMER PORTAL BADGE -->
    <div class="portal-badge-fixed farmer-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M12 20V10"></path><path d="M12 10C12 6 9 4 5 4c0 4 2 7 6 7z"></path><path d="M12 10c0-4 3-6 7-6 0 4-2 7-6 7z"></path></svg>
        <span>🌾 Farmer Portal</span>
    </div>\n\n    `;

    // Regex match from end of header card to SINGLE PANEL
    html = html.replace(
        /(<\/div>\s*<\/div>\s*)(?:<!-- (?:SWITCH|DEDICATED [^>]+) -->[\s\S]*?)(\s*<!-- SINGLE PANEL -->)/,
        `$1${badgeHtml}$2`
    );

    // Remove any lingering demo-note
    html = html.replace(/<div class="demo-note">[\s\S]*?<\/div>/g, '');

    if (isDev) {
        html = html.replace(/<span id="panelName">.*?<\/span>/, '<span id="panelName">DevSide</span>');
        html = html.replace(/<span class="account-badge" id="accountBadge">.*?<\/span>/, '<span class="account-badge" id="accountBadge">dev account</span>');
        html = html.replace(/<span id="subText">.*?<\/span>/, '<span id="subText">build, deploy & monitor agri-solutions</span>');
        html = html.replace(/<span id="emailLabel">.*?<\/span>/, '<span id="emailLabel">Dev Email</span>');
        html = html.replace(/<span id="passLabel">.*?<\/span>/, '<span id="passLabel">Access Key</span>');
        html = html.replace(/<span id="forgotText">.*?<\/span>/, '<span id="forgotText">reset dev token</span>');
        html = html.replace(/<span id="btnText">.*?<\/span>/, '<span id="btnText">Log in · Developer</span>');
        html = html.replace(/placeholder="farmer@agri\.coop"/g, 'placeholder="dev@agritech.io"');
        html = html.replace(/<a id="signupLink"[^>]*>.*?<\/a>/g, '<a id="signupLink" href="register.html">create dev profile</a>');
        html = html.replace(/updateMode\(false\);/g, 'updateMode(true);');
    } else {
        html = html.replace(/<span id="panelName">.*?<\/span>/, '<span id="panelName">FarmerSide</span>');
        html = html.replace(/<span class="account-badge" id="accountBadge">.*?<\/span>/, '<span class="account-badge" id="accountBadge">farmer account</span>');
        html = html.replace(/<span id="subText">.*?<\/span>/, '<span id="subText">access your crops, weather & tasks</span>');
        html = html.replace(/<span id="emailLabel">.*?<\/span>/, '<span id="emailLabel">Email</span>');
        html = html.replace(/<span id="passLabel">.*?<\/span>/, '<span id="passLabel">Password</span>');
        html = html.replace(/<span id="forgotText">.*?<\/span>/, '<span id="forgotText">forgot field pass?</span>');
        html = html.replace(/<span id="btnText">.*?<\/span>/, '<span id="btnText">Log in · Farmer</span>');
        html = html.replace(/placeholder="dev@agritech\.io"/g, 'placeholder="farmer@agri.coop"');
        html = html.replace(/<a id="signupLink"[^>]*>.*?<\/a>/g, '<a id="signupLink" href="register.html">create farm profile</a>');
        html = html.replace(/updateMode\(true\);/g, 'updateMode(false);');
    }

    fs.writeFileSync(filePath, html, 'utf8');
    console.log('Cleaned:', filePath, 'isDev:', isDev);
}

[
    'htdocs/farmer/login.html',
    'farmer/login.html',
    'Frontend/farmer/login.html'
].forEach(f => cleanFile(f, false));

[
    'htdocs/dev/login.html',
    'dev/login.html',
    'Frontend/dev/login.html'
].forEach(f => cleanFile(f, true));
