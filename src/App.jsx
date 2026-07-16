import React, { useState, useRef } from 'react';
import AvatarCanvas, { INITIAL_STATE } from './components/AvatarCanvas';
import CustomizationControls from './components/CustomizationControls';

export default function App() {
  const [selectedOptions, setSelectedOptions] = useState(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const downloadingRef = useRef(false);

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
  };

  return (
    <div className="app-container">
      <div className="app-title">
        <div className="app-title-main">
          <span className="highlight">PEAK</span> TYPE
        </div>
        <span className="app-title-sub">✧ avatar maker ✧</span>
      </div>

      <div className="main-card">
        <div className="preview-container">
          <AvatarCanvas selectedOptions={selectedOptions} onLoadingChange={setIsLoading} />
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
            data-testid="reset-button"
            onClick={handleReset}
            className="btn btn-reset"
          >
            ↺ Reset
          </button>
        </div>

        <CustomizationControls selectedOptions={selectedOptions} onChange={handleChange} />
      </div>

      <div className="footer-label">made with ♡</div>
    </div>
  );
}
