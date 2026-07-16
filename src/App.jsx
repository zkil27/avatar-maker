import React, { useState, useRef } from 'react';
import AvatarCanvas, { INITIAL_STATE } from './components/AvatarCanvas';
import CustomizationControls from './components/CustomizationControls';
import { CATEGORIES } from './constants/categories';

export default function App() {
  const [selectedOptions, setSelectedOptions] = useState(INITIAL_STATE);
  const [skinColor, setSkinColor] = useState('#fadcbc'); // Default beige skin tone
  const [badgeHue, setBadgeHue] = useState(0); // 0 to 360 hue rotation
  const DEFAULT_LAYER_POSITIONS = {
    global: { x: 0, y: 15, scale: 0.75, rotation: 0 },
    skin: { x: 0, y: 0, scale: 1, rotation: 0 },
    clothes: { x: 0, y: 0, scale: 1, rotation: 0 },
    mouth: { x: 0, y: 0, scale: 1, rotation: 0 },
    eyes: { x: 0, y: 0, scale: 1, rotation: 0 },
    hair: { x: 0, y: 0, scale: 1, rotation: 0 },
    glasses: { x: 0, y: 0, scale: 1, rotation: 0 },
    hats: { x: 0, y: 0, scale: 1, rotation: 0 }
  };

  const [layerPositions, setLayerPositions] = useState(DEFAULT_LAYER_POSITIONS);
  const [activePositionLayer, setActivePositionLayer] = useState('global');
  const [step, setStep] = useState('customize'); // 'customize' or 'position'
  const [isLoading, setIsLoading] = useState(false);
  const downloadingRef = useRef(false);
  const canvasRef = useRef(null);

  const handleChange = (category, optionId) => {
    setSelectedOptions(prev => ({
      ...prev,
      [category]: optionId,
    }));
    if (category === 'skin') {
      const option = CATEGORIES.skin.options.find(opt => opt.id === optionId);
      if (option && option.color) {
        setSkinColor(option.color);
      }
    }
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
    setBadgeHue(0);
    setBadgeHue(0);
    setLayerPositions(DEFAULT_LAYER_POSITIONS);
    setActivePositionLayer('global');
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
        <div className="preview-container" style={{ position: 'relative' }}>
          <button
            onClick={() => setStep(step === 'position' ? 'customize' : 'position')}
            title={step === 'position' ? "Close Position Editor" : "Open Position Editor"}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: step === 'position' ? 'var(--primary-color)' : '#fff',
              color: step === 'position' ? '#fff' : 'var(--text-main)',
              border: '2.5px solid var(--border-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 2px 0 var(--border-light)',
              fontSize: '18px'
            }}
          >
            {step === 'position' ? '✕' : '✥'}
          </button>
          
          <AvatarCanvas
            ref={canvasRef}
            selectedOptions={selectedOptions}
            onLoadingChange={setIsLoading}
            skinColor={skinColor}
            badgeHue={badgeHue}
            layerPositions={layerPositions}
            setLayerPositions={setLayerPositions}
            activePositionLayer={activePositionLayer}
            isPositioning={step === 'position'}
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
            data-testid="reset-button"
            onClick={handleReset}
            className="btn btn-reset"
            style={{ flex: '0 0 auto' }}
          >
            ↺ Reset
          </button>
        </div>

        {step === 'customize' ? (
          <CustomizationControls
            selectedOptions={selectedOptions}
            onChange={handleChange}
            skinColor={skinColor}
            onSkinColorChange={setSkinColor}
            badgeHue={badgeHue}
            onBadgeHueChange={setBadgeHue}
          />
        ) : (
          <div className="position-controls" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#fff', borderRadius: '18px', border: '2.5px solid var(--border-main)' }}>
            <div style={{ position: 'relative' }}>
              <h3 style={{ margin: 0, textAlign: 'center', color: 'var(--text-main)', fontSize: '18px' }}>Adjust Position</h3>
              <button 
                onClick={() => setLayerPositions(prev => ({ ...prev, [activePositionLayer]: DEFAULT_LAYER_POSITIONS[activePositionLayer] }))}
                style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'var(--bg-card)', border: '1px solid var(--border-main)', padding: '4px 8px', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                ↺ Reset
              </button>
            </div>
            
            {/* Layer Selector Tabs */}
            <div className="tabs-wrapper" style={{ margin: '0 -20px' }}>
              <div className="tabs-container" style={{ margin: '0 20px', padding: '4px', gap: '4px', background: 'var(--bg-preview-alt)' }}>
                {['global', 'eyes', 'mouth', 'hair', 'glasses', 'hats'].map(layer => (
                  <button
                    key={layer}
                    onClick={() => setActivePositionLayer(layer)}
                    className={`tab-btn ${activePositionLayer === layer ? 'active' : ''}`}
                    style={{ padding: '6px 12px', fontSize: '0.65rem' }}
                  >
                    {layer === 'global' ? 'Entire Avatar' : layer.charAt(0).toUpperCase() + layer.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.4' }}>
              👆 <b>Drag the {activePositionLayer === 'global' ? 'avatar' : activePositionLayer}</b> inside the circle to move it around!<br/>
            </p>
            
            <div style={{ marginTop: '4px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                Size <span>{Math.round(layerPositions[activePositionLayer].scale * 100)}%</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setLayerPositions(p => ({...p, [activePositionLayer]: {...p[activePositionLayer], scale: Math.max(0.3, p[activePositionLayer].scale - 0.05)}}))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--beige-light)', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                <input 
                  type="range" 
                  min="0.3" max="2.0" step="0.01" 
                  value={layerPositions[activePositionLayer].scale} 
                  onChange={e => setLayerPositions(p => ({...p, [activePositionLayer]: {...p[activePositionLayer], scale: parseFloat(e.target.value)}}))} 
                  style={{ flex: 1, accentColor: 'var(--primary-color)' }} 
                />
                <button onClick={() => setLayerPositions(p => ({...p, [activePositionLayer]: {...p[activePositionLayer], scale: Math.min(2.0, p[activePositionLayer].scale + 0.05)}}))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--beige-light)', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                Rotation <span>{layerPositions[activePositionLayer].rotation || 0}°</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setLayerPositions(p => ({...p, [activePositionLayer]: {...p[activePositionLayer], rotation: Math.max(-180, p[activePositionLayer].rotation - 5)}}))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--beige-light)', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                <input 
                  type="range" 
                  min="-180" max="180" step="1" 
                  value={layerPositions[activePositionLayer].rotation || 0} 
                  onChange={e => setLayerPositions(p => ({...p, [activePositionLayer]: {...p[activePositionLayer], rotation: parseInt(e.target.value)}}))} 
                  style={{ flex: 1, accentColor: 'var(--primary-color)' }} 
                />
                <button onClick={() => setLayerPositions(p => ({...p, [activePositionLayer]: {...p[activePositionLayer], rotation: Math.min(180, p[activePositionLayer].rotation + 5)}}))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--beige-light)', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="footer-label">made with ♡</div>
    </div>
  );
}
