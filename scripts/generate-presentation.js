const pptxgen = require('pptxgenjs');
const path = require('path');

async function createPresentation() {
  const pres = new pptxgen();

  pres.layout = 'LAYOUT_16x9';
  pres.rtl = true;

  const THEME = {
    bg: '0B1844',
    cardBg: '12204F',
    accentBlue: '3B82F6',
    accentPurple: '8B5CF6',
    accentGreen: '10B981',
    accentOrange: 'F59E0B',
    accentTeal: '14B8A6',
    textWhite: 'FFFFFF',
    textMuted: '94A3B8',
    fontFace: 'Tahoma'
  };

  // Helper: Slide Master Header
  function addHeader(slide, title, subtitle) {
    slide.background = { color: THEME.bg };
    
    // Header title
    slide.addText(title, {
      x: 0.8,
      y: 0.5,
      w: 11.7,
      h: 0.6,
      fontSize: 22,
      bold: true,
      color: THEME.textWhite,
      fontFace: THEME.fontFace,
      align: 'right'
    });

    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8,
        y: 1.1,
        w: 11.7,
        h: 0.4,
        fontSize: 13,
        color: THEME.accentBlue,
        fontFace: THEME.fontFace,
        align: 'right'
      });
    }

    // Top accent bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 0.1,
      fill: { color: THEME.accentPurple }
    });

    // Footer
    slide.addText('مدیریت کارت پرسنلی / یزدان مطهر قائم وسطی', {
      x: 0.8,
      y: 7.0,
      w: 8.0,
      h: 0.3,
      fontSize: 10,
      color: THEME.textMuted,
      fontFace: THEME.fontFace,
      align: 'right'
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 1: Title Slide
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    slide.background = { color: THEME.bg };

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 0.15,
      fill: { color: THEME.accentBlue }
    });

    slide.addText('طرح تحول و مکانیزاسیون فرآیند صدور کارت', {
      x: 1.0,
      y: 2.2,
      w: 11.33,
      h: 0.5,
      fontSize: 18,
      color: THEME.accentBlue,
      fontFace: THEME.fontFace,
      align: 'center',
      bold: true
    });

    slide.addText('سامانه مدیریت کارت پرسنلی', {
      x: 1.0,
      y: 2.8,
      w: 11.33,
      h: 0.9,
      fontSize: 34,
      color: THEME.textWhite,
      fontFace: THEME.fontFace,
      align: 'center',
      bold: true
    });

    slide.addText('یزدان مطهر قائم وسطی', {
      x: 1.0,
      y: 3.7,
      w: 11.33,
      h: 0.7,
      fontSize: 26,
      color: THEME.accentPurple,
      fontFace: THEME.fontFace,
      align: 'center',
      bold: true
    });

    slide.addText('دریافت متمرکز مدارک از مسئولان ۸ مجموعه | چرخه ۶ مرحله‌ای | پیام‌رسانی داخلی', {
      x: 1.0,
      y: 4.8,
      w: 11.33,
      h: 0.5,
      fontSize: 14,
      color: THEME.textMuted,
      fontFace: THEME.fontFace,
      align: 'center'
    });

    slide.addText('ساخته شده توسط', {
      x: 1.0,
      y: 5.5,
      w: 11.33,
      h: 0.3,
      fontSize: 11,
      color: THEME.textMuted,
      fontFace: THEME.fontFace,
      align: 'center'
    });

    slide.addImage({
      path: path.join(__dirname, '..', 'public', 'images', 'creator-logo.png'),
      x: 4.9,
      y: 5.9,
      w: 3.5,
      h: 0.71
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 2: Problem & Challenges
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'چالش‌های وضع موجود و ضرورت ایجاد سامانه', 'مشکلات سیستم سنتی و پیام‌رسان‌ها');

    const cards = [
      {
        title: 'ارسال پراکنده در پیام‌رسان‌ها',
        desc: 'ارسال عکس فرم‌ها توسط مسئولان ۸ مجموعه در پیام‌رسان‌های مختلف که باعث گم شدن فایل‌ها و سردرگمی می‌شد.'
      },
      {
        title: 'عدم ثبت زمان و تاریخ دقیق',
        desc: 'مشخص نبود هر فرم در چه روز و چه ساعتی ارسال شده و پیگیری تاخیرها غیرممکن بود.'
      },
      {
        title: 'نامشخص بودن وضعیت درخواست‌ها',
        desc: 'پرسنل و مسئولان نمی‌دانستند کارت در چه مرحله‌ای است (دیده شده، ارسال به چاپخانه یا تحویل).'
      },
      {
        title: 'تصاویر نامنظم و مخدوش',
        desc: 'تصاویر کج، افقی یا ناخوانا بدون امکان چرخش و زوم در کامپیوتر باعث خطا در چاپ می‌شد.'
      }
    ];

    cards.forEach((c, idx) => {
      const xPos = 0.8 + (idx % 2) * 5.9;
      const yPos = 1.8 + Math.floor(idx / 2) * 2.3;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: xPos,
        y: yPos,
        w: 5.6,
        h: 2.0,
        fill: { color: THEME.cardBg },
        line: { color: '334155', width: 1 }
      });

      slide.addText(c.title, {
        x: xPos + 0.3,
        y: yPos + 0.25,
        w: 5.0,
        h: 0.4,
        fontSize: 15,
        bold: true,
        color: 'EF4444',
        fontFace: THEME.fontFace,
        align: 'right'
      });

      slide.addText(c.desc, {
        x: xPos + 0.3,
        y: yPos + 0.7,
        w: 5.0,
        h: 1.1,
        fontSize: 12,
        color: THEME.textMuted,
        fontFace: THEME.fontFace,
        align: 'right'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 3: Organizational Hierarchy (8 Branches & Coordinators)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'معماری ساختار سازمانی و تفکیک دسترسی‌ها', 'پوشش کامل ۸ مجموعه و مسئولان مربوطه');

    const branches = [
      { num: '۱', name: 'هایپر آرین', officer: 'خانم رسولی', user: 'officer1 / rasouli', password: 'رمز: 841203', color: THEME.accentBlue },
      { num: '۲', name: 'هایپر قدمت', officer: 'خانم رضوی', user: 'officer2 / razavi', password: 'رمز: 729514', color: THEME.accentPurple },
      { num: '۳', name: 'مشتاق قائمشهر', officer: 'خانم صباغی', user: 'officer3 / sabbaghi_gh', password: 'رمز: 638195', color: THEME.accentOrange },
      { num: '۴', name: 'مشتاق آمل', officer: 'خانم مهدی پور', user: 'officer4 / mehdipour', password: 'رمز: 519482', color: THEME.accentGreen },
      { num: '۵', name: 'مشتاق بهنمیر', officer: 'خانم باباجان زاده', user: 'officer5 / babajanzadeh', password: 'رمز: 926371', color: '06B6D4' },
      { num: '۶', name: 'مشتاق نکا', officer: 'خانم صادقی', user: 'officer6 / sadeghi', password: 'رمز: 384729', color: 'F43F5E' },
      { num: '۷', name: 'مشتاق ساری', officer: 'خانم صباغی', user: 'officer7 / sabbaghi_sa', password: 'رمز: 471938', color: '6366F1' },
      { num: '۸', name: 'فروشگاه آرین', officer: 'خانم صباغی', user: 'officer8 / sabbaghi_ar', password: 'رمز: 652814', color: '14B8A6' }
    ];

    branches.forEach((b, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const xPos = 0.85 + col * 2.95;
      const yPos = 1.8 + row * 2.3;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: xPos,
        y: yPos,
        w: 2.75,
        h: 2.1,
        fill: { color: THEME.cardBg },
        line: { color: b.color, width: 1.5 }
      });

      slide.addText(`${b.num}. ${b.name}`, {
        x: xPos + 0.15,
        y: yPos + 0.2,
        w: 2.45,
        h: 0.5,
        fontSize: 14,
        bold: true,
        color: THEME.textWhite,
        fontFace: THEME.fontFace,
        align: 'right'
      });

      slide.addText(`مسئول: ${b.officer}`, {
        x: xPos + 0.15,
        y: yPos + 0.75,
        w: 2.45,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: b.color,
        fontFace: THEME.fontFace,
        align: 'right'
      });

      slide.addText(`کاربر: ${b.user}`, {
        x: xPos + 0.15,
        y: yPos + 1.25,
        w: 2.45,
        h: 0.35,
        fontSize: 9.5,
        color: THEME.textMuted,
        fontFace: THEME.fontFace,
        align: 'right'
      });

      slide.addText(b.password, {
        x: xPos + 0.15,
        y: yPos + 1.6,
        w: 2.45,
        h: 0.35,
        fontSize: 10,
        bold: true,
        color: '34D399',
        fontFace: THEME.fontFace,
        align: 'right'
      });
    });

    slide.addText('🔒 تفکیک کامل دسترسی: هر مسئول فقط به درخواست‌ها و پیام‌های مجموعه خود دسترسی دارد؛ مدیریت کل بر تمام ۸ مجموعه اشراف و نظارت دارد.', {
      x: 0.85,
      y: 6.5,
      w: 11.63,
      h: 0.4,
      fontSize: 11,
      color: THEME.textMuted,
      fontFace: THEME.fontFace,
      align: 'center'
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 4: 6-Stage Workflow
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'چرخه هوشمند ۶ مرحله‌ای صدور کارت پرسنلی', 'رهگیری لحظه‌ای و شفاف از ثبت تا تحویل');

    const stages = [
      { num: '۱', name: 'دیده نشده', desc: 'ثبت اولیه توسط مسئول', color: 'F59E0B' },
      { num: '۲', name: 'دیده شده', desc: 'بررسی مدارک توسط مدیر', color: '38BDF8' },
      { num: '۳', name: 'آماده‌سازی فایل', desc: 'روتوش عکس و طراحی', color: 'A855F7' },
      { num: '۴', name: 'ارسال به لابراتوار', desc: 'تحویل به چاپخانه', color: 'FB923C' },
      { num: '۵', name: 'چاپ شده', desc: 'آماده‌سازی فیزیکی کارت', color: '10B981' },
      { num: '۶', name: 'تحویل داده شده', desc: 'تحویل نهایی به پرسنل', color: '14B8A6' }
    ];

    stages.forEach((st, idx) => {
      const xPos = 0.6 + idx * 2.05;
      const yPos = 2.4;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: xPos,
        y: yPos,
        w: 1.9,
        h: 3.6,
        fill: { color: THEME.cardBg },
        line: { color: st.color, width: 2 }
      });

      slide.addShape(pres.shapes.OVAL, {
        x: xPos + 0.55,
        y: yPos + 0.3,
        w: 0.8,
        h: 0.8,
        fill: { color: st.color }
      });

      slide.addText(st.num, {
        x: xPos + 0.55,
        y: yPos + 0.35,
        w: 0.8,
        h: 0.7,
        fontSize: 16,
        bold: true,
        color: THEME.textWhite,
        fontFace: THEME.fontFace,
        align: 'center'
      });

      slide.addText(st.name, {
        x: xPos + 0.1,
        y: yPos + 1.4,
        w: 1.7,
        h: 0.7,
        fontSize: 13,
        bold: true,
        color: THEME.textWhite,
        fontFace: THEME.fontFace,
        align: 'center'
      });

      slide.addText(st.desc, {
        x: xPos + 0.1,
        y: yPos + 2.3,
        w: 1.7,
        h: 1.0,
        fontSize: 11,
        color: THEME.textMuted,
        fontFace: THEME.fontFace,
        align: 'center'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 5: Key Features (Date/Time, Messaging, Image Viewer)
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'امکانات شاخص و وجه تمایز سامانه', 'نوآوری‌های فنی جهت سهولت کاربری');

    const features = [
      {
        title: 'ثبت دقیق تاریخ شمسی و ساعت ارسال',
        desc: 'ثبت خودکار ساعت و تاریخ ارسال فرم‌ها (مانند ۱۴۰۵/۰۸/۲۰ ساعت ۱۴:۳۵) برای جلوگیری از ادعای تاخیر.'
      },
      {
        title: 'سیستم پیام‌رسانی و تیکتینگ داخلی',
        desc: 'امکان گفتگوی دوطرفه میان هر یک از مسئولان ۸ مجموعه با مدیر کل جهت رفع نقص یا اولویت‌بندی، بدون نیاز به واتساپ.'
      },
      {
        title: 'نمایشگر پیشرفته با زوم و چرخش ۹۰ درجه',
        desc: 'حل مشکل عکس‌های گوشی که افقی یا برعکس گرفته شده‌اند؛ چرخش آنی و بزرگ‌نمایی تصویر جهت خواندن متون ریز.'
      },
      {
        title: 'خروجی اکسل استاندارد و عملیات دسته‌جمعی',
        desc: 'امکان تغییر وضعیت گروهی چندین فرم به «چاپ شده» و دریافت فایل اکسل UTF-8 با یک کلیک.'
      }
    ];

    features.forEach((f, idx) => {
      const xPos = 0.8 + (idx % 2) * 5.9;
      const yPos = 1.8 + Math.floor(idx / 2) * 2.3;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: xPos,
        y: yPos,
        w: 5.6,
        h: 2.0,
        fill: { color: THEME.cardBg },
        line: { color: THEME.accentBlue, width: 1 }
      });

      slide.addText(f.title, {
        x: xPos + 0.3,
        y: yPos + 0.25,
        w: 5.0,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: THEME.accentGreen,
        fontFace: THEME.fontFace,
        align: 'right'
      });

      slide.addText(f.desc, {
        x: xPos + 0.3,
        y: yPos + 0.7,
        w: 5.0,
        h: 1.1,
        fontSize: 12,
        color: THEME.textMuted,
        fontFace: THEME.fontFace,
        align: 'right'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 6: Organizational Benefits & ROI
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'دستاوردها و ارزش افزوده سازمانی', 'نتایج حاصل از استقرار سامانه');

    const benefits = [
      { metric: '۱۰۰٪', title: 'حذف گم شدن نامه‌ها', desc: 'بایگانی متمرکز ابری با کد رهگیری اختصاصی' },
      { metric: '۶۰٪', title: 'کاهش زمان انتظار صدور', desc: 'سرعت در آماده‌سازی و ارسال به لابراتوار' },
      { metric: '۰ خطا', title: 'دقت در مشخصات پرسنل', desc: 'جلوگیری از اشتباه تایپی سمت یا نام پرسنل' },
      { metric: 'شفاف', title: 'گزارش‌گیری لحظه‌ای مدیریت', desc: 'آمار دقیق تفکیک شده بر اساس ۸ مجموعه' }
    ];

    benefits.forEach((b, idx) => {
      const xPos = 0.8 + idx * 2.95;
      const yPos = 2.2;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: xPos,
        y: yPos,
        w: 2.75,
        h: 3.8,
        fill: { color: THEME.cardBg },
        line: { color: THEME.accentPurple, width: 1.5 }
      });

      slide.addText(b.metric, {
        x: xPos + 0.1,
        y: yPos + 0.4,
        w: 2.55,
        h: 0.8,
        fontSize: 32,
        bold: true,
        color: THEME.accentGreen,
        fontFace: THEME.fontFace,
        align: 'center'
      });

      slide.addText(b.title, {
        x: xPos + 0.1,
        y: yPos + 1.4,
        w: 2.55,
        h: 0.6,
        fontSize: 14,
        bold: true,
        color: THEME.textWhite,
        fontFace: THEME.fontFace,
        align: 'center'
      });

      slide.addText(b.desc, {
        x: xPos + 0.2,
        y: yPos + 2.2,
        w: 2.35,
        h: 1.2,
        fontSize: 11,
        color: THEME.textMuted,
        fontFace: THEME.fontFace,
        align: 'center'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 7: Summary & Live Demo
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'آماده‌سازی جهت بهره‌برداری و دمو زنده', 'یزدان مطهر قائم وسطی');

    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 1.5,
      y: 2.0,
      w: 10.33,
      h: 4.2,
      fill: { color: THEME.cardBg },
      line: { color: THEME.accentBlue, width: 2 }
    });

    slide.addText('سامانه به صورت کامل پیاده‌سازی و آماده تست در جلسه می‌باشد', {
      x: 2.0,
      y: 2.4,
      w: 9.33,
      h: 0.6,
      fontSize: 18,
      bold: true,
      color: THEME.textWhite,
      fontFace: THEME.fontFace,
      align: 'center'
    });

    slide.addText('ورود به پنل آنلاین (همین سیستم): http://localhost:3000\nدسترسی شبکه وای‌فای (گوشی و سایر سیستم‌ها): http://192.168.8.113:3000\n\nحساب مدیر ارشد: admin | رمز: 951753 (یا admin123)\nحساب مسئولان ۸ مجموعه: رمز عبور ۶ رقمی مجزا و اختصاصی برای هر شعبه', {
      x: 2.0,
      y: 3.1,
      w: 9.33,
      h: 1.8,
      fontSize: 13.5,
      color: THEME.accentBlue,
      fontFace: THEME.fontFace,
      align: 'center'
    });

    slide.addText('با سپاس از توجه مدیران و اعضای محترم جلسه', {
      x: 2.0,
      y: 5.1,
      w: 9.33,
      h: 0.5,
      fontSize: 15,
      color: THEME.accentPurple,
      fontFace: THEME.fontFace,
      align: 'center',
      bold: true
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE 8: Complete Credentials & Passwords
  // ---------------------------------------------------------------------------
  {
    const slide = pres.addSlide();
    addHeader(slide, 'جدول جامع مشخصات ورود و رمزهای عبور کاربران', 'تفکیک دسترسی مدیر ارشد و مسئولان ۸ مجموعه');

    // Admin Card
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.85,
      y: 1.8,
      w: 11.63,
      h: 1.1,
      fill: { color: THEME.cardBg },
      line: { color: THEME.accentPurple, width: 2 }
    });

    slide.addText('👑 مدیر کل ارشد سامانه: مدیریت کارت پرسنلی / یزدان مطهر قائم وسطی', {
      x: 1.0,
      y: 1.9,
      w: 6.5,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: THEME.textWhite,
      fontFace: THEME.fontFace,
      align: 'right'
    });

    slide.addText('نام کاربری: admin', {
      x: 7.7,
      y: 1.9,
      w: 2.2,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: THEME.accentPurple,
      fontFace: THEME.fontFace,
      align: 'right'
    });

    slide.addText('رمز عبور: 951753', {
      x: 10.0,
      y: 1.9,
      w: 2.3,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: '34D399',
      fontFace: THEME.fontFace,
      align: 'right'
    });

    slide.addText('دسترسی شبکه وای‌فای: http://192.168.8.113:3000 | اشراف کامل بر تمام ۸ مجموعه', {
      x: 1.0,
      y: 2.4,
      w: 11.3,
      h: 0.35,
      fontSize: 10.5,
      color: THEME.textMuted,
      fontFace: THEME.fontFace,
      align: 'right'
    });

    // 8 Branches Grid
    const branches = [
      { num: '۱', name: 'هایپر آرین', officer: 'خانم رسولی', user: 'officer1', pass: '841203', color: THEME.accentBlue },
      { num: '۲', name: 'هایپر قدمت', officer: 'خانم رضوی', user: 'officer2', pass: '729514', color: THEME.accentPurple },
      { num: '۳', name: 'مشتاق قائمشهر', officer: 'خانم صباغی', user: 'officer3', pass: '638195', color: THEME.accentOrange },
      { num: '۴', name: 'مشتاق آمل', officer: 'خانم مهدی پور', user: 'officer4', pass: '519482', color: THEME.accentGreen },
      { num: '۵', name: 'مشتاق بهنمیر', officer: 'خانم باباجان زاده', user: 'officer5', pass: '926371', color: '06B6D4' },
      { num: '۶', name: 'مشتاق نکا', officer: 'خانم صادقی', user: 'officer6', pass: '384729', color: 'F43F5E' },
      { num: '۷', name: 'مشتاق ساری', officer: 'خانم صباغی', user: 'officer7', pass: '471938', color: '6366F1' },
      { num: '۸', name: 'فروشگاه آرین', officer: 'خانم صباغی', user: 'officer8', pass: '652814', color: '14B8A6' }
    ];

    branches.forEach((b, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const xPos = 0.85 + col * 2.95;
      const yPos = 3.1 + row * 1.8;

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: xPos,
        y: yPos,
        w: 2.75,
        h: 1.6,
        fill: { color: THEME.cardBg },
        line: { color: b.color, width: 1.5 }
      });

      slide.addText(`${b.num}. ${b.name}`, {
        x: xPos + 0.15,
        y: yPos + 0.15,
        w: 2.45,
        h: 0.35,
        fontSize: 13,
        bold: true,
        color: THEME.textWhite,
        fontFace: THEME.fontFace,
        align: 'right'
      });

      slide.addText(`مسئول: ${b.officer}`, {
        x: xPos + 0.15,
        y: yPos + 0.55,
        w: 2.45,
        h: 0.3,
        fontSize: 11,
        color: b.color,
        fontFace: THEME.fontFace,
        align: 'right'
      });

      slide.addText(`کاربر: ${b.user} | رمز: ${b.pass}`, {
        x: xPos + 0.15,
        y: yPos + 0.95,
        w: 2.45,
        h: 0.35,
        fontSize: 10,
        bold: true,
        color: '34D399',
        fontFace: THEME.fontFace,
        align: 'right'
      });
    });

    slide.addText('ورود با نام خانوادگی مسئولان نیز امکان‌پذیر است | پشتیبانی کامل بر بستر شبکه Wi-Fi', {
      x: 0.85,
      y: 6.8,
      w: 11.63,
      h: 0.35,
      fontSize: 10,
      color: THEME.textMuted,
      fontFace: THEME.fontFace,
      align: 'center'
    });
  }

  const outputPath = path.join(__dirname, '..', 'public', 'downloads', 'yazdan_motahar_presentation.pptx');
  await pres.writeFile({ fileName: outputPath });
  console.log('PowerPoint generated successfully at:', outputPath);
}

createPresentation().catch(err => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
