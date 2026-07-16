import React, { useEffect, useRef } from 'react';
import { CATEGORIES, CATEGORY_KEYS } from '../constants/categories';

export const INITIAL_STATE = {
  skin: 'skin_1',
  clothes: 'clothes_1',
  mouth: 'mouth_1',
  eyes: 'eyes_1',
  hair: 'none',
  glasses: 'none',
  hats: 'none',
};

const imageCache = new Map();

const loadImage = (path) => {
  if (imageCache.has(path)) return Promise.resolve(imageCache.get(path));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(path, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load: ${path}`));
    img.src = path;
  });
};

export default function AvatarCanvas({ selectedOptions, onLoadingChange }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isCurrent = true;
    if (onLoadingChange) onLoadingChange(true);

    const dpr = window.devicePixelRatio || 1;
    const size = 400;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const sortedCategories = CATEGORY_KEYS
      .map(key => ({ key, ...CATEGORIES[key] }))
      .sort((a, b) => a.zIndex - b.zIndex);

    const loadPromises = sortedCategories.map(({ key }) => {
      const selectedId = selectedOptions[key];
      if (!selectedId || selectedId === 'none') return Promise.resolve({ key, img: null });
      const option = CATEGORIES[key].options.find(opt => opt.id === selectedId);
      if (option?.path) {
        return loadImage(option.path)
          .then(img => ({ key, img }))
          .catch(() => ({ key, img: null }));
      }
      return Promise.resolve({ key, img: null });
    });

    Promise.all(loadPromises).then(results => {
      if (!isCurrent) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      results.forEach(({ img }) => {
        if (img) {
          // Scale to cover the width of the canvas
          const scale = size / img.width;
          const dw = size;
          const dh = img.height * scale;
          
          // Center horizontally
          const dx = (size - dw) / 2;
          
          // Crop overflow primarily at the bottom (anchor towards the top)
          // Shifting it up slightly (15% of the overflow) so the head doesn't hit the very top edge
          let dy = 0;
          if (dh > size) {
             dy = (size - dh) * 0.15;
          } else {
             dy = (size - dh) / 2; // vertically center if it's shorter
          }

          ctx.drawImage(img, dx, dy, dw, dh);
        }
      });

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (onLoadingChange) onLoadingChange(false);
    });

    return () => { isCurrent = false; };
  }, [selectedOptions, onLoadingChange]);

  const activeLayersStr = CATEGORY_KEYS
    .map(key => `${key}:${selectedOptions[key] || 'none'}`)
    .join(',');

  return (
    <>
      <canvas
        ref={canvasRef}
        data-testid="avatar-canvas"
        data-active-layers={activeLayersStr}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <div data-testid="layers-debug" style={{ display: 'none' }}>
        {CATEGORY_KEYS.map(key => (
          <span key={key} data-testid={`layer-${key}`} data-value={selectedOptions[key] || 'none'}>
            {selectedOptions[key] || 'none'}
          </span>
        ))}
      </div>
    </>
  );
}
