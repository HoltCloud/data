import { CsvData } from '../types';

export const TIME_BUCKETS = [
  { label: '9:00-10:00', start: 9, end: 10 },
  { label: '10:00-12:00', start: 10, end: 12 },
  { label: '12:00-14:00', start: 12, end: 14 },
  { label: '14:00-16:00', start: 14, end: 16 },
  { label: '16:00-18:00', start: 16, end: 18 },
  { label: '18:00-20:00', start: 18, end: 20 },
];

export function parseTimeToHour(value: unknown): number | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getHours();
  }

  // Excel stores dates as a day serial; the fractional part is the time.
  if (typeof value === 'number' && Number.isFinite(value)) {
    const fraction = ((value % 1) + 1) % 1;
    return Math.floor((fraction * 24) + 1e-7);
  }

  if (typeof value !== 'string' || !value.trim()) return null;
  // 支持格式如 2024-07-01 09:30:00 或 09:30:00
  const timeMatch = value.match(/(?:^|[ T])(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;
  const hour = parseInt(timeMatch[1], 10);
  return isNaN(hour) || hour < 0 || hour > 23 ? null : hour;
}

function parseCSVRecords(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      record.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      record.push(current);
      if (record.some(cell => cell.trim() !== '')) records.push(record);
      record = [];
      current = '';
    } else {
      current += char;
    }
  }

  record.push(current);
  if (record.some(cell => cell.trim() !== '')) records.push(record);
  return records;
}

// 处理CSV行，考虑引号内的逗号和转义引号
export function parseCSVRow(row: string): string[] {
  return parseCSVRecords(row)[0] || [];
}

export function parseCSV(text: string): CsvData[] {
  const rows = parseCSVRecords(text.replace(/^\uFEFF/, ''));
  if (rows.length === 0) return [];
  const headers = rows[0].map(header => header.trim());

  // 解析数据行
  const data = rows.slice(1).map(values => {
    const rowData: CsvData = {};

    headers.forEach((header, index) => {
      rowData[header] = values[index] || '';
    });

    return rowData;
  });

  return data;
}
