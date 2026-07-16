import React, { useState, useRef } from 'react';
import AvatarCanvas, { INITIAL_STATE } from './components/AvatarCanvas';
import CustomizationControls from './components/CustomizationControls';
import DrawingControls from './components/DrawingControls';

export default function App() {
  const [selectedOptions, setSelectedOptions] = useState(INITIAL_STATE);
  const [skinColor, setSkinColor] = useState('#fadcbc'); // Default beige skin tone
  const [isLoading, setIsLoading] = useState(false);
  const downloadingRef = useRef(false);
  const canvasRef = useRef(null);

  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#5D4E37');
  const [drawingSize, setDrawingSize] = useState(5);
  const [drawingTool, setDrawingTool] = useState('pen');

  const handleChange = (category, optionId) => {
    setSelectedOptions(prev => ({
      ...prev,
      [category]: optionId,
    }));
  };

  const handleDownload = () => {
    if (isLoading || downloadingRef.current) return;
    downloadingRef.current = true;
    setTimeout(() => { downloadingRef.current = false; }, 500);

    const canvas = document.querySelector('[data-testid="avatar-canvas"]');
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'my-avatar.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleReset = () => {
    setSelectedOptions(INITIAL_STATE);
    setSkinColor('#fadcbc');
    if (canvasRef.current) {
      canvasRef.current.clearDrawing();
    }
  };

  const handleClearDrawing = () => {
    if (canvasRef.current) {
      canvasRef.current.clearDrawing();
    }
  };

  return (
    <div className="app-container">
      {!isDrawingMode && (
        <div className="app-title">
          <div className="app-title-main">
            <span className="highlight">PEAK</span> TYPE
          </div>
          <span className="app-title-sub">✧ avatar maker ✧</span>
        </div>
      )}

      <div className="main-card">
        <div className={`preview-container ${isDrawingMode ? 'expanded' : ''}`}>
          <AvatarCanvas
            ref={canvasRef}
            selectedOptions={selectedOptions}
            onLoadingChange={setIsLoading}
            isDrawingMode={isDrawingMode}
            drawingColor={drawingColor}
            drawingSize={drawingSize}
            drawingTool={drawingTool}
            skinColor={skinColor}
          />
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner" />
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button
            data-testid="download-button"
            onClick={handleDownload}
            className="btn btn-download"
          >
            ⬇ Save
          </button>
          <button
            data-testid="draw-button"
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className="btn btn-draw"
          >
            {isDrawingMode ? '✕ Cancel' : '✎ Draw Custom'}
          </button>
          <button
            data-testid="reset-button"
            onClick={handleReset}
            className="btn btn-reset"
          >
            ↺ Reset
          </button>
        </div>

        {isDrawingMode ? (
          <DrawingControls
            drawingColor={drawingColor}
            setDrawingColor={setDrawingColor}
            drawingSize={drawingSize}
            setDrawingSize={setDrawingSize}
            drawingTool={drawingTool}
            setDrawingTool={setDrawingTool}
            onClear={handleClearDrawing}
            onDone={() => setIsDrawingMode(false)}
          />
        ) : (
          <CustomizationControls
            selectedOptions={selectedOptions}
            onChange={handleChange}
            skinColor={skinColor}
            onSkinColorChange={setSkinColor}
          />
        )}
      </div>

      <div className="footer-label">made with ♡</div>
    </div>
  );
}
