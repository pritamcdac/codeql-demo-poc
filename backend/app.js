const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
// Hardcoded secret for demo purposes (intentionally insecure)
const HARDCODED_ADMIN_API_KEY = 'sk_live_admin_secret_key_1234567890';

app.use(bodyParser.json());
app.use('/api/users', userRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
