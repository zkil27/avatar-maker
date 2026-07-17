import React, { useState, useRef } from 'react';
import AvatarCanvas, { INITIAL_STATE } from './components/AvatarCanvas';
import CustomizationControls from './components/CustomizationControls';

import TutorialModal from './components/TutorialModal';
import { CATEGORIES } from './constants/categories';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const BADGE_HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const BADGE_TEXT_COLORS = ['#ffffff', '#000000', '#fadcbc', '#e4c653', '#b3391b', '#2a3621', '#4a5b6d', '#7a493b'];

export default function App() {
  const [selectedOptions, setSelectedOptions] = useState(INITIAL_STATE);
  const [skinColor, setSkinColor] = useState('#fadcbc'); // Default beige skin tone
  const [hairColor, setHairColor] = useState('#222222'); // Default dark hair
  const [clothesColor, setClothesColor] = useState('#ffffff'); // Default white clothes
  const [badgeHue, setBadgeHue] = useState(0); // 0 to 360 hue rotation
  const [badgeTextColor, setBadgeTextColor] = useState('#ffffff'); // Text overlay color
  const DEFAULT_LAYER_POSITIONS = {
    global: { x: 0, y: 15, scale: 0.75, rotation: 0 },
    skin: { x: 0, y: 0, scale: 1, rotation: 0 },
    eyes: { x: 0, y: 0, scale: 1, rotation: 0 },
    mouth: { x: 0, y: 0, scale: 1, rotation: 0 },
    hair_back: { x: 0, y: 0, scale: 1, rotation: 0 },
    clothes: { x: 0, y: 0, scale: 1, rotation: 0 },
    hair_bangs: { x: 0, y: 0, scale: 1, rotation: 0 },
    accessories_1: { x: 0, y: 0, scale: 1, rotation: 0 },
    accessories_2: { x: 0, y: 0, scale: 1, rotation: 0 },
    accessories_3: { x: 0, y: 0, scale: 1, rotation: 0 }
  };

  const [layerPositions, setLayerPositions] = useState(DEFAULT_LAYER_POSITIONS);
  const [activeCategory, setActiveCategory] = useState('skin');
  const [isLoading, setIsLoading] = useState(false);
  const [appState, setAppState] = useState('editing'); // 'editing', 'saving', 'finished'
  const [badgeImageURL, setBadgeImageURL] = useState(null);
  const [badgeOpacity, setBadgeOpacity] = useState(1);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const isInitialMount = useRef(true);
  const downloadingRef = useRef(false);
  const canvasRef = useRef(null);

  const containerRef = useRef(null);
  const cardWrapperRef = useRef(null);
  const previewContainerRef = useRef(null);
  const bottomPanelRef = useRef(null);
  const mainCardRef = useRef(null);
  const finalBtnRef = useRef(null);
  const shockwaveRef = useRef(null);
  const fabRef = useRef(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const getBadgeProps = () => {
    if (typeof window === 'undefined') return { scale: 1, y: 0 };
    const H = window.innerHeight;
    const vh = H / 100;
    
    // Make the badge larger (up to 1.6x) so it's not tiny on big screens
    const scale = Math.min(1.6, (H * 0.4) / (28 * vh)); 
    
    // The bottom panel has a fixed height of 58vh.
    // When it's open, its top edge is at 42vh (H - 0.58*H).
    const targetVisualBottom = H - (0.58 * H);
    
    // Perfectly center the badge in the empty brown space above the panel
    const emptySpaceCenter = targetVisualBottom / 2;
    const requiredLocalCenter = (emptySpaceCenter - 32) / 0.85;
    const requiredY = requiredLocalCenter - 24 - (14 * vh);
    
    return { scale, y: requiredY };
  };

  const animatePreview = contextSafe(() => {
    if (!previewContainerRef.current) return;
    gsap.killTweensOf(previewContainerRef.current);
    
    const { scale, y } = getBadgeProps();
    
    gsap.fromTo(previewContainerRef.current, 
      { scale: scale * 1.05, rotation: (Math.random() - 0.5) * 4 },
      { scale: scale, rotation: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.4)' }
    );
  });



  // Initialize Avatar position
  React.useEffect(() => {
    if (appState === 'editing') {
      const { scale, y } = getBadgeProps();
      
      if (isInitialMount.current) {
        gsap.set(previewContainerRef.current, { scale, y });
        isInitialMount.current = false;
      }
    }
  }, [appState]);

  useGSAP(() => {
    if (appState !== 'editing' || isInitialMount.current) return;

    if (isFocusMode) {
      gsap.to(bottomPanelRef.current, { y: '100%', duration: 0.5, ease: 'power3.inOut' });
      gsap.to(fabRef.current, { y: '58vh', duration: 0.5, ease: 'power3.inOut' });
      
      const H = window.innerHeight;
      const W = window.innerWidth;
      const vh = H / 100;
      const baseSizePx = 28 * vh;
      const targetSize = Math.min(W, H) * 0.9; 
      const scale = targetSize / baseSizePx;
      
      // Use the same coordinate system math as getBadgeProps to center it vertically on the whole screen
      const emptySpaceCenter = H / 2;
      const requiredLocalCenter = (emptySpaceCenter - 32) / 0.85;
      const targetY = requiredLocalCenter - 24 - (14 * vh);
      
      gsap.to(previewContainerRef.current, {
        scale: scale,
        y: targetY,
        duration: 0.5,
        ease: 'power3.inOut'
      });
    } else {
      gsap.to(bottomPanelRef.current, { y: '0%', duration: 0.5, ease: 'power3.inOut' });
      gsap.to(fabRef.current, { y: 0, duration: 0.5, ease: 'power3.inOut' });
      const { scale, y } = getBadgeProps();
      gsap.to(previewContainerRef.current, {
        scale: scale,
        y: y,
        duration: 0.5,
        ease: 'power3.inOut'
      });
    }
  }, [isFocusMode]);

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
    // 1. Avatar snaps down to fit badge
    tl.to(previewContainerRef.current, {
      scale,
      y,
      rotationZ: 0,
      duration: 0.8,
      ease: 'back.out(1.2)'
    });
  });

  const handleFinishID = contextSafe(() => {
    if (isLoading || downloadingRef.current || appState !== 'editing') return;
    
    // Capture the 2D badge image BEFORE starting animations
    // Use base64 (toDataURL) instead of Blob URL, because in-app browsers
    // (like Messenger or Instagram) often crash when trying to open/download blob URLs.
    const canvas = document.querySelector('[data-testid="avatar-canvas"]');
    if (canvas) {
      setBadgeImageURL(canvas.toDataURL('image/png'));
    }

    setAppState('saving');

    const tl = gsap.timeline();

    // 1. UI Drop-away smoothly
    tl.to(bottomPanelRef.current, {
      y: '100%',
      duration: 0.8,
      ease: 'power3.inOut'
    });

    // 2. Smoothly float to the exact center of the screen
    const H = window.innerHeight;
    const vh = H / 100;
    const emptySpaceCenter = H / 2;
    const requiredLocalCenter = (emptySpaceCenter - 32) / 0.85;
    const targetY = requiredLocalCenter - 24 - (14 * vh);

    tl.to(previewContainerRef.current, {
      scale: 1.4,
      y: targetY,
      rotationZ: 0,
      duration: 1.2,
      ease: 'expo.inOut',
      onComplete: () => {
        setAppState('finished');
      }
    }, "-=0.6");

    // Clear any leftover wrapper translations
    tl.to(cardWrapperRef.current, {
      y: 0,
      duration: 0.5
    }, "<");

    // 3. Make the Save button pop in playfully!
    tl.fromTo(finalBtnRef.current, 
      { autoAlpha: 0, scale: 0.4, y: 40, rotationZ: -8 },
      { autoAlpha: 1, scale: 1, y: 0, rotationZ: 0, duration: 0.8, ease: 'back.out(1.7)' },
      "-=0.4"
    );
  });

  const handleDownloadImage = async () => {
    if (downloadingRef.current || !badgeImageURL) return;
    
    downloadingRef.current = true;
    setTimeout(() => { downloadingRef.current = false; }, 1000);

    try {
      // 1. Try Web Share API (Best for mobile if fully supported)
      if (navigator.share) {
        try {
          // Convert base64 data URL to blob for sharing
          const fetchRes = await fetch(badgeImageURL);
          const blob = await fetchRes.blob();
          const file = new File([blob], 'my-camper-id.png', { type: 'image/png' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'My Avatar ID',
            });
            return; // Success!
          }
        } catch (shareError) {
          if (shareError.name === 'AbortError') return;
          console.error('Share failed, falling back:', shareError);
        }
      }

      // 2. Fallback to standard download with base64 Data URL
      // Data URLs are much safer in in-app browsers than Blob URLs
      const link = document.createElement('a');
      link.download = 'my-camper-id.png';
      link.href = badgeImageURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 3. Inform user of the universal fallback
      alert("Downloading... If nothing happens, you can simply long-press (or right-click) the badge to save it!");
      
    } catch (error) {
      console.error('Download/Share failed:', error);
      alert("To save your badge, simply long-press (or right-click) the image!");
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
      setBadgeTextColor('#ffffff');
      if (badgeImageURL && badgeImageURL.startsWith('blob:')) {
        URL.revokeObjectURL(badgeImageURL);
      }
      setBadgeImageURL(null);
      setLayerPositions(DEFAULT_LAYER_POSITIONS);
      setActivePositionLayer('global');
      setAppState('editing');
      setStep('customize');
      setBadgeOpacity(0);
      
      // Reset all GSAP properties except the cardWrapper position
      gsap.set([bottomPanelRef.current, mainCardRef.current, finalBtnRef.current], { clearProps: 'all' });
      
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
      <TutorialModal />
      {/* Centered Wrapper for Notebook Page */}
      <div className="id-card-wrapper" ref={cardWrapperRef}>
        
        <div className="main-card" ref={mainCardRef} style={{ width: '100%', maxWidth: '440px', padding: '24px 16px' }}>

          <div style={{ position: 'relative', margin: '0 auto 4px', zIndex: 10, display: 'inline-block' }}>
            <div className="shockwave" ref={shockwaveRef}></div>
            <div className="animated-wrapper" ref={previewContainerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                className="preview-container" 
                style={{
                  background: `rgba(255, 255, 255, ${badgeOpacity})`,
                  borderColor: `rgba(44, 53, 41, ${badgeOpacity})`,
                  boxShadow: badgeOpacity > 0 ? 'var(--shadow-inset)' : 'none',
                  overflow: badgeOpacity > 0 && appState !== 'finished' ? 'hidden' : 'visible',
                  borderRadius: badgeOpacity > 0 ? '50%' : '0'
                }}
              >
                {appState !== 'finished' && (
                  <AvatarCanvas 
                    ref={canvasRef}
                    selectedOptions={selectedOptions} 
                    onLoadingChange={setIsLoading}
                    skinColor={skinColor}
                    hairColor={hairColor}
                    clothesColor={clothesColor}
                    badgeHue={badgeHue}
                    badgeOpacity={badgeOpacity}
                    badgeTextColor={badgeTextColor}
                    layerPositions={layerPositions}
                    setLayerPositions={setLayerPositions}
                    activePositionLayer={activeCategory === 'skin' ? 'global' : (activeCategory === 'badge' || activeCategory === 'text' ? null : activeCategory)}
                    isPositioning={activeCategory !== 'badge' && activeCategory !== 'text'}
                  />
                )}
                {isLoading && appState !== 'finished' && (
                  <div className="loading-overlay">
                    <div className="spinner" />
                  </div>
                )}
                {appState === 'finished' && badgeImageURL && (
                  <img 
                    src={badgeImageURL} 
                    alt="Final Badge" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      borderRadius: '50%',
                      pointerEvents: 'auto',
                      WebkitTouchCallout: 'default'
                    }} 
                  />
                )}
              </div>
              
              {/* Final Download Button */}
              <button
                ref={finalBtnRef}
                onClick={handleDownloadImage}
                className="final-download-btn"
              >
                ⬇ Save Badge
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Mode FAB */}
      {appState === 'editing' && (
        <div ref={fabRef} className="focus-fab-wrapper">
          <button 
            className="focus-fab" 
            onClick={() => setIsFocusMode(!isFocusMode)}
            aria-label={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            <div style={{
              display: 'flex', 
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isFocusMode ? 'rotate(180deg) scale(1.2)' : 'rotate(0deg) scale(1)'
            }}>
              {isFocusMode ? (
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Bottom UI Panel */}
      <div className="bottom-ui-panel" ref={bottomPanelRef}>
        <div className="bottom-ui-content">
          <CustomizationControls
            selectedOptions={selectedOptions}
            onChange={handleChange}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            skinColor={skinColor}
            onSkinColorChange={setSkinColor}
            hairColor={hairColor}
            onHairColorChange={setHairColor}
            clothesColor={clothesColor}
            onClothesColorChange={setClothesColor}
            badgeHue={badgeHue}
            onBadgeHueChange={(hue) => { setBadgeHue(hue); animatePreview(); }}
            badgeTextColor={badgeTextColor}
            onBadgeTextColorChange={(color) => { setBadgeTextColor(color); animatePreview(); }}
            onResetLayer={(layer) => {
              const resetLayer = layer === 'skin' ? 'global' : layer;
              setLayerPositions(prev => ({ ...prev, [resetLayer]: DEFAULT_LAYER_POSITIONS[resetLayer] }));
            }}
          />

          <div className="action-buttons">
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
          </div>
        </div>
      </div>
    </div>
  );
}
