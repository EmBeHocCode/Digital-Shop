import { describe, expect, it } from 'bun:test';
import {
  _safe_replace_words,
  build_reply,
  normalize_slang,
  pick_style,
  should_reduce_style,
  stylize_reply,
} from '../../../src/shared/utils/chat_style.js';

describe('chat_style utilities', () => {
  it('normalize_slang should not break URL/email', () => {
    const input = 'a oi check link https://example.com/ko?x=1 va mail test@ko.com nha, ko dc thi bao';
    const output = normalize_slang(input);

    expect(output).toContain('https://example.com/ko?x=1');
    expect(output).toContain('test@ko.com');
    expect(output).toContain('không');
    expect(output).toContain('được');
  });

  it('pick_style should choose normal for technical text', () => {
    const style = pick_style('Bot bị lỗi api webhook, fix giúp mình với');
    expect(style).toBe('normal');
  });

  it('pick_style should choose genz_soft for emotional text', () => {
    const style = pick_style('huhu nay em mệt quá');
    expect(style).toBe('genz_soft');
  });

  it('should_reduce_style should return true for long or technical guidance text', () => {
    const longText = `${'Nội dung này dài. '.repeat(20)}Bước 1: kiểm tra log. Bước 2: restart server.`;
    expect(should_reduce_style(longText)).toBe(true);
    expect(should_reduce_style('Error: stack trace here https://example.com/logs')).toBe(true);
  });

  it('stylize_reply should never return empty string for non-empty input', () => {
    const output = stylize_reply('Đúng rồi, cái này đang rất nổi.', 'genz_bestie', 42);
    expect(output.trim().length).toBeGreaterThan(0);
  });

  it('build_reply should keep core meaning for technical reply', () => {
    const base = 'Anh kiểm tra lại log server, tốc độ mạng và đoạn xử lý webhook trước nhé.';
    const output = build_reply('a ơi bot e bị lag v, fix s nè', base, 'genz_soft', 7);

    expect(output).toContain('log server');
    expect(output).toContain('webhook');
  });

  it('build_reply should stay clean on technical output (no style emoji spam)', () => {
    const base =
      'Bước 1: mở log.\nBước 2: kiểm tra Error: timeout.\nBước 3: kiểm tra URL https://example.com/api.';
    const output = build_reply('fix bug api giúp mình', base, 'genz_hype', 123);

    expect(output).not.toMatch(/[✨🫶🔥⚡😎🤍😊🙂😉😌]/u);
  });

  it('build_reply should be deterministic with seed', () => {
    const base = 'Đúng rồi, cái này đang rất nổi.';
    const user = 'bestie ơi cái này cháy quá';
    const one = build_reply(user, base, 'genz_soft', 11);
    const two = build_reply(user, base, 'genz_soft', 11);

    expect(one).toBe(two);
  });

  it('_safe_replace_words should preserve punctuation and link/mail tokens', () => {
    const output = _safe_replace_words(
      'okie, check https://abc.com/okie và mail hi@okie.com nha!',
      { okie: 'ok', nha: 'nhé' },
    );

    expect(output).toContain('ok,');
    expect(output).toContain('https://abc.com/okie');
    expect(output).toContain('hi@okie.com');
    expect(output).toContain('nhé!');
  });

  it('stylize_reply should enforce em/anh-chị addressing tone', () => {
    const output = stylize_reply(
      'Mình nghĩ bạn nên kiểm tra lại log trước, cậu thử mở webhook nhé.',
      'normal',
      77,
    );

    expect(output.toLowerCase()).toContain('em nghĩ');
    expect(output).toContain('anh/chị nên');
    expect(output).not.toContain('Mình nghĩ');
    expect(output).not.toContain('bạn nên');
    expect(output).not.toContain('cậu thử');
  });
});
