import { describe, expect, it } from 'vitest';
import { calculateRemainingTime } from '../hooks/useBatchTimer';
import { filterData } from './filterRules';
import { parseCSV, parseCSVRow, parseTimeToHour } from './csvParser';

describe('batch timer', () => {
  it('marks a time-only deadline earlier today as overdue', () => {
    const now = new Date(2026, 7, 19, 11, 0, 0);
    const result = calculateRemainingTime('10:00', now);

    expect(result.isOverdue).toBe(true);
    expect(result.remainingTime).toBe('01:00:00');
  });

  it('keeps an explicit future date', () => {
    const now = new Date(2026, 7, 19, 11, 0, 0);
    const result = calculateRemainingTime('2026-08-20 11:00', now);

    expect(result.isOverdue).toBe(false);
    expect(result.remainingTime).toBe('24:00:00');
  });
});

describe('CSV parsing', () => {
  it('handles BOM, quoted commas, escaped quotes and newlines', () => {
    const data = parseCSV('\uFEFF证书编码,商品名称,备注\r\n1,"A,B","line 1\nline ""2"""');

    expect(data).toEqual([{ 证书编码: '1', 商品名称: 'A,B', 备注: 'line 1\nline "2"' }]);
    expect(parseCSVRow('a,"b,c"')).toEqual(['a', 'b,c']);
  });
});

describe('data normalization', () => {
  it('reads text, Date and Excel serial times', () => {
    expect(parseTimeToHour('2026-08-19 09:30:00')).toBe(9);
    expect(parseTimeToHour(new Date(2026, 7, 19, 14, 30))).toBe(14);
    expect(parseTimeToHour(45523.75)).toBe(18);
  });

  it('does not treat a missing or invalid quality-check price as non-zero', () => {
    const invalidRows = filterData([{
      '商品名称': '999项链', '贵金属结论': '足金', '备注': '', '质检价格': ''
    }]);
    const validRows = filterData([{
      '商品名称': '999项链', '贵金属结论': '足金', '备注': '', '质检价格': '10'
    }]);

    expect(invalidRows.find(result => result.name === '999筛选')?.data).toHaveLength(0);
    expect(validRows.find(result => result.name === '999筛选')?.data).toHaveLength(1);
  });

  it('excludes 银婆婆 and 贵玲珑 from the missing jewelry type filter', () => {
    const results = filterData([
      { '商品名称': '银婆婆手链', '饰品类型': '', '质检价格': '10' },
      { '商品名称': '贵玲珑吊坠', '饰品类型': '', '质检价格': '10' },
      { '商品名称': '普通手链', '饰品类型': '', '质检价格': '10' },
    ]);

    const jewelryTypeRows = results.find(result => result.name === '饰品类型筛选')?.data;
    expect(jewelryTypeRows).toEqual([
      { '商品名称': '普通手链', '饰品类型': '', '质检价格': '10' },
    ]);
  });
});
