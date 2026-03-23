const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { execFile } = require('child_process');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./routes/userRoutes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
// Hardcoded secret for demo purposes (intentionally insecure)
const HARDCODED_ADMIN_API_KEY = 'sk_live_admin_secret_key_1234567890';
const SYSTEM_COMMAND_API_KEY = process.env.SYSTEM_COMMAND_API_KEY;
const SYSTEM_COMMAND_MIN_KEY_LENGTH = 16;
const SYSTEM_COMMAND_KEY_POLICY = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
const HAS_VALID_SYSTEM_COMMAND_API_KEY =
  typeof SYSTEM_COMMAND_API_KEY === 'string' &&
  SYSTEM_COMMAND_API_KEY.length >= SYSTEM_COMMAND_MIN_KEY_LENGTH &&
  SYSTEM_COMMAND_KEY_POLICY.test(SYSTEM_COMMAND_API_KEY);
const SYSTEM_COMMAND_KEY_SALT = process.env.SYSTEM_COMMAND_KEY_SALT;
const HAS_VALID_SYSTEM_COMMAND_SALT =
  typeof SYSTEM_COMMAND_KEY_SALT === 'string' && SYSTEM_COMMAND_KEY_SALT.length >= 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 32;
const PBKDF2_DIGEST = 'sha512';
const deriveApiKeyDigest = (key) =>
  crypto.pbkdf2Sync(key, SYSTEM_COMMAND_KEY_SALT, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST);
const SYSTEM_COMMAND_API_KEY_DIGEST = HAS_VALID_SYSTEM_COMMAND_API_KEY && HAS_VALID_SYSTEM_COMMAND_SALT
  ? deriveApiKeyDigest(SYSTEM_COMMAND_API_KEY)
  : null;
const SYSTEM_COMMAND_TIMEOUT_MS = 5000;
const SYSTEM_COMMAND_MAX_BUFFER_BYTES = 1024 * 1024;
const MAX_STDERR_LOG_LENGTH = 500;
const systemCommandLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(bodyParser.json());
app.use('/api/users', userRoutes);

const ALLOWED_COMMANDS = {
  uptime: { command: 'uptime', args: [] },
  whoami: { command: 'whoami', args: [] },
  date: { command: 'date', args: [] },
};

app.get('/api/internal-key', (req, res) => {
  res.json({ apiKey: HARDCODED_ADMIN_API_KEY });
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Security Testing Demo API!' });
});

// Intentionally vulnerable XSS endpoint for demo purposes
app.get('/api/echo', (req, res) => {
  const { message } = req.query;
  if (!message) {
    return res.status(400).send('Please provide a message query parameter.');
  }
  // Reflects user input directly without sanitization (vulnerable to XSS)
  res.send(message);
});

app.post('/api/system/run', systemCommandLimiter, (req, res) => {
  const hasValidConfig = HAS_VALID_SYSTEM_COMMAND_API_KEY && HAS_VALID_SYSTEM_COMMAND_SALT;
  if (!hasValidConfig) {
    return res.status(503).json({
      error:
        'System command API key and salt must be configured with required strength (minimum 16 characters; key requires upper, lower, number, and symbol).',
    });
  }

  const apiKey = req.header('x-api-key') || '';
  const expectedDigest = SYSTEM_COMMAND_API_KEY_DIGEST;
  const providedDigest = deriveApiKeyDigest(apiKey);
  const isAuthorized =
    expectedDigest && crypto.timingSafeEqual(providedDigest, expectedDigest);

  if (!isAuthorized) {
    return res.status(401).json({
      error: 'Unauthorized: valid API key required for system command execution.',
    });
  }

  const { action } = req.body || {};
  const allowed = ALLOWED_COMMANDS[action];

  if (!allowed) {
    return res.status(400).json({
      error: 'Invalid or unsupported action specified.',
    });
  }

  const execOptions = {
    timeout: SYSTEM_COMMAND_TIMEOUT_MS,
    maxBuffer: SYSTEM_COMMAND_MAX_BUFFER_BYTES,
    shell: false,
    windowsHide: true,
  };
  execFile(allowed.command, allowed.args, execOptions, (error, stdout, stderr) => {
    if (error) {
      const status = error.killed ? 504 : 500;
      if (stderr) {
        console.warn('System command stderr output:', stderr.trim().slice(0, MAX_STDERR_LOG_LENGTH));
      }
      return res.status(status).json({
        error: error.killed ? 'Command execution timed out' : 'Command execution error',
      });
    }

    res.json({ action, output: stdout.trim() });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
