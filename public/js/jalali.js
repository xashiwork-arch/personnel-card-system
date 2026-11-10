// Lightweight Gregorian to Jalali (Shamsi) Date Converter & Formatter
const JalaliDate = (() => {
  const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  function toPersianDigits(n) {
    if (n === null || n === undefined) return '';
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(n).replace(/[0-9]/g, (w) => farsiDigits[+w]);
  }

  function gregorianToJalali(gy, gm, gd) {
    let g_day_no = 365 * (gy - 1600) + Math.floor((gy - 1599) / 4) - Math.floor((gy - 1501) / 100) + Math.floor((gy - 1201) / 400);
    for (let i = 0; i < gm; ++i) g_day_no += g_days_in_month[i];
    if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) ++g_day_no;
    g_day_no += gd - 1;

    let j_day_no = g_day_no - 79;
    const j_np = Math.floor(j_day_no / 12053);
    j_day_no %= 12053;

    let jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
    j_day_no %= 1461;

    if (j_day_no >= 366) {
      jy += Math.floor((j_day_no - 1) / 365);
      j_day_no = (j_day_no - 1) % 365;
    }

    let jm = 0;
    for (let i = 0; i < 11 && j_day_no >= j_days_in_month[i]; ++i) {
      j_day_no -= j_days_in_month[i];
      jm = i + 1;
    }
    const jd = j_day_no + 1;

    return { jy, jm: jm + 1, jd };
  }

  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  function format(dateInput) {
    if (!dateInput) return '-';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';

    const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth(), d.getDate());
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${toPersianDigits(jd)} ${monthNames[jm - 1]} ${toPersianDigits(jy)} - ساعت ${toPersianDigits(hours)}:${toPersianDigits(minutes)}`;
  }

  function formatShort(dateInput) {
    if (!dateInput) return '-';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';

    const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth(), d.getDate());
    const mStr = String(jm).padStart(2, '0');
    const dStr = String(jd).padStart(2, '0');
    return `${toPersianDigits(jy)}/${toPersianDigits(mStr)}/${toPersianDigits(dStr)}`;
  }

  function formatTime(dateInput) {
    if (!dateInput) return '-';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${toPersianDigits(hours)}:${toPersianDigits(minutes)}`;
  }

  function formatDateTimeBadges(dateInput) {
    if (!dateInput) return '-';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';

    const dateStr = formatShort(dateInput);
    const timeStr = formatTime(dateInput);

    return `
      <div class="flex flex-col gap-0.5">
        <span class="font-bold text-slate-200 flex items-center gap-1">
          <svg class="w-3.5 h-3.5 text-blue-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          ${dateStr}
        </span>
        <span class="text-[11px] text-sky-400 font-mono font-medium flex items-center gap-1">
          <svg class="w-3 h-3 text-sky-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          ساعت ${timeStr}
        </span>
      </div>
    `;
  }

  function timeAgo(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    const diffMs = Date.now() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 2) return 'همین الان';
    if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`;
    if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت پیش`;
    if (diffDays === 1) return 'دیروز';
    if (diffDays < 30) return `${toPersianDigits(diffDays)} روز پیش`;
    return formatShort(dateInput);
  }

  return { format, formatShort, formatTime, formatDateTimeBadges, timeAgo, toPersianDigits };
})();

window.JalaliDate = JalaliDate;
