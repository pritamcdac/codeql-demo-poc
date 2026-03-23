const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many login attempts from this IP, please try again later.',
});

router.post('/register', userController.register);
router.post('/login', loginLimiter, userController.login);

module.exports = router;
