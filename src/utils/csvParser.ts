import { CsvData } from '../types';

export const TIME_BUCKETS = [
  { label: '9:00-10:00', start: 9, end: 10 },
  { label: '10:00-12:00', start: 10, end: 12 },
  { label: '12:00-14:00', start: 12, end: 14 },
  { label: '14:00-16:00', start: 14, end: 16 },
  { label: '16:00-18:00', start: 16, end: 18 },
  { label: '18:00-20:00', start: 18, end: 20 },
];

export function parseTimeToHour(dateStr: string): number | null {
  if (!dateStr) return null;
  // 支持格式如 2024-07-01 09:30:00 或 09:30:00
  const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;
  const hour = parseInt(timeMatch[1], 10);
  return isNaN(hour) ? null : hour;
}

// 处理CSV行，考虑引号内的逗号
export function parseCSVRow(row: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

export function parseCSV(text: string): CsvData[] {
  // 分割行
  const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');

  // 第一行是标题
  const headers = rows[0].split(',').map(header => header.trim());

  // 解析数据行
  const data = rows.slice(1).map(row => {
    const values = parseCSVRow(row);
    const rowData: CsvData = {};

    headers.forEach((header, index) => {
      rowData[header] = values[index] || '';
    });

    return rowData;
  });

  return data;
}
