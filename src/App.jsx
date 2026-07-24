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
    global: { x: 0, y: 15, scale: 0.85, rotation: 0 },
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
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);
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
  const diceRef = useRef(null);

  const showToast = (message, duration = 4000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, duration);
  };

  const { contextSafe } = useGSAP({ scope: containerRef });

  const getBadgeProps = () => {
    if (typeof window === 'undefined') return { scale: 1, y: 0 };
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) return { scale: 1, y: 0 };

    const H = window.innerHeight;
    const W = window.innerWidth;
    
    // The animated-wrapper has a fixed base size of 400px (from the canvas)
    const baseSizePx = 400;
    
    // The available empty space above the panel is 42vh (H - 0.58*H)
    const targetVisualBottom = H - (0.58 * H);
    const emptySpace = targetVisualBottom;
    
    // We want the visual size on screen to comfortably fit
    const targetNormalSize = Math.min(emptySpace * 0.75, W * 0.65);
    
    // The .id-card-wrapper has transform: scale(0.85), so we must account for it
    let scale = targetNormalSize / (baseSizePx * 0.85);
    const maxScaleForContainer = 440 / baseSizePx;
    scale = Math.min(scale, maxScaleForContainer);
    
    // Perfectly center the badge in the empty brown space above the panel
    const emptySpaceCenter = targetVisualBottom / 2;
    
    // The wrapper has 32px top padding, 4px border, and 24px inner padding.
    const requiredLocalCenter = (emptySpaceCenter - 32) / 0.85;
    const requiredY = requiredLocalCenter - 28 - (baseSizePx / 2);
    
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
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) return;


    if (isFocusMode) {
      gsap.to(bottomPanelRef.current, { y: '100%', duration: 0.5, ease: 'power3.inOut' });
      gsap.to(fabRef.current, { y: '58vh', duration: 0.5, ease: 'power3.inOut' });
      
      const H = window.innerHeight;
      const W = window.innerWidth;
      
      const baseSizePx = 400;
      const targetSize = Math.min(W, H) * 0.9; 
      const finalTargetSize = Math.min(targetSize, 440);
      const scale = finalTargetSize / (baseSizePx * 0.85);
      
      // Use the same coordinate system math as getBadgeProps to center it vertically on the whole screen
      const emptySpaceCenter = H / 2;
      const requiredLocalCenter = (emptySpaceCenter - 32) / 0.85;
      const targetY = requiredLocalCenter - 28 - (baseSizePx / 2);
      
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
    const canvas = document.querySelector('[data-testid="avatar-canvas"]');
    let finalUrl = 'data:image/png;base64,mock';
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        if (dataUrl && dataUrl !== 'data:,') {
          finalUrl = dataUrl;
        }
      } catch (e) {
        // Fallback
      }
    }
    setBadgeImageURL(finalUrl);

    setAppState('saving');

    const tl = gsap.timeline();

    // 1. UI Drop-away smoothly
    tl.to(bottomPanelRef.current, {
      x: '0%',
      y: '100%',
      duration: 0.8,
      ease: 'power3.inOut'
    });

    // 2. Smoothly float to the exact center of the screen
    let targetY = 0;
    let targetScale = 1.2;
    
    const H = window.innerHeight;
    const W = window.innerWidth;
    const emptySpaceCenter = H / 2;
    const requiredLocalCenter = (emptySpaceCenter - 32) / 0.85;
    targetY = requiredLocalCenter - 28 - 200; // 200 is baseSizePx/2
    
    const targetSize = Math.min(W, H) * 0.9;
    const finalTargetSize = Math.min(targetSize, 440);
    targetScale = finalTargetSize / (400 * 0.85);

    tl.to(previewContainerRef.current, {
      scale: targetScale,
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
    if (downloadingRef.current) return;
    
    let urlToDownload = badgeImageURL;
    if (!urlToDownload) {
      const canvas = document.querySelector('[data-testid="avatar-canvas"]');
      if (canvas) {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          if (dataUrl && dataUrl !== 'data:,') {
            urlToDownload = dataUrl;
          }
        } catch (e) {}
      }
    }
    if (!urlToDownload) {
      urlToDownload = 'data:image/png;base64,mock';
    }

    downloadingRef.current = true;
    setTimeout(() => { downloadingRef.current = false; }, 1000);

    try {
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

      // 1. Try Web Share API (Best for mobile if fully supported, skip on desktop for standard save)
      if (!isDesktop && navigator.share) {
        try {
          // Convert base64 data URL to blob for sharing
          const fetchRes = await fetch(urlToDownload);
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
      link.href = urlToDownload;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 3. Inform user of the universal fallback
      showToast("📌 Downloading... If nothing happens, long-press the badge to save it!");
      
    } catch (error) {
      console.error('Download/Share failed:', error);
      showToast("📌 Long-press (or right-click) the badge to save it!");
    }
  };

  const getRandomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const generateRandomState = () => {
    const newOptions = {};
    Object.keys(CATEGORIES).forEach(catKey => {
      const options = CATEGORIES[catKey].options;
      if (!options || options.length === 0) return;
      
      if (catKey === 'skin') {
        const validSkins = options.filter(o => o.id !== 'none');
        const chosen = getRandomChoice(validSkins.length > 0 ? validSkins : options);
        newOptions[catKey] = chosen.id;
      } else {
        const nonNone = options.filter(o => o.id !== 'none');
        if (nonNone.length > 0 && Math.random() > 0.15) {
          const chosen = getRandomChoice(nonNone);
          newOptions[catKey] = chosen.id;
        } else {
          newOptions[catKey] = getRandomChoice(options).id;
        }
      }
    });

    const HAIR_COLORS_LIST = [
      '#222222', '#3d2314', '#593e2b', '#80593b', 
      '#a87a51', '#cfa173', '#f2d4a2', '#f9ebb5', 
      '#6b221d', '#9e3b22', '#d46535', '#e89c6d',
      '#b88ce6', '#ff99cc', '#a2d149', '#80b6f0'
    ];
    const CLOTHES_COLORS_LIST = [
      '#ffffff', '#222222', '#ff595e', '#ffca3a',
      '#8ac926', '#1982c4', '#6a4c93', '#f4a261',
      '#e76f51', '#2a9d8f', '#264653', '#e9c46a'
    ];

    const skinOption = CATEGORIES.skin.options.find(opt => opt.id === newOptions.skin);
    const newSkinColor = skinOption?.color || getRandomChoice(['#fadcbc', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#3d2210', '#ffdbac']);
    const newHairColor = getRandomChoice(HAIR_COLORS_LIST);
    const newClothesColor = getRandomChoice(CLOTHES_COLORS_LIST);
    const newBadgeHue = BADGE_HUES[Math.floor(Math.random() * BADGE_HUES.length)];
    const newBadgeTextColor = BADGE_TEXT_COLORS[Math.floor(Math.random() * BADGE_TEXT_COLORS.length)];

    return {
      options: newOptions,
      skinColor: newSkinColor,
      hairColor: newHairColor,
      clothesColor: newClothesColor,
      badgeHue: newBadgeHue,
      badgeTextColor: newBadgeTextColor
    };
  };

  const handleRandomize = contextSafe(() => {
    if (isRandomizing || appState !== 'editing') return;
    setIsRandomizing(true);

    if (diceRef.current) {
      // Dice spin is now handled by CSS .spinning class to prevent main-thread lockup stutter
    }

    const { scale, y } = getBadgeProps();

    gsap.to(previewContainerRef.current, {
      scale: scale * 0.9,
      rotation: -6,
      duration: 0.15,
      ease: 'power2.in',
      onComplete: () => {
        const finalState = generateRandomState();
        setSelectedOptions(finalState.options);
        setSkinColor(finalState.skinColor);
        setHairColor(finalState.hairColor);
        setClothesColor(finalState.clothesColor);
        setBadgeHue(finalState.badgeHue);
        setBadgeTextColor(finalState.badgeTextColor);

        gsap.to(previewContainerRef.current, {
          scale: scale,
          rotation: 0,
          y: y,
          duration: 0.45,
          delay: 0.15,
          ease: 'elastic.out(1.2, 0.4)',
          onComplete: () => setIsRandomizing(false)
        });

        if (shockwaveRef.current) {
          gsap.fromTo(shockwaveRef.current,
            { scale: 0.8, opacity: 0.9 },
            { scale: 1.6, opacity: 0, duration: 0.5, delay: 0.15, ease: 'power2.out' }
          );
        }

        const titles = [
          "🎲 Wildcard Camper Unlocked!",
          "✨ Mystery Ranger Assembled!",
          "🔥 Legendary Explorer Rolled!",
          "🌲 Trailblazer Outfit Ready!"
        ];
        showToast(titles[Math.floor(Math.random() * titles.length)], 2500);
      }
    });
  });

  const handleReset = contextSafe(() => {
    const isDesktop = window.innerWidth >= 768;
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
      setActiveCategory('skin');
      setAppState('editing');
      setBadgeOpacity(1);
      
      // Reset all GSAP properties except the cardWrapper position
      gsap.set([bottomPanelRef.current, mainCardRef.current, finalBtnRef.current], { clearProps: 'all' });
      
      // Keep giant avatar set
      let scale = 1.2;
      let y = 0;
      if (!isDesktop) {
        const H = window.innerHeight;
        const W = window.innerWidth;
        const emptySpaceCenter = H / 2;
        const requiredLocalCenter = (emptySpaceCenter - 32) / 0.85;
        y = requiredLocalCenter - 28 - 200; // 200 is baseSizePx/2
        
        const targetSize = Math.min(W, H) * 0.9;
        const finalTargetSize = Math.min(targetSize, 440);
        scale = finalTargetSize / (400 * 0.85);
      }
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
    <>
      <TutorialModal />
      <div className="app-container" ref={containerRef}>

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
              data-testid="randomize-button"
              onClick={handleRandomize}
              disabled={isRandomizing}
              className={`btn btn-randomize ${isRandomizing ? 'spinning' : ''}`}
              title="Roll a random wildcard camper!"
            >
              <span ref={diceRef} className="dice-icon">🎲</span>
              Random
            </button>
            <button
              data-testid="download-button"
              onClick={handleFinishID}
              className="btn btn-download btn-finish"
            >
              <span className="mobile-only">Finish ID</span>
              <span className="desktop-only">Save Badge</span>
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

      {/* Version label */}
      <span style={{
        position: 'fixed',
        bottom: '8px',
        left: '10px',
        fontSize: '0.65rem',
        opacity: 0.25,
        color: '#fff',
        fontFamily: 'monospace',
        pointerEvents: 'none',
        zIndex: 9999,
        userSelect: 'none'
      }}>
        v{__APP_VERSION__}
      </span>
    </div>
    {toastMessage && (
      <div className={`camp-toast ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>
    )}
    </>
  );
}
