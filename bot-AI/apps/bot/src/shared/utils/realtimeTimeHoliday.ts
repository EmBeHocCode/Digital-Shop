/**
 * Realtime time + holiday context (Vietnam timezone).
 * Injected per message so AI does not depend on stale session-level prompt time.
 */

export interface HolidayInfo {
  month: number;
  day: number;
  name: string;
  aliases: string[];
  note?: string;
}

const VI_TIMEZONE = 'Asia/Ho_Chi_Minh';

const FIXED_HOLIDAYS: HolidayInfo[] = [
  { month: 1, day: 1, name: 'Tết Dương lịch', aliases: ['tết dương lịch', 'new year', 'năm mới dương lịch'] },
  { month: 2, day: 14, name: 'Valentine', aliases: ['valentine', 'lễ tình nhân'] },
  { month: 3, day: 8, name: 'Quốc tế Phụ nữ', aliases: ['8/3', 'quốc tế phụ nữ'] },
  { month: 4, day: 30, name: 'Ngày Giải phóng miền Nam', aliases: ['30/4', 'giải phóng miền nam'] },
  { month: 5, day: 1, name: 'Quốc tế Lao động', aliases: ['1/5', 'quốc tế lao động'] },
  { month: 6, day: 1, name: 'Quốc tế Thiếu nhi', aliases: ['1/6', 'quốc tế thiếu nhi', 'thiếu nhi'] },
  { month: 10, day: 20, name: 'Ngày Phụ nữ Việt Nam', aliases: ['20/10', 'phụ nữ việt nam'] },
  { month: 11, day: 20, name: 'Ngày Nhà giáo Việt Nam', aliases: ['20/11', 'nhà giáo việt nam', 'nhà giáo'] },
  { month: 12, day: 24, name: 'Đêm Giáng sinh', aliases: ['24/12', 'noel', 'giáng sinh'] },
  { month: 12, day: 25, name: 'Lễ Giáng sinh', aliases: ['25/12', 'christmas', 'giáng sinh'] },
  { month: 9, day: 2, name: 'Quốc khánh Việt Nam', aliases: ['2/9', 'quốc khánh'] },
];

const MOVABLE_OR_LUNAR_HINTS = [
  'Tết Nguyên đán',
  'Giỗ Tổ Hùng Vương',
  'Trung thu',
];

function toVnDate(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: VI_TIMEZONE }));
}

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatTime(date: Date): string {
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function dayName(date: Date): string {
  const names = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return names[date.getDay()] || 'Không rõ';
}

function detectHolidayQuery(userText: string): boolean {
  if (!userText) return false;
  return /(ngày lễ|lễ gì|holiday|quốc khánh|noel|giáng sinh|tết|valentine|20\/11|20\/10|30\/4|1\/5|2\/9|8\/3|1\/6)/iu.test(
    userText,
  );
}

function parseDateHints(userText: string): Array<{ day: number; month: number }> {
  const matches = [...userText.matchAll(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/gu)];
  const out: Array<{ day: number; month: number }> = [];
  for (const m of matches) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (Number.isFinite(day) && Number.isFinite(month) && day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      out.push({ day, month });
    }
  }
  return out;
}

function holidayByDate(day: number, month: number): HolidayInfo | undefined {
  return FIXED_HOLIDAYS.find((h) => h.day === day && h.month === month);
}

function holidayByName(userText: string): HolidayInfo | undefined {
  const q = userText.toLowerCase();
  return FIXED_HOLIDAYS.find((h) => h.aliases.some((alias) => q.includes(alias.toLowerCase())));
}

function nextUpcomingHolidays(fromVn: Date, limit = 3): Array<{ holiday: HolidayInfo; date: Date; diffDays: number }> {
  const nowTs = fromVn.getTime();
  const candidates: Array<{ holiday: HolidayInfo; date: Date; diffDays: number }> = [];

  for (const holiday of FIXED_HOLIDAYS) {
    for (const yearOffset of [0, 1]) {
      const y = fromVn.getFullYear() + yearOffset;
      const target = new Date(y, holiday.month - 1, holiday.day, 0, 0, 0, 0);
      const diffMs = target.getTime() - nowTs;
      const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      if (diffDays >= 0) {
        candidates.push({ holiday, date: target, diffDays });
        break;
      }
    }
  }

  return candidates.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, limit);
}

export function buildRealtimeTimeHolidayContext(userText = '', referenceDate?: Date): string {
  const nowUtc = referenceDate ? new Date(referenceDate) : new Date();
  const nowVn = toVnDate(nowUtc);
  const isHolidayQuestion = detectHolidayQuery(userText);
  const todayHoliday = holidayByDate(nowVn.getDate(), nowVn.getMonth() + 1);
  const nextHolidays = nextUpcomingHolidays(nowVn, isHolidayQuestion ? 5 : 2);

  const lines: string[] = [];
  lines.push('[REALTIME TIME CONTEXT]');
  lines.push(`- Timezone: ${VI_TIMEZONE} (UTC+7)`);
  lines.push(`- Hôm nay: ${dayName(nowVn)}, ${formatDate(nowVn)}`);
  lines.push(`- Giờ hiện tại: ${formatTime(nowVn)}`);
  lines.push(`- Unix timestamp (ms): ${nowUtc.getTime()}`);

  if (todayHoliday) {
    lines.push(`- Hôm nay là ngày lễ: ${todayHoliday.name} (${todayHoliday.day}/${todayHoliday.month})`);
  } else {
    lines.push('- Hôm nay không trùng ngày lễ cố định trong danh sách nội bộ.');
  }

  if (nextHolidays.length) {
    const upcoming = nextHolidays
      .map((x) => `${x.holiday.name} (${x.holiday.day}/${x.holiday.month}, còn ${x.diffDays} ngày)`)
      .join('; ');
    lines.push(`- Ngày lễ cố định sắp tới: ${upcoming}`);
  }

  if (isHolidayQuestion) {
    const byName = holidayByName(userText);
    const byDateHint = parseDateHints(userText).map((x) => holidayByDate(x.day, x.month)).find(Boolean);
    const matched = byName || byDateHint;
    if (matched) {
      lines.push(`- Truy vấn khớp ngày lễ: ${matched.name} (${matched.day}/${matched.month}).`);
    } else {
      lines.push(
        `- Nếu user hỏi lễ di động/lunar (${MOVABLE_OR_LUNAR_HINTS.join(', ')}), hãy chủ động dùng Google Search để trả ngày dương lịch chính xác theo năm.`,
      );
    }
  }

  lines.push('- Khi user hỏi "bây giờ mấy giờ/ngày gì" hãy trả theo mốc realtime ở trên, không suy diễn theo memory cũ.');
  return lines.join('\n');
}
