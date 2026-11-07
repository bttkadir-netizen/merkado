const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const express = require('express');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');

const app = express();
const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;
const dataDir = path.resolve(__dirname, '..', 'data');

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be set to a random value of at least 32 characters.');
}

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'merkado.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price INTEGER NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'payment_pending',
    total INTEGER NOT NULL CHECK (total >= 0),
    payment_provider TEXT,
    provider_reference TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0)
  );
  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
`);

const seedProducts = [
  [1, 'PUBG UC 60 TL', 'PUBG UC', 'Hızlı teslimat ve güvenli işlem.', 60, 100],
  [2, 'PUBG UC 120 TL', 'PUBG UC', 'Yüksek miktar paket seçeneği.', 120, 80],
  [3, 'Premium Oyun Hesabı', 'Oyun Hesapları', 'Premium özellikler ve özel erişim.', 299, 12],
  [4, 'Steam Hediye Kartı', 'Dijital Ürünler', 'Anlık kullanım için dijital kod.', 150, 40],
  [5, 'Valorant VP Paketi', 'Oyun Ürünleri', 'Kısa sürede teslim edilen kod.', 210, 35],
  [6, 'Dijital Abonelik', 'Dijital Ürünler', 'Aylık erişim ve özel içerikler.', 99, 50],
];
const insertSeed = db.prepare(`
  INSERT OR IGNORE INTO products (id, name, category, description, price, stock)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const seedTransaction = db.transaction((rows) => rows.forEach((row) => insertSeed.run(...row)));
seedTransaction(seedProducts);

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '20kb', type: 'application/json' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(
  session({
    name: 'merkado.sid',
    secret: sessionSecret,
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: dataDir, table: 'sessions' }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.' },
});

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function csrfTokenFor(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

function requireCsrf(req, res, next) {
  const expected = req.session.csrfToken;
  const supplied = req.get('x-csrf-token');
  if (!expected || !supplied) return sendError(res, 403, 'İstek doğrulanamadı. Sayfayı yenileyip tekrar deneyin.');

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    return sendError(res, 403, 'İstek doğrulanamadı. Sayfayı yenileyip tekrar deneyin.');
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) return sendError(res, 401, 'Bu işlem için giriş yapmalısınız.');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return sendError(res, 403, 'Bu alana erişim yetkiniz yok.');
  }
  next();
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/csrf', (req, res, next) => {
  const token = csrfTokenFor(req);
  req.session.save((error) => {
    if (error) return next(error);
    res.set('Cache-Control', 'no-store').json({ csrfToken: token });
  });
});

app.get('/api/products', (req, res) => {
  const rows = db.prepare(`
    SELECT id, name, category, description, price, stock
    FROM products WHERE active = 1 ORDER BY id
  `).all();
  res.json({ products: rows });
});

app.post('/api/auth/register', authLimiter, requireCsrf, async (req, res, next) => {
  try {
    const name = cleanText(req.body.name, 100);
    const email = cleanText(req.body.email, 254).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 200) {
      return sendError(res, 400, 'Ad, geçerli e-posta ve en az 12 karakterli şifre girin.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name, email, passwordHash);
    res.status(201).json({ user: { id: result.lastInsertRowid, name, email, role: 'customer' } });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return sendError(res, 409, 'Bu e-posta adresi zaten kayıtlı.');
    next(error);
  }
});

app.post('/api/auth/login', authLimiter, requireCsrf, async (req, res, next) => {
  try {
    const email = cleanText(req.body.email, 254).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = db.prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ?').get(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return sendError(res, 401, 'E-posta veya şifre hatalı.');
    }

    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        res.json({ user: req.session.user, csrfToken: req.session.csrfToken });
      });
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post('/api/auth/logout', requireCsrf, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('merkado.sid', { httpOnly: true, secure: isProduction, sameSite: 'lax' });
    res.status(204).end();
  });
});

// Orders intentionally remain disabled until a real server-side payment provider is configured.
app.post('/api/orders', requireAuth, requireCsrf, (req, res) => {
  res.set('Retry-After', '0');
  return sendError(res, 503, 'Sipariş/ödeme şu an etkin değil. Demo sürümünde gerçek ödeme veya teslimat yapılmaz.');
});

app.get('/api/admin/products', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id, name, category, description, price, stock, active FROM products ORDER BY id').all();
  res.json({ products: rows });
});

app.post('/api/admin/products', requireAuth, requireAdmin, requireCsrf, (req, res) => {
  const name = cleanText(req.body.name, 160);
  const category = cleanText(req.body.category, 80);
  const description = cleanText(req.body.description, 1000);
  const price = Number(req.body.price);
  const stock = Number(req.body.stock);

  if (name.length < 2 || !category || !Number.isSafeInteger(price) || price < 0 || !Number.isSafeInteger(stock) || stock < 0) {
    return sendError(res, 400, 'Ürün adı, kategori, kuruş cinsinden tam sayı fiyat ve stok bilgisi geçerli olmalıdır.');
  }

  const result = db.prepare(`
    INSERT INTO products (name, category, description, price, stock)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, category, description, price, stock);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.patch('/api/admin/products/:id', requireAuth, requireAdmin, requireCsrf, (req, res) => {
  const id = Number(req.params.id);
  const current = db.prepare('SELECT id, name, category, description, price, stock, active FROM products WHERE id = ?').get(id);
  if (!current) return sendError(res, 404, 'Ürün bulunamadı.');

  const next = {
    name: req.body.name === undefined ? current.name : cleanText(req.body.name, 160),
    category: req.body.category === undefined ? current.category : cleanText(req.body.category, 80),
    description: req.body.description === undefined ? current.description : cleanText(req.body.description, 1000),
    price: req.body.price === undefined ? current.price : Number(req.body.price),
    stock: req.body.stock === undefined ? current.stock : Number(req.body.stock),
    active: req.body.active === undefined ? current.active : Number(req.body.active),
  };

  if (!next.name || !next.category || !Number.isSafeInteger(next.price) || next.price < 0 ||
      !Number.isSafeInteger(next.stock) || next.stock < 0 || ![0, 1].includes(next.active)) {
    return sendError(res, 400, 'Ürün alanları geçerli olmalıdır. Fiyat kuruş cinsinden tam sayı olmalıdır.');
  }

  db.prepare(`
    UPDATE products SET name = ?, category = ?, description = ?, price = ?, stock = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(next.name, next.category, next.description, next.price, next.stock, next.active, id);
  res.json({ id, ...next });
});

app.use((req, res) => sendError(res, 404, 'API yolu bulunamadı.'));

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Sunucu hatası oluştu.' });
});

app.listen(port, () => {
  console.log(`MERKADO API listening on port ${port}`);
});
