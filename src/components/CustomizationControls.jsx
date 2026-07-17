import React, { useRef } from 'react';
import { CATEGORIES, CATEGORY_KEYS } from '../constants/categories';

const SKIN_TONES = [
  '#fadcbc', '#f1c27d', '#e0ac69', '#c68642',
  '#8d5524', '#3d2210', '#ffdbac', '#e5c298',
];

const BADGE_HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const BADGE_TEXT_COLORS = ['#ffffff', '#000000', '#fadcbc', '#e4c653', '#b3391b', '#2a3621', '#4a5b6d', '#7a493b'];

export default function CustomizationControls({ 
  selectedOptions, onChange, 
  activeCategory, setActiveCategory,
  skinColor, onSkinColorChange, 
  badgeHue, onBadgeHueChange,
  badgeTextColor, onBadgeTextColorChange,
  onResetLayer
}) {
  const tabsRef = useRef(null);

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
    const el = tabsRef.current;
    if (!el) return;
    const block = (e) => e.preventDefault();
    el.addEventListener('wheel', block, { passive: false });
    return () => el.removeEventListener('wheel', block);
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

      <div className="options-grid">
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
                      <img src={option.path} alt={option.name} loading="lazy" style={{ position: 'relative', zIndex: 1 }} />
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
