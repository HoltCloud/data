import React, { useState, useRef, useEffect } from 'react';
import { Upload, AlertCircle, Database, X, ArrowUpDown, Copy, Check, Clock, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface CsvData {
  [key: string]: string;
}

interface FilterResult {
  name: string;
  data: CsvData[];
}


interface SortConfig {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

// 添加批次数据接口
interface BatchData {
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

const TIME_BUCKETS = [
  { label: '9:00-10:00', start: 9, end: 10 },
  { label: '10:00-12:00', start: 10, end: 12 },
  { label: '12:00-14:00', start: 12, end: 14 },
  { label: '14:00-16:00', start: 14, end: 16 },
  { label: '16:00-18:00', start: 16, end: 18 },
  { label: '18:00-20:00', start: 18, end: 20 },
];

function parseTimeToHour(dateStr: string): number | null {
  if (!dateStr) return null;
  // 支持格式如 2024-07-01 09:30:00 或 09:30:00
  const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;
  const hour = parseInt(timeMatch[1], 10);
  return isNaN(hour) ? null : hour;
}

function DataAnalysisPage({
  buckets,
  setBuckets
}: {
  buckets: number[];
  setBuckets: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: CsvData[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        // 统计入库时间分布
        const bucketCounts = [0, 0, 0, 0, 0, 0];
        json.forEach(row => {
          const timeStr = row['入库时间'] || row['入库日期'] || row['时间'] || '';
          const hour = parseTimeToHour(timeStr);
          if (hour !== null) {
            for (let i = 0; i < TIME_BUCKETS.length; i++) {
              const { start, end } = TIME_BUCKETS[i];
              if (hour >= start && hour < end) {
                bucketCounts[i]++;
                break;
              }
            }
          }
        });
        setBuckets(bucketCounts);
      } catch (err) {
        setError('Excel解析失败，请检查文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 横向柱状图最大宽度
  const maxCount = Math.max(...buckets, 1);
  const barColors = [
    '#FFBE98', '#FFD5C2', '#E5967A', '#3B82F6', '#10B981', '#F59E0B'
  ];
  const chartHeight = 60 * TIME_BUCKETS.length + 40;
  const chartWidth = 420;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold mb-4 text-white/90 flex items-center gap-2">
        <Database className="w-6 h-6 text-[#FFBE98]" /> Excel入库时间段分析
      </h2>
      <div className="inline-block mb-4">
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
        <button type="button" className="glass-button px-6 py-2 text-base font-medium cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          点击上传表格
        </button>
      </div>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {buckets.some(c => c > 0) && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white/80 mb-2">入库单数分布（按时间段）</h3>
          <div className="w-full max-w-2xl mx-auto bg-[#1D2939] rounded-lg p-6 shadow-lg">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ height: chartHeight }}>
              {/* 坐标轴 */}
              <line x1="120" y1="20" x2="120" y2={chartHeight - 20} stroke="#374151" strokeWidth="2" />
              <line x1="120" y1={chartHeight - 20} x2={chartWidth - 10} y2={chartHeight - 20} stroke="#374151" strokeWidth="2" />
              {/* 横向柱状图 */}
              {buckets.map((count, i) => {
                const barWidth = (count / maxCount) * (chartWidth - 160);
                const y = 40 + i * 60;
                return (
                  <g key={i}>
                    {/* 时间段标签 */}
                    <text
                      x={110}
                      y={y + 20}
                      textAnchor="end"
                      fill="#E2E8F0"
                      fontSize="15"
                      fontWeight="bold"
                    >
                      {TIME_BUCKETS[i].label}
                    </text>
                    <rect
                      x={130}
                      y={y}
                      width={barWidth}
                      height={32}
                      fill={barColors[i % barColors.length]}
                      rx="8"
                    />
                    {/* 数值标签 */}
                    <text
                      x={130 + barWidth + 10}
                      y={y + 20}
                      textAnchor="start"
                      fill="#FFBE98"
                      fontSize="16"
                      fontWeight="bold"
                    >
                      {count}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

function FulfillmentStatusPage({
  buckets,
  setBuckets,
  pendingInBuckets,
  setPendingInBuckets,
  pieData,
  setPieData
}: {

  buckets: { name: string, count: number }[];

  setBuckets: React.Dispatch<React.SetStateAction<{ name: string, count: number }[]>>;
  pendingInBuckets: { name: string, count: number }[];
  setPendingInBuckets: React.Dispatch<React.SetStateAction<{ name: string, count: number }[]>>;
  pieData: { label: string, value: number, color: string }[];
  setPieData: React.Dispatch<React.SetStateAction<{ label: string, value: number, color: string }[]>>;
}) {
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: CsvData[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        // 统计每个商家"订单履约状态"为"待绑码"的订单数量
        const merchantMap: Record<string, number> = {};
        const pendingInMap: Record<string, number> = {};
        let total = 0, waitBind = 0, waitIn = 0;
        json.forEach(row => {
          const merchant = (row['商家名称'] || row['商户名称'] || row['商家'] || row['商户'] || '未知商家').toString().trim();
          let status = (row['订单履约状态'] || row['履约状态'] || row['状态'] || '').toString().trim();
          // 统一全角转半角，去除所有空白字符，转小写
          status = status.replace(/[\u3000]/g, ' ').replace(/\s/g, '').toLowerCase();
          total++;
          if (status.includes('待绑码')) {
            merchantMap[merchant] = (merchantMap[merchant] || 0) + 1;
            waitBind++;
          }
          if (status.includes('待入库')) {
            pendingInMap[merchant] = (pendingInMap[merchant] || 0) + 1;
            waitIn++;
          }
        });
        // 转为数组并按数量降序
        const bucketArr = Object.entries(merchantMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        setBuckets(bucketArr);
        const pendingArr = Object.entries(pendingInMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        setPendingInBuckets(pendingArr);
        setPieData([
          { label: '待商家绑码', value: waitBind, color: '#3B82F6' },
          { label: '待质检入库', value: waitIn, color: '#10B981' },
          //{ label: '其他', value: Math.max(0, total - waitBind - waitIn), color: '#E5E7EB' }
        ]);
      } catch (err) {
        setError('Excel解析失败，请检查文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 横向柱状图最大宽度
  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  const barColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#FFBE98', '#FFD5C2', '#E5967A', '#EC4899', '#8B5CF6'
  ];
  // 显示所有商家，bar高度12px，间距4px
  const barHeight = 12;
  const barGap = 4;
  const chartHeight = buckets.length * (barHeight + barGap) + 40;
  const chartWidth = 420;
  // 待入库图表参数
  const pendingMaxCount = Math.max(...pendingInBuckets.map(b => b.count), 1);
  const pendingChartHeight = pendingInBuckets.length * (barHeight + barGap) + 40;
  const pendingChartWidth = 420;




  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold mb-4 text-white/90 flex items-center gap-2">
        <Database className="w-6 h-6 text-[#3B82F6]" /> 履约状态统计
      </h2>
      <div className="inline-block mb-4">
        <input id="fulfillment-upload" type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
        <button type="button" className="glass-button px-6 py-2 text-base font-medium cursor-pointer" onClick={() => document.getElementById('fulfillment-upload')?.click()}>
          点击上传表格
        </button>
      </div>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {buckets.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white/80 mb-2">各商家"待绑码"/"待入库"订单数量</h3>
          <div className="w-full flex flex-col md:flex-row gap-6">
            {/* 待质检入库图表 */}
            <div className="flex-1 bg-[#1D2939] rounded-lg p-6 shadow-lg">
              <div className="text-center text-base font-bold text-[#10B981] mb-2">待质检入库</div>
              <svg viewBox={`0 0 ${pendingChartWidth} ${pendingChartHeight}`} className="w-full" style={{ height: pendingChartHeight }}>
                <line x1="120" y1="20" x2="120" y2={pendingChartHeight - 20} stroke="#374151" strokeWidth="2" />
                <line x1="120" y1={pendingChartHeight - 20} x2={pendingChartWidth - 10} y2={pendingChartHeight - 20} stroke="#374151" strokeWidth="2" />
                {pendingInBuckets.map((b, i) => {
                  const barWidth = (b.count / pendingMaxCount) * (pendingChartWidth - 160);
                  const y = 20 + i * (barHeight + barGap);
                  return (
                    <g key={i}>
                      <text
                        x={110}
                        y={y + barHeight / 2 + 4}
                        textAnchor="end"
                        fill="#E2E8F0"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        {b.name}
                      </text>
                      <rect
                        x={130}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill="#10B981"
                        rx="6"
                      />
                      <text
                        x={130 + barWidth + 8}
                        y={y + barHeight / 2 + 4}
                        textAnchor="start"
                        fill="#10B981"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        {b.count}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            {/* 待商家绑码图表 */}
            <div className="flex-1 bg-[#1D2939] rounded-lg p-6 shadow-lg">
              <div className="text-center text-base font-bold text-[#3B82F6] mb-2">待商家绑码</div>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ height: chartHeight }}>
                <line x1="120" y1="20" x2="120" y2={chartHeight - 20} stroke="#374151" strokeWidth="2" />
                <line x1="120" y1={chartHeight - 20} x2={chartWidth - 10} y2={chartHeight - 20} stroke="#374151" strokeWidth="2" />
                {buckets.map((b, i) => {
                  const barWidth = (b.count / maxCount) * (chartWidth - 160);
                  const y = 20 + i * (barHeight + barGap);
                  return (
                    <g key={i}>
                      <text
                        x={110}
                        y={y + barHeight / 2 + 4}
                        textAnchor="end"
                        fill="#E2E8F0"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        {b.name}
                      </text>
                      <rect
                        x={130}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={barColors[i % barColors.length]}
                        rx="6"
                      />
                      <text
                        x={130 + barWidth + 8}
                        y={y + barHeight / 2 + 4}
                        textAnchor="start"
                        fill="#3B82F6"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        {b.count}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            {/* 饼图统计 */}
            <div className="flex-1 bg-[#1D2939] rounded-lg p-6 shadow-lg flex flex-col items-center justify-center">
              <div className="text-center text-base font-bold text-[#F59E0B] mb-4">待绑码/待入库占比</div>
              <svg viewBox="0 0 240 240" width="240" height="240">
                {(() => {
                  // 放大饼图渲染
                  const total = pieData.reduce((sum, d) => sum + d.value, 0);
                  if (total === 0) return <circle cx="120" cy="120" r="100" fill="#E5E7EB" />;
                  let startAngle = 0;
                  const elements = [];
                  for (let i = 0; i < pieData.length; i++) {
                    const d = pieData[i];
                    if (d.value === 0) continue;
                    const angle = (d.value / total) * Math.PI * 2;
                    const endAngle = startAngle + angle;
                    const x1 = 120 + 100 * Math.cos(startAngle);
                    const y1 = 120 + 100 * Math.sin(startAngle);
                    const x2 = 120 + 100 * Math.cos(endAngle);
                    const y2 = 120 + 100 * Math.sin(endAngle);
                    const largeArc = angle > Math.PI ? 1 : 0;
                    const pathData = [
                      `M 120 120`,
                      `L ${x1} ${y1}`,
                      `A 100 100 0 ${largeArc} 1 ${x2} ${y2}`,
                      `Z`
                    ].join(' ');
                    elements.push(<path key={d.label} d={pathData} fill={d.color} />);
                    // 百分比标签
                    if (d.value / total > 0.05) {
                      const labelAngle = startAngle + angle / 2;
                      const lx = 120 + 70 * Math.cos(labelAngle);
                      const ly = 120 + 70 * Math.sin(labelAngle);
                      elements.push(
                        <text key={d.label + '-label'} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#222" fontSize="20" fontWeight="bold">
                          {Math.round((d.value / total) * 100)}%
                        </text>
                      );
                    }
                    startAngle = endAngle;
                  }
                  return elements;
                })()}
              </svg>
              <div className="mt-6 flex flex-col gap-3 text-base">
                {pieData.map(d => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span style={{ width: 20, height: 20, background: d.color, display: 'inline-block', borderRadius: 4 }}></span>
                    <span className="text-gray-200">{d.label}</span>
                    <span className="text-gray-400">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [filterResults, setFilterResults] = useState<FilterResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: '拖放或点击上传数据文件，筛选结果仅显示符合条件的条目', isUser: false },
  ]);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: null });

  const [copiedCertId, setCopiedCertId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<'dataFilter' | 'batchTimer' | 'dataAnalysis' | 'fulfillmentStatus'>(
    () => (localStorage.getItem('activePage') as 'dataFilter' | 'batchTimer' | 'dataAnalysis' | 'fulfillmentStatus') || 'dataFilter'
  );
  const [batchData, setBatchData] = useState<BatchData[]>(() => {
    const savedBatchData = localStorage.getItem('batchData');
    return savedBatchData ? JSON.parse(savedBatchData) : [];
  });
  // 新增一个状态用于存储所有批次数据（包括"流程完成"状态的批次）
  const [allBatchData, setAllBatchData] = useState<BatchData[]>(() => {
    const savedAllBatchData = localStorage.getItem('allBatchData');
    return savedAllBatchData ? JSON.parse(savedAllBatchData) : [];
  });
  const [batchFileError, setBatchFileError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());


  // 新增：将数据分析相关状态提升到App

  const [analysisBuckets, setAnalysisBuckets] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  // 在App组件中新增履约状态统计相关状态

  const [fulfillmentBuckets, setFulfillmentBuckets] = useState<{ name: string, count: number }[]>([]);
  const [pendingInBuckets, setPendingInBuckets] = useState<{ name: string, count: number }[]>([]);
  const [pieData, setPieData] = useState<{ label: string, value: number, color: string }[]>([]);

  // 要显示的列
  const columnsToDisplay = [
    "证书编码",
    "商品名称",
    "商品材质",
    "宝玉石结论",
    "贵金属结论",
    "重量",
    "备注",
    "饰品类型"
  ];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 在组件挂载时初始化定时器
  useEffect(() => {
    // 每秒更新一次当前时间和批次数据
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      // 更新批次数据的剩余时间
      if (batchData.length > 0) {
        setBatchData(prevData => {
          const updatedData = prevData.map(batch => {
            const timeInfo = calculateRemainingTime(batch.dueTime);
            return {
              ...batch,
              ...timeInfo
            };
          });

          return updatedData.sort((a, b) => {
            if (!a.remainingMs || a.remainingMs === Infinity) return 1;
            if (!b.remainingMs || b.remainingMs === Infinity) return -1;
            return a.remainingMs - b.remainingMs;
          });
        });
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [batchData.length]);



  // 当批次数据变化时，保存到localStorage
  useEffect(() => {
    localStorage.setItem('batchData', JSON.stringify(batchData));
  }, [batchData]);

  // 当活动页面变化时，保存到localStorage
  useEffect(() => {
    localStorage.setItem('activePage', activePage);
  }, [activePage]);

  // 当allBatchData批次数据变化时，保存到localStorage
  useEffect(() => {
    localStorage.setItem('allBatchData', JSON.stringify(allBatchData));
  }, [allBatchData]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      addMessage(`错误：请上传CSV文件。当前文件类型: ${file.type}`, true);
      setError('请上传CSV文件');
      return;
    }

    setIsLoading(true);
    setError(null);
    addMessage(`正在处理文件: ${file.name}`, true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);

        addMessage(`文件已成功加载，共 ${parsedData.length} 条记录。正在筛选数据...`, false);

        // 记录筛选开始时间
        const startTime = performance.now();

        // 执行筛选
        const results = filterData(parsedData);

        // 只保留有数据的筛选结果
        const filteredResults = results.filter(result => result.data.length > 0);
        setFilterResults(filteredResults);

        // 计算筛选用时
        const endTime = performance.now();
        const timeUsed = (endTime - startTime) / 1000; // 转换为秒


        const totalFilteredRows = filteredResults.reduce((sum, result) => sum + result.data.length, 0);
        addMessage(`筛选完成，共找到 ${totalFilteredRows} 条符合条件的记录，分布在 ${filteredResults.length} 个筛选条件中。筛选用时: ${timeUsed.toFixed(4)}秒`, false);

        setIsLoading(false);
        setHasUploadedFile(true);
      } catch (err) {
        console.error('Error processing CSV:', err);
        setError('CSV解析错误，请检查文件格式');
        addMessage('CSV解析错误，请检查文件格式是否正确。', false);
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('文件读取错误');
      addMessage('文件读取错误，请重试。', false);
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  const parseCSV = (text: string): CsvData[] => {
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
  };

  // 处理CSV行，考虑引号内的逗号
  const parseCSVRow = (row: string): string[] => {
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
  };

  const filterData = (data: CsvData[]): FilterResult[] => {
    const filters = [
      {
        name: "999筛选",
        filter: (row: CsvData) =>
          (containsText(row["商品名称"], "999") || containsText(row["商品材质"], "999")) &&
          parseFloat(row["质检价格"]) !== 0 &&
          !containsText(row["商品名称"], "铂") &&
          !containsText(row["商品材质"], "铂") &&
          !containsText(row["备注"], "999")
      },
      {
        name: "上错足金筛选",
        filter: (row: CsvData) =>
          (!containsText(row["商品名称"], "足金") || !containsText(row["商品材质"], "足金") || !containsText(row["镶嵌材质"], "足金")) &&
          parseFloat(row["质检价格"]) !== 0 &&
          containsText(row["贵金属结论"], "足金")
      },
      {
        name: "错误备注999",
        filter: (row: CsvData) =>
          !containsText(row["贵金属结论"], "足金") &&
          parseFloat(row["质检价格"]) !== 0 &&
          !containsText(row["贵金属结论"], "足金") &&
          containsText(row["备注"], "999")
      },
      {
        name: "足金筛选",
        filter: (row: CsvData) =>
          (containsText(row["商品名称"], "足金") || containsText(row["商品材质"], "足金")) &&
          parseFloat(row["质检价格"]) !== 0 &&
          !containsText(row["贵金属结论"], "足金")
      },
      {
        name: "上错足金筛选",
        filter: (row: CsvData) =>
          (!containsText(row["商品名称"], "足金") || !containsText(row["商品材质"], "足金") || !containsText(row["镶嵌材质"], "足金")) &&
          parseFloat(row["质检价格"]) !== 0 &&
          containsText(row["贵金属结论"], "足金")
      },
      {
        name: "K金筛选",
        filter: (row: CsvData) =>
          (containsText(row["商品名称"], "K金") || containsText(row["商品材质"], "K金") || containsText(row["镶嵌材质"], "K金")) &&
          parseFloat(row["质检价格"]) !== 0 &&
          !containsText(row["贵金属结论"], "K金")
      },
      {
        name: "925筛选",
        filter: (row: CsvData) =>
          (containsText(row["商品名称"], "925") || containsText(row["商品材质"], "925")) &&
          parseFloat(row["质检价格"]) !== 0 &&
          !containsText(row["贵金属结论"], "925")
      },
      {
        name: "足银筛选",
        filter: (row: CsvData) =>
          (containsText(row["商品名称"], "足银") || containsText(row["商品材质"], "足银")) &&
          parseFloat(row["质检价格"]) !== 0 &&
          !containsText(row["贵金属结论"], "足银")
      },
     {
  name: "南红筛选",
  filter: (row: CsvData) => {
    // 定义所有需要包含的关键词
    const targetKeywords = ["保山红", "凉山红", "川料红", "瓦西", "九口红", "锦红", "南红"];
    
    // 检查 商品名称 或 商品材质 是否包含上述任一关键词
    const matchesNameOrMaterial = targetKeywords.some(key => 
      containsText(row["商品名称"], key) || containsText(row["商品材质"], key)
    );

    return (
      matchesNameOrMaterial &&
      parseFloat(row["质检价格"]) !== 0 &&
      !containsText(row["备注"], "南红")
    );
  }
},
    {
  name: "海水珍珠筛选",
  filter: (row: CsvData) => {
    // 定义所有需要包含的关键词
    const targetKeywords = ["海水珍珠", "海水珠"];
    
    // 检查 商品名称 或 商品材质 是否包含上述任一关键词
    const matchesNameOrMaterial = targetKeywords.some(key => 
      containsText(row["商品名称"], key) || containsText(row["商品材质"], key)
    );

    return (
      matchesNameOrMaterial &&
      parseFloat(row["质检价格"]) !== 0 &&
      !containsText(row["宝玉石结论"], "海水珍珠")
    );
  }
},
      {
        name: "足铂筛选",
        filter: (row: CsvData) =>
          (containsText(row["商品名称"], "足铂") || containsText(row["商品材质"], "足铂")) &&
          parseFloat(row["质检价格"]) !== 0 &&
          !containsText(row["贵金属结论"], "足铂")
      },
      {
        name: "铂筛选",
        filter: (row: CsvData) =>
          (containsText(row["商品名称"], "铂") || containsText(row["商品材质"], "铂")) &&
          parseFloat(row["质检价格"]) !== 0 &&
          !containsText(row["贵金属结论"], "铂")
      },
  {
  name: "饰品类型筛选",
  filter: (row: CsvData) => {
    const price = parseFloat(row["质检价格"]);
    const type = row["饰品类型"];
    const name = row["商品名称"] || ""; // 确保名称不为 null

    return (
      price !== 0 &&
      !(type != null && type.trim().length > 0) &&
      // 新增条件：商品名称不包含以下关键词
      !name.includes("金条") &&
      !name.includes("金豆") &&
      !name.includes("投资") &&
      !name.includes("金钞") &&
      !name.includes("金饼")
    );
  }
},
      {
        name: "检测备注漏含覆层筛选",
        filter: (row: CsvData) =>
          containsText(row["重量"], "覆层") &&
          !containsText(row["备注"], "贵金属纯度不包括表层") &&
          parseFloat(row["质检价格"]) !== 0
      },
      {
        name: "翡翠备注筛选",
        filter: (row: CsvData) =>
          containsText(row["宝玉石结论"], "翡翠") &&
          !(containsText(row["备注"], "A货翡翠") || containsText(row["备注"], "翡翠A货")) &&
          parseFloat(row["质检价格"]) !== 0
      },
      {
        name: "重量单位筛选",
        filter: (row: CsvData) =>
          !containsText(row["重量"], "g") &&
          parseFloat(row["质检价格"]) !== 0
      },
      {
        name: "覆层称重备注筛选",
        filter: (row: CsvData) =>
          !containsText(row["重量"], "含覆层") &&
          !containsText(row["重量"], "总重") &&
          containsText(row["备注"], "贵金属纯度不包括表层") &&
          parseFloat(row["质检价格"]) !== 0
      },
      {
        name: "赠链检测备注筛选",
        filter: (row: CsvData) =>
          containsText(row["重量"], "不含链") &&
          !containsText(row["备注"], "配链") &&
          !containsText(row["备注"], "银925链") &&
          !containsText(row["备注"], "配18K金链") &&
          parseFloat(row["质检价格"]) !== 0
      },
      {
        name: "称重备注不含链筛选",
        filter: (row: CsvData) =>
          !(containsText(row["重量"], "不含链") || containsText(row["重量"], "总重")) &&
          (containsText(row["备注"], "配链未测") || containsText(row["备注"], "银925链")) &&
          parseFloat(row["质检价格"]) !== 0
      },
      // {
      // name: "驳回筛选",
      // filter: (row: CsvData) =>
      //  containsText(row["质检结果"], "不通过")
      // },
      //{
      //  name: "严格零价格筛选",
      //   filter: (row: CsvData) => parseFloat(row["质检价格"]) === 0
      //  },
      // {
      // name: "非零质检价格筛选",
      //filter: (row: CsvData) => parseFloat(row["质检价格"]) !== 0
      //},
      {
        name: "零重量筛选",
        filter: (row: CsvData) =>
          containsText(row["重量"], "0.00") &&
          !containsText(row["重量"], "10.00") &&
          !containsText(row["重量"], "20.00") &&
          !containsText(row["重量"], "30.00") &&
          !containsText(row["重量"], "50.00") &&
          !containsText(row["重量"], "100.00") &&
          !containsText(row["重量"], "150.00") &&
          !containsText(row["重量"], "200.00") &&
          parseFloat(row["质检价格"]) !== 0

      }
      //{
      //name: "D字段内容遗漏筛选",
      //filter: (row: CsvData) => {
      //const dText = row["宝玉石结论"]; // 获取字段 D 的内容

      // 1. 若 D 无文字词组（为空），则不筛选（直接返回 false）
      //if (dText == null || dText.trim() === "") {
      //return false;
      //}

      // 2. 核心逻辑：
      // 只有当 A 不包含 D，且 B 不包含 D，且 C 也不包含 D 时，返回 true（筛选出来）
      //return (
      //!containsText(row["商品材质"], dText) &&
      //!containsText(row["镶嵌材质"], dText) &&
      //!containsText(row["配件材质"], dText)
      //);
      //}
      // }
    ];

    return filters.map(filter => ({
      name: filter.name,
      data: data.filter(filter.filter)
    }));
  };

  const containsText = (text: string | undefined, searchText: string): boolean => {
    if (!text) return false;
    return text.includes(searchText);
  };

  const addMessage = (text: string, isUser: boolean) => {
    setMessages(prev => [...prev, { text, isUser }]);
  };




  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      direction:
        prev.column === column && prev.direction === 'asc'
          ? 'desc'
          : 'asc'
    }));
  };

  const filterAndSortData = (data: CsvData[]) => {
    let filtered = data;

    // 排序
    if (sortConfig.column && sortConfig.direction) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.column!] || '';
        const bValue = b[sortConfig.column!] || '';
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }

    return filtered;
  };

  const handleCopy = async (text: string) => {
    try {
      const trimmedText = text.trim(); // 去除两端空格
      await navigator.clipboard.writeText(trimmedText);
      setCopiedCertId(text);
      setTimeout(() => setCopiedCertId(null), 2000); // 2秒后重置复制状态
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 切换页面
  const togglePage = () => {
    setActivePage(prev => prev === 'dataFilter' ? 'batchTimer' : 'dataFilter');
  };


  // 处理批次Excel文件
  const processBatchFile = (file: File) => {
    setBatchFileError(null);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("文件数据为空");
        }

        // 使用xlsx库解析Excel文件，添加更多选项以提高兼容性
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,  // 将日期转换为JS日期对象
          cellNF: false,    // 不保留数字格式
          cellText: false   // 不生成格式化文本
        });
        console.log("Excel解析成功，工作表:", workbook.SheetNames);

        if (workbook.SheetNames.length === 0) {
          throw new Error("Excel文件没有工作表");
        }

        // 获取第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 将工作表转换为JSON，添加更多选项以提高兼容性
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
          raw: false,       // 返回格式化的字符串
          defval: "",       // 空单元格的默认值
          header: "A",      // 使用Excel列标题作为键
          blankrows: false  // 跳过空行
        });

        if (jsonData.length === 0) {
          throw new Error("Excel文件没有数据");
        }
        const firstRow = jsonData[0];

        // 如果第一行是列标题，则重新解析使用列标题作为键
        let processedData: CsvData[] = [];


        // 尝试检测列标题行
        const hasColumnHeaders = Object.keys(firstRow).some(key =>
          typeof firstRow[key] === 'string' &&
          (firstRow[key].includes('批次') ||
            firstRow[key].includes('质检') ||
            firstRow[key].includes('状态') ||
            firstRow[key].includes('数量') ||
            firstRow[key].includes('货盘'))
        );

        if (hasColumnHeaders) {
          // 使用第一行作为列标题
          processedData = XLSX.utils.sheet_to_json<CsvData>(worksheet, {
            raw: false,
            defval: "",
            blankrows: false
          });
        } else {
          // 如果没有找到标准列名，尝试使用默认映射
          processedData = jsonData.map((row: any) => {
            const mappedRow: CsvData = {};
            if (row['A']) mappedRow['质检批次号'] = row['A'];
            if (row['B']) mappedRow['批次名称'] = row['B'];
            if (row['C']) mappedRow['数量'] = row['C'];
            if (row['D']) mappedRow['货盘'] = row['D'];
            if (row['E']) mappedRow['状态'] = row['E'];
            return mappedRow;
          });
        }

        const { filteredBatchData, allProcessedBatchData } = processBatchData(processedData);

        if (allProcessedBatchData.length === 0) {
          throw new Error("没有找到有效的批次数据，请检查文件格式和列名");
        }

        // 保存批次数据到状态和localStorage
        setBatchData(filteredBatchData);
        setAllBatchData(allProcessedBatchData);
        localStorage.setItem('batchData', JSON.stringify(filteredBatchData));
        localStorage.setItem('allBatchData', JSON.stringify(allProcessedBatchData));

        setIsLoading(false);
        addMessage(`成功导入 ${allProcessedBatchData.length} 条批次数据，其中 ${filteredBatchData.length} 条未完成批次`, false);
      } catch (err) {
        console.error('Error processing batch file:', err);
        setBatchFileError(`批次文件解析错误: ${err instanceof Error ? err.message : '未知错误'}`);
        addMessage(`批次文件解析错误: ${err instanceof Error ? err.message : '未知错误'}`, false);
        setIsLoading(false);
      }
    };

    reader.onerror = (e) => {
      console.error('文件读取错误:', e);
      setBatchFileError('文件读取错误');
      addMessage('文件读取错误，请重试。', false);
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // 计算剩余时间和进度
  const calculateRemainingTime = (dueTimeStr: string) => {
    // 解析逾期时间
    let dueTime: Date | null = null;

    try {
      // 尝试解析不同格式的日期时间
      if (dueTimeStr.includes('/') || dueTimeStr.includes('-')) {
        // 处理日期格式 (如 "2023/05/20 14:30" 或 "2023-05-20 14:30")
        dueTime = new Date(dueTimeStr);
      } else if (dueTimeStr.match(/^\d{1,2}:\d{2}$/)) {
        // 处理时间格式 (如 "14:30")
        const [hours, minutes] = dueTimeStr.split(':').map(Number);
        dueTime = new Date();
        dueTime.setHours(hours, minutes, 0, 0);

        // 如果设置的时间已经过去，则设置为明天的同一时间
        if (dueTime < currentTime) {
          dueTime.setDate(dueTime.getDate() + 1);
        }
      }

      // 如果无法解析，返回默认值
      if (!dueTime || isNaN(dueTime.getTime())) {
        console.warn(`无法解析逾期时间: ${dueTimeStr}`);
        return {
          remainingTime: "无效时间",
          progress: 0,
          isOverdue: false,
          remainingMs: 0
        };
      }

      // 计算剩余时间（毫秒）
      const remainingMs = dueTime.getTime() - currentTime.getTime();
      const isOverdue = remainingMs <= 0;

      // 格式化剩余时间 (更精确的格式: HH:MM:SS)
      let formattedTime = "";
      if (isOverdue) {
        // 已逾期，计算逾期时间
        const overdueDuration = Math.abs(remainingMs);
        const hours = Math.floor(overdueDuration / (1000 * 60 * 60));
        const minutes = Math.floor((overdueDuration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((overdueDuration % (1000 * 60)) / 1000);
        formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      } else {
        // 未逾期，显示剩余时间
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
        formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }

      // 计算进度百分比 (4小时 = 100%)
      // 4小时 = 14400000毫秒
      const fourHoursInMs = 4 * 60 * 60 * 1000;
      const progress = isOverdue ? 0 : Math.min(100, Math.max(0, (remainingMs / fourHoursInMs * 100)));

      return {
        remainingTime: formattedTime,
        progress: Math.round(progress),
        isOverdue,
        remainingMs: isOverdue ? 0 : remainingMs
      };
    } catch (error) {
      console.error("计算剩余时间错误:", error);
      return {
        remainingTime: "计算错误",
        progress: 0,
        isOverdue: false,
        remainingMs: 0
      };
    }
  };

  // 处理批次数据
  const processBatchData = (data: CsvData[]): { filteredBatchData: BatchData[], allProcessedBatchData: BatchData[] } => {

    // 更灵活的列名匹配
    const getColumnValue = (row: CsvData, possibleNames: string[]): string => {
      // 首先尝试直接匹配
      for (const name of possibleNames) {
        if (row[name] !== undefined) {
          return row[name] || "";
        }
      }

      // 如果直接匹配失败，尝试部分匹配（包含关系）
      const allKeys = Object.keys(row);
      for (const name of possibleNames) {
        const lowerName = name.toLowerCase();
        for (const key of allKeys) {
          if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
            return row[key] || "";
          }
        }
      }

      return "";
    };

    // 处理所有数据行，用于统计信息
    const allProcessedBatchData = data.map(row => processRow(row));

    // 过滤掉特定状态的行，但保留"制证完成"状态，用于计时显示
    const filteredData = data.filter(row => {
      const status = getColumnValue(row, ["状态", "Status", "status", "检验状态", "检测状态"]).toLowerCase();

      // 检查状态是否包含需要过滤的关键词
      const excludeStatuses = ["已出检", "已完成", "完成", "流程完成"];

      // 特别处理"制证完成"状态 - 这个状态需要保留
      if (status.includes("制证完成")) {
        return true; // 保留"制证完成"状态的条目
      }

      // 过滤掉其他需要排除的状态
      return !excludeStatuses.some(excludeStatus =>
        status.includes(excludeStatus.toLowerCase())
      );
    });

    const filteredBatchData = filteredData.length === 0
      ? [] // 如果过滤后没有数据，返回空数组而不是所有数据
      : filteredData.map(row => processRow(row));

    return { filteredBatchData, allProcessedBatchData };

    // 处理单行数据
    function processRow(row: CsvData): BatchData {
      // 将货盘列的四位数字转换为24小时制时间
      let dueTime = getColumnValue(row, ["货盘", "逾期时间", "DueTime", "duetime", "时间", "预计时间"]);

      // 处理不同格式的时间

      if (/^\d{4}$/.test(dueTime)) {
        // 四位数字格式: 1231 -> 12:31
        const hours = dueTime.substring(0, 2);
        const minutes = dueTime.substring(2, 4);
        dueTime = `${hours}:${minutes}`;
      } else if (/^\d{1,2}:\d{1,2}$/.test(dueTime)) {
        // 已经是时:分格式，确保两位数
        const [hours, minutes] = dueTime.split(':').map(Number);
        dueTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      } else if (/^\d{1,2}$/.test(dueTime)) {
        // 只有小时
        dueTime = `${dueTime.padStart(2, '0')}:00`;
      } else if (dueTime.includes('/') || dueTime.includes('-')) {
        // 日期格式，尝试提取时间部分
        try {
          const date = new Date(dueTime);
          if (!isNaN(date.getTime())) {
            dueTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          }
        } catch (e) {
          // 忽略错误
        }
      }

      // 生成当前时间作为开始时间
      const now = new Date();
      const startTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const batchId = getColumnValue(row, ["质检批次号", "批次号", "BatchId", "batchid", "编号", "ID"]);
      const batchName = getColumnValue(row, ["批次名称", "名称", "BatchName", "batchname", "品名", "产品名称"]);
      const quantity = getColumnValue(row, ["数量", "Quantity", "quantity", "件数", "个数"]);
      const status = getColumnValue(row, ["状态", "Status", "status", "检验状态", "检测状态"]);


      const batchData = {
        batchId: batchId || "未知批次",
        batchName: batchName || "未命名批次",
        quantity,
        dueTime,
        status,
        startTime,
        ...calculateRemainingTime(dueTime)
      };

      return batchData;
    }
  };

  // 添加清除批次数据的功能
  const clearBatchData = () => {
    if (window.confirm('确定要清除所有批次数据吗？此操作不可撤销。')) {
      setBatchData([]);
      setAllBatchData([]);
      localStorage.removeItem('batchData');
      localStorage.removeItem('allBatchData');
      addMessage('已清除所有批次数据', false);
    }
  };

  // 新增：计算批次统计数据
  const calculateBatchStatistics = () => {
    // 使用allBatchData而不是batchData进行统计，确保包含所有状态的批次
    if (allBatchData.length === 0) return {
      total: 0,
      batchGenerated: 0,
      inQualityCheck: 0,
      pendingCertification: 0,
      certificationComplete: 0,
      processComplete: 0,
      totalQuantity: 0
    };

    // 初始化统计对象
    const stats = {
      total: allBatchData.length,
      batchGenerated: 0,
      inQualityCheck: 0,
      pendingCertification: 0,
      certificationComplete: 0,
      processComplete: 0,
      totalQuantity: 0
    };

    // 遍历批次数据计算统计信息
    allBatchData.forEach(batch => {
      // 解析数量列的值
      const quantity = parseInt(batch.quantity) || 0;

      // 累加总数量
      stats.totalQuantity += quantity;

      // 按状态累加不同类别的数量
      const status = batch.status.toLowerCase();
      if (status.includes("批次已生成")) {
        stats.batchGenerated += quantity;
      } else if (status.includes("质检中")) {
        stats.inQualityCheck += quantity;
      } else if (status.includes("待制证")) {
        stats.pendingCertification += quantity;
      } else if (status.includes("制证完成")) {
        stats.certificationComplete += quantity;
      } else if (status.includes("流程完成") || status.includes("已出检") || status.includes("已完成") || status.includes("完成")) {
        stats.processComplete += quantity;
      }
    });

    return stats;
  };

  // 辅助函数：渲染饼图
  function renderPieChart(sectors: { value: number, color: string }[]) {
    const total = sectors.reduce((sum, sector) => sum + sector.value, 0);
    if (total === 0) return <circle cx="50" cy="50" r="45" fill="#374151" />;

    let startAngle = 0;
    const elements = [];

    for (let i = 0; i < sectors.length; i++) {
      const sector = sectors[i];
      if (sector.value === 0) continue;

      const percentage = sector.value / total;
      const endAngle = startAngle + percentage * Math.PI * 2;

      // 计算路径
      const x1 = 50 + 45 * Math.cos(startAngle);
      const y1 = 50 + 45 * Math.sin(startAngle);
      const x2 = 50 + 45 * Math.cos(endAngle);
      const y2 = 50 + 45 * Math.sin(endAngle);

      // 确定是否大弧（超过半圆）
      const largeArcFlag = percentage > 0.5 ? 1 : 0;

      // 生成路径
      const pathData = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `Z`
      ].join(' ');

      elements.push(<path key={`path-${i}`} d={pathData} fill={sector.color} />);

      // 添加百分比标签
      if (percentage > 0.03) { // 只为较大扇区添加百分比
        const labelAngle = startAngle + (endAngle - startAngle) / 2;
        const labelRadius = 32; // 标签距离中心的距离
        const labelX = 50 + labelRadius * Math.cos(labelAngle);
        const labelY = 50 + labelRadius * Math.sin(labelAngle);

        elements.push(
          <text
            key={`text-${i}`}
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="8"
            fontWeight="bold"
          >
            {Math.round(percentage * 100)}%
          </text>
        );
      }

      startAngle = endAngle;
    }

    return elements;
  }

  // 批次计时器页面组件
  const BatchTimerPage = () => {
    const [localTime, setLocalTime] = useState(new Date());

    // 添加本地计时器，每100毫秒更新一次
    useEffect(() => {
      const timer = setInterval(() => {
        setLocalTime(new Date());
      }, 100);

      return () => clearInterval(timer);
    }, []);

    // 简化的文件处理函数
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;

      if (files && files.length > 0) {
        const file = files[0];

        // 检查文件类型
        const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls');

        if (!isExcel) {
          alert("请选择.xlsx或.xls格式的Excel文件");
          return;
        }

        processBatchFile(file);
      }

      // 重置input值以允许选择相同文件
      event.target.value = '';
    };

    // 使用hook获取最新的批次统计数据
    const batchStats = calculateBatchStatistics();

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-[#FFBE98] mr-3" />
            <h2 className="text-xl font-semibold text-white/90">检测批次计时</h2>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.xlsx,.xls';
                input.onchange = (e) => {
                  const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleFileSelect(event);
                };
                input.click();
              }}
              className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-[#FFBE98]/20 text-[#FFBE98] hover:bg-[#FFBE98]/30 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span>上传Excel文件</span>
            </button>

            <button
              onClick={clearBatchData}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              清除数据
            </button>
          </div>
        </div>

        {/* 批次统计信息框 - 现在单独占用整行 */}
        <div className="border-2 border-gray-700 rounded-xl p-6 mb-8 bg-[#1D2939]/50">
          <div className="flex items-center mb-4">
            <div className="w-5 h-5 text-[#FFBE98] mr-2 flex items-center justify-center">
              <div className="w-4 h-3 bg-[#FFBE98]"></div>
            </div>
            <h3 className="text-lg font-medium text-white/90">批次统计信息</h3>
          </div>

          {allBatchData.length > 0 ? (
            <div className="flex flex-col md:flex-row gap-6">
              {/* 左侧统计卡片区域 */}
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-[#FFBE98]/20 border border-[#FFBE98]/30">
                    <p className="text-[#FFBE98] text-sm mb-1">总数量</p>
                    <p className="text-xl font-semibold text-white">{batchStats.totalQuantity}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#FFBE98]/20 border border-[#FFBE98]/30">
                    <p className="text-[#FFBE98] text-sm mb-1">批次总数</p>
                    <p className="text-xl font-semibold text-white">{batchStats.total}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-[#171E2E]/80">
                    <p className="text-gray-400 text-sm mb-1">批次已生成</p>
                    <p className="text-lg font-medium text-white">{batchStats.batchGenerated}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#171E2E]/80">
                    <p className="text-gray-400 text-sm mb-1">质检中</p>
                    <p className="text-lg font-medium text-white">{batchStats.inQualityCheck}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#171E2E]/80">
                    <p className="text-gray-400 text-sm mb-1">待制证</p>
                    <p className="text-lg font-medium text-white">{batchStats.pendingCertification}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-[#171E2E]/80">
                    <p className="text-gray-400 text-sm mb-1">待确认</p>
                    <p className="text-lg font-medium text-white">{batchStats.certificationComplete}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#171E2E]/80">
                    <p className="text-gray-400 text-sm mb-1">已出检</p>
                    <p className="text-lg font-medium text-white">{batchStats.processComplete}</p>
                  </div>
                </div>
              </div>

              {/* 右侧饼图区域 */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-48 h-48 mx-auto">
                  {/* 改进的饼图 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full">
                      <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-lg">
                        {/* 背景圆形 */}
                        <circle cx="50" cy="50" r="48" fill="#1D2939" />

                        {/* 如果有数据，绘制饼图扇区 */}
                        {batchStats.total > 0 && [
                          batchStats.batchGenerated,
                          batchStats.inQualityCheck,
                          batchStats.pendingCertification,
                          batchStats.certificationComplete,
                          batchStats.processComplete
                        ].some(val => val > 0) ? (
                          renderPieChart([
                            { value: batchStats.batchGenerated, color: '#3B82F6' },  // 蓝色
                            { value: batchStats.inQualityCheck, color: '#10B981' },  // 绿色
                            { value: batchStats.pendingCertification, color: '#F59E0B' }, // 黄色
                            { value: batchStats.certificationComplete, color: '#EC4899' }, // 粉色
                            { value: batchStats.processComplete, color: '#8B5CF6' }  // 紫色
                          ])
                        ) : (
                          <circle cx="50" cy="50" r="45" fill="#374151" />
                        )}

                        {/* 中心圆洞 */}
                        <circle cx="50" cy="50" r="20" fill="#1D2939" />

                        {/* 中心点 */}
                        <circle cx="50" cy="50" r="4" fill="#FFBE98" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <div className="flex items-center px-2 py-1 bg-[#171E2E]/60 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] mr-1.5"></span>
                    <span className="text-sm text-gray-300">批次已生成</span>
                  </div>
                  <div className="flex items-center px-2 py-1 bg-[#171E2E]/60 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] mr-1.5"></span>
                    <span className="text-sm text-gray-300">质检中</span>
                  </div>
                  <div className="flex items-center px-2 py-1 bg-[#171E2E]/60 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] mr-1.5"></span>
                    <span className="text-sm text-gray-300">待制证</span>
                  </div>
                  <div className="flex items-center px-2 py-1 bg-[#171E2E]/60 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899] mr-1.5"></span>
                    <span className="text-sm text-gray-300">待确认</span>
                  </div>
                  <div className="flex items-center px-2 py-1 bg-[#171E2E]/60 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] mr-1.5"></span>
                    <span className="text-sm text-gray-300">已出检</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 mb-4 flex items-center justify-center">
                <div className="w-8 h-6 bg-gray-600"></div>
              </div>
              <p className="text-gray-400 mb-2">暂无批次数据</p>
              <p className="text-xs text-gray-500">请上传Excel文件以查看统计信息</p>
            </div>
          )}

          {/* 错误提示 */}
          {batchFileError && (
            <div className="mt-4 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              {batchFileError}
            </div>
          )}
        </div>

        {/* 批次数据显示区域 */}
        <div className="bg-[#1D2939] p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white/90 font-medium">未确认批次</h3>
            <div className="flex items-center gap-2">
              <span className="filter-badge">{batchData.length} 个批次</span>
              <span className="text-xs text-gray-400">{localTime.toLocaleTimeString()}</span>
            </div>
          </div>

          {batchData.length > 0 ? (
            <div className="space-y-4">
              {batchData.map((batch, index) => {
                // 在渲染时实时计算每个批次的剩余时间
                const timeInfo = calculateRemainingTime(batch.dueTime);
                return (
                  <div key={index} className="p-4 border border-gray-700 rounded-lg hover:border-[#FFBE98]/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white/90 font-medium">
                            {batch.batchName || "未命名批次"}
                          </h3>
                          {batch.batchId && (
                            <span className="text-xs bg-[#FFBE98]/20 text-[#FFBE98] px-2 py-0.5 rounded">
                              {batch.batchId}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <p className="text-sm text-gray-400">数量: <span className="text-white/80">{batch.quantity || "未知"}</span></p>
                          <p className="text-sm text-gray-400">逾期时间: <span className="text-white/80">{batch.dueTime || "未设置"}</span></p>
                          <p className="text-sm text-gray-400">状态: <span className="text-white/80">{batch.status || "未知"}</span></p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-4">
                        <div className="flex items-center gap-2">
                          {timeInfo.isOverdue ? (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-[#FFBE98]" />
                          )}
                          <span className={`text-xl font-mono ${timeInfo.isOverdue ? 'text-red-500' : 'text-[#FFBE98]'}`}>
                            {timeInfo.remainingTime}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 mt-1">
                          {timeInfo.isOverdue ? '已逾期' : '剩余时间'}
                        </span>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${timeInfo.isOverdue ? 'bg-red-500' :
                            timeInfo.progress < 25 ? 'bg-red-500' :
                              timeInfo.progress < 50 ? 'bg-yellow-500' :
                                'bg-[#FFBE98]'
                            }`}
                          style={{ width: `${timeInfo.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">4h</span>
                        <span className="text-xs text-gray-500">
                          {timeInfo.isOverdue ? '已逾期' : `剩余: ${Math.floor((timeInfo.remainingMs / (1000 * 60 * 60)) * 10) / 10}小时`}
                        </span>
                        <span className="text-xs text-gray-500">0h</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>暂无批次数据，请上传Excel文件</p>
              <p className="text-xs mt-2 text-gray-500">支持的列名: 质检批次号、批次名称、数量、货盘(逾期时间)、状态</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container min-h-screen bg-gradient-to-br from-[#171E2E] via-[#1F2937] to-[#2C3B4F]">
      <header className="app-header">
        <div className="flex flex-col items-center justify-center" onClick={togglePage}>
          <div className="flex items-center justify-center">
            <img src="hcd-logo.png" alt="Holt Cloud Design" className="w-28 h-28 mr-0" />
            <div>
              <h1 className="text-2xl font-semibold text-white/90 mb-1">数据筛选工具</h1>
              <p className="text-sm text-gray-400">Data Filtering Assistant</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <div className="flex bg-[#1D2939] rounded-full p-1">
            <button
              className={`px-4 py-2 rounded-full text-sm transition-colors ${activePage === 'dataFilter'
                ? 'bg-[#FFBE98] text-gray-900 font-medium'
                : 'text-gray-400 hover:text-white'
                }`}
              onClick={() => setActivePage('dataFilter')}
            >
              数据筛选
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm transition-colors ${activePage === 'batchTimer'
                ? 'bg-[#FFBE98] text-gray-900 font-medium'
                : 'text-gray-400 hover:text-white'
                }`}
              onClick={() => setActivePage('batchTimer')}
            >
              检测批次计时
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm transition-colors ${activePage === 'dataAnalysis'
                ? 'bg-[#FFBE98] text-gray-900 font-medium'
                : 'text-gray-400 hover:text-white'
                }`}
              onClick={() => setActivePage('dataAnalysis')}
            >
              入库量时段分析
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm transition-colors ${activePage === 'fulfillmentStatus'
                ? 'bg-[#3B82F6] text-gray-900 font-medium'
                : 'text-gray-400 hover:text-white'
                }`}
              onClick={() => setActivePage('fulfillmentStatus')}
            >
              待入库/待绑码统计
            </button>
          </div>
        </div>
      </header>

      <main>
        {activePage === 'dataFilter' ? (
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <div className="glass-card p-6 flex items-center justify-center">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 w-full ${dragActive ? 'border-[#FFBE98] bg-[#FFBE98]/10' : 'border-gray-700 hover:border-[#FFBE98]/50'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept=".csv"
                    className="hidden"
                  />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-[#FFBE98]" />
                  <p className="text-gray-300 mb-4">
                    拖放CSV文件到这里，或者
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="glass-button mx-auto"
                    disabled={isLoading}
                  >
                    <Upload className="w-4 h-4" />
                    <span>选择文件</span>
                  </button>
                </div>
              </div>

              {/* Messages Section */}
              <div className="glass-card p-6 flex items-center justify-center">
                <div
                  ref={chatContainerRef}
                  className="h-[120px] w-full overflow-y-auto flex flex-col justify-center"
                >
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`message-bubble ${message.isUser ? 'message-user' : 'message-system'
                        }`}
                    >
                      {message.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {hasUploadedFile && (
              <div className="mt-8">
                <div className="glass-card mt-8 p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white/90">筛选结果</h2>
                  </div>

                  <div className="space-y-6">
                    {filterResults.map((result, index) => (
                      <div key={index} className="filter-card">
                        <div className="filter-header">
                          <div className="flex items-center">
                            <div className="filter-dot"></div>
                            <h3 className="text-white/90 text-sm font-medium">{result.name}</h3>
                          </div>
                          <span className="filter-badge">
                            {result.data.length} 条
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="table-container">
                            <table className="w-full table-fixed">
                              <thead>
                                <tr>
                                  {columnsToDisplay.map((column) => (
                                    <th key={column} className={`px-4 py-3 ${column === "证书编码" ? "w-[140px]" :
                                      column === "商品名称" ? "w-[180px]" :
                                        column === "商品材质" ? "w-[120px]" :
                                          column === "宝玉石结论" ? "w-[120px]" :
                                            column === "贵金属结论" ? "w-[120px]" :
                                              column === "重量" ? "w-[100px]" :
                                                column === "备注" ? "w-[160px]" :
                                                  "w-[100px]"
                                      }`}>
                                      <button
                                        className="flex items-center gap-1 hover:text-[#FFBE98] transition-colors w-full"
                                        onClick={() => handleSort(column)}
                                      >
                                        <span className="truncate">{column}</span>
                                        <ArrowUpDown
                                          className={`w-4 h-4 flex-shrink-0 ${sortConfig.column === column
                                            ? 'text-[#FFBE98]'
                                            : ''
                                            }`}
                                        />
                                      </button>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {filterAndSortData(result.data).map((item, itemIndex) => (
                                  <tr key={itemIndex}>
                                    {columnsToDisplay.map((column) => (
                                      <td
                                        key={column}
                                        className="px-4 py-3 break-words"
                                      >
                                        {column === "证书编码" ? (
                                          <div className="flex items-center gap-2">
                                            <span>{item[column]}</span>
                                            <button
                                              onClick={() => handleCopy(item[column])}
                                              className="p-1 hover:bg-[#FFBE98]/20 rounded transition-colors"
                                              title="复制证书编码"
                                            >
                                              {copiedCertId === item[column] ? (
                                                <Check className="w-4 h-4 text-[#FFBE98]" />
                                              ) : (
                                                <Copy className="w-4 h-4 text-gray-400 hover:text-[#FFBE98]" />
                                              )}
                                            </button>
                                          </div>
                                        ) : (
                                          item[column]
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activePage === 'batchTimer' ? (
          <BatchTimerPage />
        ) : activePage === 'dataAnalysis' ? (
          <DataAnalysisPage
            buckets={analysisBuckets}
            setBuckets={setAnalysisBuckets}
          />
        ) : (
          <FulfillmentStatusPage

            buckets={fulfillmentBuckets}

            setBuckets={setFulfillmentBuckets}
            pendingInBuckets={pendingInBuckets}
            setPendingInBuckets={setPendingInBuckets}
            pieData={pieData}
            setPieData={setPieData}
          />
        )}
      </main>

      {error && (
        <div className="fixed top-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 hover:text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#1F2937] p-6 rounded-xl shadow-xl flex items-center gap-3">
            <div className="loading-spinner" />
            <span className="text-white/90">处理中...</span>
          </div>
        </div>
      )}

      {batchFileError && (
        <div className="fixed top-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          <span>{batchFileError}</span>
          <button
            onClick={() => setBatchFileError(null)}
            className="ml-2 hover:text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 mt-8 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} 抖音项目组 - All Rights Reserved -
          </p>
        </div>
      </footer>


    </div>
  );
}

export default App;