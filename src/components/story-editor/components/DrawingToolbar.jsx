'use client';

import { useState, useEffect } from 'react';
import {
  DRAWING_COLOR_PRESETS,
  BRUSH_MODES,
  enableDrawingMode,
  disableDrawingMode,
  setBrushConfig,
  clearDrawings,
} from '../utils/drawingUtils';
import {
  PenTool,
  Highlighter,
  Eraser,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react';

/**
 * DrawingToolbar Component
 * Controls freehand drawing mode with Pen, Highlighter, and Non-destructive Vector Eraser.
 * 
 * @param {Object} props
 * @param {import('fabric').Canvas} props.fabricCanvas
 * @param {() => void} props.onClose Callback when user finishes drawing
 */
export default function DrawingToolbar({ fabricCanvas, onClose }) {
  const [brushMode, setBrushMode] = useState(BRUSH_MODES.PEN);
  const [strokeWidth, setStrokeWidth] = useState(12);
  const [strokeColor, setStrokeColor] = useState('#ffffff');

  // Activate drawing mode when toolbar mounts
  useEffect(() => {
    if (fabricCanvas) {
      enableDrawingMode(fabricCanvas, {
        mode: brushMode,
        strokeWidth,
        strokeColor,
      });
    }

    return () => {
      // Cleanup on unmount
      if (fabricCanvas) {
        disableDrawingMode(fabricCanvas);
      }
    };
  }, [fabricCanvas]);

  // Update brush config when parameters change
  const handleModeChange = (mode) => {
    setBrushMode(mode);
    let defaultWidth = strokeWidth;
    if (mode === BRUSH_MODES.HIGHLIGHTER && strokeWidth < 24) {
      defaultWidth = 36;
      setStrokeWidth(36);
    } else if (mode === BRUSH_MODES.PEN && strokeWidth > 32) {
      defaultWidth = 12;
      setStrokeWidth(12);
    }

    setBrushConfig(fabricCanvas, {
      mode,
      strokeWidth: defaultWidth,
      strokeColor,
    });
  };

  const handleWidthChange = (val) => {
    const width = parseInt(val, 10);
    setStrokeWidth(width);
    setBrushConfig(fabricCanvas, {
      mode: brushMode,
      strokeWidth: width,
      strokeColor,
    });
  };

  const handleColorChange = (color) => {
    setStrokeColor(color);
    if (brushMode === BRUSH_MODES.ERASER) {
      setBrushMode(BRUSH_MODES.PEN);
      setBrushConfig(fabricCanvas, {
        mode: BRUSH_MODES.PEN,
        strokeWidth,
        strokeColor: color,
      });
    } else {
      setBrushConfig(fabricCanvas, {
        mode: brushMode,
        strokeWidth,
        strokeColor: color,
      });
    }
  };

  const handleClearDrawings = () => {
    clearDrawings(fabricCanvas);
  };

  const handleDone = () => {
    disableDrawingMode(fabricCanvas);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="relative z-30 w-full max-w-lg mx-auto rounded-3xl bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-md border border-white/10 shadow-2xl p-3.5 sm:p-4 text-white flex flex-col gap-3">
      {/* Top Row: Brush Tool Selector & Action Buttons */}
      <div className="flex items-center justify-between gap-2">
        {/* Brush Modes */}
        <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/10 gap-1">
          <button
            type="button"
            onClick={() => handleModeChange(BRUSH_MODES.PEN)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              brushMode === BRUSH_MODES.PEN
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" /> Pen
          </button>

          <button
            type="button"
            onClick={() => handleModeChange(BRUSH_MODES.HIGHLIGHTER)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              brushMode === BRUSH_MODES.HIGHLIGHTER
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" /> Highlighter
          </button>

          <button
            type="button"
            onClick={() => handleModeChange(BRUSH_MODES.ERASER)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              brushMode === BRUSH_MODES.ERASER
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Vector Eraser (Tap or sweep to remove drawings)"
          >
            <Eraser className="w-3.5 h-3.5" /> Eraser
          </button>
        </div>

        {/* Clear & Done Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClearDrawings}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 transition-colors"
            title="Clear all drawings"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDone}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md active:scale-95 transition-all"
          >
            <Check className="w-3.5 h-3.5" /> Done
          </button>
        </div>
      </div>

      {/* Brush Size Slider Row */}
      {brushMode !== BRUSH_MODES.ERASER && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-2 w-16">
            <span className="text-[11px] font-semibold text-gray-400">{strokeWidth}px</span>
            <div
              className="rounded-full bg-white transition-all"
              style={{
                width: Math.min(Math.max(strokeWidth / 3, 4), 20),
                height: Math.min(Math.max(strokeWidth / 3, 4), 20),
              }}
            />
          </div>
          <input
            type="range"
            min={brushMode === BRUSH_MODES.HIGHLIGHTER ? '16' : '4'}
            max={brushMode === BRUSH_MODES.HIGHLIGHTER ? '72' : '48'}
            value={strokeWidth}
            onChange={(e) => handleWidthChange(e.target.value)}
            className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      )}

      {/* Color Palette Swatches */}
      {brushMode !== BRUSH_MODES.ERASER && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DRAWING_COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorChange(color)}
              style={{ backgroundColor: color }}
              className={`w-6 h-6 rounded-full shrink-0 border transition-all hover:scale-110 active:scale-95 ${
                strokeColor.toLowerCase() === color.toLowerCase()
                  ? 'border-white ring-2 ring-indigo-500 scale-110'
                  : 'border-white/30'
              }`}
              title={color}
            />
          ))}

          {/* Custom Color Input */}
          <label
            className="relative w-6 h-6 rounded-full shrink-0 border border-white/40 cursor-pointer overflow-hidden flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-500 hover:scale-110 transition-transform"
            title="Custom Color"
          >
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
      )}

      {brushMode === BRUSH_MODES.ERASER && (
        <p className="text-[11px] text-amber-300/90 text-center bg-amber-500/10 border border-amber-500/20 rounded-xl py-1.5 px-3">
          🧹 Vector Eraser Active: Click or sweep over drawn lines to remove them.
        </p>
      )}
    </div>
  );
}
