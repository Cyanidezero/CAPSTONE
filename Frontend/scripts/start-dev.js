const os = require('os');

// Dynamic Local IP Detection
const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if ((iface.family === 'IPv4' || iface.family === 4) && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '192.168.1.108';
};

const localIp = getLocalIp();

// Dedicated Developer-Only Frontend Server on Port 3001
process.env.PORT = process.env.PORT || '3001';
process.env.REACT_APP_DEV_ONLY = 'true';
delete process.env.REACT_APP_FARMER_ONLY;
process.env.BROWSER = 'none';
process.env.HOST = '0.0.0.0';
process.env.DANGEROUSLY_DISABLE_HOST_CHECK = 'true';

console.log('================================================================');
console.log('💻 CLIMAYIELD-X DEDICATED DEVELOPER PORTAL');
console.log('================================================================');
console.log(`💻 Local computer access:   http://localhost:${process.env.PORT}`);
console.log(`📱 OTHER USERS / PHONES:    http://${localIp}:${process.env.PORT}`);
console.log('----------------------------------------------------------------');
console.log('🔧 Developer Console: Data Management & AI Model Training Pipeline');
console.log(`   Direct Dev Link: http://${localIp}:${process.env.PORT}`);
console.log('================================================================\n');

require('react-scripts/scripts/start');
