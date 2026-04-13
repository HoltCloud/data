import React, { useState, useEffect } from 'react';
import { Upload, Clock, AlertTriangle } from 'lucide-react';
import { BatchData } from '../../types';
import { calculateRemainingTime } from '../../hooks/useBatchTimer';
import { renderPieChart } from '../../utils/pieChart';

interface BatchStats {
  total: number;
  batchGenerated: number;
  inQualityCheck: number;
  pendingCertification: number;
  certificationComplete: number;
  processComplete: number;
  totalQuantity: number;
}

interface BatchTimerPageProps {
  batchData: BatchData[];
  allBatchData: BatchData[];
  batchFileError: string | null;
  currentTime: Date;
  batchStats: BatchStats;
  processBatchFile: (file: File) => void;
  clearBatchData: () => void;
}

export function BatchTimerPage({
  batchData,
  allBatchData,
  batchFileError,
  currentTime,
  batchStats,
  processBatchFile,
  clearBatchData,
}: BatchTimerPageProps) {
  const [localTime, setLocalTime] = useState(new Date());

  // 添加本地计时器，每100毫秒更新一次
  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(new Date());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isExcel =
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls');
      if (!isExcel) {
        alert("请选择.xlsx或.xls格式的Excel文件");
        return;
      }
      processBatchFile(file);
    }
    event.target.value = '';
  };

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

      {/* 批次统计信息框 */}
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full">
                    <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-lg">
                      <circle cx="50" cy="50" r="48" fill="#1D2939" />
                      {batchStats.total > 0 && [
                        batchStats.batchGenerated,
                        batchStats.inQualityCheck,
                        batchStats.pendingCertification,
                        batchStats.certificationComplete,
                        batchStats.processComplete
                      ].some(val => val > 0) ? (
                        renderPieChart([
                          { value: batchStats.batchGenerated, color: '#3B82F6' },
                          { value: batchStats.inQualityCheck, color: '#10B981' },
                          { value: batchStats.pendingCertification, color: '#F59E0B' },
                          { value: batchStats.certificationComplete, color: '#EC4899' },
                          { value: batchStats.processComplete, color: '#8B5CF6' }
                        ])
                      ) : (
                        <circle cx="50" cy="50" r="45" fill="#374151" />
                      )}
                      <circle cx="50" cy="50" r="20" fill="#1D2939" />
                      <circle cx="50" cy="50" r="4" fill="#FFBE98" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {[
                  { color: '#3B82F6', label: '批次已生成' },
                  { color: '#10B981', label: '质检中' },
                  { color: '#F59E0B', label: '待制证' },
                  { color: '#EC4899', label: '待确认' },
                  { color: '#8B5CF6', label: '已出检' },
                ].map(item => (
                  <div key={item.label} className="flex items-center px-2 py-1 bg-[#171E2E]/60 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: item.color }}></span>
                    <span className="text-sm text-gray-300">{item.label}</span>
                  </div>
                ))}
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
              const timeInfo = calculateRemainingTime(batch.dueTime, currentTime);
              return (
                <div key={index} className="p-4 border border-gray-700 rounded-lg hover:border-[#FFBE98]/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white/90 font-medium">{batch.batchName || "未命名批次"}</h3>
                        {batch.batchId && (
                          <span className="text-xs bg-[#FFBE98]/20 text-[#FFBE98] px-2 py-0.5 rounded">{batch.batchId}</span>
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
}
