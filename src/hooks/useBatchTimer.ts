import { useEffect, Dispatch, SetStateAction } from 'react';
import { BatchData } from '../types';

export interface RemainingTimeInfo {
  remainingTime: string;
  progress: number;
  isOverdue: boolean;
  remainingMs: number;
}

function parseDueTime(dueTimeStr: string, currentTime: Date): Date | null {
  const value = dueTimeStr.trim();
  if (!value) return null;

  const timeOnly = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeOnly) {
    const hours = Number(timeOnly[1]);
    const minutes = Number(timeOnly[2]);
    const seconds = Number(timeOnly[3] || 0);
    if (hours > 23 || minutes > 59 || seconds > 59) return null;

    const result = new Date(currentTime);
    result.setHours(hours, minutes, seconds, 0);
    return result;
  }

  // Explicitly parse common local-date formats instead of relying on
  // implementation-dependent parsing of strings such as "2026-08-19 09:30".
  const dateTime = value.match(
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (dateTime) {
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = dateTime;
    const result = new Date(
      Number(year), Number(month) - 1, Number(day),
      Number(hour), Number(minute), Number(second), 0
    );
    const isValid = result.getFullYear() === Number(year)
      && result.getMonth() === Number(month) - 1
      && result.getDate() === Number(day)
      && result.getHours() === Number(hour)
      && result.getMinutes() === Number(minute);
    return isValid ? result : null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function calculateRemainingTime(dueTimeStr: string, currentTime: Date): RemainingTimeInfo {
  try {
    const dueTime = parseDueTime(dueTimeStr, currentTime);

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
