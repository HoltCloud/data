import React from 'react';
import { Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { CsvData } from '../../types';

export function FulfillmentStatusPage({
  buckets,
  setBuckets,
  pendingInBuckets,
  setPendingInBuckets,
  pieData,
  setPieData
}: {
  buckets: { name: string; count: number }[];
  setBuckets: React.Dispatch<React.SetStateAction<{ name: string; count: number }[]>>;
  pendingInBuckets: { name: string; count: number }[];
  setPendingInBuckets: React.Dispatch<React.SetStateAction<{ name: string; count: number }[]>>;
  pieData: { label: string; value: number; color: string }[];
  setPieData: React.Dispatch<React.SetStateAction<{ label: string; value: number; color: string }[]>>;
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
        let waitBind = 0, waitIn = 0;
        json.forEach(row => {
          const merchant = (row['商家名称'] || row['商户名称'] || row['商家'] || row['商户'] || '未知商家').toString().trim();
          let status = (row['订单履约状态'] || row['履约状态'] || row['状态'] || '').toString().trim();
          // 统一全角转半角，去除所有空白字符，转小写
          status = status.replace(/[\u3000]/g, ' ').replace(/\s/g, '').toLowerCase();
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
        ]);
      } catch {
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
  const barHeight = 12;
  const barGap = 4;
  const chartHeight = buckets.length * (barHeight + barGap) + 40;
  const chartWidth = 420;
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
                      <text x={110} y={y + barHeight / 2 + 4} textAnchor="end" fill="#E2E8F0" fontSize="12" fontWeight="bold">{b.name}</text>
                      <rect x={130} y={y} width={barWidth} height={barHeight} fill="#10B981" rx="6" />
                      <text x={130 + barWidth + 8} y={y + barHeight / 2 + 4} textAnchor="start" fill="#10B981" fontSize="12" fontWeight="bold">{b.count}</text>
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
                      <text x={110} y={y + barHeight / 2 + 4} textAnchor="end" fill="#E2E8F0" fontSize="12" fontWeight="bold">{b.name}</text>
                      <rect x={130} y={y} width={barWidth} height={barHeight} fill={barColors[i % barColors.length]} rx="6" />
                      <text x={130 + barWidth + 8} y={y + barHeight / 2 + 4} textAnchor="start" fill="#3B82F6" fontSize="12" fontWeight="bold">{b.count}</text>
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
                    const pathData = [`M 120 120`, `L ${x1} ${y1}`, `A 100 100 0 ${largeArc} 1 ${x2} ${y2}`, `Z`].join(' ');
                    elements.push(<path key={d.label} d={pathData} fill={d.color} />);
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
