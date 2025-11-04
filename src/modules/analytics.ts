/**
 * Analytics and visualization module
 */

import type { Estimate } from '../types/index';

export interface AnalyticsData {
  totalEstimates: number;
  totalValue: number;
  averageValue: number;
  monthlyTrends: { month: string; count: number; value: number }[];
  categoryBreakdown: { category: string; count: number; value: number }[];
  topClients: { client: string; count: number; value: number }[];
}

export class Analytics {
  calculateStats(estimates: Estimate[]): AnalyticsData {
    const totalEstimates = estimates.length;
    const totalValue = estimates.reduce((sum, est) => sum + est.total, 0);
    const averageValue = totalEstimates > 0 ? totalValue / totalEstimates : 0;

    return {
      totalEstimates,
      totalValue,
      averageValue,
      monthlyTrends: this.getMonthlyTrends(estimates),
      categoryBreakdown: this.getCategoryBreakdown(estimates),
      topClients: this.getTopClients(estimates),
    };
  }

  private getMonthlyTrends(
    estimates: Estimate[]
  ): { month: string; count: number; value: number }[] {
    const monthMap = new Map<string, { count: number; value: number }>();

    estimates.forEach(est => {
      const date = new Date(est.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { count: 0, value: 0 });
      }

      const data = monthMap.get(monthKey)!;
      data.count++;
      data.value += est.total;
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }

  private getCategoryBreakdown(
    estimates: Estimate[]
  ): { category: string; count: number; value: number }[] {
    const categoryMap = new Map<string, { count: number; value: number }>();

    estimates.forEach(est => {
      const category = est.category || 'Без категории';

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, value: 0 });
      }

      const data = categoryMap.get(category)!;
      data.count++;
      data.value += est.total;
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value);
  }

  private getTopClients(estimates: Estimate[]): { client: string; count: number; value: number }[] {
    const clientMap = new Map<string, { count: number; value: number }>();

    estimates.forEach(est => {
      const client = est.client || 'Не указан';

      if (!clientMap.has(client)) {
        clientMap.set(client, { count: 0, value: 0 });
      }

      const data = clientMap.get(client)!;
      data.count++;
      data.value += est.total;
    });

    return Array.from(clientMap.entries())
      .map(([client, data]) => ({ client, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 clients
  }

  generateChart(
    canvas: HTMLCanvasElement,
    data: number[],
    labels: string[],
    type: 'bar' | 'line' | 'pie'
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (type === 'bar') {
      this.drawBarChart(ctx, data, labels, width, height, padding);
    } else if (type === 'line') {
      this.drawLineChart(ctx, data, labels, width, height, padding);
    } else if (type === 'pie') {
      this.drawPieChart(ctx, data, labels, width, height);
    }
  }

  private drawBarChart(
    ctx: CanvasRenderingContext2D,
    data: number[],
    labels: string[],
    width: number,
    height: number,
    padding: number
  ): void {
    const maxValue = Math.max(...data);
    const barWidth = (width - padding * 2) / data.length;
    const scale = (height - padding * 2) / maxValue;

    // Set styles
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // Draw bars
    data.forEach((value, i) => {
      const barHeight = value * scale;
      const x = padding + i * barWidth;
      const y = height - padding - barHeight;

      ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
      ctx.strokeRect(x + 5, y, barWidth - 10, barHeight);

      // Draw labels
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i].substring(0, 10), x + barWidth / 2, height - padding + 20);

      // Draw values
      ctx.fillText(this.formatValue(value), x + barWidth / 2, y - 5);
      ctx.fillStyle = '#3b82f6';
    });

    // Draw axes
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
  }

  private drawLineChart(
    ctx: CanvasRenderingContext2D,
    data: number[],
    labels: string[],
    width: number,
    height: number,
    padding: number
  ): void {
    const maxValue = Math.max(...data);
    const pointSpacing = (width - padding * 2) / (data.length - 1 || 1);
    const scale = (height - padding * 2) / maxValue;

    // Draw line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, i) => {
      const x = padding + i * pointSpacing;
      const y = height - padding - value * scale;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    data.forEach((value, i) => {
      const x = padding + i * pointSpacing;
      const y = height - padding - value * scale;

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw labels
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i].substring(0, 10), x, height - padding + 20);
    });

    // Draw axes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
  }

  private drawPieChart(
    ctx: CanvasRenderingContext2D,
    data: number[],
    labels: string[],
    width: number,
    height: number
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;
    const total = data.reduce((sum, val) => sum + val, 0);

    const colors = [
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#f59e0b',
      '#10b981',
      '#06b6d4',
      '#6366f1',
      '#f97316',
    ];

    let currentAngle = -Math.PI / 2;

    data.forEach((value, i) => {
      const sliceAngle = (value / total) * Math.PI * 2;

      // Draw slice
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 30);

      ctx.fillStyle = '#1e293b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i].substring(0, 15), labelX, labelY);
      ctx.fillText(((value / total) * 100).toFixed(1) + '%', labelX, labelY + 15);

      currentAngle += sliceAngle;
    });
  }

  private formatValue(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toFixed(0);
  }
}

export const analytics = new Analytics();
