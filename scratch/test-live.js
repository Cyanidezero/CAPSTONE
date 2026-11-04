const https = require('https');

function check(url) {
  return new Promise(resolve => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(url, 'STATUS:', res.statusCode, 'LEN:', data.length);
        if (url.includes('/api/crops')) {
          try {
            const json = JSON.parse(data);
            console.log('Crops count:', json.count);
            if (json.crops && json.crops[0]) {
              console.log('Sample crop:', {
                name: json.crops[0].name,
                currentGrowthDay: json.crops[0].currentGrowthDay,
                daysRemaining: json.crops[0].daysRemaining,
                growthDayBadgeEn: json.crops[0].growthDayBadgeEn
              });
            }
          } catch(e) {
            console.log('API output:', data.substring(0, 300));
          }
        } else if (url.includes('login.html')) {
          console.log('Has duplicate badge:', data.includes('portal-badge-fixed'));
          console.log('Has phone in modal:', data.includes('signupPhone'));
        } else if (url.endsWith('/farmer/')) {
          console.log('Direct root div present:', data.includes('id="root"'));
          console.log('No bounce to login:', !data.includes("window.location.replace('login.html')"));
        }
        resolve();
      });
    }).on('error', err => {
      console.log(url, 'ERR:', err.message);
      resolve();
    });
  });
}

(async () => {
  await check('https://climayieldx.infinityfree.me/farmer/');
  await check('https://climayieldx.infinityfree.me/farmer/login.html');
  await check('https://climayieldx.infinityfree.me/api/crops');
})();
