/**
 * Advanced Data Visualization Module
 * Interactive dashboards with D3.js-like capabilities using Canvas
 */

export interface ChartOptions {
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  colors?: string[];
  animated?: boolean;
  interactive?: boolean;
  legend?: boolean;
}

export interface DataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: any;
}

export class AdvancedVisualization {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrame: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context not available');
    }
    this.ctx = context;
    this.setupInteractions();
  }

  /**
   * Create interactive heatmap
   */
  public createHeatmap(
    data: number[][],
    labels: { x: string[]; y: string[] },
    options: ChartOptions = {}
  ): void {
    const {
      width = this.canvas.width,
      height = this.canvas.height,
      margin = { top: 40, right: 40, bottom: 60, left: 80 },
      colors = ['#3b82f6', '#ef4444'],
    } = options;

    this.clear();

    const cellWidth = (width - margin.left - margin.right) / data[0].length;
    const cellHeight = (height - margin.top - margin.bottom) / data.length;

    // Find min/max for color scale
    const flat = data.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);

    // Draw cells
    data.forEach((row, i) => {
      row.forEach((value, j) => {
        const x = margin.left + j * cellWidth;
        const y = margin.top + i * cellHeight;

        // Calculate color based on value
        const ratio = (value - min) / (max - min);
        this.ctx.fillStyle = this.interpolateColor(colors[0], colors[1], ratio);
        this.ctx.fillRect(x, y, cellWidth, cellHeight);

        // Draw border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.strokeRect(x, y, cellWidth, cellHeight);

        // Draw value
        this.ctx.fillStyle = ratio > 0.5 ? '#fff' : '#000';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(value.toFixed(0), x + cellWidth / 2, y + cellHeight / 2);
      });
    });

    // Draw labels
    this.drawLabels(labels, margin, cellWidth, cellHeight);
  }

  /**
   * Create animated bubble chart
   */
  public createBubbleChart(
    data: Array<{ x: number; y: number; size: number; label: string; color?: string }>,
    options: ChartOptions = {}
  ): void {
    const {
      width = this.canvas.width,
      height = this.canvas.height,
      margin = { top: 40, right: 40, bottom: 60, left: 60 },
      animated = true,
    } = options;

    this.clear();

    // Find ranges
    const xValues = data.map(d => d.x);
    const yValues = data.map(d => d.y);
    const sizeValues = data.map(d => d.size);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const sizeMax = Math.max(...sizeValues);

    // Scale functions
    const xScale = (value: number) =>
      margin.left + ((value - xMin) / (xMax - xMin)) * (width - margin.left - margin.right);

    const yScale = (value: number) =>
      height -
      margin.bottom -
      ((value - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);

    const sizeScale = (value: number) => 5 + (value / sizeMax) * 50;

    // Draw axes
    this.drawAxes(width, height, margin);

    // Animation setup
    let frame = 0;
    const maxFrames = animated ? 60 : 1;

    const animate = () => {
      if (frame < maxFrames) {
        const progress = frame / maxFrames;

        // Easing function
        const eased = 1 - Math.pow(1 - progress, 3);

        // Clear bubbles area only
        this.ctx.clearRect(
          margin.left,
          margin.top,
          width - margin.left - margin.right,
          height - margin.top - margin.bottom
        );

        // Draw bubbles
        data.forEach((point, index) => {
          const x = xScale(point.x);
          const y = yScale(point.y);
          const radius = sizeScale(point.size) * eased;

          // Draw bubble
          this.ctx.beginPath();
          this.ctx.arc(x, y, radius, 0, Math.PI * 2);
          this.ctx.fillStyle = point.color || this.getColorByIndex(index);
          this.ctx.globalAlpha = 0.6;
          this.ctx.fill();
          this.ctx.globalAlpha = 1;

          // Draw border
          this.ctx.strokeStyle = point.color || this.getColorByIndex(index);
          this.ctx.lineWidth = 2;
          this.ctx.stroke();

          // Draw label if fully animated
          if (frame === maxFrames - 1) {
            this.ctx.fillStyle = '#000';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(point.label, x, y - radius - 5);
          }
        });

        frame++;
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    if (animated) {
      animate();
    } else {
      frame = maxFrames - 1;
      animate();
    }
  }

  /**
   * Create Sankey diagram for flow visualization
   */
  public createSankeyDiagram(
    nodes: Array<{ id: string; label: string }>,
    links: Array<{ source: string; target: string; value: number }>,
    options: ChartOptions = {}
  ): void {
    const {
      width = this.canvas.width,
      height = this.canvas.height,
      margin = { top: 20, right: 20, bottom: 20, left: 20 },
    } = options;

    this.clear();

    // Calculate node positions
    const nodeWidth = 20;
    const nodeSpacing = 10;
    const totalValue = links.reduce((sum, link) => sum + link.value, 0);

    // Simple layout: arrange nodes in columns
    const columns = 3;
    const columnWidth = (width - margin.left - margin.right - nodeWidth * columns) / (columns - 1);

    nodes.forEach((node, index) => {
      const column = Math.floor(index / Math.ceil(nodes.length / columns));
      const row = index % Math.ceil(nodes.length / columns);

      const x = margin.left + column * (nodeWidth + columnWidth);
      const y = margin.top + row * (height / Math.ceil(nodes.length / columns));
      const nodeHeight = 60;

      // Draw node
      this.ctx.fillStyle = this.getColorByIndex(index);
      this.ctx.fillRect(x, y, nodeWidth, nodeHeight);

      // Draw label
      this.ctx.fillStyle = '#000';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(node.label, x + nodeWidth + 5, y + nodeHeight / 2);
    });

    // Draw links (simplified)
    this.ctx.globalAlpha = 0.3;
    links.forEach((link, index) => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);

      if (sourceNode && targetNode) {
        this.ctx.strokeStyle = this.getColorByIndex(index);
        this.ctx.lineWidth = (link.value / totalValue) * 50;
        this.ctx.beginPath();
        // Simplified path
        this.ctx.moveTo(100, 100);
        this.ctx.lineTo(200, 150);
        this.ctx.stroke();
      }
    });
    this.ctx.globalAlpha = 1;
  }

  /**
   * Create radar chart
   */
  public createRadarChart(
    data: Array<{ label: string; value: number; max: number }>,
    options: ChartOptions = {}
  ): void {
    const { width = this.canvas.width, height = this.canvas.height } = options;

    this.clear();

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;
    const angleStep = (Math.PI * 2) / data.length;

    // Draw background circles
    for (let i = 1; i <= 5; i++) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      this.ctx.stroke();
    }

    // Draw axes
    data.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(x, y);
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      this.ctx.stroke();
    });

    // Draw data polygon
    this.ctx.beginPath();
    data.forEach((point, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const value = (point.value / point.max) * radius;
      const x = centerX + Math.cos(angle) * value;
      const y = centerY + Math.sin(angle) * value;

      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    this.ctx.fill();
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw labels
    data.forEach((point, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelRadius = radius + 30;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;

      this.ctx.fillStyle = '#000';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(point.label, x, y);
      this.ctx.fillText(`${point.value}/${point.max}`, x, y + 15);
    });
  }

  /**
   * Create treemap visualization
   */
  public createTreemap(
    data: Array<{ label: string; value: number; color?: string }>,
    options: ChartOptions = {}
  ): void {
    const {
      width = this.canvas.width,
      height = this.canvas.height,
      margin = { top: 10, right: 10, bottom: 10, left: 10 },
    } = options;

    this.clear();

    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const availableWidth = width - margin.left - margin.right;
    const availableHeight = height - margin.top - margin.bottom;

    // Simple treemap algorithm (squarified)
    let currentX = margin.left;
    let currentY = margin.top;
    let rowHeight = 0;
    const rowWidth = 0;

    data.forEach((item, index) => {
      const ratio = item.value / totalValue;
      const area = ratio * availableWidth * availableHeight;

      // Calculate dimensions
      const itemWidth = Math.sqrt(area);
      const itemHeight = area / itemWidth;

      // Check if we need a new row
      if (currentX + itemWidth > width - margin.right) {
        currentX = margin.left;
        currentY += rowHeight;
        rowHeight = 0;
      }

      // Draw rectangle
      this.ctx.fillStyle = item.color || this.getColorByIndex(index);
      this.ctx.fillRect(currentX, currentY, itemWidth, itemHeight);

      // Draw border
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(currentX, currentY, itemWidth, itemHeight);

      // Draw label if space allows
      if (itemWidth > 50 && itemHeight > 30) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(item.label, currentX + itemWidth / 2, currentY + itemHeight / 2 - 8);
        this.ctx.font = '12px Arial';
        this.ctx.fillText(
          this.formatNumber(item.value),
          currentX + itemWidth / 2,
          currentY + itemHeight / 2 + 8
        );
      }

      currentX += itemWidth;
      rowHeight = Math.max(rowHeight, itemHeight);
    });
  }

  /**
   * Setup canvas interactions
   */
  private setupInteractions(): void {
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Trigger custom event with coordinates
      this.canvas.dispatchEvent(
        new CustomEvent('chart:hover', {
          detail: { x, y },
        })
      );
    });

    this.canvas.addEventListener('click', e => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.canvas.dispatchEvent(
        new CustomEvent('chart:click', {
          detail: { x, y },
        })
      );
    });
  }

  /**
   * Clear canvas
   */
  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  /**
   * Helper methods
   */
  private interpolateColor(color1: string, color2: string, ratio: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);

    if (!c1 || !c2) return color1;

    const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
    const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
    const b = Math.round(c1.b + (c2.b - c1.b) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private getColorByIndex(index: number): string {
    const colors = [
      '#3b82f6',
      '#ef4444',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#06b6d4',
      '#ec4899',
      '#14b8a6',
      '#f97316',
      '#6366f1',
    ];
    return colors[index % colors.length];
  }

  private drawLabels(
    labels: { x: string[]; y: string[] },
    margin: any,
    cellWidth: number,
    cellHeight: number
  ): void {
    this.ctx.fillStyle = '#000';
    this.ctx.font = '12px Arial';

    // X-axis labels
    labels.x.forEach((label, i) => {
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        label,
        margin.left + i * cellWidth + cellWidth / 2,
        this.canvas.height - margin.bottom + 20
      );
    });

    // Y-axis labels
    labels.y.forEach((label, i) => {
      this.ctx.textAlign = 'right';
      this.ctx.fillText(label, margin.left - 10, margin.top + i * cellHeight + cellHeight / 2);
    });
  }

  private drawAxes(width: number, height: number, margin: any): void {
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(margin.left, height - margin.bottom);
    this.ctx.lineTo(width - margin.right, height - margin.bottom);
    this.ctx.moveTo(margin.left, height - margin.bottom);
    this.ctx.lineTo(margin.left, margin.top);
    this.ctx.stroke();
  }

  private formatNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }
}

// Export factory function
export function createVisualization(canvas: HTMLCanvasElement): AdvancedVisualization {
  return new AdvancedVisualization(canvas);
}
