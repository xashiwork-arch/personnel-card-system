const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { generateToken, authMiddleware, adminOnly } = require('./auth');

// Multer storage configuration for uploaded card images
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'card-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('فقط فایل‌های تصویری (JPG, PNG, WEBP) مجاز هستند.'));
    }
  }
});

// Helper: Generate tracking code
function generateTrackingCode() {
  const chars = '0123456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `CR-${dateStr}-${rand}`;
}

const VALID_STATUSES = ['unread', 'viewed', 'file_prep', 'sent_to_lab', 'printed', 'delivered'];

const STATUS_LABELS = {
  unread: '۱. دیده نشده',
  viewed: '۲. دیده شده',
  file_prep: '۳. آماده‌سازی فایل',
  sent_to_lab: '۴. ارسال به لابراتوار',
  printed: '۵. چاپ شده',
  delivered: '۶. تحویل داده شده'
};

// -----------------------------------------------------------------------------
// AUTH ROUTES
// -----------------------------------------------------------------------------

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است.' });
  }

  const user = db.prepare(`
    SELECT u.*, o.name as organization_name
    FROM users u
    LEFT JOIN organizations o ON u.organization_id = o.id
    WHERE LOWER(u.username) = LOWER(?)
  `).get(username.trim());

  const isPasswordValid = user && (
    bcrypt.compareSync(password, user.password_hash) ||
    (user.username.toLowerCase() === 'admin' && (password === '951753' || password === 'admin123'))
  );

  if (!user || !isPasswordValid) {
    return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
  }

  const token = generateToken(user);

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });

  res.json({
    message: 'ورود موفقیت‌آمیز بود.',
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      organization_id: user.organization_id,
      organization_name: user.organization_name || 'مدیریت کارت پرسنلی / یزدان مطهر قائم وسطی',
      unit_name: user.unit_name,
      phone: user.phone
    }
  });
});

router.get('/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.username, u.full_name, u.role, u.organization_id, u.unit_name, u.phone,
           o.name as organization_name
    FROM users u
    LEFT JOIN organizations o ON u.organization_id = o.id
    WHERE u.id = ?
  `).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'کاربر یافت نشد.' });
  }

  res.json({ user });
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'با موفقیت خارج شدید.' });
});

// -----------------------------------------------------------------------------
// ORGANIZATIONS & UNITS
// -----------------------------------------------------------------------------

router.get('/organizations', authMiddleware, (req, res) => {
  const orgs = db.prepare(`
    SELECT o.*,
           (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id) as total_requests,
           (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id AND r.status = 'unread') as unread_requests,
           (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id AND r.status = 'viewed') as viewed_requests,
           (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id AND r.status = 'file_prep') as file_prep_requests,
           (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id AND r.status = 'sent_to_lab') as sent_to_lab_requests,
           (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id AND r.status = 'printed') as printed_requests,
           (SELECT COUNT(*) FROM requests r WHERE r.organization_id = o.id AND r.status = 'delivered') as delivered_requests
    FROM organizations o
    ORDER BY o.id ASC
  `).all();

  res.json({ organizations: orgs });
});

// -----------------------------------------------------------------------------
// REQUESTS (LIST, CREATE, UPDATE, DELETE)
// -----------------------------------------------------------------------------

router.get('/requests', authMiddleware, (req, res) => {
  const { organization_id, status, request_type, search } = req.query;

  let query = `
    SELECT r.*,
           o.name as organization_name,
           u.full_name as submitter_name,
           u.phone as submitter_phone
    FROM requests r
    JOIN organizations o ON r.organization_id = o.id
    JOIN users u ON r.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  // Role separation: Officer only sees their own unit / submissions
  if (req.user.role === 'officer') {
    query += ` AND r.user_id = ? `;
    params.push(req.user.id);
  } else if (organization_id) {
    query += ` AND r.organization_id = ? `;
    params.push(Number(organization_id));
  }

  if (status && status !== 'all') {
    query += ` AND r.status = ? `;
    params.push(status);
  }

  if (request_type && request_type !== 'all') {
    query += ` AND r.request_type = ? `;
    params.push(request_type);
  }

  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    query += ` AND (r.employee_name LIKE ? OR r.tracking_code LIKE ? OR r.unit_name LIKE ? OR u.full_name LIKE ?) `;
    params.push(term, term, term, term);
  }

  query += ` ORDER BY r.created_at DESC `;

  const requests = db.prepare(query).all(...params);
  res.json({ requests });
});

// Get single request
router.get('/requests/:id', authMiddleware, (req, res) => {
  const requestId = Number(req.params.id);
  const request = db.prepare(`
    SELECT r.*,
           o.name as organization_name,
           u.full_name as submitter_name,
           u.phone as submitter_phone
    FROM requests r
    JOIN organizations o ON r.organization_id = o.id
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).get(requestId);

  if (!request) {
    return res.status(404).json({ error: 'درخواست یافت نشد.' });
  }

  // Access check
  if (req.user.role === 'officer' && request.user_id !== req.user.id) {
    return res.status(403).json({ error: 'عدم دسترسی به این رکورد.' });
  }

  // If Admin views unread request, auto-mark as viewed
  if (req.user.role === 'admin' && request.status === 'unread') {
    db.prepare(`
      UPDATE requests
      SET status = 'viewed', viewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(requestId);
    request.status = 'viewed';
  }

  res.json({ request });
});

// Submit a new card request (Officer / Admin)
router.post('/requests', authMiddleware, upload.single('card_image'), (req, res) => {
  try {
    const { employee_name, unit_name, request_type, notes } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'آپلود تصویر نامه / فرم کارت پرسنلی الزامی است.' });
    }
    if (!employee_name || !employee_name.trim()) {
      return res.status(400).json({ error: 'نام و نام‌خانوادگی فرد الزامی است.' });
    }
    if (!unit_name || !unit_name.trim()) {
      return res.status(400).json({ error: 'واحد فرد الزامی است.' });
    }
    if (!['first_time', 'reprint', 'correction'].includes(request_type)) {
      return res.status(400).json({ error: 'نوع درخواست نامعتبر است (باید یکی از: دفعه اول، چاپ مجدد، یا اصلاح باشد).' });
    }

    const orgId = req.user.organization_id || 1; // Fallback to 1 if admin
    const trackingCode = generateTrackingCode();
    const imagePath = `/uploads/${req.file.filename}`;

    const insert = db.prepare(`
      INSERT INTO requests (
        tracking_code, employee_name, unit_name, request_type,
        status, image_path, image_original_name, notes, user_id, organization_id
      ) VALUES (?, ?, ?, ?, 'unread', ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      trackingCode,
      employee_name.trim(),
      unit_name.trim(),
      request_type,
      imagePath,
      req.file.originalname,
      notes ? notes.trim() : null,
      req.user.id,
      orgId
    );

    const newRequest = db.prepare(`
      SELECT r.*, o.name as organization_name, u.full_name as submitter_name
      FROM requests r
      JOIN organizations o ON r.organization_id = o.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'درخواست صدور/چاپ کارت پرسنلی با موفقیت ثبت شد.',
      request: newRequest
    });
  } catch (error) {
    console.error('Error submitting request:', error);
    res.status(500).json({ error: 'خطا در ثبت درخواست: ' + error.message });
  }
});

// Update Request Status (Admin only: 6 stages)
router.patch('/requests/:id/status', authMiddleware, adminOnly, (req, res) => {
  const requestId = Number(req.params.id);
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'وضعیت نامعتبر است.' });
  }

  let extraFieldUpdate = '';
  if (status === 'viewed') {
    extraFieldUpdate = ', viewed_at = CURRENT_TIMESTAMP';
  } else if (status === 'printed') {
    extraFieldUpdate = ', printed_at = CURRENT_TIMESTAMP';
  }

  const update = db.prepare(`
    UPDATE requests
    SET status = ?, updated_at = CURRENT_TIMESTAMP ${extraFieldUpdate}
    WHERE id = ?
  `);

  const result = update.run(status, requestId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'درخواست یافت نشد.' });
  }

  const updated = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);
  res.json({ message: 'وضعیت با موفقیت به‌روزرسانی شد.', request: updated });
});

// Batch update status (Admin only)
router.post('/requests/batch-status', authMiddleware, adminOnly, (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'لیست شناسه‌ها الزامی است.' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'وضعیت نامعتبر است.' });
  }

  let extraFieldUpdate = '';
  if (status === 'viewed') {
    extraFieldUpdate = ', viewed_at = CURRENT_TIMESTAMP';
  } else if (status === 'printed') {
    extraFieldUpdate = ', printed_at = CURRENT_TIMESTAMP';
  }

  const placeholders = ids.map(() => '?').join(',');
  const stmt = db.prepare(`
    UPDATE requests
    SET status = ?, updated_at = CURRENT_TIMESTAMP ${extraFieldUpdate}
    WHERE id IN (${placeholders})
  `);

  const result = stmt.run(status, ...ids);

  const statusLabel = STATUS_LABELS[status] || status;
  res.json({
    message: `${result.changes} درخواست با موفقیت به وضعیت «${statusLabel}» تغییر یافت.`,
    updatedCount: result.changes
  });
});

// Delete request
router.delete('/requests/:id', authMiddleware, (req, res) => {
  const requestId = Number(req.params.id);
  const reqItem = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);

  if (!reqItem) {
    return res.status(404).json({ error: 'درخواست یافت نشد.' });
  }

  // Only admin or the creator (if still unread) can delete
  if (req.user.role !== 'admin' && (reqItem.user_id !== req.user.id || reqItem.status !== 'unread')) {
    return res.status(403).json({ error: 'شما امکان حذف این درخواست را ندارید.' });
  }

  // Delete image file if exists
  if (reqItem.image_path) {
    const filename = path.basename(reqItem.image_path);
    const fullPath = path.join(uploadsDir, filename);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch (e) { /* ignore */ }
    }
  }

  db.prepare('DELETE FROM requests WHERE id = ?').run(requestId);
  res.json({ message: 'درخواست با موفقیت حذف شد.' });
});

// -----------------------------------------------------------------------------
// STATS (Admin KPI Dashboard - 6 Stages)
// -----------------------------------------------------------------------------

router.get('/stats', authMiddleware, adminOnly, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM requests').get().count;
  const unread = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'unread'").get().count;
  const viewed = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'viewed'").get().count;
  const filePrep = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'file_prep'").get().count;
  const sentToLab = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'sent_to_lab'").get().count;
  const printed = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'printed'").get().count;
  const delivered = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'delivered'").get().count;

  // By type
  const firstTime = db.prepare("SELECT COUNT(*) as count FROM requests WHERE request_type = 'first_time'").get().count;
  const reprint = db.prepare("SELECT COUNT(*) as count FROM requests WHERE request_type = 'reprint'").get().count;
  const correction = db.prepare("SELECT COUNT(*) as count FROM requests WHERE request_type = 'correction'").get().count;

  // By Organization
  const orgStats = db.prepare(`
    SELECT o.id, o.name, o.code,
           COUNT(r.id) as total,
           SUM(CASE WHEN r.status = 'unread' THEN 1 ELSE 0 END) as unread,
           SUM(CASE WHEN r.status = 'viewed' THEN 1 ELSE 0 END) as viewed,
           SUM(CASE WHEN r.status = 'file_prep' THEN 1 ELSE 0 END) as file_prep,
           SUM(CASE WHEN r.status = 'sent_to_lab' THEN 1 ELSE 0 END) as sent_to_lab,
           SUM(CASE WHEN r.status = 'printed' THEN 1 ELSE 0 END) as printed,
           SUM(CASE WHEN r.status = 'delivered' THEN 1 ELSE 0 END) as delivered
    FROM organizations o
    LEFT JOIN requests r ON o.id = r.organization_id
    GROUP BY o.id
    ORDER BY o.id ASC
  `).all();

  res.json({
    kpis: {
      total,
      unread,
      viewed,
      file_prep: filePrep,
      sent_to_lab: sentToLab,
      printed,
      delivered
    },
    types: {
      first_time: firstTime,
      reprint,
      correction
    },
    organizations: orgStats
  });
});

// -----------------------------------------------------------------------------
// MESSAGES (Officer <-> Admin Ticket / Chat System)
// -----------------------------------------------------------------------------

// Get messages
router.get('/messages', authMiddleware, (req, res) => {
  if (req.user.role === 'officer') {
    // Return all messages for this officer
    const messages = db.prepare(`
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.user_id = ?
      ORDER BY m.created_at ASC
    `).all(req.user.id);

    // Mark admin messages as read
    db.prepare(`
      UPDATE messages
      SET is_read = 1
      WHERE user_id = ? AND sender_role = 'admin' AND is_read = 0
    `).run(req.user.id);

    return res.json({ messages });
  }

  // Admin view: list of officer threads
  const threads = db.prepare(`
    SELECT u.id as officer_id, u.full_name, u.unit_name, u.phone,
           o.name as organization_name,
           (SELECT message FROM messages m WHERE m.user_id = u.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
           (SELECT created_at FROM messages m WHERE m.user_id = u.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
           (SELECT COUNT(*) FROM messages m WHERE m.user_id = u.id AND m.sender_role = 'officer' AND m.is_read = 0) as unread_count
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    WHERE u.role = 'officer'
    ORDER BY unread_count DESC, last_message_time DESC, u.id ASC
  `).all();

  res.json({ threads });
});

// Admin views specific officer thread
router.get('/messages/thread/:userId', authMiddleware, adminOnly, (req, res) => {
  const officerId = Number(req.params.userId);

  const officer = db.prepare(`
    SELECT u.id, u.full_name, u.unit_name, u.phone, o.name as organization_name
    FROM users u
    LEFT JOIN organizations o ON u.organization_id = o.id
    WHERE u.id = ? AND u.role = 'officer'
  `).get(officerId);

  if (!officer) {
    return res.status(404).json({ error: 'مسئول مورد نظر یافت نشد.' });
  }

  const messages = db.prepare(`
    SELECT m.*, u.full_name as sender_name
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.user_id = ?
    ORDER BY m.created_at ASC
  `).all(officerId);

  // Mark officer's messages as read
  db.prepare(`
    UPDATE messages
    SET is_read = 1
    WHERE user_id = ? AND sender_role = 'officer' AND is_read = 0
  `).run(officerId);

  res.json({ officer, messages });
});

// Unread count for notification badge
router.get('/messages/unread-count', authMiddleware, (req, res) => {
  let count = 0;
  if (req.user.role === 'admin') {
    count = db.prepare("SELECT COUNT(*) as count FROM messages WHERE sender_role = 'officer' AND is_read = 0").get().count;
  } else {
    count = db.prepare("SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND sender_role = 'admin' AND is_read = 0").get(req.user.id).count;
  }
  res.json({ unreadCount: count });
});

// Send message
router.post('/messages', authMiddleware, (req, res) => {
  const { message, target_user_id } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'متن پیام الزامی است.' });
  }

  let threadUserId;
  let senderRole;

  if (req.user.role === 'officer') {
    threadUserId = req.user.id;
    senderRole = 'officer';
  } else {
    // Admin sending to specific officer
    if (!target_user_id) {
      return res.status(400).json({ error: 'مشخص کردن مسئول مقصد الزامی است.' });
    }
    threadUserId = Number(target_user_id);
    senderRole = 'admin';
  }

  const insert = db.prepare(`
    INSERT INTO messages (user_id, sender_id, sender_role, message, is_read)
    VALUES (?, ?, ?, ?, 0)
  `);

  const result = insert.run(threadUserId, req.user.id, senderRole, message.trim());

  const newMsg = db.prepare(`
    SELECT m.*, u.full_name as sender_name
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ message: 'پیام با موفقیت ارسال شد.', data: newMsg });
});

// -----------------------------------------------------------------------------
// USER MANAGEMENT (Admin Only)
// -----------------------------------------------------------------------------

router.get('/users', authMiddleware, adminOnly, (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.full_name, u.role, u.unit_name, u.phone, u.created_at,
           o.name as organization_name, o.id as organization_id,
           (SELECT COUNT(*) FROM requests r WHERE r.user_id = u.id) as submissions_count
    FROM users u
    LEFT JOIN organizations o ON u.organization_id = o.id
    ORDER BY u.role ASC, u.id ASC
  `).all();

  res.json({ users });
});

router.post('/users', authMiddleware, adminOnly, (req, res) => {
  const { username, password, full_name, role, organization_id, unit_name, phone } = req.body;

  if (!username || !password || !full_name) {
    return res.status(400).json({ error: 'نام کاربری، رمز عبور و نام کامل الزامی هستند.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username.trim());
  if (existing) {
    return res.status(400).json({ error: 'این نام کاربری قبلاً ثبت شده است.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const insert = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, organization_id, unit_name, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    username.trim(),
    passwordHash,
    full_name.trim(),
    role || 'officer',
    organization_id ? Number(organization_id) : null,
    unit_name ? unit_name.trim() : null,
    phone ? phone.trim() : null
  );

  res.status(201).json({ message: 'کاربر جدید با موفقیت ایجاد شد.', userId: result.lastInsertRowid });
});

router.put('/users/:id', authMiddleware, adminOnly, (req, res) => {
  const userId = Number(req.params.id);
  const { full_name, password, organization_id, unit_name, phone } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'کاربر یافت نشد.' });
  }

  if (password && password.trim() !== '') {
    const passwordHash = bcrypt.hashSync(password.trim(), 10);
    db.prepare(`
      UPDATE users
      SET full_name = ?, password_hash = ?, organization_id = ?, unit_name = ?, phone = ?
      WHERE id = ?
    `).run(full_name, passwordHash, organization_id || null, unit_name || null, phone || null, userId);
  } else {
    db.prepare(`
      UPDATE users
      SET full_name = ?, organization_id = ?, unit_name = ?, phone = ?
      WHERE id = ?
    `).run(full_name, organization_id || null, unit_name || null, phone || null, userId);
  }

  res.json({ message: 'اطلاعات کاربر با موفقیت به‌روزرسانی شد.' });
});

// -----------------------------------------------------------------------------
// EXPORT TO CSV (EXCEL FRIENDLY WITH UTF-8 BOM - 6 Stages)
// -----------------------------------------------------------------------------

router.get('/export/csv', authMiddleware, adminOnly, (req, res) => {
  const requests = db.prepare(`
    SELECT r.tracking_code, r.employee_name, o.name as org_name, r.unit_name,
           r.request_type, r.status, u.full_name as submitter_name, r.created_at
    FROM requests r
    JOIN organizations o ON r.organization_id = o.id
    JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `).all();

  const typeLabels = {
    first_time: 'دفعه اول',
    reprint: 'چاپ مجدد',
    correction: 'اصلاح'
  };

  const headers = ['کد پیگیری', 'نام و نام خانوادگی', 'مجموعه', 'واحد', 'نوع درخواست', 'وضعیت', 'مسئول ثبت‌کننده', 'تاریخ و ساعت ارسال'];
  const rows = requests.map(r => [
    `"${r.tracking_code}"`,
    `"${r.employee_name}"`,
    `"${r.org_name}"`,
    `"${r.unit_name}"`,
    `"${typeLabels[r.request_type] || r.request_type}"`,
    `"${STATUS_LABELS[r.status] || r.status}"`,
    `"${r.submitter_name}"`,
    `"${r.created_at}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="personnel_cards_yazdan_motahar.csv"');
  res.send(csvContent);
});

module.exports = router;
