import React, { useEffect, useLayoutEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { CATEGORIES, CATEGORY_KEYS } from '../constants/categories';

export const INITIAL_STATE = {
  skin: 'skin_1',
  eyes: 'eyes_1',
  mouth: 'mouth_1',
  hair_back: 'none',
  clothes: 'clothes_1',
  hair_bangs: 'none',
  accessories_1: 'none',
  accessories_2: 'none',
  accessories_3: 'none',
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

const AvatarCanvas = forwardRef(({ selectedOptions, onLoadingChange, skinColor, hairColor, clothesColor, badgeHue, layerPositions, setLayerPositions, activePositionLayer, isPositioning, badgeOpacity = 1, badgeTextColor = '#ffffff' }, ref) => {
  const mainCanvasRef = useRef(null);
  const loadedImagesRef = useRef(new Map());
  const tintedSkinCache = useRef({ color: null, canvas: null, originalSrc: null });
  const tintedHairBackCache = useRef({ color: null, canvas: null, originalSrc: null });
  const tintedHairBangsCache = useRef({ color: null, canvas: null, originalSrc: null });
  const tintedClothesCache = useRef({ color: null, canvas: null, originalSrc: null });
  const tintedTextCache = useRef({ color: null, frame3: null, frame4: null });
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const layerPositionsRef = useRef(layerPositions);

  // Keep ref in sync and redraw immediately without re-triggering the image loader
  useLayoutEffect(() => {
    layerPositionsRef.current = layerPositions;
    renderComposite();
  }, [layerPositions, badgeOpacity, skinColor, hairColor, clothesColor, badgeHue, badgeTextColor]);

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

    // Clip the canvas to a perfect circle ONLY if the badge is visible
    if (badgeOpacity > 0) {
      ctx.save(); // Save before clip
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    const sortedCategories = CATEGORY_KEYS
      .map(key => ({ key, ...CATEGORIES[key] }))
      .sort((a, b) => a.zIndex - b.zIndex);

    // No more drawCentered function here, logic moved inside loop

    // Apply badge hue rotation to the base frames
    if (badgeHue) {
      ctx.filter = `hue-rotate(${badgeHue}deg)`;
    }

    if (badgeOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = badgeOpacity;
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
      ctx.restore();
    }

    // Reset filter before drawing the avatar so it doesn't get hue-rotated
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

        let layerToDraw = img;
        
        if ((key === 'skin' && skinColor && skinColor !== 'none') ||
            (key === 'hair_back' && hairColor && hairColor !== 'none') ||
            (key === 'hair_bangs' && hairColor && hairColor !== 'none') ||
            (key === 'clothes' && clothesColor && clothesColor !== 'none')) {
          
          let cacheRef;
          let targetColor;
          if (key === 'skin') { cacheRef = tintedSkinCache; targetColor = skinColor; }
          else if (key === 'hair_back') { cacheRef = tintedHairBackCache; targetColor = hairColor; }
          else if (key === 'hair_bangs') { cacheRef = tintedHairBangsCache; targetColor = hairColor; }
          else if (key === 'clothes') { cacheRef = tintedClothesCache; targetColor = clothesColor; }
          
          if (cacheRef.current.color !== targetColor || !cacheRef.current.canvas || cacheRef.current.originalSrc !== img.src) {
            const tCanvas = document.createElement('canvas');
            tCanvas.width = img.width;
            tCanvas.height = img.height;
            const tCtx = tCanvas.getContext('2d');
            tCtx.drawImage(img, 0, 0);
            
            const imgData = tCtx.getImageData(0, 0, img.width, img.height);
            const data = imgData.data;
            const hex = targetColor;
            const tr = parseInt(hex.slice(1,3), 16);
            const tg = parseInt(hex.slice(3,5), 16);
            const tb = parseInt(hex.slice(5,7), 16);

            const threshold = key === 'skin' ? 60 : 15;
            for (let i = 0; i < data.length; i += 4) {
              if (data[i+3] > 0) {
                const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
                if (brightness > threshold) {
                  // Normalize factor based on typical asset brightness to preserve both shadows and highlights
                  let normBase = 130;
                  if (key === 'skin') normBase = 235;
                  else if (key === 'clothes') normBase = 235;
                  
                  const factor = brightness / normBase;
                  data[i] = Math.min(255, tr * factor);
                  data[i+1] = Math.min(255, tg * factor);
                  data[i+2] = Math.min(255, tb * factor);
                }
              }
            }
            tCtx.putImageData(imgData, 0, 0);
            cacheRef.current.color = targetColor;
            cacheRef.current.canvas = tCanvas;
            cacheRef.current.originalSrc = img.src;
          }
          layerToDraw = cacheRef.current.canvas;
        }

        ctx.drawImage(layerToDraw, dx, dy, dw, dh);
        
        ctx.restore();
      }
    });

    if (badgeOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = badgeOpacity;
      
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
      const frame4 = loadedImagesRef.current.get('frame4');

      if (badgeTextColor && badgeTextColor !== '#ffffff') {
        if (tintedTextCache.current.color !== badgeTextColor) {
          const tintFrame = (img) => {
            if (!img) return null;
            const tCanvas = document.createElement('canvas');
            tCanvas.width = img.width;
            tCanvas.height = img.height;
            const tCtx = tCanvas.getContext('2d');
            tCtx.drawImage(img, 0, 0);
            tCtx.globalCompositeOperation = 'source-in';
            tCtx.fillStyle = badgeTextColor;
            tCtx.fillRect(0, 0, img.width, img.height);
            return tCanvas;
          };
          tintedTextCache.current.frame3 = tintFrame(frame3);
          tintedTextCache.current.color = badgeTextColor;
        }
        if (tintedTextCache.current.frame3) ctx.drawImage(tintedTextCache.current.frame3, 0, 0, size, size);
      } else {
        if (frame3) ctx.drawImage(frame3, 0, 0, size, size);
      }

      // frame4 remains untinted
      if (frame4) ctx.drawImage(frame4, 0, 0, size, size);
      
      ctx.restore();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Restore the canvas state to remove the clip
    if (badgeOpacity > 0) {
      ctx.restore(); // Restore after clip
    }
  }, [skinColor, hairColor, clothesColor, badgeHue, badgeOpacity, badgeTextColor]); 

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

  const activePointers = useRef(new Map());
  const initialGestureState = useRef(null);

  const handlePointerDown = (e) => {
    if (!isPositioning) return;
    e.target.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    // When a second finger touches, lock in the initial distance and angle for scaling/rotating
    if (activePointers.current.size === 2) {
      const pointers = Array.from(activePointers.current.values());
      const dx = pointers[1].x - pointers[0].x;
      const dy = pointers[1].y - pointers[0].y;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      const layer = activePositionLayer || 'global';
      const currentPos = layerPositionsRef.current[layer] || { x: 0, y: 0, scale: 1, rotation: 0 };
      
      initialGestureState.current = {
        distance,
        angle,
        baseScale: currentPos.scale || 1,
        baseRotation: currentPos.rotation || 0
      };
    } else if (activePointers.current.size === 1) {
      initialGestureState.current = null;
    }
  };

  const handlePointerMove = (e) => {
    if (!isPositioning || !activePointers.current.has(e.pointerId)) return;
    
    const prevPos = activePointers.current.get(e.pointerId);
    const dxDrag = e.clientX - prevPos.x;
    const dyDrag = e.clientY - prevPos.y;
    
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const rect = e.target.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 400 / rect.height;

    setLayerPositions(prev => {
      const layer = activePositionLayer || 'global';
      const current = prev[layer] || { x: 0, y: 0, scale: 1, rotation: 0 };
      const scaleAdjustment = layer === 'global' ? 1 : (prev.global?.scale || 0.75);
      
      if (activePointers.current.size === 1) {
        // Drag to pan
        return {
          ...prev,
          [layer]: {
            ...current,
            x: current.x + (dxDrag * scaleX) / (4 * scaleAdjustment),
            y: current.y + (dyDrag * scaleY) / (4 * scaleAdjustment)
          }
        };
      } else if (activePointers.current.size === 2 && initialGestureState.current) {
        // Pinch to scale & Twist to rotate
        const pointers = Array.from(activePointers.current.values());
        const dx = pointers[1].x - pointers[0].x;
        const dy = pointers[1].y - pointers[0].y;
        
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        const scaleRatio = distance / initialGestureState.current.distance;
        let newScale = initialGestureState.current.baseScale * scaleRatio;
        newScale = Math.max(0.3, Math.min(2.0, newScale)); // Clamp scale
        
        let angleDelta = angle - initialGestureState.current.angle;
        if (angleDelta > 180) angleDelta -= 360;
        if (angleDelta < -180) angleDelta += 360;
        
        let newRotation = initialGestureState.current.baseRotation + angleDelta;
        if (newRotation > 180) newRotation -= 360;
        if (newRotation < -180) newRotation += 360;

        return {
          ...prev,
          [layer]: {
            ...current,
            scale: newScale,
            rotation: Math.round(newRotation)
          }
        };
      }
      return prev;
    });
  };

  const handlePointerUp = (e) => {
    if (!isPositioning) return;
    activePointers.current.delete(e.pointerId);
    e.target.releasePointerCapture(e.pointerId);
    
    if (activePointers.current.size < 2) {
      initialGestureState.current = null;
    }
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
