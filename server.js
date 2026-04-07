const path = require('path');
const fs = require('fs/promises');

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const app = express();

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret';

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function readJson(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === 'ENOENT') return fallbackValue;
    throw err;
  }
}

async function writeJsonAtomic(filePath, value) {
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(tmp, filePath);
}

async function ensureDefaults() {
  const defaultContent = {
    home: {
      title: 'ABOUT US',
      description:
        "Brakes India Private Limited, founded in 1962 and part of the TVS Group, is India's largest manufacturer of automotive braking systems and a major global supplier. Headquartered in Chennai, it operates over 21 manufacturing locations, offering braking solutions for passenger vehicles, commercial vehicles."
    },
    assets: {
      logoImage: 'brakes india pagr.png',
      homeVideo: 'video/absvideo.mp4'
    }
  };

  const content = await readJson(CONTENT_FILE, null);
  if (!content) {
    await writeJsonAtomic(CONTENT_FILE, defaultContent);
  }

  const users = await readJson(USERS_FILE, null);
  if (!users) {
    const adminUser = {
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 10)
    };
    await writeJsonAtomic(USERS_FILE, [adminUser]);
    // Default login is admin / admin123 (change later in data/users.json)
  }
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user && req.session.user.username) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

// Static files (your existing HTML/CSS/JS)
app.use(express.static(ROOT_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
      const safeBase = path
        .basename(file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      const ext = path.extname(safeBase);
      const name = path.basename(safeBase, ext);
      const stamp = Date.now();
      cb(null, `${name}-${stamp}${ext}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// --- Public content API (frontend reads this) ---
app.get('/api/content', async (req, res) => {
  const content = await readJson(CONTENT_FILE, {});
  res.json(content);
});

// --- Auth APIs ---
app.get('/api/me', (req, res) => {
  const user = req.session && req.session.user ? req.session.user : null;
  res.json({ user });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const users = await readJson(USERS_FILE, []);
  const found = users.find((u) => u.username === username);
  if (!found) return res.status(401).json({ error: 'Invalid username or password' });

  const ok = await bcrypt.compare(password, found.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid username or password' });

  req.session.user = { username: found.username };
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// --- Admin APIs ---
app.put('/api/content', requireAuth, async (req, res) => {
  const nextContent = req.body;
  if (!nextContent || typeof nextContent !== 'object') {
    return res.status(400).json({ error: 'Invalid content payload' });
  }
  await writeJsonAtomic(CONTENT_FILE, nextContent);
  res.json({ ok: true });
});

app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ ok: true, url });
});

// Route helpers for admin UX
app.get('/admin', (req, res) => {
  res.redirect('/admin.html');
});
app.get('/admin-login', (req, res) => {
  res.redirect('/admin-login.html');
});

async function main() {
  await ensureDirs();
  await ensureDefaults();

  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

