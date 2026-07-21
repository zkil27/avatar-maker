import '@testing-library/jest-dom';
import { vi } from 'vitest';

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray() }),
  putImageData: vi.fn(),
  createPattern: vi.fn(),
  createRadialGradient: vi.fn(),
  createLinearGradient: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  scale: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  clip: vi.fn(),
  setTransform: vi.fn(),
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
});

HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockDataURL');

Element.prototype.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this._src = '';
  }

  get src() {
    return this._src;
  }

  set src(val) {
    this._src = val;
    // For test 2.11 to simulate an active loading state, we load hair_2 asynchronously.
    // All other assets are loaded synchronously to prevent blocking synchronous tests.
    if (val && val.includes('hair_2')) {
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 50);
    } else if (val && val.includes('error')) {
      if (this.onerror) {
        this.onerror(new Error(`Failed to load image: ${val}`));
      }
    } else {
      if (this.onload) {
        this.onload();
      }
    }
  }
};

