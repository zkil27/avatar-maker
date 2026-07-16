import React, { useState } from 'react';
import { CATEGORIES, CATEGORY_KEYS } from '../constants/categories';

export default function CustomizationControls({ selectedOptions, onChange }) {
  const [activeCategory, setActiveCategory] = useState('skin');

  return (
    <div data-testid="customization-controls">
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
    </div>
  );
}
