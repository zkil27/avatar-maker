import React, { useState } from 'react';
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

export default function CustomizationControls({ selectedOptions, onChange, skinColor, onSkinColorChange }) {
  const [activeCategory, setActiveCategory] = useState('skin');

  return (
    <div data-testid="customization-controls" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Category tabs */}
      <div className="tabs-container" role="tablist">
        {CATEGORY_KEYS.map(key => (
          <button
            key={key}
            role="tab"
            aria-selected={activeCategory === key}
            data-testid={`tab-${key}`}
            onClick={() => setActiveCategory(key)}
            className={`tab-btn ${activeCategory === key ? 'active' : ''}`}
          >
            {CATEGORIES[key].name}
          </button>
        ))}
      </div>

      {/* Options grid */}
      <div className="options-grid" style={{ marginTop: '12px' }}>
        {CATEGORIES[activeCategory].options.map(option => {
          const isSelected = selectedOptions[activeCategory] === option.id;
          return (
            <button
              key={option.id}
              data-testid={`option-${option.id}`}
              aria-selected={isSelected}
              onClick={() => onChange(activeCategory, option.id)}
              className={`option-btn ${isSelected ? 'selected' : ''}`}
            >
              {option.path ? (
                <img src={option.path} alt={option.name} loading="lazy" />
              ) : (
                <span className="option-label">{option.name}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Skin Color Palette */}
      {activeCategory === 'skin' && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', marginLeft: '4px' }}>
            Skin Tone
          </div>
          <div className="color-palette" style={{ padding: '4px' }}>
            {SKIN_TONES.map(color => (
              <button
                key={color}
                className={`color-swatch ${skinColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color, width: '32px', height: '32px' }}
                onClick={() => onSkinColorChange(color)}
                aria-label={`Skin color ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
