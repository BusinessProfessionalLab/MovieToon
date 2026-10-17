const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toFa(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

export function toFaDecimal(n: number, digits = 1): string {
  const fixed = n.toFixed(digits);
  const latin = fixed.replace('.', '٫');
  return toFa(latin);
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return toFa((n / 1_000_000).toFixed(1).replace('.', '٫')) + ' میلیون';
  if (n >= 1_000) return toFa(Math.round(n / 1_000)) + ' هزار';
  return toFa(n);
}

export function formatDuration(min: number | null): string {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${toFa(m)} دقیقه`;
  if (m === 0) return `${toFa(h)} ساعت`;
  return `${toFa(h)} ساعت و ${toFa(m)} دقیقه`;
}

export function formatPrice(n: number): string {
  const grouped = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return toFa(grouped) + ' تومان';
}

/** Approximate Gregorian -> Jalali year conversion (March-based). Good enough for mock display. */
export function gregorianToJalaliYear(gy: number, month = 7): number {
  return month >= 3 ? gy - 621 : gy - 622;
}

const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

/** Formats an ISO date string as a Jalali-ish date. Deterministic mock: maps month/day cyclically. */
export function formatJalaliDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return iso;
  const gy = d.getUTCFullYear();
  const gm = d.getUTCMonth() + 1;
  const gd = d.getUTCDate();
  const jy = gregorianToJalaliYear(gy, gm);
  const jm = ((gm + 5) % 12) + 1;
  const jd = ((gd + 9) % 29) + 1;
  return `${toFa(jd)} ${JALALI_MONTHS[jm - 1]} ${toFa(jy)}`;
}

export function jalaliYearOf(iso: string): number {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return 1403;
  return gregorianToJalaliYear(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

export function slugifyFa(text: string): string {
  return text
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[؟?!.،,؛:()«»"']/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function timeAgoFa(iso: string, now = new Date()): string {
  const then = new Date(iso + 'T00:00:00Z').getTime();
  const diff = Math.max(0, now.getTime() - then);
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return 'امروز';
  if (days === 1) return 'دیروز';
  if (days < 30) return `${toFa(days)} روز پیش`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${toFa(months)} ماه پیش`;
  return `${toFa(Math.floor(months / 12))} سال پیش`;
}
