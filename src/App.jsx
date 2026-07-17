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

  const { contextSafe } = useGSAP({ scope: containerRef });

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
    // Convert to Blob instead of Data URL to prevent mobile WebView crashes
    const canvas = document.querySelector('[data-testid="avatar-canvas"]');
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) setBadgeImageURL(URL.createObjectURL(blob));
      }, 'image/png');
    }

    setAppState('saving');

    const tl = gsap.timeline();

    // 1. UI Drop-away
    tl.to(bottomPanelRef.current, {
      y: '100%',
      duration: 0.5,
      ease: 'back.in(1.2)'
    });

    // 2. Scale badge WAY up (Zoom out) and tilt it
    tl.to(previewContainerRef.current, {
      scale: 2.5,
      y: '-20vh',
      rotationZ: 15,
      duration: 0.6,
      ease: 'power2.out'
    }, "-=0.3");

    // 3. THE SLAM! (Smash it down into the center)
    tl.to(previewContainerRef.current, {
      scale: 1.2,
      y: 0,
      rotationZ: 0,
      duration: 0.3,
      ease: 'back.out(1.5)',
      onComplete: () => {
        setAppState('finished');
        // Screen shake
        gsap.to(containerRef.current, {
          y: 'random(-10, 10)',
          x: 'random(-10, 10)',
          duration: 0.05,
          yoyo: true,
          repeat: 5,
          onComplete: () => gsap.set(containerRef.current, { clearProps: 'all' })
        });
      }
    });

    // Move the wrapper down to center it on screen vertically
    tl.to(cardWrapperRef.current, {
      y: '22vh',
      duration: 0.3,
      ease: 'power2.out'
    }, "<");

    // 5. Expand and fade the shockwave
    tl.fromTo(shockwaveRef.current,
      { scale: 0.5, opacity: 1 },
      { scale: 6, opacity: 0, duration: 0.8, ease: 'power2.out' },
      "<" // Start at the same time as the slam finishes
    );

    // 6. Drop in the "Save Badge" button
    tl.fromTo(finalBtnRef.current, 
      { autoAlpha: 0, scale: 0.5, rotationZ: -10, y: 30 },
      { autoAlpha: 1, scale: 1, rotationZ: 0, y: 0, duration: 0.8, ease: 'elastic.out(1.2, 0.4)' },
      "-=0.3"
    );
  });

  const handleDownloadImage = async () => {
    if (downloadingRef.current) return;
    
    downloadingRef.current = true;
    setTimeout(() => { downloadingRef.current = false; }, 1000);

    try {
      let blob = null;
      if (badgeImageURL && badgeImageURL.startsWith('blob:')) {
        // badgeImageURL is already a Blob URL
        const response = await fetch(badgeImageURL);
        blob = await response.blob();
      } else {
        // Fallback
        const canvas = document.querySelector('[data-testid="avatar-canvas"]');
        if (canvas) {
          blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        }
      }
      
      if (!blob) return;

      // 2. Try Web Share API (Best for mobile/FB in-app browsers)
      if (navigator.share) {
        const file = new File([blob], 'my-camper-id.png', { type: 'image/png' });
        // Check if the browser supports sharing files
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'My Avatar ID',
            });
            return; // Success, user shared or saved via native dialog
          } catch (shareError) {
            // Ignore AbortError (user cancelled)
            if (shareError.name === 'AbortError') return;
            console.error('Share failed, falling back to download:', shareError);
          }
        }
      }

      // 3. Fallback to Object URL download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'my-camper-id.png';
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL to free memory
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
    } catch (error) {
      console.error('Download/Share failed:', error);
      alert('Unable to save. If you are inside an app like Facebook, please tap the menu and choose "Open in Browser".');
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
            <div 
              className="preview-container" 
              ref={previewContainerRef}
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
                    userSelect: 'none' 
                  }} 
                />
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
          ⬇ Save Badge
        </button>
      </div>

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
