import solarLunar from 'solarlunar';

// Her birthday: lunar month 7, day 21
const LUNAR_MONTH = 7;
const LUNAR_DAY = 21;
const TIME_ZONE = 'Asia/Shanghai';

export type BirthdayStatus =
  | { type: 'birthday'; today: string }
  | { type: 'countdown'; today: string; target: string; daysUntil: number };

/** Current date (YYYY-MM-DD) in China timezone, independent of server locale. */
function todayInChina(now: Date): string {
  // 'en-CA' locale yields YYYY-MM-DD
  return now.toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
}

/** Date-only string to UTC-epoch-day, avoiding timezone drift. */
function epochDay(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Resolve lunar month/day 7-21 for a given year to its solar date string. */
export function lunarBirthdaySolarDate(year: number): string {
  const r = solarLunar.lunar2solar(year, LUNAR_MONTH, LUNAR_DAY, false);
  return `${r.cYear}-${pad(r.cMonth)}-${pad(r.cDay)}`;
}

/**
 * Determine today's birthday state. The 7-21 lunar date always falls in the
 * same solar year (August–September), so this year's match is checked first.
 */
export function getBirthdayStatus(now: Date = new Date()): BirthdayStatus {
  const today = todayInChina(now);
  const year = Number(today.slice(0, 4));

  const thisYearTarget = lunarBirthdaySolarDate(year);
  if (thisYearTarget === today) {
    return { type: 'birthday', today };
  }

  let daysUntil = epochDay(thisYearTarget) - epochDay(today);
  let target = thisYearTarget;
  if (daysUntil < 0) {
    // Birthday already passed this year — count down to next year.
    target = lunarBirthdaySolarDate(year + 1);
    daysUntil = epochDay(target) - epochDay(today);
  }

  return { type: 'countdown', today, target, daysUntil };
}
