const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '../..');
const frontendDir = path.resolve(__dirname, '..');
const farmerOut = path.resolve(rootDir, 'farmer');
const devOut = path.resolve(rootDir, 'dev');
const farmerFrontendOut = path.resolve(frontendDir, 'farmer');
const devFrontendOut = path.resolve(frontendDir, 'dev');
const htdocsFarmerOut = path.resolve(rootDir, 'htdocs/farmer');
const htdocsDevOut = path.resolve(rootDir, 'htdocs/dev');

function cleanAndCopyDir(src, dest) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  copyDirRecursive(src, dest);
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const buildTimestamp = Date.now();
const versionData = {
  version: `1.0.${Math.floor(buildTimestamp / 1000)}`,
  buildTimestamp: buildTimestamp,
  buildTime: new Date(buildTimestamp).toISOString()
};

fs.writeFileSync(path.join(frontendDir, 'src/version.json'), JSON.stringify(versionData, null, 2), 'utf8');
fs.writeFileSync(path.join(frontendDir, 'public/version.json'), JSON.stringify(versionData, null, 2), 'utf8');

function writeDeployConfigs(targetDir, portalName) {
  // 1. config.js
  const configContent = `/**
 * ClimaYield-X Runtime API Configuration (${portalName} Portal)
 */
(function() {
  var isInfinityFree = typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.indexOf('infinityfree.me') !== -1;
  window.API_BASE_URL = isInfinityFree
    ? (window.location.origin + '/api')
    : 'https://climayieldx.infinityfree.me/api';
})();
`;
  fs.writeFileSync(path.join(targetDir, 'config.js'), configContent, 'utf8');

  // 2. version.json
  fs.writeFileSync(path.join(targetDir, 'version.json'), JSON.stringify(versionData, null, 2), 'utf8');

  // 3. netlify.toml
  const netlifyToml = `[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
  fs.writeFileSync(path.join(targetDir, 'netlify.toml'), netlifyToml, 'utf8');

  // 4. _redirects fallback
  fs.writeFileSync(path.join(targetDir, '_redirects'), '/*    /index.html   200\n', 'utf8');
}

console.log('🚀 Step 1: Building Farmer Portal (climayield-farmer)...');
process.env.BUILD_PATH = farmerOut;
process.env.PUBLIC_URL = '.';
process.env.REACT_APP_FARMER_ONLY = 'true';
process.env.REACT_APP_API_URL = 'https://climayieldx.infinityfree.me/api';
execSync('npx react-scripts build', {
  cwd: frontendDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    BUILD_PATH: farmerOut,
    PUBLIC_URL: '.',
    REACT_APP_FARMER_ONLY: 'true',
    REACT_APP_API_URL: 'https://climayieldx.infinityfree.me/api'
  }
});
writeDeployConfigs(farmerOut, 'Farmer');
cleanAndCopyDir(farmerOut, farmerFrontendOut);
cleanAndCopyDir(farmerOut, htdocsFarmerOut);
console.log('✅ Farmer Portal build created in /farmer, /Frontend/farmer, and /htdocs/farmer');

console.log('\n🚀 Step 2: Building Developer Portal (climayield-dev)...');
process.env.BUILD_PATH = devOut;
process.env.PUBLIC_URL = '.';
delete process.env.REACT_APP_FARMER_ONLY;
process.env.REACT_APP_DEV_ONLY = 'true';
execSync('npx react-scripts build', {
  cwd: frontendDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    BUILD_PATH: devOut,
    PUBLIC_URL: '.',
    REACT_APP_FARMER_ONLY: 'false',
    REACT_APP_DEV_ONLY: 'true',
    REACT_APP_API_URL: 'https://climayieldx.infinityfree.me/api'
  }
});
writeDeployConfigs(devOut, 'Developer');
cleanAndCopyDir(devOut, devFrontendOut);
cleanAndCopyDir(devOut, htdocsDevOut);
fs.writeFileSync(path.join(rootDir, 'htdocs/version.json'), JSON.stringify(versionData, null, 2), 'utf8');
console.log('✅ Developer Portal build created in /dev, /Frontend/dev, and /htdocs/dev');

console.log('\n🎉 Portals built successfully with config.js and netlify.toml!');
