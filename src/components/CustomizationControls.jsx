import React, { useState, useRef } from 'react';
import { CATEGORIES, CATEGORY_KEYS } from '../constants/categories';

const SKIN_TONES = [
  '#fadcbc', // Default beige
  '#f1c27d', // Warm peach
  '#e0ac69', // Golden
  '#c68642', // Tan
  '#8d5524', // Brown
  '#3d2210', // Dark brown
  '#ffdbac', // Pale
  '#e5c298', // Olive
];

const BADGE_HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export default function CustomizationControls({ selectedOptions, onChange, skinColor, onSkinColorChange, badgeHue, onBadgeHueChange }) {
  const [activeCategory, setActiveCategory] = useState('skin');

  const tabsRef = useRef(null);

  const handleTabClick = (key, e) => {
    setActiveCategory(key);
    // Smooth scroll the clicked tab to center
    if (tabsRef.current && e.target) {
      const container = tabsRef.current;
      const tab = e.target;
      const scrollLeft = tab.offsetLeft - (container.offsetWidth / 2) + (tab.offsetWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  // Block scroll wheel on tabs - must be non-passive to allow preventDefault
  React.useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const block = (e) => e.preventDefault();
    el.addEventListener('wheel', block, { passive: false });
    return () => el.removeEventListener('wheel', block);
  }, []);

  return (
    <div data-testid="customization-controls" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Category tabs */}
      <div className="tabs-wrapper">
        <div className="tabs-container" role="tablist" ref={tabsRef}>
          {CATEGORY_KEYS.map(key => (
            <button
              key={key}
              role="tab"
              aria-selected={activeCategory === key}
              data-testid={`tab-${key}`}
              onClick={(e) => handleTabClick(key, e)}
              className={`tab-btn ${activeCategory === key ? 'active' : ''}`}
            >
              {CATEGORIES[key].name}
            </button>
          ))}
        </div>
      </div>

      <div className="options-grid">
        {CATEGORIES[activeCategory].options.map(option => {
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
        })}
      </div>
    </div>
  );
}
