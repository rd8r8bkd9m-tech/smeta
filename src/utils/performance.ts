/**
 * Performance optimization utilities
 */

// Lazy loading for images
export function lazyLoadImages(): void {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// Request Idle Callback polyfill
export const requestIdleCallback =
  window.requestIdleCallback ||
  function (cb: IdleRequestCallback) {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, 1);
  };

// Memoization decorator
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Virtual scrolling for large lists
export class VirtualScroll {
  private container: HTMLElement;
  private items: any[];
  private itemHeight: number;
  private visibleItems: number;
  private renderItem: (item: any, index: number) => HTMLElement;

  constructor(
    container: HTMLElement,
    items: any[],
    itemHeight: number,
    renderItem: (item: any, index: number) => HTMLElement
  ) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
    this.renderItem = renderItem;

    this.init();
  }

  private init(): void {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';

    const totalHeight = this.items.length * this.itemHeight;
    const spacer = document.createElement('div');
    spacer.style.height = `${totalHeight}px`;
    this.container.appendChild(spacer);

    this.container.addEventListener('scroll', () => this.render());
    this.render();
  }

  private render(): void {
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleItems, this.items.length);

    // Remove old items
    this.container.querySelectorAll('.virtual-item').forEach(el => el.remove());

    // Add visible items
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.renderItem(this.items[i], i);
      item.classList.add('virtual-item');
      item.style.position = 'absolute';
      item.style.top = `${i * this.itemHeight}px`;
      item.style.width = '100%';
      this.container.appendChild(item);
    }
  }

  update(items: any[]): void {
    this.items = items;
    const totalHeight = this.items.length * this.itemHeight;
    const spacer = this.container.querySelector('div');
    if (spacer) {
      spacer.style.height = `${totalHeight}px`;
    }
    this.render();
  }
}

// Web Worker for heavy computations
export function createWorker(fn: Function): Worker {
  const blob = new Blob([`self.onmessage = ${fn.toString()}`], {
    type: 'application/javascript',
  });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

// Performance monitoring
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Mark "${startMark}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  clearMarks(): void {
    this.marks.clear();
  }
}

export const perfMonitor = new PerformanceMonitor();
