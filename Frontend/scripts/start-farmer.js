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

// Dedicated Farmer-Only Frontend Server on Port 3002
process.env.PORT = process.env.PORT || '3002';
process.env.REACT_APP_FARMER_ONLY = 'true';
process.env.BROWSER = 'none';
process.env.HOST = '0.0.0.0';
process.env.DANGEROUSLY_DISABLE_HOST_CHECK = 'true';

console.log('================================================================');
console.log('🌾 CLIMAYIELD-X DEDICATED FARMER PORTAL');
console.log('================================================================');
console.log(`💻 Local computer access:   http://localhost:${process.env.PORT}`);
console.log(`📱 OTHER USERS / PHONES:    http://${localIp}:${process.env.PORT}`);
console.log('----------------------------------------------------------------');
console.log('⚠️  IMPORTANT NOTE FOR SHARING:');
console.log('   Do NOT send other users "http://localhost:..." !');
console.log('   "localhost" only works on YOUR computer.');
console.log(`   Send other users THIS link: http://${localIp}:${process.env.PORT}`);
console.log('   Make sure their phone or laptop is on the same Wi-Fi network.');
console.log('================================================================\n');

require('react-scripts/scripts/start');
