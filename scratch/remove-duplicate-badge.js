const fs = require('fs');

const files = [
    'htdocs/farmer/login.html',
    'htdocs/dev/login.html',
    'farmer/login.html',
    'dev/login.html',
    'Frontend/farmer/login.html',
    'Frontend/dev/login.html',
    'Frontend/public/login.html',
    'Frontend/build/login.html'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Remove the portal-badge-fixed HTML element
    const badgeRegex = /<!--\s*DEDICATED\s+(FARMER|DEVELOPER)[^>]*-->\s*<div class="portal-badge-fixed[^>]*>[\s\S]*?<\/div>/gi;
    const directRegex = /<div class="portal-badge-fixed[^>]*>[\s\S]*?<\/div>/gi;

    if (badgeRegex.test(content)) {
        content = content.replace(badgeRegex, '');
        console.log('Removed portal-badge-fixed with comment in:', file);
    } else if (directRegex.test(content)) {
        content = content.replace(directRegex, '');
        console.log('Removed portal-badge-fixed in:', file);
    }

    fs.writeFileSync(file, content, 'utf8');
});

console.log('Done removing duplicate portal badge!');

