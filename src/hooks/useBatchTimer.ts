import { useEffect, Dispatch, SetStateAction } from 'react';
import { BatchData } from '../types';

export interface RemainingTimeInfo {
  remainingTime: string;
  progress: number;
  isOverdue: boolean;
  remainingMs: number;
}

export function calculateRemainingTime(dueTimeStr: string, currentTime: Date): RemainingTimeInfo {
  let dueTime: Date | null = null;

  try {
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

    if (!dueTime || isNaN(dueTime.getTime())) {
      console.warn(`无法解析逾期时间: ${dueTimeStr}`);
      return { remainingTime: "无效时间", progress: 0, isOverdue: false, remainingMs: 0 };
    }

    const remainingMs = dueTime.getTime() - currentTime.getTime();
    const isOverdue = remainingMs <= 0;

    let formattedTime = "";
    if (isOverdue) {
      const overdueDuration = Math.abs(remainingMs);
      const hours = Math.floor(overdueDuration / (1000 * 60 * 60));
      const minutes = Math.floor((overdueDuration % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((overdueDuration % (1000 * 60)) / 1000);
      formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
      formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // 计算进度百分比 (4小时 = 100%)
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
    return { remainingTime: "计算错误", progress: 0, isOverdue: false, remainingMs: 0 };
  }
}

export function useBatchTimer(
  batchData: BatchData[],
  setBatchData: Dispatch<SetStateAction<BatchData[]>>,
  setCurrentTime: Dispatch<SetStateAction<Date>>
) {
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (batchData.length > 0) {
        setBatchData(prevData => {
          const updatedData = prevData.map(batch => {
            const timeInfo = calculateRemainingTime(batch.dueTime, now);
            return { ...batch, ...timeInfo };
          });

          return updatedData.sort((a, b) => {
            if (!a.remainingMs || a.remainingMs === Infinity) return 1;
            if (!b.remainingMs || b.remainingMs === Infinity) return -1;
            return a.remainingMs - b.remainingMs;
          });
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchData.length]);
}
