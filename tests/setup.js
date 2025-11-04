/* globals vi, expect */
/**
 * Vitest setup file
 */

// Import fake-indexeddb
import 'fake-indexeddb/auto';

// Import canvas mock
import { Canvas } from 'canvas';

// Setup proper localStorage implementation
const localStorageData = new Map();

global.localStorage = {
  getItem: vi.fn(key => localStorageData.get(key) || null),
  setItem: vi.fn((key, value) => localStorageData.set(key, value)),
  removeItem: vi.fn(key => localStorageData.delete(key)),
  clear: vi.fn(() => localStorageData.clear()),
  get length() {
    return localStorageData.size;
  },
  key: vi.fn(index => Array.from(localStorageData.keys())[index] || null),
};

// Mock Canvas for visualization tests
global.HTMLCanvasElement.prototype.getContext = function (contextId) {
  if (contextId === '2d') {
    const canvas = new Canvas(this.width || 300, this.height || 150);
    return canvas.getContext('2d');
  }
  return null;
};

// Mock WebSocket for collaboration tests
global.WebSocket = class WebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    // Simulate async connection
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  send() {
    // Mock send
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }
};

// Mock online status
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
