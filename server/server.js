const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const routes = require('./routes');
const { seedSampleRequests } = require('./seed-sample-requests');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize seed data
seedSampleRequests();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static file servers
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api', routes);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 سامانه مدیریت کارت پرسنلی با موفقیت راه‌اندازی شد!`);
  console.log(`🌐 آدرس دسترسی محلی: http://localhost:${PORT}`);
  console.log(`🔑 ورود مدیر کل: نام کاربری: admin | رمز عبور: 951753 (یا admin123)`);
  console.log(`👤 ورود مسئولان نمونه (۸ مسئول): رمزهای عبور ۶ رقمی مجزا برای هر شعبه`);
  console.log(`====================================================`);
});
