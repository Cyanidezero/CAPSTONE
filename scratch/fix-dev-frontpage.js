const fs = require('fs');

function polishDevLogin(filePath) {
    if (!fs.existsSync(filePath)) return;
    let html = fs.readFileSync(filePath, 'utf8');

    // 1. Default body background in CSS
    html = html.replace(
        /background:\s*linear-gradient\(to right,\s*rgba\(10,\s*25,\s*12,\s*0\.12\)[\s\S]*?url\('assets\/farmer\.jpg'\)[^;]+;/i,
        "background: linear-gradient(to right, rgba(8, 20, 35, 0.12) 0%, rgba(8, 20, 35, 0.28) 55%, rgba(8, 20, 35, 0.55) 100%), url('assets/developer.jpg') no-repeat left center fixed;"
    );

    // 2. Header icon -> Developer Chip / Monitor
    const devChipIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="1"></rect><path d="M9 9l-2 2 2 2"></path><path d="M15 9l2 2-2 2"></path><path d="M2 20h20"></path></svg>';
    
    html = html.replace(
        /<span id="headerIcon" class="header-icon-slot">[\s\S]*?<\/span>/,
        `<span id="headerIcon" class="header-icon-slot">${devChipIcon}</span>`
    );

    // 3. Panel icon -> Dev Icon
    html = html.replace(
        /<span id="panelIcon"[^>]*>[\s\S]*?<\/span>/,
        `<span id="panelIcon" class="icon-slot dev-icon">${devChipIcon}</span>`
    );

    // 4. Panel sub icon -> Line chart / code
    const devSubIcon = '<svg id="panelSubIcon" class="icon-inline panel-sub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 13 14 20 7"></polyline><polyline points="14 7 20 7 20 13"></polyline></svg>';
    html = html.replace(
        /<svg id="panelSubIcon"[\s\S]*?<\/svg>/,
        devSubIcon
    );

    // 5. Forgot link icon -> Key / token
    const devKeyIcon = '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M9 9h.01"></path><path d="M15 9h.01"></path><path d="M9 15h6"></path></svg>';
    html = html.replace(
        /<a href="#" id="forgotLink">[\s\S]*?<\/a>/,
        `<a href="#" id="forgotLink">${devKeyIcon} <span id="forgotText">reset dev token</span></a>`
    );

    // 6. Modal Title -> Create Developer Profile
    html = html.replace(
        /<h2 id="modalTitle">[\s\S]*?<\/h2>/,
        `<h2 id="modalTitle">${devChipIcon} Create Developer Profile</h2>`
    );

    // 7. Ensure role in login dispatch is 'dev'
    html = html.replace(/role = isDev \? 'dev' : 'farmer';/g, "role = 'dev';");

    fs.writeFileSync(filePath, html, 'utf8');
    console.log('Polished Dev Frontpage:', filePath);
}

[
    'htdocs/dev/login.html',
    'dev/login.html',
    'Frontend/dev/login.html'
].forEach(polishDevLogin);

