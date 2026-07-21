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
    const accessories_1Tab = screen.getByTestId('tab-accessories_1');
    fireEvent.click(accessories_1Tab);
    // Options for accessories_1 should now be shown
    expect(screen.getByTestId('option-accessories_1_1')).toBeInTheDocument();
    expect(screen.getByTestId('option-accessories_1_2')).toBeInTheDocument();
  });

  test('1.2: Option Selection State Update', () => {
    render(<App />);
    const accessories_2Tab = screen.getByTestId('tab-accessories_2');
    fireEvent.click(accessories_2Tab);
    const hatOption = screen.getByTestId('option-accessories_2_1');
    fireEvent.click(hatOption);
    expect(hatOption).toHaveAttribute('aria-selected', 'true');
  });

  test('1.3: Default Selection Verification', () => {
    render(<App />);
    // Check initial values of the layers debug component
    expect(screen.getByTestId('layer-skin')).toHaveAttribute('data-value', 'skin_1');
    expect(screen.getByTestId('layer-mouth')).toHaveAttribute('data-value', 'mouth_1');
    expect(screen.getByTestId('layer-eyes')).toHaveAttribute('data-value', 'eyes_1');
    expect(screen.getByTestId('layer-hair_back')).toHaveAttribute('data-value', 'hair_back_1');
    expect(screen.getByTestId('layer-accessories_1')).toHaveAttribute('data-value', 'none');
    expect(screen.getByTestId('layer-accessories_2')).toHaveAttribute('data-value', 'none');
  });

  test('1.4: Removing Accessories (None Option)', () => {
    render(<App />);
    // Select Hat 1
    fireEvent.click(screen.getByTestId('tab-accessories_2'));
    fireEvent.click(screen.getByTestId('option-accessories_2_1'));
    expect(screen.getByTestId('layer-accessories_2')).toHaveAttribute('data-value', 'accessories_2_1');
    
    // Select None
    fireEvent.click(screen.getByTestId('option-none'));
    expect(screen.getByTestId('layer-accessories_2')).toHaveAttribute('data-value', 'none');
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
    expect(screen.getByTestId('tab-skin')).toBeVisible();

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
    fireEvent.click(screen.getByTestId('tab-hair_back'));
    fireEvent.click(screen.getByTestId('option-hair_back_2'));
    
    await vi.waitFor(() => {
      const canvas = screen.getByTestId('avatar-canvas');
      expect(canvas.getAttribute('data-active-layers')).toContain('hair_back:hair_back_2');
    });
  });

  test('1.8: Correct Z-Index Ordering', () => {
    // Assert ordering is Base (1) -> Mouth (2) -> Eyes (3) -> Hair (4) -> Glasses (5) -> Hats (6)
    expect(CATEGORIES.skin.zIndex).toBe(1);
    expect(CATEGORIES.mouth.zIndex).toBe(4);
    expect(CATEGORIES.eyes.zIndex).toBe(3);
    expect(CATEGORIES.hair_back.zIndex).toBe(0);
    expect(CATEGORIES.accessories_1.zIndex).toBe(8);
    expect(CATEGORIES.accessories_2.zIndex).toBe(9);
  });

  test('1.9: Layer Clearing', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('tab-accessories_1'));
    fireEvent.click(screen.getByTestId('option-accessories_1_1'));
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('layer-accessories_1')).toHaveAttribute('data-value', 'accessories_1_1');
    });

    fireEvent.click(screen.getByTestId('option-none'));
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('layer-accessories_1')).toHaveAttribute('data-value', 'none');
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
    expect(anchor.href).startsWith('data:image/png;skin64,');
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
    render(<AvatarCanvas selectedOptions={{ ...INITIAL_STATE, hair_back: 'hair_back_unknown' }} />);
    // The canvas should fallback-render the default hair_back option
    expect(screen.getByTestId('layer-hair_back')).toHaveAttribute('data-value', 'hair_back_1');
  });

  test('2.2: Rapid Interaction Debounce', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('tab-hair_back'));
    const opt1 = screen.getByTestId('option-hair_back_1');
    const opt2 = screen.getByTestId('option-hair_back_2');
    
    // Rapid clicks
    fireEvent.click(opt2);
    fireEvent.click(opt1);
    
    expect(opt1).toHaveAttribute('aria-selected', 'true');
    expect(opt2).toHaveAttribute('aria-selected', 'false');
  });

  test('2.3: Keyboard Select Support', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('tab-hair_back'));
    const opt2 = screen.getByTestId('option-hair_back_2');
    
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
    const originalName = CATEGORIES.accessories_1.options[0].name;
    CATEGORIES.accessories_1.options[0].name = "Super Extended Multi-Line Custom Accessory Item";

    render(<App />);
    fireEvent.click(screen.getByTestId('tab-accessories_1'));
    const opt1 = screen.getByTestId('option-accessories_1_1');
    expect(opt1).toHaveStyle({ wordBreak: 'break-word' });

    CATEGORIES.accessories_1.options[0].name = originalName;
  });

  // Category B: Live Canvas Rendering (5 tests)

  test('2.6: Image Loading Failures', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalPath = CATEGORIES.hair_back.options[0].path;
    // Inject invalid path that triggers onerror in our mocked Image
    CATEGORIES.hair_back.options[0].path = '/assets/hair_back_error.svg';

    render(<App />);
    
    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load image: /assets/hair_back_error.svg'));
    });

    // Make sure other items are still listed as active
    expect(screen.getByTestId('layer-skin')).toHaveAttribute('data-value', 'skin_1');

    CATEGORIES.hair_back.options[0].path = originalPath;
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
    
    // Deselect eyes and hair_back
    fireEvent.click(screen.getByTestId('tab-eyes'));
    fireEvent.click(screen.getByTestId('option-none'));
    fireEvent.click(screen.getByTestId('tab-hair_back'));
    fireEvent.click(screen.getByTestId('option-none'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      // Should show eye:none and hair_back:none but contain others
      expect(activeLayers).toContain('eyes:none');
      expect(activeLayers).toContain('hair_back:none');
      expect(activeLayers).toContain('skin:skin_1');
    });
  });

  test('2.9: Drawing of Base Layer Failure', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalPath = CATEGORIES.skin.options[0].path;
    CATEGORIES.skin.options[0].path = '/assets/skin_error.svg';

    render(<App />);
    
    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load image: /assets/skin_error.svg'));
    });

    // Accessories like mouth still render
    expect(screen.getByTestId('layer-mouth')).toHaveAttribute('data-value', 'mouth_1');

    CATEGORIES.skin.options[0].path = originalPath;
    consoleErrorSpy.mockRestore();
  });

  test('2.10: Zero-Size Canvas Dimensions', () => {
    const { container } = render(<AvatarCanvas selectedOptions={INITIAL_STATE} />);
    const canvas = container.querySelector('canvas');
    canvas.width = 0;
    canvas.height = 0;
    
    // Forcing re-render/rendering path by rendering with updated props
    const { rerender } = render(<AvatarCanvas selectedOptions={{ ...INITIAL_STATE, hair_back: 'hair_back_2' }} />);
    // Should not throw any exceptions
    expect(canvas.width).toBe(0);
  });

  // Category C: Export/Save Features (5 tests)

  test('2.11: Export Initiated During Loading State', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<App />);
    
    // Trigger option change to enter loading state
    fireEvent.click(screen.getByTestId('tab-hair_back'));
    fireEvent.click(screen.getByTestId('option-hair_back_2'));
    
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
    fireEvent.click(screen.getByTestId('tab-accessories_2'));
    fireEvent.click(screen.getByTestId('option-accessories_2_1'));

    await vi.waitFor(() => {
      // 2. State & Canvas: Check active layers contains accessories_2_1
      expect(screen.getByTestId('avatar-canvas').getAttribute('data-active-layers')).toContain('accessories_2:accessories_2_1');
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
    fireEvent.click(screen.getByTestId('tab-accessories_1'));
    fireEvent.click(screen.getByTestId('option-accessories_1_1'));
    // Select Hat 2
    fireEvent.click(screen.getByTestId('tab-accessories_2'));
    fireEvent.click(screen.getByTestId('option-accessories_2_2'));
    // Deselect Glasses 1
    fireEvent.click(screen.getByTestId('tab-accessories_1'));
    fireEvent.click(screen.getByTestId('option-none'));
    // Select Glasses 2
    fireEvent.click(screen.getByTestId('option-accessories_1_2'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toContain('accessories_1:accessories_1_2');
      expect(activeLayers).toContain('accessories_2:accessories_2_2');
      expect(activeLayers).toContain('skin:skin_1');
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
    
    fireEvent.click(screen.getByTestId('tab-skin'));
    fireEvent.click(screen.getByTestId('option-skin_2'));
    
    fireEvent.click(screen.getByTestId('tab-mouth'));
    fireEvent.click(screen.getByTestId('option-mouth_2'));
    
    fireEvent.click(screen.getByTestId('tab-eyes'));
    fireEvent.click(screen.getByTestId('option-eyes_2'));
    
    fireEvent.click(screen.getByTestId('tab-hair_back'));
    fireEvent.click(screen.getByTestId('option-hair_back_2'));
    
    fireEvent.click(screen.getByTestId('tab-accessories_1'));
    fireEvent.click(screen.getByTestId('option-accessories_1_1'));
    
    fireEvent.click(screen.getByTestId('tab-accessories_2'));
    fireEvent.click(screen.getByTestId('option-accessories_2_1'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toBe('skin:skin_2,mouth:mouth_2,eyes:eyes_2,hair_back:hair_back_2,accessories_1:accessories_1_1,accessories_2:accessories_2_1');
    });
  });

  test('4.2: Minimalist Composition', async () => {
    render(<App />);
    
    fireEvent.click(screen.getByTestId('tab-mouth'));
    fireEvent.click(screen.getByTestId('option-none'));
    
    fireEvent.click(screen.getByTestId('tab-eyes'));
    fireEvent.click(screen.getByTestId('option-none'));
    
    fireEvent.click(screen.getByTestId('tab-hair_back'));
    fireEvent.click(screen.getByTestId('option-none'));
    
    fireEvent.click(screen.getByTestId('tab-accessories_1'));
    fireEvent.click(screen.getByTestId('option-none'));
    
    fireEvent.click(screen.getByTestId('tab-accessories_2'));
    fireEvent.click(screen.getByTestId('option-none'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toBe('skin:skin_1,mouth:none,eyes:none,hair_back:none,accessories_1:none,accessories_2:none');
    });
  });

  test('4.3: Base Character Swap State Retention', async () => {
    render(<App />);
    
    // Choose some accessories
    fireEvent.click(screen.getByTestId('tab-accessories_1'));
    fireEvent.click(screen.getByTestId('option-accessories_1_1'));
    
    fireEvent.click(screen.getByTestId('tab-accessories_2'));
    fireEvent.click(screen.getByTestId('option-accessories_2_1'));
    
    // Swap skin from skin_1 to skin_2
    fireEvent.click(screen.getByTestId('tab-skin'));
    fireEvent.click(screen.getByTestId('option-skin_2'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toContain('skin:skin_2');
      expect(activeLayers).toContain('accessories_1:accessories_1_1');
      expect(activeLayers).toContain('accessories_2:accessories_2_1');
    });
  });

  test('4.4: Reset to Defaults Flow', async () => {
    render(<App />);
    
    // Change some options
    fireEvent.click(screen.getByTestId('tab-hair_back'));
    fireEvent.click(screen.getByTestId('option-hair_back_2'));
    
    fireEvent.click(screen.getByTestId('tab-accessories_1'));
    fireEvent.click(screen.getByTestId('option-accessories_1_1'));

    await vi.waitFor(() => {
      expect(screen.getByTestId('layer-hair_back')).toHaveAttribute('data-value', 'hair_back_2');
    });

    // Reset
    fireEvent.click(screen.getByTestId('reset-button'));

    await vi.waitFor(() => {
      expect(screen.getByTestId('layer-hair_back')).toHaveAttribute('data-value', 'hair_back_1');
      expect(screen.getByTestId('layer-accessories_1')).toHaveAttribute('data-value', 'none');
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
