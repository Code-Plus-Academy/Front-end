'use client';

import { useState, useEffect } from 'react';
import {
  SUPPORTED_FONTS,
  TEXT_COLOR_PRESETS,
  addTextToCanvas,
  toggleTextPillBackground,
  setTextFontFamily,
  setTextFontSize,
  setTextFill,
  setTextAlign,
  toggleTextBold,
  toggleTextItalic,
  toggleTextUnderline,
} from '../utils/typographyUtils';
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Square,
  Sparkles,
  X,
  Plus,
  ChevronDown,
} from 'lucide-react';

/**
 * TypographyToolbar Component
 * Floating/docked toolbar for text styling, font family, font size, pill background, and colors.
 * 
 * @param {Object} props
 * @param {import('fabric').Canvas} props.fabricCanvas
 * @param {import('fabric').FabricObject} props.activeObject
 * @param {() => void} [props.onClose]
 */
export default function TypographyToolbar({
  fabricCanvas,
  activeObject,
  onClose,
}) {
  const isTextSelected =
    activeObject &&
    (activeObject.type === 'textbox' ||
      activeObject.type === 'Textbox' ||
      activeObject.type === 'i-text' ||
      activeObject.type === 'IText' ||
      activeObject.customType === 'story_text');

  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState(54);
  const [fillColor, setFillColor] = useState('#ffffff');
  const [textAlign, setTextAlignState] = useState('center');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [pillMode, setPillMode] = useState('none');
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);

  // Sync state from active text object
  useEffect(() => {
    if (isTextSelected) {
      setFontFamily(activeObject.fontFamily || 'Inter');
      setFontSize(activeObject.fontSize || 54);
      setFillColor(typeof activeObject.fill === 'string' ? activeObject.fill : '#ffffff');
      setTextAlignState(activeObject.textAlign || 'center');
      setIsBold(activeObject.fontWeight === 'bold' || activeObject.fontWeight === '700');
      setIsItalic(activeObject.fontStyle === 'italic');
      setIsUnderline(!!activeObject.underline);
      setPillMode(activeObject.pillMode || (activeObject.backgroundColor ? 'solid' : 'none'));
    }
  }, [activeObject, isTextSelected]);

  const handleAddNewText = () => {
    if (!fabricCanvas) return;
    addTextToCanvas(fabricCanvas, 'Tap to edit text', {
      fontFamily,
      fontSize,
      fill: fillColor,
      textAlign,
    });
  };

  const handleFontChange = (font) => {
    setFontFamily(font.id);
    setIsFontDropdownOpen(false);
    if (isTextSelected) {
      setTextFontFamily(fabricCanvas, activeObject, font.id);
    }
  };

  const handleFontSizeChange = (val) => {
    const size = parseInt(val, 10);
    setFontSize(size);
    if (isTextSelected) {
      setTextFontSize(fabricCanvas, activeObject, size);
    }
  };

  const handleColorChange = (color) => {
    setFillColor(color);
    if (isTextSelected) {
      setTextFill(fabricCanvas, activeObject, color);
    }
  };

  const handleAlignChange = (alignment) => {
    setTextAlignState(alignment);
    if (isTextSelected) {
      setTextAlign(fabricCanvas, activeObject, alignment);
    }
  };

  const handleToggleBold = () => {
    if (isTextSelected) {
      const next = toggleTextBold(fabricCanvas, activeObject);
      setIsBold(next);
    }
  };

  const handleToggleItalic = () => {
    if (isTextSelected) {
      const next = toggleTextItalic(fabricCanvas, activeObject);
      setIsItalic(next);
    }
  };

  const handleToggleUnderline = () => {
    if (isTextSelected) {
      const next = toggleTextUnderline(fabricCanvas, activeObject);
      setIsUnderline(next);
    }
  };

  const handleTogglePill = () => {
    if (isTextSelected) {
      const nextPill = toggleTextPillBackground(fabricCanvas, activeObject);
      setPillMode(nextPill);
    }
  };

  return (
    <div className="relative z-30 w-full max-w-lg mx-auto rounded-3xl bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-md border border-white/10 shadow-2xl p-3.5 sm:p-4 text-white flex flex-col gap-3">
      {/* Header Row: Font Picker, Styles, Pill, Close */}
      <div className="flex items-center justify-between gap-2">
        {/* Font Family Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFontDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-all"
          >
            <Type className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate max-w-[100px] sm:max-w-[130px]">{fontFamily}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {isFontDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-52 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl p-1.5 z-50 flex flex-col gap-1">
              {SUPPORTED_FONTS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => handleFontChange(font)}
                  className={`flex flex-col items-start px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                    fontFamily === font.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <span className="text-xs">{font.name}</span>
                  <span className="text-[10px] text-gray-400 opacity-80">{font.sample}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alignment Toggles */}
        <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => handleAlignChange('left')}
            className={`p-1.5 rounded-lg transition-all ${
              textAlign === 'left' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleAlignChange('center')}
            className={`p-1.5 rounded-lg transition-all ${
              textAlign === 'center' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleAlignChange('right')}
            className={`p-1.5 rounded-lg transition-all ${
              textAlign === 'right' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Style Buttons (Bold, Italic, Underline) */}
        <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10">
          <button
            type="button"
            onClick={handleToggleBold}
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg transition-all disabled:opacity-40 ${
              isBold ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToggleItalic}
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg transition-all disabled:opacity-40 ${
              isItalic ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToggleUnderline}
            disabled={!isTextSelected}
            className={`p-1.5 rounded-lg transition-all disabled:opacity-40 ${
              isUnderline ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pill Background Toggle */}
        <button
          type="button"
          onClick={handleTogglePill}
          disabled={!isTextSelected}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 ${
            pillMode !== 'none'
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          }`}
          title="Toggle Background Pill (None / Solid / Translucent)"
        >
          <Square className="w-3.5 h-3.5" />
          <span className="capitalize">{pillMode === 'none' ? 'Pill' : pillMode}</span>
        </button>

        {/* Add Text / Close Button */}
        {!isTextSelected ? (
          <button
            type="button"
            onClick={handleAddNewText}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        ) : (
          onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Close toolbar"
            >
              <X className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {/* Font Size Slider Row */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-[11px] font-semibold text-gray-400 w-12">Size: {fontSize}px</span>
        <input
          type="range"
          min="24"
          max="130"
          value={fontSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      {/* Color Palette Swatches */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TEXT_COLOR_PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handleColorChange(color)}
            style={{ backgroundColor: color }}
            className={`w-6 h-6 rounded-full shrink-0 border transition-all hover:scale-110 active:scale-95 ${
              fillColor.toLowerCase() === color.toLowerCase()
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
            value={fillColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
