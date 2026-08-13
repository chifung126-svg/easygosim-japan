const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let jpCatalog;
try { jpCatalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'jp-products.json'), 'utf8')); }
catch { jpCatalog = { currency: 'JPY', paymentMethodTypes: ['card'], products: { manual: [] } }; }
const { createJapanOrder, createJapanPaymentLink, listJapanSkus } = require('./api/_lib/jp-backend');

const root = __dirname;
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8', '.txt':'text/plain; charset=utf-8' };

function route(requestPath) {
  const clean = requestPath.split('?')[0].replace(/\\/g, '/');
  if (clean === '/blogs/news/2' || clean === '/blogs/news/2/') return '/blogs/news/2/index.html';
  if (clean.startsWith('/products/')) return '/index.html';
  if (clean === '/korea-esim' || clean === '/korea-esim/') return '/korea-esim.html';
  if (clean === '/malaysia-esim-guide' || clean === '/malaysia-esim-guide/') return '/malaysia-esim-guide.html';
  if (clean === '/checkout' || clean === '/checkout/') return '/checkout.html';
  if (clean === '/jpesim-checkout' || clean === '/jpesim-checkout/') return '/jpesim-checkout.html';
  if (clean === '/jpesim-thank-you' || clean === '/jpesim-thank-you/') return '/jpesim-thank-you.html';
  return clean === '/' ? '/index.html' : clean;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10000) reject(new Error('Request body too large'));
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

const manualPlans = {
  7: { data: '50GB', amount: 1980 },
  15: { data: '150GB', amount: 2640 },
  30: { data: '300GB', amount: 3840 }
};

function requiredEnv(name) {
  if (!process.env[name]) throw new Error(`Missing environment variable: ${name}`);
  return process.env[name];
}

async function createManualPayment(body) {
  const days = Number(body.days);
  const plan = manualPlans[days];
  const departure = String(body.departure_date || '').trim();
  if (!plan || !/^\d{4}-\d{2}-\d{2}$/.test(departure)) throw new Error('Invalid Malaysia plan or departure date');
  const base = (process.env.AIRWALLEX_API_BASE_URL || 'https://api.airwallex.com').replace(/\/$/, '');
  const auth = await fetch(`${base}/api/v1/authentication/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-client-id': requiredEnv('AIRWALLEX_CLIENT_ID'), 'x-api-key': requiredEnv('AIRWALLEX_API_KEY') } });
  const authData = await auth.json().catch(() => ({}));
  if (!auth.ok || !authData.token) throw new Error('Airwallex authentication failed');
  const orderNo = `EGS-JP-MY-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const paymentResponse = await fetch(`${base}/api/v1/pa/payment_links/create`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${authData.token}` }, body: JSON.stringify({ amount: plan.amount, currency: 'JPY', title: `Malaysia eSIM ${days} days - ${orderNo}`, description: `${plan.data} Malaysia eSIM`, reference: orderNo, reusable: false, metadata: { order_no: orderNo, product_key: 'malaysia_manual', days: String(days), departure_date: departure, customer_email: String(body.email || '') } }) });
  const payment = await paymentResponse.json().catch(() => ({}));
  if (!paymentResponse.ok || !payment.url) throw new Error(payment.message || payment.error?.message || 'Airwallex payment link failed');
  const key = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseResponse = await fetch(`${requiredEnv('SUPABASE_URL').replace(/\/$/, '')}/rest/v1/jp_manual_orders`, { method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', prefer: 'return=minimal' }, body: JSON.stringify({ order_no: orderNo, product_key: 'malaysia_manual', plan_days: days, data_allowance: plan.data, amount: plan.amount, currency: 'JPY', customer_email: String(body.email || '').trim().toLowerCase() || null, customer_name: String(body.name || '').trim() || null, departure_date: departure, payment_status: 'pending', fulfillment_status: 'awaiting_payment', airwallex_payment_link_id: payment.id, airwallex_payment_url: payment.url }) });
  if (!supabaseResponse.ok) throw new Error('Order record could not be saved');
  return { order_no: orderNo, payment_url: payment.url };
}

function findJapanProduct(sku) {
  return Object.values(jpCatalog.products).flat().find(product => product.sku === sku);
}

async function handleApi(req, res, pathname) {
  if (req.method === 'POST' && pathname === '/api/create-order') {
    try { return sendJson(res, 200, { ok: true, ...(await createManualPayment(await readJsonBody(req))) }); }
    catch (error) { console.error('Japan manual order failed', error); return sendJson(res, 500, { ok: false, error: 'Unable to create payment' }); }
  }
  if (req.method === 'GET' && pathname === '/api/jp/catalog') {
    try {
      return sendJson(res, 200, { market: 'JP', locale: 'ja-JP', currency: 'JPY', paymentMethodTypes: ['card'], products: await listJapanSkus() });
    } catch {
      return sendJson(res, 200, jpCatalog);
    }
  }
  if (req.method === 'POST' && pathname === '/api/jp/create-checkout') {
    try {
      const body = await readJsonBody(req);
      const created = await createJapanOrder(body);
      return sendJson(res, 201, await createJapanPaymentLink({ ...created, customerEmail: body.customerEmail }));
    } catch (error) {
      return sendJson(res, error.status || 500, { error: error.message || 'Unable to create checkout' });
    }
  }
  if (req.method === 'POST' && pathname === '/api/jp/order-draft') {
    try {
      const body = await readJsonBody(req);
      const product = findJapanProduct(body.sku);
      if (!product) return sendJson(res, 400, { error: 'Unknown Japan product SKU' });
      const orderId = 'JP-' + crypto.randomBytes(6).toString('hex').toUpperCase();
      return sendJson(res, 201, {
        orderId,
        market: 'jp',
        locale: 'ja-JP',
        currency: jpCatalog.currency,
        paymentMethodTypes: jpCatalog.paymentMethodTypes,
        product,
        paymentStatus: 'not_configured',
        message: 'Airwallex credentials are required before a live checkout can be created.'
      });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }
  return false;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': 'https://esim.easygosim.com', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' });
  res.end(JSON.stringify(payload));
  return true;
}

const server = http.createServer((req, res) => {
  const pathname = (req.url || '/').split('?')[0];
  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) { sendJson(res, 204, {}); return; }
  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname).catch(error => sendJson(res, 500, { error: 'Internal server error' }));
    return;
  }
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
