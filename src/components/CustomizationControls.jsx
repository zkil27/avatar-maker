import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CATEGORIES, CATEGORY_KEYS } from '../constants/categories';

const SKIN_TONES = [
  '#fadcbc', '#f1c27d', '#e0ac69', '#c68642',
  '#8d5524', '#3d2210', '#ffdbac', '#e5c298',
];

const BADGE_HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const BADGE_TEXT_COLORS = ['#ffffff', '#000000', '#fadcbc', '#e4c653', '#b3391b', '#2a3621', '#4a5b6d', '#7a493b'];

const HAIR_COLORS = [
  'none', '#222222', '#3d2314', '#593e2b', '#80593b', 
  '#a87a51', '#cfa173', '#f2d4a2', '#f9ebb5', 
  '#6b221d', '#9e3b22', '#d46535', '#e89c6d',
  '#b88ce6', '#ff99cc', '#a2d149', '#80b6f0'
];

const CLOTHES_COLORS = [
  'none', '#ffffff', '#222222', '#ff595e', '#ffca3a',
  '#8ac926', '#1982c4', '#6a4c93', '#f4a261',
  '#e76f51', '#2a9d8f', '#264653', '#e9c46a'
];

export default function CustomizationControls({ 
  selectedOptions, onChange, 
  activeCategory, setActiveCategory,
  skinColor, onSkinColorChange, 
  hairColor, onHairColorChange,
  clothesColor, onClothesColorChange,
  badgeHue, onBadgeHueChange,
  badgeTextColor, onBadgeTextColorChange,
  onResetLayer
}) {
  const tabsRef = useRef(null);
  const paletteRef = useRef(null);
  const paletteScrollRef = useRef(null);
  const optionsGridRef = useRef(null);

  useGSAP(() => {
    if (!paletteRef.current) return;
    if (activeCategory.startsWith('hair') || activeCategory === 'clothes') {
      gsap.to(paletteRef.current, { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.fromTo('.hair-swatch', 
        { scale: 0, rotation: -45, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.4, stagger: 0.03, ease: 'back.out(1.5)', delay: 0.1, overwrite: 'auto' }
      );
    } else {
      gsap.to('.hair-swatch', { scale: 0, opacity: 0, duration: 0.2, stagger: -0.01, ease: 'power2.in', overwrite: 'auto' });
      gsap.to(paletteRef.current, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in', delay: 0.1, overwrite: 'auto' });
    }
  }, [activeCategory]);

  const handleTabClick = (key, e) => {
    setActiveCategory(key);
    if (tabsRef.current && e.target) {
      const container = tabsRef.current;
      const tab = e.target;
      const scrollLeft = tab.offsetLeft - (container.offsetWidth / 2) + (tab.offsetWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    const setupScroll = (el, horizontal = true, vertical = false) => {
      if (!el) return null;
      let isDown = false;
      let startX, startY;
      let scrollLeft, scrollTop;
      let isDragging = false;

      const onMouseDown = (e) => {
        isDown = true;
        isDragging = false;
        startX = e.pageX - el.offsetLeft;
        startY = e.pageY - el.offsetTop;
        scrollLeft = el.scrollLeft;
        scrollTop = el.scrollTop;
      };
      const onMouseLeave = () => {
        isDown = false;
      };
      const onMouseUp = () => {
        isDown = false;
      };
      const onMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        const y = e.pageY - el.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        if (horizontal && Math.abs(walkX) > 5) isDragging = true;
        if (vertical && Math.abs(walkY) > 5) isDragging = true;
        
        if (horizontal) el.scrollLeft = scrollLeft - walkX;
        if (vertical) el.scrollTop = scrollTop - walkY;
      };
      
      const onClick = (e) => {
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
          isDragging = false;
        }
      };

      const handleWheel = (e) => {
        if (horizontal && !vertical) {
          if (e.deltaY !== 0) {
            e.preventDefault();
            el.scrollLeft += e.deltaY;
          }
        }
      };

      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('mouseleave', onMouseLeave);
      el.addEventListener('mouseup', onMouseUp);
      el.addEventListener('mousemove', onMouseMove);
      el.addEventListener('click', onClick, { capture: true });
      if (horizontal && !vertical) el.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        el.removeEventListener('mousedown', onMouseDown);
        el.removeEventListener('mouseleave', onMouseLeave);
        el.removeEventListener('mouseup', onMouseUp);
        el.removeEventListener('mousemove', onMouseMove);
        el.removeEventListener('click', onClick, { capture: true });
        if (horizontal && !vertical) el.removeEventListener('wheel', handleWheel);
      };
    };

    const cleanupTabs = setupScroll(tabsRef.current, true, false);
    const cleanupPalette = setupScroll(paletteScrollRef.current, true, false);
    const cleanupOptions = setupScroll(optionsGridRef.current, false, true);

    return () => {
      if (cleanupTabs) cleanupTabs();
      if (cleanupPalette) cleanupPalette();
      if (cleanupOptions) cleanupOptions();
    };
  }, []);

  const allTabs = [...CATEGORY_KEYS, 'badge', 'text'];
  const isPositionable = activeCategory !== 'badge' && activeCategory !== 'text';

  return (
    <div data-testid="customization-controls" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Category tabs */}
      <div className="tabs-wrapper">
        <div className="tabs-container" role="tablist" ref={tabsRef}>
          {allTabs.map(key => {
            let name = '';
            if (key === 'badge') name = 'Badge';
            else if (key === 'text') name = 'Text';
            else name = CATEGORIES[key].name;

            return (
              <button
                key={key}
                role="tab"
                aria-selected={activeCategory === key}
                data-testid={`tab-${key}`}
                onClick={(e) => handleTabClick(key, e)}
                className={`tab-btn ${activeCategory === key ? 'active' : ''}`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
      
      {isPositionable && (
        <div style={{ padding: '10px 16px 4px 16px', display: 'flex', justifyContent: 'center', flex: 'none', height: 'auto' }}>
          <button 
            className="reset-layer-btn"
            style={{ padding: '8px 24px', fontSize: '0.8rem', width: '100%' }}
            onClick={() => onResetLayer(activeCategory)}>
            ↺ Reset {activeCategory === 'skin' ? 'Avatar' : CATEGORIES[activeCategory].name} Position
          </button>
        </div>
      )}

      <div ref={paletteRef} className="hair-palette-container">
        <div className="hair-palette-inner">
          <div ref={paletteScrollRef} className="hair-palette">
            {(activeCategory === 'clothes' ? CLOTHES_COLORS : HAIR_COLORS).map(color => (
              <div
                key={color}
                role="button"
                tabIndex={0}
                className={`hair-swatch ${(activeCategory === 'clothes' ? clothesColor : hairColor) === color ? 'selected' : ''}`}
                onClick={() => activeCategory === 'clothes' ? onClothesColorChange(color) : onHairColorChange(color)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activeCategory === 'clothes' ? onClothesColorChange(color) : onHairColorChange(color);
                  }
                }}
                style={{ 
                  background: color === 'none' 
                    ? 'linear-gradient(to top right, white calc(50% - 2px), #C0392B 50%, white calc(50% + 2px))'
                    : color, 
                  flexShrink: 0, 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  border: '2px solid rgba(0,0,0,0.2)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                title={color === 'none' ? 'No Tint' : `Color ${color}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div ref={optionsGridRef} className="options-grid">
        {activeCategory === 'badge' ? (
          BADGE_HUES.map(hue => (
            <div
              key={hue}
              role="button"
              tabIndex={0}
              className={`option-btn ${badgeHue === hue ? 'selected' : ''}`}
              onClick={() => onBadgeHueChange(hue)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBadgeHueChange(hue);
                }
              }}
              title={`Hue ${hue}°`}
            >
              <div className="option-btn-content">
                <img 
                  crossOrigin="anonymous"
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
          ))
        ) : activeCategory === 'text' ? (
          BADGE_TEXT_COLORS.map(color => (
            <div
              key={color}
              role="button"
              tabIndex={0}
              className={`option-btn ${badgeTextColor === color ? 'selected' : ''}`}
              onClick={() => onBadgeTextColorChange(color)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBadgeTextColorChange(color);
                }
              }}
              style={{ backgroundColor: color }}
              title={`Text Color ${color}`}
            />
          ))
        ) : (
          CATEGORIES[activeCategory].options.map(option => {
            const isSelected = selectedOptions[activeCategory] === option.id;
            return (
              <div
                key={option.id}
                role="button"
                tabIndex={0}
                data-testid={`option-${option.id}`}
                aria-selected={isSelected}
                onClick={() => onChange(activeCategory, option.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange(activeCategory, option.id);
                  }
                }}
                className={`option-btn ${isSelected ? 'selected' : ''}`}
              >
                <div className="option-btn-content">
                  {option.path ? (
                    <>
                      <img crossOrigin="anonymous" src={option.path} alt={option.name} loading="lazy" style={{ position: 'relative', zIndex: 1 }} />
                      {activeCategory === 'skin' && option.color && option.color !== '#fadcbc' && (
                        <div style={{
                          position: 'absolute',
                          top: '8px', left: '8px', width: 'calc(100% - 16px)', height: 'calc(100% - 16px)',
                          backgroundColor: option.color,
                          mixBlendMode: 'multiply',
                          zIndex: 2,
                          WebkitMaskImage: `url(${option.path})`,
                          WebkitMaskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center'
                        }} />
                      )}
                      {(activeCategory.startsWith('hair') && hairColor !== 'none') || (activeCategory === 'clothes' && clothesColor !== 'none') ? (
                        <div style={{
                          position: 'absolute',
                          top: '8px', left: '8px', width: 'calc(100% - 16px)', height: 'calc(100% - 16px)',
                          backgroundColor: activeCategory === 'clothes' ? clothesColor : hairColor,
                          mixBlendMode: 'multiply',
                          zIndex: 2,
                          WebkitMaskImage: `url(${option.path})`,
                          WebkitMaskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center'
                        }} />
                      ) : null}
                    </>
                  ) : (
                    <span className="option-label">{option.name}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
