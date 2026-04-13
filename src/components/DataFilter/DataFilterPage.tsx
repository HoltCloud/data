import React, { useState, useRef, useEffect } from 'react';
import { Upload, ArrowUpDown, Copy, Check } from 'lucide-react';
import { CsvData, FilterResult, SortConfig } from '../../types';
import { parseCSV } from '../../utils/csvParser';
import { filterData } from '../../utils/filterRules';

const COLUMNS_TO_DISPLAY = [
  "证书编码",
  "商品名称",
  "商品材质",
  "宝玉石结论",
  "贵金属结论",
  "重量",
  "备注",
  "饰品类型"
];

export function DataFilterPage() {
  const [filterResults, setFilterResults] = useState<FilterResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: null });
  const [copiedCertId, setCopiedCertId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (text: string, isUser: boolean) => {
    setMessages(prev => [...prev, { text, isUser }]);
  };

  const processFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      addMessage(`错误：请上传CSV文件。当前文件类型: ${file.type}`, true);
      return;
    }

    setIsLoading(true);
    addMessage(`正在处理文件: ${file.name}`, true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);
        addMessage(`文件已成功加载，共 ${parsedData.length} 条记录。正在筛选数据...`, false);

        const startTime = performance.now();
        const results = filterData(parsedData);
        const filteredResults = results.filter(result => result.data.length > 0);
        setFilterResults(filteredResults);

        const endTime = performance.now();
        const timeUsed = (endTime - startTime) / 1000;
        const totalFilteredRows = filteredResults.reduce((sum, result) => sum + result.data.length, 0);
        addMessage(`筛选完成，共找到 ${totalFilteredRows} 条符合条件的记录，分布在 ${filteredResults.length} 个筛选条件中。筛选用时: ${timeUsed.toFixed(4)}秒`, false);

        setIsLoading(false);
        setHasUploadedFile(true);
      } catch (err) {
        console.error('Error processing CSV:', err);
        addMessage('CSV解析错误，请检查文件格式是否正确。', false);
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      addMessage('文件读取错误，请重试。', false);
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

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
    if (files.length > 0) processFile(files[0]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processFile(files[0]);
  };

  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filterAndSortData = (data: CsvData[]) => {
    let filtered = data;
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
      await navigator.clipboard.writeText(text.trim());
      setCopiedCertId(text);
      setTimeout(() => setCopiedCertId(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="glass-card p-6 flex items-center justify-center">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 w-full ${dragActive ? 'border-[#FFBE98] bg-[#FFBE98]/10' : 'border-gray-700 hover:border-[#FFBE98]/50'}`}
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
            <p className="text-gray-300 mb-4">拖放CSV文件到这里，或者</p>
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
          <div ref={chatContainerRef} className="h-[120px] w-full overflow-y-auto flex flex-col justify-center">
            {messages.map((message, index) => (
              <div key={index} className={`message-bubble ${message.isUser ? 'message-user' : 'message-system'}`}>
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
                    <span className="filter-badge">{result.data.length} 条</span>
                  </div>
                  <div className="p-4">
                    <div className="table-container">
                      <table className="w-full table-fixed">
                        <thead>
                          <tr>
                            {COLUMNS_TO_DISPLAY.map((column) => (
                              <th key={column} className={`px-4 py-3 ${
                                column === "证书编码" ? "w-[140px]" :
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
                                  <ArrowUpDown className={`w-4 h-4 flex-shrink-0 ${sortConfig.column === column ? 'text-[#FFBE98]' : ''}`} />
                                </button>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filterAndSortData(result.data).map((item, itemIndex) => (
                            <tr key={itemIndex}>
                              {COLUMNS_TO_DISPLAY.map((column) => (
                                <td key={column} className="px-4 py-3 break-words">
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
  );
}
