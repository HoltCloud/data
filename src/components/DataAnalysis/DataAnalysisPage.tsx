import React from 'react';
import { Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { CsvData } from '../../types';
import { TIME_BUCKETS, parseTimeToHour } from '../../utils/csvParser';

export function DataAnalysisPage({
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
      } catch {
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
