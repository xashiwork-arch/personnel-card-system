const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'personnel-card-secret-key-1405-secure';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      organization_id: user.organization_id,
      unit_name: user.unit_name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'احراز هویت انجام نشده است. لطفاً وارد شوید.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'نشست کاربری منقضی یا نامعتبر است. مجدداً وارد شوید.' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'دسترسی غیرمجاز؛ فقط مدیر کل به این بخش دسترسی دارد.' });
  }
  next();
}

module.exports = {
  generateToken,
  authMiddleware,
  adminOnly
};
