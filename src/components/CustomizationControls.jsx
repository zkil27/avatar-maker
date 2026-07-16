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
          <button
            role="tab"
            aria-selected={activeCategory === 'badge'}
            onClick={(e) => handleTabClick('badge', e)}
            className={`tab-btn ${activeCategory === 'badge' ? 'active' : ''}`}
          >
            Badge
          </button>
        </div>
      </div>

      {activeCategory === 'badge' ? (
        <div className="badge-controls" style={{ padding: '16px 4px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', overflowY: 'auto' }}>
          {BADGE_HUES.map(hue => (
            <button
              key={hue}
              onClick={() => onBadgeHueChange(hue)}
              style={{
                width: '100%',
                aspectRatio: '1',
                minHeight: '60px',
                borderRadius: '50%',
                border: badgeHue === hue ? '3.5px solid var(--primary-color)' : '2px solid var(--border-light)',
                backgroundColor: '#fff',
                padding: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: badgeHue === hue ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 0 var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
              title={`Hue ${hue}°`}
            >
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'url(/assets/frame/frame1.png) center/cover',
                filter: `hue-rotate(${hue}deg)`
              }} />
            </button>
          ))}
        </div>
      ) : (

      <div className="options-grid" style={{ marginTop: '12px' }}>
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
      )}
    </div>
  );
}
