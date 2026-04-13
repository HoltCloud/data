import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { CsvData, BatchData } from './types';
import { calculateRemainingTime, useBatchTimer } from './hooks/useBatchTimer';
import { DataFilterPage } from './components/DataFilter/DataFilterPage';
import { BatchTimerPage } from './components/BatchTimer/BatchTimerPage';
import { DataAnalysisPage } from './components/DataAnalysis/DataAnalysisPage';
import { FulfillmentStatusPage } from './components/FulfillmentStatus/FulfillmentStatusPage';

function App() {
  // 导航状态
  const [activePage, setActivePage] = useState<'dataFilter' | 'batchTimer' | 'dataAnalysis' | 'fulfillmentStatus'>(
    () => (localStorage.getItem('activePage') as 'dataFilter' | 'batchTimer' | 'dataAnalysis' | 'fulfillmentStatus') || 'dataFilter'
  );

  // 批次计时器状态
  const [batchData, setBatchData] = useState<BatchData[]>(() => {
    const saved = localStorage.getItem('batchData');
    return saved ? JSON.parse(saved) : [];
  });
  const [allBatchData, setAllBatchData] = useState<BatchData[]>(() => {
    const saved = localStorage.getItem('allBatchData');
    return saved ? JSON.parse(saved) : [];
  });
  const [batchFileError, setBatchFileError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 数据分析页状态
  const [analysisBuckets, setAnalysisBuckets] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  // 履约状态页状态
  const [fulfillmentBuckets, setFulfillmentBuckets] = useState<{ name: string; count: number }[]>([]);
  const [pendingInBuckets, setPendingInBuckets] = useState<{ name: string; count: number }[]>([]);
  const [pieData, setPieData] = useState<{ label: string; value: number; color: string }[]>([]);

  // 批次计时器 Hook（每秒更新剩余时间）
  useBatchTimer(batchData, setBatchData, setCurrentTime);

  // 持久化到 localStorage
  useEffect(() => {
    localStorage.setItem('activePage', activePage);
  }, [activePage]);

  useEffect(() => {
    localStorage.setItem('batchData', JSON.stringify(batchData));
  }, [batchData]);

  useEffect(() => {
    localStorage.setItem('allBatchData', JSON.stringify(allBatchData));
  }, [allBatchData]);

  // 处理批次 Excel 文件
  const processBatchFile = (file: File) => {
    setBatchFileError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("文件数据为空");

        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
          cellNF: false,
          cellText: false
        });

        if (workbook.SheetNames.length === 0) throw new Error("Excel文件没有工作表");

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          raw: false,
          defval: "",
          header: "A",
          blankrows: false
        });

        if (jsonData.length === 0) throw new Error("Excel文件没有数据");

        const firstRow = jsonData[0];
        let processedData: CsvData[] = [];

        const hasColumnHeaders = Object.keys(firstRow).some(key =>
          typeof firstRow[key] === 'string' &&
          (String(firstRow[key]).includes('批次') ||
            String(firstRow[key]).includes('质检') ||
            String(firstRow[key]).includes('状态') ||
            String(firstRow[key]).includes('数量') ||
            String(firstRow[key]).includes('货盘'))
        );

        if (hasColumnHeaders) {
          processedData = XLSX.utils.sheet_to_json<CsvData>(worksheet, {
            raw: false,
            defval: "",
            blankrows: false
          });
        } else {
          processedData = jsonData.map((row) => {
            const mappedRow: CsvData = {};
            if (row['A']) mappedRow['质检批次号'] = String(row['A']);
            if (row['B']) mappedRow['批次名称'] = String(row['B']);
            if (row['C']) mappedRow['数量'] = String(row['C']);
            if (row['D']) mappedRow['货盘'] = String(row['D']);
            if (row['E']) mappedRow['状态'] = String(row['E']);
            return mappedRow;
          });
        }

        const { filteredBatchData, allProcessedBatchData } = processBatchData(processedData);

        if (allProcessedBatchData.length === 0) {
          throw new Error("没有找到有效的批次数据，请检查文件格式和列名");
        }

        setBatchData(filteredBatchData);
        setAllBatchData(allProcessedBatchData);
        localStorage.setItem('batchData', JSON.stringify(filteredBatchData));
        localStorage.setItem('allBatchData', JSON.stringify(allProcessedBatchData));
      } catch (err) {
        console.error('Error processing batch file:', err);
        setBatchFileError(`批次文件解析错误: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    };

    reader.onerror = (e) => {
      console.error('文件读取错误:', e);
      setBatchFileError('文件读取错误');
    };

    reader.readAsArrayBuffer(file);
  };

  // 处理批次数据行
  const processBatchData = (data: CsvData[]): { filteredBatchData: BatchData[]; allProcessedBatchData: BatchData[] } => {
    const getColumnValue = (row: CsvData, possibleNames: string[]): string => {
      for (const name of possibleNames) {
        if (row[name] !== undefined) return row[name] || "";
      }
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

    function processRow(row: CsvData): BatchData {
      let dueTime = getColumnValue(row, ["货盘", "逾期时间", "DueTime", "duetime", "时间", "预计时间"]);

      if (/^\d{4}$/.test(dueTime)) {
        dueTime = `${dueTime.substring(0, 2)}:${dueTime.substring(2, 4)}`;
      } else if (/^\d{1,2}:\d{1,2}$/.test(dueTime)) {
        const [h, m] = dueTime.split(':').map(Number);
        dueTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      } else if (/^\d{1,2}$/.test(dueTime)) {
        dueTime = `${dueTime.padStart(2, '0')}:00`;
      } else if (dueTime.includes('/') || dueTime.includes('-')) {
        try {
          const date = new Date(dueTime);
          if (!isNaN(date.getTime())) {
            dueTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          }
        } catch {
          // 忽略错误
        }
      }

      const now = new Date();
      const startTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      return {
        batchId: getColumnValue(row, ["质检批次号", "批次号", "BatchId", "batchid", "编号", "ID"]) || "未知批次",
        batchName: getColumnValue(row, ["批次名称", "名称", "BatchName", "batchname", "品名", "产品名称"]) || "未命名批次",
        quantity: getColumnValue(row, ["数量", "Quantity", "quantity", "件数", "个数"]),
        dueTime,
        status: getColumnValue(row, ["状态", "Status", "status", "检验状态", "检测状态"]),
        startTime,
        ...calculateRemainingTime(dueTime, now)
      };
    }

    const allProcessedBatchData = data.map(row => processRow(row));

    const filteredData = data.filter(row => {
      const status = getColumnValue(row, ["状态", "Status", "status", "检验状态", "检测状态"]).toLowerCase();
      if (status.includes("制证完成")) return true;
      return !["已出检", "已完成", "完成", "流程完成"].some(s => status.includes(s.toLowerCase()));
    });

    const filteredBatchData = filteredData.length === 0 ? [] : filteredData.map(row => processRow(row));

    return { filteredBatchData, allProcessedBatchData };
  };

  // 清除批次数据
  const clearBatchData = () => {
    if (window.confirm('确定要清除所有批次数据吗？此操作不可撤销。')) {
      setBatchData([]);
      setAllBatchData([]);
      localStorage.removeItem('batchData');
      localStorage.removeItem('allBatchData');
    }
  };

  // 计算批次统计数据
  const calculateBatchStatistics = () => {
    if (allBatchData.length === 0) return {
      total: 0, batchGenerated: 0, inQualityCheck: 0,
      pendingCertification: 0, certificationComplete: 0,
      processComplete: 0, totalQuantity: 0
    };

    const stats = {
      total: allBatchData.length,
      batchGenerated: 0, inQualityCheck: 0,
      pendingCertification: 0, certificationComplete: 0,
      processComplete: 0, totalQuantity: 0
    };

    allBatchData.forEach(batch => {
      const quantity = parseInt(batch.quantity) || 0;
      stats.totalQuantity += quantity;
      const status = batch.status.toLowerCase();
      if (status.includes("批次已生成")) stats.batchGenerated += quantity;
      else if (status.includes("质检中")) stats.inQualityCheck += quantity;
      else if (status.includes("待制证")) stats.pendingCertification += quantity;
      else if (status.includes("制证完成")) stats.certificationComplete += quantity;
      else if (status.includes("流程完成") || status.includes("已出检") || status.includes("已完成") || status.includes("完成")) stats.processComplete += quantity;
    });

    return stats;
  };

  return (
    <div className="app-container min-h-screen bg-gradient-to-br from-[#171E2E] via-[#1F2937] to-[#2C3B4F]">
      <header className="app-header">
        <div className="flex flex-col items-center justify-center">
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
            {(['dataFilter', 'batchTimer', 'dataAnalysis', 'fulfillmentStatus'] as const).map((page) => {
              const labels: Record<string, string> = {
                dataFilter: '数据筛选',
                batchTimer: '检测批次计时',
                dataAnalysis: '入库量时段分析',
                fulfillmentStatus: '待入库/待绑码统计',
              };
              const activeColor = page === 'fulfillmentStatus' ? 'bg-[#3B82F6]' : 'bg-[#FFBE98]';
              return (
                <button
                  key={page}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${activePage === page
                    ? `${activeColor} text-gray-900 font-medium`
                    : 'text-gray-400 hover:text-white'
                    }`}
                  onClick={() => setActivePage(page)}
                >
                  {labels[page]}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main>
        {activePage === 'dataFilter' && <DataFilterPage />}
        {activePage === 'batchTimer' && (
          <BatchTimerPage
            batchData={batchData}
            allBatchData={allBatchData}
            batchFileError={batchFileError}
            currentTime={currentTime}
            batchStats={calculateBatchStatistics()}
            processBatchFile={processBatchFile}
            clearBatchData={clearBatchData}
          />
        )}
        {activePage === 'dataAnalysis' && (
          <DataAnalysisPage
            buckets={analysisBuckets}
            setBuckets={setAnalysisBuckets}
          />
        )}
        {activePage === 'fulfillmentStatus' && (
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
