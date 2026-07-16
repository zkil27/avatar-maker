import React, { useEffect, useLayoutEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
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

const AvatarCanvas = forwardRef(({ selectedOptions, onLoadingChange, skinColor, badgeHue, layerPositions, setLayerPositions, activePositionLayer, isPositioning }, ref) => {
  const mainCanvasRef = useRef(null);
  const loadedImagesRef = useRef(new Map());
  const tintedSkinCache = useRef({ color: null, canvas: null });
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const layerPositionsRef = useRef(layerPositions);

  // Keep ref in sync and redraw immediately without re-triggering the image loader
  useLayoutEffect(() => {
    layerPositionsRef.current = layerPositions;
    renderComposite();
  }, [layerPositions]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => mainCanvasRef.current
  }));

  const renderComposite = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 400;

    canvas.width = size * dpr;
    canvas.height = size * dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // Clip the canvas to a perfect circle so the exported image matches the preview exactly
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const sortedCategories = CATEGORY_KEYS
      .map(key => ({ key, ...CATEGORIES[key] }))
      .sort((a, b) => a.zIndex - b.zIndex);

    // No more drawCentered function here, logic moved inside loop

    // Apply badge hue rotation to the base frames
    if (badgeHue) {
      ctx.filter = `hue-rotate(${badgeHue}deg)`;
    }

    // 1. Draw frame backgrounds
    const frame1 = loadedImagesRef.current.get('frame1');
    if (frame1) ctx.drawImage(frame1, 0, 0, size, size);

    // 2. Draw texture with soft-light ONLY over the background
    const texture = loadedImagesRef.current.get('frame_texture');
    if (texture) {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.drawImage(texture, 0, 0, size, size);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Reset filter for the avatar so it isn't colorized
    ctx.filter = 'none';

    // 3. Draw Avatar (BEHIND frame2)
    sortedCategories.forEach(({ key }) => {
      const img = loadedImagesRef.current.get(key);
      
      if (img) {
        ctx.save();
        
        const layers = layerPositionsRef.current || {};
        const globalPos = layers.global || { scale: 0.75, x: 0, y: 15, rotation: 0 };
        const localPos = layers[key] || { scale: 1, x: 0, y: 0, rotation: 0 };
        
        const targetWidth = size * (globalPos.scale || 0.75) * (localPos.scale || 1);
        const scale = targetWidth / img.width;
        const dw = targetWidth;
        const dh = img.height * scale;
        const dx = -dw / 2;
        const dy = -dh / 2;

        const globalDx = size * ((globalPos.x || 0) / 100);
        const globalDy = size * ((globalPos.y !== undefined ? globalPos.y : 15) / 100);
        const centerX = size / 2 + globalDx;
        const centerY = size / 2 + globalDy;
        
        ctx.translate(centerX, centerY);
        ctx.rotate((globalPos.rotation || 0) * Math.PI / 180);
        
        const localDx = size * ((localPos.x || 0) / 100) * (globalPos.scale || 0.75);
        const localDy = size * ((localPos.y || 0) / 100) * (globalPos.scale || 0.75);
        ctx.translate(localDx, localDy);
        ctx.rotate((localPos.rotation || 0) * Math.PI / 180);

        if (key === 'skin' && skinColor && skinColor !== '#fadcbc') {
          if (tintedSkinCache.current.color !== skinColor || !tintedSkinCache.current.canvas) {
            const tCanvas = document.createElement('canvas');
            tCanvas.width = img.width;
            tCanvas.height = img.height;
            const tCtx = tCanvas.getContext('2d');
            tCtx.drawImage(img, 0, 0);
            
            const imgData = tCtx.getImageData(0, 0, img.width, img.height);
            const data = imgData.data;
            const hex = skinColor;
            const tr = parseInt(hex.slice(1,3), 16);
            const tg = parseInt(hex.slice(3,5), 16);
            const tb = parseInt(hex.slice(5,7), 16);

            for (let i = 0; i < data.length; i += 4) {
              if (data[i+3] > 0) {
                const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
                if (brightness > 60) {
                  const factor = Math.min(1, brightness / 235);
                  data[i] = tr * factor;
                  data[i+1] = tg * factor;
                  data[i+2] = tb * factor;
                }
              }
            }
            tCtx.putImageData(imgData, 0, 0);
            tintedSkinCache.current.color = skinColor;
            tintedSkinCache.current.canvas = tCanvas;
          }
          ctx.drawImage(tintedSkinCache.current.canvas, dx, dy, dw, dh);
        } else {
          ctx.drawImage(img, dx, dy, dw, dh);
        }
        
        ctx.restore();
      }
    });

    // Re-apply hue rotation for the outer brown ring
    if (badgeHue) {
      ctx.filter = `hue-rotate(${badgeHue}deg)`;
    }

    // 4. Draw overlays (frame2, frame3, frame4)
    const frame2 = loadedImagesRef.current.get('frame2');
    if (frame2) ctx.drawImage(frame2, 0, 0, size, size);

    // Reset filter for the white overlays
    ctx.filter = 'none';

    const frame3 = loadedImagesRef.current.get('frame3');
    if (frame3) ctx.drawImage(frame3, 0, 0, size, size);

    const frame4 = loadedImagesRef.current.get('frame4');
    if (frame4) ctx.drawImage(frame4, 0, 0, size, size);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [skinColor, badgeHue]); // Added badgeHue to dependencies

  // Re-render when skin color toggles
  useEffect(() => {
    renderComposite();
  }, [skinColor, renderComposite]);

  useEffect(() => {
    let isCurrent = true;
    if (onLoadingChange) onLoadingChange(true);

    const loadPromises = CATEGORY_KEYS.map(key => {
      const selectedId = selectedOptions[key];
      if (!selectedId || selectedId === 'none') {
        loadedImagesRef.current.set(key, null);
        return Promise.resolve();
      }
      const option = CATEGORIES[key].options.find(opt => opt.id === selectedId);
      if (option?.path) {
        return loadImage(option.path)
          .then(img => {
            if (isCurrent) loadedImagesRef.current.set(key, img);
          })
          .catch(() => {
            if (isCurrent) loadedImagesRef.current.set(key, null);
          });
      }
      loadedImagesRef.current.set(key, null);
      return Promise.resolve();
    });

    // Load static frame assets
    const frameAssets = [
      { key: 'frame1', path: '/assets/frame/frame1.png' },
      { key: 'frame2', path: '/assets/frame/frame2.png' },
      { key: 'frame3', path: '/assets/frame/frame3.png' },
      { key: 'frame4', path: '/assets/frame/frame4.png' },
      { key: 'frame_texture', path: '/assets/frame/Texturelabs_Fabric_195L 1.png' },
    ];
    
    frameAssets.forEach(({ key, path }) => {
      loadPromises.push(
        loadImage(path)
          .then(img => {
            if (isCurrent) loadedImagesRef.current.set(key, img);
          })
          .catch(() => {
            if (isCurrent) loadedImagesRef.current.set(key, null);
          })
      );
    });

    Promise.all(loadPromises).then(() => {
      if (!isCurrent) return;
      renderComposite();
      if (onLoadingChange) onLoadingChange(false);
    });

    return () => { isCurrent = false; };
  }, [selectedOptions, onLoadingChange, renderComposite]);

  const activeLayersStr = CATEGORY_KEYS
    .map(key => `${key}:${selectedOptions[key] || 'none'}`)
    .join(',');

  const handlePointerDown = (e) => {
    if (!isPositioning) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || !isPositioning) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };
    
    // Convert screen pixel movement to actual canvas coordinate percentages
    const rect = e.target.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 400 / rect.height;
    
    // Since 1% = 4px on a 400x400 canvas, we divide by 4 to get percentage offset
    setLayerPositions(prev => {
      const layer = activePositionLayer || 'global';
      const current = prev[layer] || { x: 0, y: 0, scale: 1, rotation: 0 };
      const scaleAdjustment = layer === 'global' ? 1 : (prev.global?.scale || 0.75);
      
      return {
        ...prev,
        [layer]: {
          ...current,
          x: current.x + (dx * scaleX) / (4 * scaleAdjustment),
          y: current.y + (dy * scaleY) / (4 * scaleAdjustment)
        }
      };
    });
  };

  const handlePointerUp = (e) => {
    if (!isPositioning) return;
    isDragging.current = false;
    e.target.releasePointerCapture(e.pointerId);
  };

  return (
    <canvas 
      ref={mainCanvasRef} 
      width={400} 
      height={400} 
      data-testid="avatar-canvas" 
      data-active-layers={activeLayersStr}
      style={{ 
        width: '100%', 
        height: 'auto',
        cursor: isPositioning ? 'grab' : 'default',
        touchAction: isPositioning ? 'none' : 'auto'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
});

export default AvatarCanvas;
