const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8', '.txt':'text/plain; charset=utf-8' };

function route(requestPath) {
  const clean = requestPath.split('?')[0].replace(/\\/g, '/');
  if (clean === '/blogs/news/2' || clean === '/blogs/news/2/') return '/blogs/news/2/index.html';
  if (clean.startsWith('/products/')) return '/index.html';
  if (clean === '/malaysia-esim-guide' || clean === '/malaysia-esim-guide/') return '/malaysia-esim-guide.html';
  if (clean === '/checkout' || clean === '/checkout/') return '/checkout.html';
  return clean === '/' ? '/index.html' : clean;
}

const server = http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(route(req.url || '/')); } catch { res.writeHead(400); return res.end('Bad request'); }
  const file = path.resolve(root, '.' + urlPath);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); return res.end('Not found'); }
    res.writeHead(200, {'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log('EasyGoSim Japan server is ready'));
