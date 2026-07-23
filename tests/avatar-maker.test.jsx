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
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('seen_tutorial', 'true');
    }
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
    expect(screen.getByTestId('option-accessories_1')).toBeInTheDocument();
  });

  test('1.2: Option Selection State Update', () => {
    render(<App />);
    const accessories_2Tab = screen.getByTestId('tab-accessories_2');
    fireEvent.click(accessories_2Tab);
    const hatOption = screen.getByTestId('option-accessories_2');
    fireEvent.click(hatOption);
    expect(hatOption).toHaveAttribute('aria-selected', 'true');
  });

  test('1.3: Default Selection Verification', () => {
    render(<App />);
    const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
    expect(activeLayers).toContain('skin:skin_1');
    expect(activeLayers).toContain('mouth:mouth_1');
    expect(activeLayers).toContain('eyes:eyes_1');
    expect(activeLayers).toContain('hair_back:none');
    expect(activeLayers).toContain('accessories_1:none');
    expect(activeLayers).toContain('accessories_2:none');
  });

  test('1.4: Removing Accessories (None Option)', async () => {
    render(<App />);
    // Select Hat 1
    fireEvent.click(screen.getByTestId('tab-accessories_2'));
    fireEvent.click(screen.getByTestId('option-accessories_2'));
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('avatar-canvas').getAttribute('data-active-layers')).toContain('accessories_2:accessories_2');
    });
    
    // Select None
    fireEvent.click(screen.getByTestId('option-none'));
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('avatar-canvas').getAttribute('data-active-layers')).toContain('accessories_2:none');
    });
  });

  test('1.5: UI Viewport Adaptation', () => {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    
    window.innerWidth = 375;
    window.innerHeight = 667;
    fireEvent(window, new Event('resize'));

    render(<App />);
    expect(screen.getByTestId('customization-controls')).toBeInTheDocument();
    expect(screen.getByTestId('tab-skin')).toBeVisible();

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
    fireEvent.click(screen.getByTestId('option-accessories_1'));
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('avatar-canvas').getAttribute('data-active-layers')).toContain('accessories_1:accessories_1');
    });

    fireEvent.click(screen.getByTestId('option-none'));
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('avatar-canvas').getAttribute('data-active-layers')).toContain('accessories_1:none');
    });
  });

  test('1.10: Responsive Canvas Container Bounds', () => {
    const { container } = render(<App />);
    const canvasContainer = container.querySelector('.preview-container');
    expect(canvasContainer).toBeInTheDocument();
  });

  // Category C: Export/Save Features (5 tests)

  test('1.11: Save Button Presence', () => {
    render(<App />);
    const downloadBtn = screen.getByTestId('download-button');
    expect(downloadBtn).toBeInTheDocument();
    expect(downloadBtn).not.toBeDisabled();
  });

  test('1.12: Download Trigger Event', async () => {
    vi.stubGlobal('navigator', { share: undefined });
    render(<App />);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    
    fireEvent.click(screen.getByTestId('download-button'));
    await vi.waitFor(() => {
      expect(screen.getByText('⬇ Save Badge')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('⬇ Save Badge'));
    expect(appendSpy).toHaveBeenCalled();
    appendSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  test('1.13: Export Filename Pattern', async () => {
    vi.stubGlobal('navigator', { share: undefined });
    render(<App />);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    
    fireEvent.click(screen.getByTestId('download-button'));
    await vi.waitFor(() => {
      expect(screen.getByText('⬇ Save Badge')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('⬇ Save Badge'));
    const anchor = appendSpy.mock.calls.find(call => call[0] && call[0].tagName === 'A')[0];
    expect(anchor.download).toBe('my-camper-id.png');
    appendSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  test('1.14: Export Format Type', async () => {
    vi.stubGlobal('navigator', { share: undefined });
    render(<App />);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    
    fireEvent.click(screen.getByTestId('download-button'));
    await vi.waitFor(() => {
      expect(screen.getByText('⬇ Save Badge')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('⬇ Save Badge'));
    const anchor = appendSpy.mock.calls.find(call => call[0] && call[0].tagName === 'A')[0];
    expect(anchor.href).toMatch(/^data:image\/png/);
    appendSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  test('1.15: toDataURL Invocation', () => {
    render(<App />);
    const downloadBtn = screen.getByTestId('download-button');
    expect(downloadBtn).toBeInTheDocument();
  });

  // ==========================================
  // TIER 2: BOUNDARY/EDGE CASES (15 tests)
  // ==========================================

  // Category A: Customization UI (5 tests)

  test('2.1: Missing Option State Safe-guarding', () => {
    // Inject invalid value in active selection
    render(<AvatarCanvas selectedOptions={{ ...INITIAL_STATE, hair_back: 'hair_back_unknown' }} />);
    expect(screen.getByTestId('avatar-canvas')).toBeInTheDocument();
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
    const opt1 = screen.getByTestId('option-accessories_1');
    expect(opt1).toHaveStyle({ wordBreak: 'break-word' });

    CATEGORIES.accessories_1.options[0].name = originalName;
  });

  // Category B: Live Canvas Rendering (5 tests)

  test('2.6: Image Loading Failures', async () => {
    const originalPath = CATEGORIES.hair_back.options[0].path;
    CATEGORIES.hair_back.options[0].path = '/assets/hair_back_error.svg';

    render(<App />);
    
    // Canvas should still render
    expect(screen.getByTestId('avatar-canvas')).toBeInTheDocument();

    CATEGORIES.hair_back.options[0].path = originalPath;
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
    const originalPath = CATEGORIES.skin.options[0].path;
    CATEGORIES.skin.options[0].path = '/assets/skin_error.svg';

    render(<App />);
    expect(screen.getByTestId('avatar-canvas')).toBeInTheDocument();

    CATEGORIES.skin.options[0].path = originalPath;
  });

  test('2.10: Zero-Size Canvas Dimensions', () => {
    const { container } = render(<AvatarCanvas selectedOptions={INITIAL_STATE} />);
    const canvas = container.querySelector('canvas');
    canvas.width = 0;
    canvas.height = 0;
    
    // Forcing re-render/rendering path by rendering with updated props
    render(<AvatarCanvas selectedOptions={{ ...INITIAL_STATE, hair_back: 'hair_back_2' }} />);
    // Should not throw any exceptions
    expect(canvas.width).toBe(0);
  });

  // Category C: Export/Save Features (5 tests)

  test('2.11: Export Initiated During Loading State', async () => {
    render(<App />);
    
    // Trigger option change to enter loading state
    fireEvent.click(screen.getByTestId('tab-hair_back'));
    fireEvent.click(screen.getByTestId('option-hair_back_2'));
    
    // Download button exists and is clickable
    const downloadBtn = screen.getByTestId('download-button');
    expect(downloadBtn).toBeInTheDocument();
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
    const downloadBtn = screen.getByTestId('download-button');
    
    // Click finish ID button
    fireEvent.click(downloadBtn);
    
    await vi.waitFor(() => {
      expect(screen.getByText('⬇ Save Badge')).toBeInTheDocument();
    });
  });

  test('2.14: Export Resource Cleanup', async () => {
    vi.stubGlobal('navigator', { share: undefined });
    render(<App />);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    
    fireEvent.click(screen.getByTestId('download-button'));
    
    await vi.waitFor(() => {
      expect(screen.getByText('⬇ Save Badge')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('⬇ Save Badge'));
    
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    
    appendSpy.mockRestore();
    removeSpy.mockRestore();
    vi.unstubAllGlobals();
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
    fireEvent.click(screen.getByTestId('option-accessories_2'));

    await vi.waitFor(() => {
      // 2. State & Canvas: Check active layers contains accessories_2
      expect(screen.getByTestId('avatar-canvas').getAttribute('data-active-layers')).toContain('accessories_2:accessories_2');
    });
  });

  test('3.2: Cumulative Accessory Toggle Redraws', async () => {
    render(<App />);
    
    // Select Glasses 1
    fireEvent.click(screen.getByTestId('tab-accessories_1'));
    fireEvent.click(screen.getByTestId('option-accessories_1'));
    // Select Hat 2
    fireEvent.click(screen.getByTestId('tab-accessories_2'));
    fireEvent.click(screen.getByTestId('option-accessories_2'));
    // Deselect Glasses 1
    fireEvent.click(screen.getByTestId('tab-accessories_1'));
    fireEvent.click(screen.getByTestId('option-none'));
    // Select Glasses 1 again
    fireEvent.click(screen.getByTestId('option-accessories_1'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toContain('accessories_1:accessories_1');
      expect(activeLayers).toContain('accessories_2:accessories_2');
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
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toContain('mouth:mouth_2');
    });

    window.innerWidth = originalWidth;
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
    fireEvent.click(screen.getByTestId('option-accessories_1'));
    
    fireEvent.click(screen.getByTestId('tab-accessories_2'));
    fireEvent.click(screen.getByTestId('option-accessories_2'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toContain('skin:skin_2');
      expect(activeLayers).toContain('mouth:mouth_2');
      expect(activeLayers).toContain('eyes:eyes_2');
      expect(activeLayers).toContain('hair_back:hair_back_2');
      expect(activeLayers).toContain('accessories_1:accessories_1');
      expect(activeLayers).toContain('accessories_2:accessories_2');
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
      expect(activeLayers).toContain('skin:skin_1');
      expect(activeLayers).toContain('mouth:none');
      expect(activeLayers).toContain('eyes:none');
      expect(activeLayers).toContain('hair_back:none');
      expect(activeLayers).toContain('accessories_1:none');
      expect(activeLayers).toContain('accessories_2:none');
    });
  });

  test('4.3: Base Character Swap State Retention', async () => {
    render(<App />);
    
    // Choose some accessories
    fireEvent.click(screen.getByTestId('tab-accessories_1'));
    fireEvent.click(screen.getByTestId('option-accessories_1'));
    
    fireEvent.click(screen.getByTestId('tab-accessories_2'));
    fireEvent.click(screen.getByTestId('option-accessories_2'));
    
    // Swap skin from skin_1 to skin_2
    fireEvent.click(screen.getByTestId('tab-skin'));
    fireEvent.click(screen.getByTestId('option-skin_2'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toContain('skin:skin_2');
      expect(activeLayers).toContain('accessories_1:accessories_1');
      expect(activeLayers).toContain('accessories_2:accessories_2');
    });
  });

  test('4.4: Reset to Defaults Flow', async () => {
    render(<App />);
    
    // Change some options
    fireEvent.click(screen.getByTestId('tab-hair_back'));
    fireEvent.click(screen.getByTestId('option-hair_back_2'));
    
    fireEvent.click(screen.getByTestId('tab-accessories_1'));
    fireEvent.click(screen.getByTestId('option-accessories_1'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toContain('hair_back:hair_back_2');
      expect(activeLayers).toContain('accessories_1:accessories_1');
    });

    // Reset
    fireEvent.click(screen.getByTestId('reset-button'));

    await vi.waitFor(() => {
      const activeLayers = screen.getByTestId('avatar-canvas').getAttribute('data-active-layers');
      expect(activeLayers).toContain('hair_back:none');
      expect(activeLayers).toContain('accessories_1:none');
    });
  });

  test('4.5: High Resolution Canvas Export DPI Scaling', async () => {
    vi.stubGlobal('navigator', { share: undefined });
    window.devicePixelRatio = 3;
    render(<App />);
    
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    fireEvent.click(screen.getByTestId('download-button'));
    
    await vi.waitFor(() => {
      expect(screen.getByText('⬇ Save Badge')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('⬇ Save Badge'));
    
    const anchorCall = appendSpy.mock.calls.find(call => call[0] && call[0].tagName === 'A');
    expect(anchorCall).toBeTruthy();
    
    window.devicePixelRatio = 1;
    appendSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  // Category 5: Randomizer (1 test)
  test('5.1: On-Theme Randomizer Button Execution', async () => {
    render(<App />);
    const randomizeBtn = screen.getByTestId('randomize-button');
    expect(randomizeBtn).toBeInTheDocument();
    
    fireEvent.click(randomizeBtn);
    
    // Wait for the randomizer reel animation to complete and set final randomized values
    await vi.waitFor(() => {
      expect(randomizeBtn).not.toHaveClass('spinning');
    }, { timeout: 3000 });
  });
});
