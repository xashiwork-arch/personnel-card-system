const fs = require('fs');
const path = require('path');
const db = require('./db');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Generate realistic SVG card forms as placeholder images
function createSvgFormImage(name, org, unit, code, typeTitle) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="800" height="1100" style="background:#0b1844; font-family: Tahoma, 'Segoe UI', sans-serif;" direction="rtl">
    <rect width="760" height="1060" x="20" y="20" rx="15" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
    
    <!-- Header -->
    <rect width="760" height="130" x="20" y="20" rx="15" fill="#0b1844"/>
    <text x="400" y="65" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">مدیریت کارت پرسنلی / یزدان مطهر قائم وسطی</text>
    <text x="400" y="105" font-size="16" fill="#93c5fd" text-anchor="middle">فرم درخواست و تایید صدور کارت شناسایی پرسنل</text>
    
    <!-- Tracking Info -->
    <rect x="50" y="170" width="700" height="50" rx="8" fill="#f1f5f9" stroke="#e2e8f0"/>
    <text x="730" y="202" font-size="16" font-weight="bold" fill="#334155" text-anchor="end">شماره رهگیری: ${code}</text>
    <text x="70" y="202" font-size="15" fill="#64748b" text-anchor="start">تاریخ ثبت: ۱۴۰۵/۰۸/۲۰</text>

    <!-- Personnel Photo placeholder -->
    <rect x="70" y="250" width="160" height="200" rx="10" fill="#e2e8f0" stroke="#94a3b8" stroke-dasharray="4"/>
    <text x="150" y="340" font-size="14" fill="#64748b" text-anchor="middle">عکس ۳×۴ پرسنل</text>
    <circle cx="150" cy="310" r="30" fill="#cbd5e1"/>

    <!-- Form Fields Table -->
    <g transform="translate(250, 250)">
      <rect width="480" height="42" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="460" y="27" font-size="15" font-weight="bold" fill="#475569" text-anchor="end">نام و نام‌خانوادگی:</text>
      <text x="250" y="27" font-size="17" font-weight="bold" fill="#0f172a" text-anchor="end">${name}</text>

      <rect y="50" width="480" height="42" fill="#ffffff" stroke="#e2e8f0"/>
      <text x="460" y="77" font-size="15" font-weight="bold" fill="#475569" text-anchor="end">مجموعه / شعبه:</text>
      <text x="350" y="77" font-size="16" font-weight="bold" fill="#1e40af" text-anchor="end">${org}</text>

      <rect y="100" width="480" height="42" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="460" y="127" font-size="15" font-weight="bold" fill="#475569" text-anchor="end">واحد سازمانی:</text>
      <text x="350" y="127" font-size="15" fill="#0f172a" text-anchor="end">${unit}</text>

      <rect y="150" width="480" height="42" fill="#ffffff" stroke="#e2e8f0"/>
      <text x="460" y="177" font-size="15" font-weight="bold" fill="#475569" text-anchor="end">نوع درخواست:</text>
      <text x="350" y="177" font-size="16" font-weight="bold" fill="#2563eb" text-anchor="end">${typeTitle}</text>
    </g>

    <!-- Additional Details Box -->
    <rect x="50" y="480" width="700" height="200" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
    <rect x="50" y="480" width="700" height="35" rx="8" fill="#f1f5f9"/>
    <text x="730" y="504" font-size="15" font-weight="bold" fill="#334155" text-anchor="end">مشخصات هویتی و تاییدیه اشتغال</text>
    
    <text x="720" y="550" font-size="14" fill="#64748b" text-anchor="end">کد ملی: ۰۰۱۴۸۲۹***</text>
    <text x="450" y="550" font-size="14" fill="#64748b" text-anchor="end">کد پرسنلی: ۹۸۴۲۱</text>
    <text x="720" y="600" font-size="14" fill="#64748b" text-anchor="end">نوع قرارداد: تمام وقت</text>
    <text x="450" y="600" font-size="14" fill="#64748b" text-anchor="end">محل خدمت: یزدان مطهر قائم وسطی</text>
    <text x="720" y="650" font-size="14" fill="#16a34a" text-anchor="end">وضعیت سوء پیشینه و طب کار: تایید شده</text>

    <!-- Signatures -->
    <g transform="translate(50, 720)">
      <rect width="210" height="180" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="105" y="35" font-size="14" font-weight="bold" fill="#475569" text-anchor="middle">امضاء مسئول شعبه</text>
      <path d="M40,110 Q90,60 140,110 T180,100" stroke="#2563eb" stroke-width="2.5" fill="none"/>
      <text x="105" y="150" font-size="12" fill="#94a3b8" text-anchor="middle">تایید و ارسال شد</text>

      <rect x="245" width="210" height="180" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="350" y="35" font-size="14" font-weight="bold" fill="#475569" text-anchor="middle">مدیریت منابع انسانی</text>
      <path d="M280,120 Q330,80 390,120 T420,100" stroke="#059669" stroke-width="2.5" fill="none"/>
      <text x="350" y="150" font-size="12" fill="#94a3b8" text-anchor="middle">تایید اولیه مدارک</text>

      <rect x="490" width="210" height="180" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="595" y="35" font-size="14" font-weight="bold" fill="#475569" text-anchor="middle">مهر و امضای حراست</text>
      <circle cx="595" cy="110" r="35" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="3"/>
      <text x="595" y="115" font-size="12" font-weight="bold" fill="#dc2626" text-anchor="middle">تایید حراست</text>
    </g>

    <!-- Footer Note -->
    <rect x="50" y="940" width="700" height="70" rx="6" fill="#fffbeb" stroke="#fef3c7"/>
    <text x="730" y="970" font-size="13" font-weight="bold" fill="#b45309" text-anchor="end">توجه: این فرم به منزله سند رسمی درخواست کارت پرسنلی هوشمند می‌باشد.</text>
    <text x="730" y="995" font-size="12" fill="#78350f" text-anchor="end">هرگونه مخدوش بودن متن یا نقص در مدارک پیوست موجب توقف فرایند چاپ خواهد شد.</text>
  </svg>`;
}

function seedSampleRequests() {
  const branches = [
    { id: 1, name: 'هایپر آرین', officer: 'خانم رسولی', officerUser: 'officer1' },
    { id: 2, name: 'هایپر قدمت', officer: 'خانم رضوی', officerUser: 'officer2' },
    { id: 3, name: 'مشتاق قائمشهر', officer: 'خانم صباغی', officerUser: 'officer3' },
    { id: 4, name: 'مشتاق آمل', officer: 'خانم مهدی پور', officerUser: 'officer4' },
    { id: 5, name: 'مشتاق بهنمیر', officer: 'خانم باباجان زاده', officerUser: 'officer5' },
    { id: 6, name: 'مشتاق نکا', officer: 'خانم صادقی', officerUser: 'officer6' },
    { id: 7, name: 'مشتاق ساری', officer: 'خانم صباغی', officerUser: 'officer7' },
    { id: 8, name: 'فروشگاه آرین', officer: 'خانم صباغی', officerUser: 'officer8' }
  ];

  // Re-seed requests to map accurately to the 8 branches
  const sampleRequests = [
    {
      employee: 'امیرحسین مرادی',
      unit: 'واحد صندوق و فروش',
      type: 'first_time',
      typeTitle: '۱. دفعه اول',
      status: 'unread',
      orgId: 1, // هایپر آرین
      notes: 'پرسنل جدید شیفت عصر - نیاز به صدور فوری'
    },
    {
      employee: 'سارا تقوی',
      unit: 'واحد چیدمان و انبار',
      type: 'reprint',
      typeTitle: '۲. چاپ مجدد',
      status: 'viewed',
      orgId: 2, // هایپر قدمت
      notes: 'مفقودی کارت تردد قبلی'
    },
    {
      employee: 'علیرضا اسدی',
      unit: 'واحد صندوقداری',
      type: 'correction',
      typeTitle: '۳. اصلاح',
      status: 'file_prep',
      orgId: 3, // مشتاق قائمشهر
      notes: 'ارتقای سمت به سرپرست شیفت'
    },
    {
      employee: 'نرگس پناهی',
      unit: 'واحد حسابداری و فروش',
      type: 'first_time',
      typeTitle: '۱. دفعه اول',
      status: 'sent_to_lab',
      orgId: 4, // مشتاق آمل
      notes: 'کارشناس پذیرش و فروش'
    },
    {
      employee: 'مهدی کریمیان',
      unit: 'واحد خدمات و تحویل',
      type: 'reprint',
      typeTitle: '۲. چاپ مجدد',
      status: 'printed',
      orgId: 5, // مشتاق بهنمیر
      notes: 'شکستگی نوار مغناطیسی'
    },
    {
      employee: 'فاطمه احمدی',
      unit: 'واحد پشتیبانی فروشگاه',
      type: 'first_time',
      typeTitle: '۱. دفعه اول',
      status: 'delivered',
      orgId: 6, // مشتاق نکا
      notes: 'کارت پرسنلی تحویل متقاضی گردید'
    },
    {
      employee: 'حسین باقریان',
      unit: 'واحد صندوق و سفارشات',
      type: 'first_time',
      typeTitle: '۱. دفعه اول',
      status: 'unread',
      orgId: 7, // مشتاق ساری
      notes: 'نیروی جدیدالورود'
    },
    {
      employee: 'رضا جلالی',
      unit: 'واحد حراست و انتظامات',
      type: 'correction',
      typeTitle: '۳. اصلاح',
      status: 'delivered',
      orgId: 8, // فروشگاه آرین
      notes: 'تغییر شیفت و تایید سمت حراست'
    }
  ];

  // Check if we need to refresh requests
  const existingCount = db.prepare('SELECT COUNT(*) as c FROM requests').get().c;
  if (existingCount === 0 || db.prepare('SELECT organization_id FROM requests LIMIT 1').get()?.organization_id > 8) {
    db.exec(`DELETE FROM requests;`);
    const insert = db.prepare(`
      INSERT INTO requests (
        tracking_code, employee_name, unit_name, request_type,
        status, image_path, image_original_name, notes, user_id, organization_id,
        created_at, viewed_at, printed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), ?, ?)
    `);

    sampleRequests.forEach((s, idx) => {
      const branch = branches.find(b => b.id === s.orgId);
      const user = db.prepare("SELECT id FROM users WHERE username = ?").get(branch.officerUser);
      const userId = user ? user.id : 2;

      const code = `CR-140508-${1000 + idx}`;
      const filename = `sample-card-${idx + 1}.svg`;
      const filePath = path.join(uploadsDir, filename);

      const svg = createSvgFormImage(s.employee, branch.name, s.unit, code, s.typeTitle);
      fs.writeFileSync(filePath, svg, 'utf-8');

      const offsetMinutes = `-${(idx + 1) * 35} minutes`;
      const viewedAt = s.status !== 'unread' ? new Date().toISOString() : null;
      const printedAt = s.status === 'printed' || s.status === 'delivered' ? new Date().toISOString() : null;

      insert.run(
        code,
        s.employee,
        s.unit,
        s.type,
        s.status,
        `/uploads/${filename}`,
        `form_${s.employee.replace(/\s+/g, '_')}.svg`,
        s.notes,
        userId,
        s.orgId,
        offsetMinutes,
        viewedAt,
        printedAt
      );
    });

    console.log('Seeded realistic sample requests for the 8 real branches!');
  }
}

module.exports = { seedSampleRequests };
