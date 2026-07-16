import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
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

const AvatarCanvas = forwardRef(({ selectedOptions, onLoadingChange, isDrawingMode, drawingColor, drawingSize, drawingTool, skinColor }, ref) => {
  const mainCanvasRef = useRef(null);
  const drawingCanvasRef = useRef(null); // Offscreen persistent drawing
  const interactionCanvasRef = useRef(null); // On-screen overlay for capturing strokes

  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const loadedImagesRef = useRef(new Map());
  const tintedSkinCache = useRef({ color: null, canvas: null });

  // Initialize offscreen canvas
  useEffect(() => {
    const dCanvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    dCanvas.width = 400 * dpr;
    dCanvas.height = 400 * dpr;
    drawingCanvasRef.current = dCanvas;
  }, []);

  useImperativeHandle(ref, () => ({
    getCanvas: () => mainCanvasRef.current,
    clearDrawing: () => {
      const dCanvas = drawingCanvasRef.current;
      if (dCanvas) {
        const ctx = dCanvas.getContext('2d');
        ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);
        renderComposite();
      }
    }
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

    const sortedCategories = CATEGORY_KEYS
      .map(key => ({ key, ...CATEGORIES[key] }))
      .sort((a, b) => a.zIndex - b.zIndex);

    sortedCategories.forEach(({ key }) => {
      const img = loadedImagesRef.current.get(key);
      const hidePremade = isDrawingMode && (key === 'eyes' || key === 'mouth');
      
      if (img && !hidePremade) {
        const scale = size / img.width;
        const dw = size;
        const dh = img.height * scale;
        const dx = (size - dw) / 2;
        let dy = 0;
        if (dh > size) {
           dy = (size - dh) * 0.15;
        } else {
           dy = (size - dh) / 2;
        }

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
      }

      // Draw custom drawing layer right after 'eyes' (zIndex 4)
      if (key === 'eyes' && drawingCanvasRef.current) {
        // We draw the offscreen canvas which is already at DPR scale
        // Since ctx is currently scaled by DPR, we need to draw it at size x size
        ctx.drawImage(drawingCanvasRef.current, 0, 0, size, size);
      }
    });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [isDrawingMode, skinColor]);

  // Re-render when drawing mode or skin color toggles
  useEffect(() => {
    renderComposite();
  }, [isDrawingMode, skinColor, renderComposite]);

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

    Promise.all(loadPromises).then(() => {
      if (!isCurrent) return;
      renderComposite();
      if (onLoadingChange) onLoadingChange(false);
    });

    return () => { isCurrent = false; };
  }, [selectedOptions, onLoadingChange, renderComposite]);

  // Drawing event handlers
  const getCoords = (e) => {
    const canvas = interactionCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    return {
      x: ((e.clientX - rect.left) / rect.width) * 400 * dpr,
      y: ((e.clientY - rect.top) / rect.height) * 400 * dpr
    };
  };

  const magnifierCanvasRef = useRef(null);

  const updateMagnifier = (pos) => {
    const mCanvas = magnifierCanvasRef.current;
    const sourceCanvas = mainCanvasRef.current;
    if (!mCanvas || !sourceCanvas) return;

    const mCtx = mCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const magSize = 100 * dpr;
    const zoom = 2; // 2x zoom
    
    mCanvas.width = magSize;
    mCanvas.height = magSize;

    mCtx.save();
    mCtx.clearRect(0, 0, magSize, magSize);
    
    // pos.x and pos.y are in the 400*dpr coordinate space
    const sourceWidth = magSize / zoom;
    const sourceHeight = magSize / zoom;
    const sx = pos.x - sourceWidth / 2;
    const sy = pos.y - sourceHeight / 2;

    mCtx.beginPath();
    mCtx.arc(magSize/2, magSize/2, magSize/2, 0, Math.PI * 2);
    mCtx.clip();

    // Fill white background in case of transparency
    mCtx.fillStyle = '#fff';
    mCtx.fill();

    mCtx.drawImage(
      sourceCanvas,
      sx, sy, sourceWidth, sourceHeight,
      0, 0, magSize, magSize
    );
    mCtx.restore();
    
    // Draw crosshair (outside clip so it touches the border)
    mCtx.strokeStyle = 'rgba(0,0,0,0.3)';
    mCtx.lineWidth = 1 * dpr;
    mCtx.beginPath();
    mCtx.moveTo(magSize/2, 0);
    mCtx.lineTo(magSize/2, magSize);
    mCtx.moveTo(0, magSize/2);
    mCtx.lineTo(magSize, magSize/2);
    mCtx.stroke();

    // Position magnifier away from finger
    if (pos.x > 200 * dpr) {
      mCanvas.style.left = '10px';
      mCanvas.style.right = 'auto';
    } else {
      mCanvas.style.right = '10px';
      mCanvas.style.left = 'auto';
    }
  };

  const handlePointerDown = (e) => {
    if (!isDrawingMode) return;
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getCoords(e);
    if (magnifierCanvasRef.current) magnifierCanvasRef.current.style.display = 'block';
    updateMagnifier(lastPos.current);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing.current || !isDrawingMode) return;
    e.preventDefault();
    const newPos = getCoords(e);
    
    const dCanvas = drawingCanvasRef.current;
    const ctx = dCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(newPos.x, newPos.y);
    ctx.strokeStyle = drawingTool === 'eraser' ? '#000' : drawingColor;
    ctx.lineWidth = drawingSize * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (drawingTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.stroke();
    
    lastPos.current = newPos;
    renderComposite();
    updateMagnifier(newPos);
  };

  const handlePointerUp = () => {
    isDrawing.current = false;
    if (magnifierCanvasRef.current) magnifierCanvasRef.current.style.display = 'none';
  };

  // Sync interaction canvas size and prevent native scrolling
  useEffect(() => {
    const iCanvas = interactionCanvasRef.current;
    if (iCanvas) {
      const dpr = window.devicePixelRatio || 1;
      iCanvas.width = 400 * dpr;
      iCanvas.height = 400 * dpr;
      
      const preventScroll = (e) => e.preventDefault();
      iCanvas.addEventListener('touchmove', preventScroll, { passive: false });
      return () => iCanvas.removeEventListener('touchmove', preventScroll);
    }
  }, []);

  const activeLayersStr = CATEGORY_KEYS
    .map(key => `${key}:${selectedOptions[key] || 'none'}`)
    .join(',');

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={mainCanvasRef}
        data-testid="avatar-canvas"
        data-active-layers={activeLayersStr}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <canvas
        ref={interactionCanvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: isDrawingMode ? 'auto' : 'none',
          touchAction: 'none'
        }}
      />
      <canvas
        ref={magnifierCanvasRef}
        style={{
          position: 'absolute',
          top: '10px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '3px solid var(--text-accent, #7AADCA)',
          backgroundColor: '#fff',
          pointerEvents: 'none',
          display: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 20,
          transition: 'left 0.15s ease, right 0.15s ease',
        }}
      />
    </div>
  );
});

export default AvatarCanvas;
