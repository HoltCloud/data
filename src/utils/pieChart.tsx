import React from 'react';

export function renderPieChart(sectors: { value: number; color: string }[]) {
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
    if (percentage > 0.03) {
      const labelAngle = startAngle + (endAngle - startAngle) / 2;
      const labelRadius = 32;
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
