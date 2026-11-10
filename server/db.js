const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys
db.exec(`PRAGMA journal_mode = WAL;`);
db.exec(`PRAGMA foreign_keys = ON;`);

function initDb() {
  // Create Organizations table (The 8 Branches / Stores)
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Units table (Sub-units)
  db.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'officer')),
      organization_id INTEGER,
      unit_name TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
    );
  `);

  // Create Requests table with the 6 statuses
  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_code TEXT UNIQUE NOT NULL,
      employee_name TEXT NOT NULL,
      unit_name TEXT NOT NULL,
      request_type TEXT NOT NULL CHECK(request_type IN ('first_time', 'reprint', 'correction')),
      status TEXT NOT NULL DEFAULT 'unread' CHECK(status IN ('unread', 'viewed', 'file_prep', 'sent_to_lab', 'printed', 'delivered')),
      image_path TEXT NOT NULL,
      image_original_name TEXT,
      notes TEXT,
      user_id INTEGER NOT NULL,
      organization_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      viewed_at DATETIME,
      printed_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  // Index for fast query filtering
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_requests_org ON requests(organization_id);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(request_type);
    CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
  `);

  // Create Messages table (Officer <-> Admin chat/ticket system)
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      sender_role TEXT NOT NULL CHECK(sender_role IN ('admin', 'officer')),
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
  `);

  syncEightBranchesAndOfficers();
}

function syncEightBranchesAndOfficers() {
  const branches = [
    { id: 1, name: 'هایپر آرین', code: 'HYPER-ARIAN', officerName: 'خانم رسولی', username: 'officer1', altUser: 'rasouli', phone: '09111000001', password: '841203' },
    { id: 2, name: 'هایپر قدمت', code: 'HYPER-GHEDMAT', officerName: 'خانم رضوی', username: 'officer2', altUser: 'razavi', phone: '09111000002', password: '729514' },
    { id: 3, name: 'مشتاق قائمشهر', code: 'MOSHTAGH-GHAEM', officerName: 'خانم صباغی', username: 'officer3', altUser: 'sabbaghi_gh', phone: '09111000003', password: '638195' },
    { id: 4, name: 'مشتاق آمل', code: 'MOSHTAGH-AMOL', officerName: 'خانم مهدی پور', username: 'officer4', altUser: 'mehdipour', phone: '09111000004', password: '519482' },
    { id: 5, name: 'مشتاق بهنمیر', code: 'MOSHTAGH-BAHNAMIR', officerName: 'خانم باباجان زاده', username: 'officer5', altUser: 'babajanzadeh', phone: '09111000005', password: '926371' },
    { id: 6, name: 'مشتاق نکا', code: 'MOSHTAGH-NEKA', officerName: 'خانم صادقی', username: 'officer6', altUser: 'sadeghi', phone: '09111000006', password: '384729' },
    { id: 7, name: 'مشتاق ساری', code: 'MOSHTAGH-SARI', officerName: 'خانم صباغی', username: 'officer7', altUser: 'sabbaghi_sa', phone: '09111000007', password: '471938' },
    { id: 8, name: 'فروشگاه آرین', code: 'STORE-ARIAN', officerName: 'خانم صباغی', username: 'officer8', altUser: 'sabbaghi_ar', phone: '09111000008', password: '652814' }
  ];

  db.exec(`PRAGMA foreign_keys = OFF;`);

  // Check if organizations need updating to the 8 branches
  const firstOrg = db.prepare('SELECT name FROM organizations WHERE id = 1').get();
  if (!firstOrg || firstOrg.name !== 'هایپر آرین' || db.prepare('SELECT COUNT(*) as c FROM organizations').get().c !== 8) {
    console.log('Syncing real 8 branches into organizations table...');
    db.exec(`DELETE FROM organizations;`);
    const insertOrg = db.prepare('INSERT INTO organizations (id, name, code, description) VALUES (?, ?, ?, ?)');
    branches.forEach(b => {
      insertOrg.run(b.id, b.name, b.code, `شعبه ${b.name} - مسئول شعبه: ${b.officerName}`);
    });
  }

  const adminPasswordHash = bcrypt.hashSync('951753', 10);

  // Ensure Admin exists with official title and 6-digit password
  const adminUser = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
  if (!adminUser) {
    db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, organization_id, unit_name, phone)
      VALUES (?, ?, ?, 'admin', NULL, 'مدیریت کل', '09120000000')
    `).run('admin', adminPasswordHash, 'مدیریت کارت پرسنلی / یزدان مطهر قائم وسطی');
  } else {
    db.prepare("UPDATE users SET password_hash = ?, full_name = 'مدیریت کارت پرسنلی / یزدان مطهر قائم وسطی' WHERE username = 'admin'").run(adminPasswordHash);
  }

  // Sync the 8 officers with unique 6-digit passwords
  branches.forEach(b => {
    const branchPasswordHash = bcrypt.hashSync(b.password, 10);

    // Check primary username (e.g. officer1..officer8)
    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(b.username);
    if (!existing) {
      db.prepare(`
        INSERT INTO users (username, password_hash, full_name, role, organization_id, unit_name, phone)
        VALUES (?, ?, ?, 'officer', ?, ?, ?)
      `).run(b.username, branchPasswordHash, b.officerName, b.id, b.name, b.phone);
    } else {
      db.prepare(`
        UPDATE users
        SET password_hash = ?, full_name = ?, organization_id = ?, unit_name = ?, phone = ?
        WHERE username = ?
      `).run(branchPasswordHash, b.officerName, b.id, b.name, b.phone, b.username);
    }

    // Also support surname login (e.g. rasouli, razavi, sabbaghi_gh, etc.)
    const altExisting = db.prepare("SELECT id FROM users WHERE username = ?").get(b.altUser);
    if (!altExisting) {
      db.prepare(`
        INSERT INTO users (username, password_hash, full_name, role, organization_id, unit_name, phone)
        VALUES (?, ?, ?, 'officer', ?, ?, ?)
      `).run(b.altUser, branchPasswordHash, b.officerName, b.id, b.name, b.phone);
    } else {
      db.prepare(`
        UPDATE users
        SET password_hash = ?, full_name = ?, organization_id = ?, unit_name = ?, phone = ?
        WHERE username = ?
      `).run(branchPasswordHash, b.officerName, b.id, b.name, b.phone, b.altUser);
    }
  });

  // Clean up any old unused officers (e.g. officer9, officer10 if present)
  try {
    db.exec("DELETE FROM users WHERE username IN ('officer9', 'officer10');");
  } catch (e) {}

  db.exec(`PRAGMA foreign_keys = ON;`);
  console.log('Synchronized real 8 branches and their officers successfully!');
}

initDb();

module.exports = db;
