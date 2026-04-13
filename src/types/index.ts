export interface CsvData {
  [key: string]: string;
}

export interface FilterResult {
  name: string;
  data: CsvData[];
}

export interface SortConfig {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

export interface BatchData {
  batchId: string;      // 质检批次号
  batchName: string;    // 批次名称
  quantity: string;     // 数量
  dueTime: string;      // 逾期时间 (转换自货盘)
  status: string;       // 状态
  startTime: string;    // 开始时间 (自动生成)
  remainingTime?: string; // 剩余时间
  progress?: number;    // 进度百分比
  isOverdue?: boolean;  // 是否已逾期
  remainingMs?: number; // 剩余毫秒数
  lastAlerted?: number; // 添加上次提醒时间戳
}
