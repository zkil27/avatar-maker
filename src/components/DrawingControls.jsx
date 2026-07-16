import React from 'react';

const COLORS = [
  '#5D4E37', // text-primary
  '#000000', // black
  '#FFFFFF', // white
  '#FFD4D4', // pink-soft
  '#7AADCA', // text-accent (blue)
  '#FFF3C4', // yellow-soft
];

export default function DrawingControls({
  drawingColor,
  setDrawingColor,
  drawingSize,
  setDrawingSize,
  drawingTool,
  setDrawingTool,
  onClear,
  onDone,
}) {
  return (
    <div className="drawing-controls" data-testid="drawing-controls">
      <div className="drawing-tools">
        <button
          className={`tool-btn ${drawingTool === 'pen' ? 'active' : ''}`}
          onClick={() => setDrawingTool('pen')}
        >
          ✎ Pen
        </button>
        <button
          className={`tool-btn ${drawingTool === 'eraser' ? 'active' : ''}`}
          onClick={() => setDrawingTool('eraser')}
        >
          ▱ Eraser
        </button>
        <button className="tool-btn" onClick={onClear} style={{ marginLeft: 'auto' }}>
          🗑 Clear
        </button>
      </div>

      {drawingTool === 'pen' && (
        <div className="color-palette">
          {COLORS.map(color => (
            <button
              key={color}
              className={`color-swatch ${drawingColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setDrawingColor(color)}
              aria-label={`Color ${color}`}
            />
          ))}
          <input
            type="color"
            className="color-picker"
            value={drawingColor}
            onChange={(e) => setDrawingColor(e.target.value)}
          />
        </div>
      )}

      <div className="slider-container">
        <label>Size: {drawingSize}px</label>
        <input
          type="range"
          min="1"
          max="30"
          value={drawingSize}
          onChange={(e) => setDrawingSize(Number(e.target.value))}
          className="size-slider"
        />
      </div>

      <button className="btn btn-download" style={{ width: '100%', marginTop: '12px' }} onClick={onDone}>
        ✓ Done Drawing
      </button>
    </div>
  );
}
