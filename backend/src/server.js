require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
require('dotenv').config(); // backend/.env 도 지원

const express = require('express');
const morgan = require('morgan');

const path = require('path');
const fs = require('fs');
const rfs = require('rotating-file-stream');

morgan.token('user', (req) => req.session?.user?.id || '-');
morgan.token('username', (req) => req.session?.user?.username || '-');
morgan.token('real-ip', (req) => req.ip);

const secureLogFormat = ':real-ip - :username[:user] [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

const session = require('express-session');
const initDb = require('./initDb');
const { createRateLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SESSION_SECRET = String(process.env.SESSION_SECRET || '').trim();

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'API 요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
});

const writeLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: '쓰기 요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
});

const readLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: '조회 요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
});

app.set('trust proxy', 1);

const logDirectory = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const accessLogStream = rfs.createStream('access.log', {
  interval: '1d',
  path: logDirectory,
  maxFiles: 30,
  compress: 'gzip'
});

app.use(morgan(secureLogFormat));
app.use(morgan(secureLogFormat, { stream: accessLogStream }));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'board.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // 로컬 http 환경. HTTPS 운영 시 true로 변경
      maxAge: 1000 * 60 * 60 * 8, // 8시간
    },
  })
);
app.use('/api', generalApiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/posts', readLimiter, postRoutes);
app.use('/api', writeLimiter, commentRoutes);
app.use('/api/admin', writeLimiter, adminRoutes);

// API 오류 응답을 JSON으로 통일
app.use('/api', (err, req, res, next) => {
  console.error(err);
  res.status(400).json({ message: err.message || '요청 처리 중 오류가 발생했습니다.' });
});

// 빌드된 Vue 화면 제공
app.use(express.static(PUBLIC_DIR));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Running ${PORT}`);
    });
  } catch (err) {
    console.error('서버 시작 중 오류:', err);
    process.exit(1);
  }
}

start();
