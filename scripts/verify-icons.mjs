import http from 'http';

const urls = [
  { path: '/', name: 'App root' },
  { path: '/icons/icon-192.png', name: 'icon-192.png' },
  { path: '/icons/icon-512.png', name: 'icon-512.png' },
  { path: '/icons/icon-maskable.png', name: 'icon-maskable.png' },
  { path: '/icons/apple-touch-icon.png', name: 'apple-touch-icon.png' },
  { path: '/favicon.ico', name: 'favicon.ico' },
  { path: '/robots.txt', name: 'robots.txt' },
  { path: '/manifest.webmanifest', name: 'manifest.webmanifest' },
];

function check(url) {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:4173' + url.path, (res) => {
      const status = res.statusCode;
      const contentType = res.headers['content-type'] || 'unknown';
      const result = status === 200;
      console.log((result ? 'PASS' : 'FAIL') + ' [' + status + '] ' + url.name + ' (' + contentType + ')');
      res.resume();
      resolve(result);
    });
    req.on('error', (err) => {
      console.log('FAIL ' + url.name + ': ' + err.message);
      resolve(false);
    });
  });
}

let allPass = true;
for (const url of urls) {
  const pass = await check(url);
  if (pass === false) allPass = false;
}
console.log(allPass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(allPass ? 0 : 1);
