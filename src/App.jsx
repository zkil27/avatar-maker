import React, { useState, useRef } from 'react';
import AvatarCanvas, { INITIAL_STATE } from './components/AvatarCanvas';
import CustomizationControls from './components/CustomizationControls';
import { CATEGORIES } from './constants/categories';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const BADGE_HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

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
    accessories: { x: 0, y: 0, scale: 1, rotation: 0 }
  };

  const [layerPositions, setLayerPositions] = useState(DEFAULT_LAYER_POSITIONS);
  const [activePositionLayer, setActivePositionLayer] = useState('global');
  const [step, setStep] = useState('customize'); // 'customize' or 'position'
  const [isLoading, setIsLoading] = useState(false);
  const [appState, setAppState] = useState('editing'); // 'editing', 'saving', 'finished'
  const [badgeOpacity, setBadgeOpacity] = useState(0);
  const badgeProxyRef = useRef({ opacity: 0 });
  const isInitialMount = useRef(true);
  const [avatarDevelopProgress, setAvatarDevelopProgress] = useState(1);
  const downloadingRef = useRef(false);
  const canvasRef = useRef(null);
  const positionTabsRef = useRef(null);

  const containerRef = useRef(null);
  const cardWrapperRef = useRef(null);
  const previewContainerRef = useRef(null);
  const bottomPanelRef = useRef(null);
  const mainCardRef = useRef(null);
  const polaroidFrameRef = useRef(null);
  const cameraFlashRef = useRef(null);
  const finalBtnRef = useRef(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const getGiantAvatarProps = () => {
    if (typeof window === 'undefined') return { scale: 3.2, y: 80 };
    const H = window.innerHeight;
    const W = window.innerWidth;
    const vh = H / 100;
    
    const baseSize = 28 * vh;
    const targetSize = Math.min(H * 0.50, W * 0.85);
    let scale = targetSize / baseSize;
    scale = Math.max(1.8, Math.min(scale, 3.5));
    
    let targetVisualBottom = H - 340;
    if (bottomPanelRef.current) {
      targetVisualBottom = bottomPanelRef.current.getBoundingClientRect().top;
    }
    
    // Add a slight overlap (e.g. 15px) so the avatar sinks just barely into the panel,
    // completely eliminating any tiny gaps or bounding box differences.
    targetVisualBottom += 15;
    
    // The notebook wrapper is scaled by 0.85 with transform-origin: top.
    // Its visual top is 32px from the top of the viewport (app-container padding).
    // The avatar preview is inside the wrapper with 24px padding.
    // Local center of avatar: 24 + 14vh
    // Local bottom of avatar after GSAP scale and y: 24 + 14vh + 14vh*scale + y
    // Visual bottom = 32 + 0.85 * (local bottom)
    
    const requiredLocalBottom = (targetVisualBottom - 32) / 0.85;
    const requiredY = requiredLocalBottom - 24 - (14 * vh) - (14 * vh * scale);
    
    return { scale, y: requiredY };
  };

  const getBadgeProps = () => {
    if (typeof window === 'undefined') return { scale: 1, y: 0 };
    const H = window.innerHeight;
    const vh = H / 100;
    
    // Make the badge larger (up to 1.6x) so it's not tiny on big screens
    const scale = Math.min(1.6, (H * 0.4) / (28 * vh)); 
    
    let targetVisualBottom = H - 340;
    if (bottomPanelRef.current) {
      targetVisualBottom = bottomPanelRef.current.getBoundingClientRect().top;
    }
    
    // Perfectly center the badge in the empty brown space above the panel
    const emptySpaceCenter = targetVisualBottom / 2;
    const requiredLocalCenter = (emptySpaceCenter - 32) / 0.85;
    const requiredY = requiredLocalCenter - 24 - (14 * vh);
    
    return { scale, y: requiredY };
  };

  const animatePreview = contextSafe(() => {
    if (!previewContainerRef.current) return;
    gsap.killTweensOf(previewContainerRef.current);
    
    const { scale: giantScale } = getGiantAvatarProps();
    const { scale: badgeScale } = getBadgeProps();
    const targetScale = step === 'customize' ? giantScale : badgeScale;
    
    gsap.fromTo(previewContainerRef.current, 
      { scale: targetScale * 1.05, rotation: (Math.random() - 0.5) * 4 },
      { scale: targetScale, rotation: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.4)' }
    );
  });

  // Block scroll wheel on position tabs
  React.useEffect(() => {
    const el = positionTabsRef.current;
    if (!el) return;
    const block = (e) => e.preventDefault();
    el.addEventListener('wheel', block, { passive: false });
    return () => el.removeEventListener('wheel', block);
  }, [step]); // Re-bind when step changes to 'position'

  // Initialize Giant Avatar
  React.useEffect(() => {
    if (step === 'customize' && appState === 'editing') {
      const { scale, y } = getGiantAvatarProps();
      
      if (isInitialMount.current) {
        gsap.killTweensOf(badgeProxyRef.current);
        badgeProxyRef.current.opacity = 0;
        setBadgeOpacity(0);
        gsap.set(previewContainerRef.current, { scale, y });
        isInitialMount.current = false;
      } else {
        // Smoothly fade the badge out
        gsap.killTweensOf(badgeProxyRef.current);
        gsap.to(badgeProxyRef.current, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out',
          onUpdate: () => setBadgeOpacity(badgeProxyRef.current.opacity)
        });
        
        // Bounce the avatar back up
        gsap.to(previewContainerRef.current, { scale, y, duration: 0.8, ease: 'back.out(1.2)' });
      }
    }
  }, [step, appState]);

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
    animatePreview();
  };

  const handleNextStep = contextSafe(() => {
    setStep('position');
    
    const { scale, y } = getBadgeProps();
    
    const tl = gsap.timeline();
    // 1. Giant avatar snaps down to fit badge
    tl.to(previewContainerRef.current, {
      scale,
      y,
      rotationZ: 0,
      duration: 0.8,
      ease: 'back.out(1.2)'
    });
    
    // 2. Badge fades in
    gsap.killTweensOf(badgeProxyRef.current);
    badgeProxyRef.current.opacity = 0;
    tl.to(badgeProxyRef.current, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.inOut',
      onUpdate: () => setBadgeOpacity(badgeProxyRef.current.opacity)
    }, "-=0.6");
  });

  const handleFinishID = contextSafe(() => {
    if (isLoading || downloadingRef.current || appState !== 'editing') return;
    setAppState('saving');

    const tl = gsap.timeline();

    // 1. UI Drop-away
    tl.to(bottomPanelRef.current, {
      y: '100%',
      duration: 0.6,
      ease: 'back.in(1.2)'
    });

    // 2. CAMERA FLASH!
    tl.to(cameraFlashRef.current, {
      opacity: 1,
      duration: 0.1,
      ease: 'power4.out',
      onComplete: () => {
        // While screen is white, reset avatar develop progress to 0 (dark)
        setAvatarDevelopProgress(0);
      }
    });
    
    // 3. Drop in Polaroid frame while screen is flashing
    tl.to(polaroidFrameRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotation: 0,
      duration: 0.1
    }, "<");

    // 4. Flash fades out slowly
    tl.to(cameraFlashRef.current, {
      opacity: 0,
      duration: 1.5,
      ease: 'power2.out'
    });

    // 5. Photo developing effect
    const proxy = { progress: 0 };
    tl.to(proxy, {
      progress: 1,
      duration: 4.5, // Slow development
      ease: 'power1.inOut',
      onUpdate: () => setAvatarDevelopProgress(proxy.progress),
      onComplete: () => {
        setAppState('finished');
        gsap.to(finalBtnRef.current, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)' });
      }
    }, "-=1.0"); // Start developing as flash fades
  });

  const handleDownloadImage = () => {
    if (downloadingRef.current) return;
    
    downloadingRef.current = true;
    setTimeout(() => { downloadingRef.current = false; }, 500);

    const canvas = document.querySelector('[data-testid="avatar-canvas"]');
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'my-camper-id.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleReset = contextSafe(() => {
    const tl = gsap.timeline();

    // 1. Throw away current badge (drop it off screen with a spin)
    tl.to(cardWrapperRef.current, {
      y: '120vh',
      rotationZ: 15,
      scale: 0.8,
      duration: 0.5,
      ease: 'power2.in'
    });

    // 2. Reset state while it's hidden
    tl.add(() => {
      setSelectedOptions(INITIAL_STATE);
      setSkinColor('#fadcbc');
      setBadgeHue(0);
      setLayerPositions(DEFAULT_LAYER_POSITIONS);
      setActivePositionLayer('global');
      setAppState('editing');
      setStep('customize');
      setBadgeOpacity(0);
      setAvatarDevelopProgress(1);
      
      // Reset all GSAP properties except the cardWrapper position
      gsap.set([bottomPanelRef.current, polaroidFrameRef.current, mainCardRef.current, finalBtnRef.current], { clearProps: 'all' });
      
      // Keep giant avatar set
      const { scale, y } = getGiantAvatarProps();
      gsap.set(previewContainerRef.current, { scale, y, clearProps: 'rotation' });
      
      // Move cardWrapper to top of screen for drop-in
      gsap.set(cardWrapperRef.current, { y: '-100vh', rotationZ: -5, scale: 0.85 });
    });

    // 3. Drop the brand new badge in
    tl.to(cardWrapperRef.current, {
      y: 0,
      rotationZ: 0,
      duration: 0.7,
      ease: 'back.out(1.2)',
      clearProps: 'all'
    });
  });

  return (
    <div className="app-container" ref={containerRef}>
      <div className="camera-flash" ref={cameraFlashRef}></div>
      {/* Centered Wrapper for Notebook Page */}
      <div className="id-card-wrapper" ref={cardWrapperRef}>
        
        <div className="main-card" ref={mainCardRef} style={{ width: '100%', maxWidth: '440px', padding: '24px 16px' }}>

          <div style={{ position: 'relative', margin: '0 auto 4px', zIndex: 10, display: 'inline-block' }}>
            <div className="polaroid-frame" ref={polaroidFrameRef}></div>
            <div 
              className="preview-container" 
              ref={previewContainerRef}
              style={{
                background: `rgba(255, 255, 255, ${badgeOpacity})`,
                borderColor: `rgba(44, 53, 41, ${badgeOpacity})`,
                boxShadow: badgeOpacity > 0 ? 'var(--shadow-inset)' : 'none',
                overflow: badgeOpacity > 0 ? 'hidden' : 'visible',
                borderRadius: badgeOpacity > 0 ? '50%' : '0'
              }}
            >
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
                badgeOpacity={badgeOpacity}
                avatarDevelopProgress={avatarDevelopProgress}
              />
              {isLoading && (
                <div className="loading-overlay">
                  <div className="spinner" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Final Download Button */}
        <button
          ref={finalBtnRef}
          onClick={handleDownloadImage}
          className="final-download-btn"
        >
          ⬇ Download Badge
        </button>
      </div>

      {/* Bottom UI Panel */}
      <div className="bottom-ui-panel" ref={bottomPanelRef}>
        <div className="bottom-ui-content">
          {step === 'customize' ? (
            <CustomizationControls
              selectedOptions={selectedOptions}
              onChange={handleChange}
              skinColor={skinColor}
              onSkinColorChange={setSkinColor}
              badgeHue={badgeHue}
              onBadgeHueChange={(hue) => { setBadgeHue(hue); animatePreview(); }}
            />
          ) : (
            <>
              {/* Layer Selector Tabs */}
              <div className="tabs-wrapper">
                <div className="tabs-container" ref={positionTabsRef}>
                  {['global', 'eyes', 'mouth', 'hair', 'accessories', 'badge'].map(layer => (
                    <button
                      key={layer}
                      onClick={() => setActivePositionLayer(layer)}
                      className={`tab-btn ${activePositionLayer === layer ? 'active' : ''}`}
                    >
                      {layer === 'global' ? 'Entire Avatar' : layer.charAt(0).toUpperCase() + layer.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="position-controls">
                {activePositionLayer === 'badge' ? (
                  <div className="badge-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', overflowY: 'auto', alignContent: 'start', paddingBottom: '16px' }}>
                    {BADGE_HUES.map(hue => (
                      <div
                        key={hue}
                        role="button"
                        tabIndex={0}
                        className={`option-btn ${badgeHue === hue ? 'selected' : ''}`}
                        onClick={() => { setBadgeHue(hue); animatePreview(); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setBadgeHue(hue);
                            animatePreview();
                          }
                        }}
                        title={`Hue ${hue}°`}
                      >
                        <div className="option-btn-content">
                          <img 
                            src="/assets/frame/frame1.png" 
                            alt={`Hue ${hue}°`} 
                            style={{ 
                              filter: `hue-rotate(${hue}deg)`,
                              width: '85%', 
                              height: '85%', 
                              objectFit: 'contain' 
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div style={{ marginTop: '0px' }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px', fontWeight: 'bold', color: 'var(--bg-card)' }}>
                        Size <span>{Math.round(layerPositions[activePositionLayer].scale * 100)}%</span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => setLayerPositions(p => ({...p, [activePositionLayer]: {...p[activePositionLayer], scale: Math.max(0.3, p[activePositionLayer].scale - 0.05)}}))} style={{ flex: '0 0 40px', height: '40px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: 'var(--bg-card)', fontWeight: 'bold', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>-</button>
                        <input 
                          type="range" 
                          min="0.3" max="2.0" step="0.01" 
                          value={layerPositions[activePositionLayer].scale} 
                          onChange={e => setLayerPositions(p => ({...p, [activePositionLayer]: {...p[activePositionLayer], scale: parseFloat(e.target.value)}}))} 
                          style={{ flex: 1 }} 
                        />
                        <button onClick={() => setLayerPositions(p => ({...p, [activePositionLayer]: {...p[activePositionLayer], scale: Math.min(2.0, p[activePositionLayer].scale + 0.05)}}))} style={{ flex: '0 0 40px', height: '40px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: 'var(--bg-card)', fontWeight: 'bold', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>+</button>
                      </div>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px', fontWeight: 'bold', color: 'var(--bg-card)' }}>
                        Rotation <span>{layerPositions[activePositionLayer].rotation || 0}°</span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => setLayerPositions(p => ({...p, [activePositionLayer]: {...p[activePositionLayer], rotation: Math.max(-180, p[activePositionLayer].rotation - 5)}}))} style={{ flex: '0 0 40px', height: '40px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: 'var(--bg-card)', fontWeight: 'bold', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>-</button>
                        <input 
                          type="range" 
                          min="-180" max="180" step="1" 
                          value={layerPositions[activePositionLayer].rotation || 0} 
                          onChange={e => setLayerPositions(p => ({...p, [activePositionLayer]: {...p[activePositionLayer], rotation: parseInt(e.target.value)}}))} 
                          style={{ flex: 1 }} 
                        />
                        <button onClick={() => setLayerPositions(p => ({...p, [activePositionLayer]: {...p[activePositionLayer], rotation: Math.min(180, p[activePositionLayer].rotation + 5)}}))} style={{ flex: '0 0 40px', height: '40px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', color: 'var(--bg-card)', fontWeight: 'bold', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>+</button>
                      </div>
                    </div>
                    <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'center', paddingBottom: '12px' }}>
                      <button 
                        onClick={() => setLayerPositions(prev => ({ ...prev, [activePositionLayer]: DEFAULT_LAYER_POSITIONS[activePositionLayer] }))}
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '10px', color: 'var(--bg-card)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        ↺ Reset {activePositionLayer === 'global' ? 'Avatar' : activePositionLayer.charAt(0).toUpperCase() + activePositionLayer.slice(1)}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <div className="action-buttons">
            {step === 'customize' ? (
              <button
                onClick={handleNextStep}
                className="btn btn-download btn-finish"
                style={{ flex: 1 }}
              >
                Next: Position Avatar ➔
              </button>
            ) : (
              <>
                <button
                  onClick={() => { 
                    setStep('customize'); 
                  }}
                  className="btn btn-reset"
                  style={{ flex: '0 0 auto', padding: '12px 16px' }}
                >
                  ← Back
                </button>
                <button
                  data-testid="finish-button"
                  onClick={handleFinishID}
                  className="btn btn-download btn-finish"
                >
                  Finish ID
                </button>
                <button
                  data-testid="reset-button"
                  onClick={handleReset}
                  className="btn btn-reset"
                  style={{ flex: '0 0 auto' }}
                >
                  ↺ Reset
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
