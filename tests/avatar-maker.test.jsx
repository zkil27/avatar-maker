import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import App from '../src/App';
import AvatarCanvas, { INITIAL_STATE } from '../src/components/AvatarCanvas';
import CustomizationControls from '../src/components/CustomizationControls';
import { CATEGORIES } from '../src/constants/categories';

describe('Avatar Maker E2E and Integration Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // TIER 1: FEATURE COVERAGE (15 tests)
  // ==========================================

  // Category A: Customization UI (5 tests)
  
  test('1.1: Category Tab Navigation', () => {
    render(<App />);
    const glassesTab = screen.getByTestId('tab-glasses');
    fireEvent.click(glassesTab);
    // Options for glasses should now be shown
    expect(screen.getByTestId('option-glasses_1')).toBeInTheDocument();
    expect(screen.getByTestId('option-glasses_2')).toBeInTheDocument();
  });

  test('1.2: Option Selection State Update', () => {
    render(<App />);
    const hatsTab = screen.getByTestId('tab-hats');
    fireEvent.click(hatsTab);
    const hatOption = screen.getByTestId('option-hats_1');
    fireEvent.click(hatOption);
    expect(hatOption).toHaveAttribute('aria-selected', 'true');
  });

  test('1.3: Default Selection Verification', () => {
    render(<App />);
    // Check initial values of the layers debug component
    expect(screen.getByTestId('layer-base')).toHaveAttribute('data-value', 'base_1');
    expect(screen.getByTestId('layer-mouth')).toHaveAttribute('data-value', 'mouth_1');
    expect(screen.getByTestId('layer-eyes')).toHaveAttribute('data-value', 'eyes_1');
    expect(screen.getByTestId('layer-hair')).toHaveAttribute('data-value', 'hair_1');
    expect(screen.getByTestId('layer-glasses')).toHaveAttribute('data-value', 'none');
    expect(screen.getByTestId('layer-hats')).toHaveAttribute('data-value', 'none');
  });

  test('1.4: Removing Accessories (None Option)', () => {
    render(<App />);
    // Select Hat 1
    fireEvent.click(screen.getByTestId('tab-hats'));
    fireEvent.click(screen.getByTestId('option-hats_1'));
    expect(screen.getByTestId('layer-hats')).toHaveAttribute('data-value', 'hats_1');
    
    // Select None
    fireEvent.click(screen.getByTestId('option-none'));
    expect(screen.getByTestId('layer-hats')).toHaveAttribute('data-value', 'none');
  });

  test('1.5: UI Viewport Adaptation', () => {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    
    // Set mock viewport to 375x667
    window.innerWidth = 375;
    window.innerHeight = 667;
    fireEvent(window, new Event('resize'));

    render(<App />);
    expect(screen.getByTestId('customization-controls')).toBeInTheDocument();
    expect(screen.getByTestId('tab-base')).toBeVisible();

    // Restore viewport
    window.innerWidth = originalWidth;
    window.innerHeight = originalHeight;
  });

  // Category B: Live Canvas Rendering (5 tests)

  test('1.6: Canvas Element Initialization', () => {
    render(<App />);
    expect(screen.getByTestId('avatar-canvas')).toBeInTheDocument();
  });

  test('1.7: Layer Re-rendering on Select', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('tab-hair'));
    fireEvent.click(screen.getByTestId('option-hair_2'));
    
    await vi.waitFor(() => {
      const canvas = screen.getByTestId('avatar-canvas');
      expect(canvas.getAttribute('data-active-layers')).toContain('hair:hair_2');
    });
  });

  test('1.8: Correct Z-Index Ordering', () => {
    // Assert ordering is Base (1) -> Mouth (2) -> Eyes (3) -> Hair (4) -> Glasses (5) -> Hats (6)
    expect(CATEGORIES.base.zIndex).toBe(1);
    expect(CATEGORIES.mouth.zIndex).toBe(2);
    expect(CATEGORIES.eyes.zIndex).toBe(3);
    expect(CATEGORIES.hair.zIndex).toBe(4);
    expect(CATEGORIES.glasses.zIndex).toBe(5);
    expect(CATEGORIES.hats.zIndex).toBe(6);
  });

  test('1.9: Layer Clearing', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('tab-glasses'));
    fireEvent.click(screen.getByTestId('option-glasses_1'));
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('layer-glasses')).toHaveAttribute('data-value', 'glasses_1');
    });

    fireEvent.click(screen.getByTestId('option-none'));
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('layer-glasses')).toHaveAttribute('data-value', 'none');
    });
  });

  test('1.10: Responsive Canvas Container Bounds', () => {
    const { container } = render(<App />);
    const canvasContainer = container.querySelector('.avatar-canvas-container');
    expect(canvasContainer).toHaveStyle('width: 300px');
    expect(canvasContainer).toHaveStyle('height: 300px');
  });

  // Category C: Export/Save Features (5 tests)

  test('1.11: Save Button Presence', () => {
    render(<App />);
    const downloadBtn = screen.getByTestId('download-button');
    expect(downloadBtn).toBeInTheDocument();
    expect(downloadBtn).not.toBeDisabled();
  });

  test('1.12: Download Trigger Event', () => {
    render(<App />);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const downloadBtn = screen.getByTestId('download-button');
    fireEvent.click(downloadBtn);
    expect(appendSpy).toHaveBeenCalled();
    appendSpy.mockRestore();
  });

  test('1.13: Export Filename Pattern', () => {
    render(<App />);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    fireEvent.click(screen.getByTestId('download-button'));
    const anchor = appendSpy.mock.calls.find(call => call[0].tagName === 'A')[0];
    expect(anchor.download).toBe('avatar.png');
    appendSpy.mockRestore();
  });

  test('1.14: Export Format Type', () => {
    render(<App />);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    fireEvent.click(screen.getByTestId('download-button'));
    const anchor = appendSpy.mock.calls.find(call => call[0].tagName === 'A')[0];
    expect(anchor.href).startsWith('data:image/png;base64,');
    appendSpy.mockRestore();
  });

  test('1.15: toDataURL Invocation', () => {
    render(<App />);
    const spyToDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
    fireEvent.click(screen.getByTestId('download-button'));
    expect(spyToDataURL).toHaveBeenCalledWith('image/png');
    spyToDataURL.mockRestore();
  });

  // ==========================================
  // TIER 2: BOUNDARY/EDGE CASES (15 tests)
  // ==========================================

  // Category A: Customization UI (5 tests)

  test('2.1: Missing Option State Safe-guarding', () => {
    // Inject invalid value in active selection
    render(<AvatarCanvas selectedOptions={{ ...INITIAL_STATE, hair: 'hair_unknown' }} />);
    // The canvas should fallback-render the default hair option
    expect(screen.getByTestId('layer-hair')).toHaveAttribute('data-value', 'hair_1');
  });

  test('2.2: Rapid Interaction Debounce', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('tab-hair'));
    const opt1 = screen.getByTestId('option-hair_1');
    const opt2 = screen.getByTestId('option-hair_2');
    
    // Rapid clicks
    fireEvent.click(opt2);
    fireEvent.click(opt1);
    
    expect(opt1).toHaveAttribute('aria-selected', 'true');
    expect(opt2).toHaveAttribute('aria-selected', 'false');
  });

  test('2.3: Keyboard Select Support', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('tab-hair'));
    const opt2 = screen.getByTestId('option-hair_2');
    
    opt2.focus();
    fireEvent.keyDown(opt2, { key: ' ', code: 'Space' });
    expect(opt2).toHaveAttribute('aria-selected', 'true');
  });

  test('2.4: Empty Category Handling', () => {
    const originalOptions = CATEGORIES.mouth.options;
    CATEGORIES.mouth.options = [];

    render(<App />);
    fireEvent.click(screen.getByTestId('tab-mouth'));
    // List elements should be empty but the component should not crash
    expect(screen.queryByTestId('option-mouth_1')).not.toBeInTheDocument();

    CATEGORIES.mouth.options = originalOptions;
  });

  test('2.5: Text Overflow in Selectors', () => {
    const originalName = CATEGORIES.glasses.options[0].name;
    CATEGORIES.glasses.options[0].name = "Super Extended Multi-Line Custom Accessory Item";

    render(<App />);
    fireEvent.click(screen.getByTestId('tab-glasses'));
    const opt1 = screen.getByTestId('option-glasses_1');
    expect(opt1).toHaveStyle({ wordBreak: 'break-word' });

    CATEGORIES.glasses.options[0].name = originalName;
  });

  // Category B: Live Canvas Rendering (5 tests)

  test('2.6: Image Loading Failures', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalPath = CATEGORIES.hair.options[0].path;
    // Inject invalid path that triggers onerror in our mocked Image
    CATEGORIES.hair.options[0].path = '/assets/hair_error.svg';

    render(<App />);
    
    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load image: /assets/hair_error.svg'));
    });

    // Make sure other items are still listed as active
    expect(screen.getByTestId('layer-base')).toHaveAttribute('data-value', 'base_1');

    CATEGORIES.hair.options[0].path = originalPath;
    consoleErrorSpy.mockRestore();
  });

  test('2.7: Extreme Viewport Resize', () => {
    const originalWidth = window.innerWidth;
    window.innerWidth = 100;
    fireEvent(window, new Event('resize'));

    render(<App />);
    expect(screen.getByTestId('avatar-canvas')).toBeInTheDocument();

    window.innerWidth = originalWidth;
  });

  test('2.8: Render Order with Middle Layer Gaps', async () => {
    render(<App />);
    
    // Deselect eyes and hair
    fireEvent.click(screen.getByTestId('tab-eyes'));
    fireEvent.click(screen.getByTestId('option-none'));
    fireEvent.click(screen.getByTestId('tab-hair'));
    fireEvent.click(screen.getByTestId('option-none'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      // Should show eye:none and hair:none but contain others
      expect(activeLayers).toContain('eyes:none');
      expect(activeLayers).toContain('hair:none');
      expect(activeLayers).toContain('base:base_1');
    });
  });

  test('2.9: Drawing of Base Layer Failure', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalPath = CATEGORIES.base.options[0].path;
    CATEGORIES.base.options[0].path = '/assets/base_error.svg';

    render(<App />);
    
    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load image: /assets/base_error.svg'));
    });

    // Accessories like mouth still render
    expect(screen.getByTestId('layer-mouth')).toHaveAttribute('data-value', 'mouth_1');

    CATEGORIES.base.options[0].path = originalPath;
    consoleErrorSpy.mockRestore();
  });

  test('2.10: Zero-Size Canvas Dimensions', () => {
    const { container } = render(<AvatarCanvas selectedOptions={INITIAL_STATE} />);
    const canvas = container.querySelector('canvas');
    canvas.width = 0;
    canvas.height = 0;
    
    // Forcing re-render/rendering path by rendering with updated props
    const { rerender } = render(<AvatarCanvas selectedOptions={{ ...INITIAL_STATE, hair: 'hair_2' }} />);
    // Should not throw any exceptions
    expect(canvas.width).toBe(0);
  });

  // Category C: Export/Save Features (5 tests)

  test('2.11: Export Initiated During Loading State', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<App />);
    
    // Trigger option change to enter loading state
    fireEvent.click(screen.getByTestId('tab-hair'));
    fireEvent.click(screen.getByTestId('option-hair_2'));
    
    // Immediately attempt download
    const downloadBtn = screen.getByTestId('download-button');
    fireEvent.click(downloadBtn);
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Download blocked'));
    
    consoleWarnSpy.mockRestore();
  });

  test('2.12: Avoid Cross-Origin Canvas Tainting', () => {
    const paths = Object.values(CATEGORIES).flatMap(c => c.options.map(o => o.path)).filter(Boolean);
    paths.forEach(p => {
      expect(p.startsWith('/')).toBe(true);
      expect(p.includes('http')).toBe(false);
    });
  });

  test('2.13: Double-Click Export Prevention', async () => {
    render(<App />);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const downloadBtn = screen.getByTestId('download-button');
    
    // Simulate fast double clicks
    fireEvent.click(downloadBtn);
    fireEvent.click(downloadBtn);
    
    const anchorCalls = appendSpy.mock.calls.filter(call => call[0].tagName === 'A');
    expect(anchorCalls.length).toBe(1);
    
    appendSpy.mockRestore();
  });

  test('2.14: Export Resource Cleanup', () => {
    render(<App />);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    
    fireEvent.click(screen.getByTestId('download-button'));
    
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    
    const appended = appendSpy.mock.calls[0][0];
    const removed = removeSpy.mock.calls[0][0];
    expect(appended).toBe(removed);
    
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  test('2.15: Null Canvas Context Graceful Failure', () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<App />);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Canvas 2d context not available'));

    consoleWarnSpy.mockRestore();
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  // ==========================================
  // TIER 3: CROSS-FEATURE INTERACTIONS (3 tests)
  // ==========================================

  test('3.1: Full Pipeline (UI -> State -> Canvas -> Export)', async () => {
    render(<App />);
    // 1. UI: click Hat 1
    fireEvent.click(screen.getByTestId('tab-hats'));
    fireEvent.click(screen.getByTestId('option-hats_1'));

    await vi.waitFor(() => {
      // 2. State & Canvas: Check active layers contains hats_1
      expect(screen.getByTestId('avatar-canvas').getAttribute('data-active-layers')).toContain('hats:hats_1');
    });

    // 3. Export: trigger download and check anchor
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    fireEvent.click(screen.getByTestId('download-button'));
    
    const anchor = appendSpy.mock.calls.find(call => call[0].tagName === 'A')[0];
    expect(anchor.download).toBe('avatar.png');
    
    appendSpy.mockRestore();
  });

  test('3.2: Cumulative Accessory Toggle Redraws', async () => {
    render(<App />);
    
    // Select Glasses 1
    fireEvent.click(screen.getByTestId('tab-glasses'));
    fireEvent.click(screen.getByTestId('option-glasses_1'));
    // Select Hat 2
    fireEvent.click(screen.getByTestId('tab-hats'));
    fireEvent.click(screen.getByTestId('option-hats_2'));
    // Deselect Glasses 1
    fireEvent.click(screen.getByTestId('tab-glasses'));
    fireEvent.click(screen.getByTestId('option-none'));
    // Select Glasses 2
    fireEvent.click(screen.getByTestId('option-glasses_2'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toContain('glasses:glasses_2');
      expect(activeLayers).toContain('hats:hats_2');
      expect(activeLayers).toContain('base:base_1');
    });
  });

  test('3.3: Mobile-View State Changes and Export', async () => {
    const originalWidth = window.innerWidth;
    window.innerWidth = 375;
    fireEvent(window, new Event('resize'));

    render(<App />);
    
    // Toggle mouth to mouth_2
    fireEvent.click(screen.getByTestId('tab-mouth'));
    fireEvent.click(screen.getByTestId('option-mouth_2'));

    await vi.waitFor(() => {
      expect(screen.getByTestId('layer-mouth')).toHaveAttribute('data-value', 'mouth_2');
    });

    const appendSpy = vi.spyOn(document.body, 'appendChild');
    fireEvent.click(screen.getByTestId('download-button'));
    
    const anchor = appendSpy.mock.calls.find(call => call[0].tagName === 'A')[0];
    expect(anchor.download).toBe('avatar.png');

    window.innerWidth = originalWidth;
    appendSpy.mockRestore();
  });

  // ==========================================
  // TIER 4: REAL-WORLD SCENARIOS (5 tests)
  // ==========================================

  test('4.1: Fully Customized Character Composition', async () => {
    render(<App />);
    
    fireEvent.click(screen.getByTestId('tab-base'));
    fireEvent.click(screen.getByTestId('option-base_2'));
    
    fireEvent.click(screen.getByTestId('tab-mouth'));
    fireEvent.click(screen.getByTestId('option-mouth_2'));
    
    fireEvent.click(screen.getByTestId('tab-eyes'));
    fireEvent.click(screen.getByTestId('option-eyes_2'));
    
    fireEvent.click(screen.getByTestId('tab-hair'));
    fireEvent.click(screen.getByTestId('option-hair_2'));
    
    fireEvent.click(screen.getByTestId('tab-glasses'));
    fireEvent.click(screen.getByTestId('option-glasses_1'));
    
    fireEvent.click(screen.getByTestId('tab-hats'));
    fireEvent.click(screen.getByTestId('option-hats_1'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toBe('base:base_2,mouth:mouth_2,eyes:eyes_2,hair:hair_2,glasses:glasses_1,hats:hats_1');
    });
  });

  test('4.2: Minimalist Composition', async () => {
    render(<App />);
    
    fireEvent.click(screen.getByTestId('tab-mouth'));
    fireEvent.click(screen.getByTestId('option-none'));
    
    fireEvent.click(screen.getByTestId('tab-eyes'));
    fireEvent.click(screen.getByTestId('option-none'));
    
    fireEvent.click(screen.getByTestId('tab-hair'));
    fireEvent.click(screen.getByTestId('option-none'));
    
    fireEvent.click(screen.getByTestId('tab-glasses'));
    fireEvent.click(screen.getByTestId('option-none'));
    
    fireEvent.click(screen.getByTestId('tab-hats'));
    fireEvent.click(screen.getByTestId('option-none'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toBe('base:base_1,mouth:none,eyes:none,hair:none,glasses:none,hats:none');
    });
  });

  test('4.3: Base Character Swap State Retention', async () => {
    render(<App />);
    
    // Choose some accessories
    fireEvent.click(screen.getByTestId('tab-glasses'));
    fireEvent.click(screen.getByTestId('option-glasses_1'));
    
    fireEvent.click(screen.getByTestId('tab-hats'));
    fireEvent.click(screen.getByTestId('option-hats_1'));
    
    // Swap base from base_1 to base_2
    fireEvent.click(screen.getByTestId('tab-base'));
    fireEvent.click(screen.getByTestId('option-base_2'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toContain('base:base_2');
      expect(activeLayers).toContain('glasses:glasses_1');
      expect(activeLayers).toContain('hats:hats_1');
    });
  });

  test('4.4: Reset to Defaults Flow', async () => {
    render(<App />);
    
    // Change some options
    fireEvent.click(screen.getByTestId('tab-hair'));
    fireEvent.click(screen.getByTestId('option-hair_2'));
    
    fireEvent.click(screen.getByTestId('tab-glasses'));
    fireEvent.click(screen.getByTestId('option-glasses_1'));

    await vi.waitFor(() => {
      expect(screen.getByTestId('layer-hair')).toHaveAttribute('data-value', 'hair_2');
    });

    // Reset
    fireEvent.click(screen.getByTestId('reset-button'));

    await vi.waitFor(() => {
      expect(screen.getByTestId('layer-hair')).toHaveAttribute('data-value', 'hair_1');
      expect(screen.getByTestId('layer-glasses')).toHaveAttribute('data-value', 'none');
    });
  });

  test('4.5: High Resolution Canvas Export DPI Scaling', () => {
    window.devicePixelRatio = 3;
    render(<App />);
    
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    fireEvent.click(screen.getByTestId('download-button'));
    
    const anchor = appendSpy.mock.calls.find(call => call[0].tagName === 'A')[0];
    expect(anchor.getAttribute('data-export-width')).toBe('900'); // 300 * 3
    expect(anchor.getAttribute('data-export-height')).toBe('900'); // 300 * 3
    
    window.devicePixelRatio = 1;
    appendSpy.mockRestore();
  });
});
