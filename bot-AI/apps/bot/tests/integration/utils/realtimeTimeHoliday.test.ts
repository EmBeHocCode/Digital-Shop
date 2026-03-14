import { describe, expect, it } from 'bun:test';
import { buildRealtimeTimeHolidayContext } from '../../../src/shared/utils/realtimeTimeHoliday.js';

describe('realtimeTimeHoliday', () => {
  it('should include realtime timezone/time fields', () => {
    const fixed = new Date('2026-03-06T10:15:20.000Z');
    const ctx = buildRealtimeTimeHolidayContext('', fixed);

    expect(ctx).toContain('[REALTIME TIME CONTEXT]');
    expect(ctx).toContain('Asia/Ho_Chi_Minh');
    expect(ctx).toContain('Unix timestamp (ms)');
  });

  it('should detect fixed holiday for matching date', () => {
    const fixed = new Date('2026-09-02T01:00:00.000Z'); // 08:00 02/09 VN
    const ctx = buildRealtimeTimeHolidayContext('hôm nay có lễ gì', fixed);

    expect(ctx).toContain('Quốc khánh Việt Nam');
    expect(ctx).toContain('2/9');
  });

  it('should match holiday query by date hint', () => {
    const fixed = new Date('2026-07-01T00:00:00.000Z');
    const ctx = buildRealtimeTimeHolidayContext('ngày 20/11 là lễ gì vậy', fixed);

    expect(ctx).toContain('Ngày Nhà giáo Việt Nam');
    expect(ctx).toContain('20/11');
  });

  it('should suggest search for lunar/movable holiday queries', () => {
    const fixed = new Date('2026-07-01T00:00:00.000Z');
    const ctx = buildRealtimeTimeHolidayContext('tết nguyên đán năm nay ngày nào', fixed);

    expect(ctx).toContain('Google Search');
    expect(ctx).toContain('lễ di động/lunar');
  });
});

