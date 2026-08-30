'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * StoryEditorCanvas Component
 * 
 * Renders the 9:16 responsive viewport for the Fabric.js story editor.
 * Maintains exact aspect ratio scaling, centering, touch safety, and loading states.
 * 
 * @param {Object} props
 * @param {React.RefObject<HTMLCanvasElement>} props.canvasRef Ref passed to the HTML5 canvas
 * @param {React.RefObject<HTMLDivElement>} props.containerRef Ref passed to the sizing container
 * @param {boolean} [props.isReady=false] Whether Fabric canvas is initialized and ready
 * @param {number} [props.scale=1] Current display scale (0.0 - 1.0)
 * @param {{ width: number, height: number, offsetX: number, offsetY: number }} [props.dimensions]
 * @param {React.ReactNode} [props.children] Overlays, toolbars, or tap guides
 * @param {string} [props.className='']
 * @param {React.CSSProperties} [props.style={}]
 */
export default function StoryEditorCanvas({
  canvasRef,
  containerRef,
  isReady = false,
  scale = 1,
  dimensions = { width: 1080, height: 1920, offsetX: 0, offsetY: 0 },
  children,
  className = '',
  style = {},
}) {
  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none touch-none p-1 sm:p-3 ${className}`}
      style={{
        backgroundColor: 'var(--canvas-backdrop, rgba(4, 7, 13, 0.95))',
        ...style,
      }}
    >
      {/* 9:16 Scaled Viewport Container */}
      <div
        className="relative flex items-center justify-center rounded-2xl sm:rounded-[24px] overflow-hidden shadow-2xl transition-shadow duration-300"
        style={{
          width: dimensions.width ? `${dimensions.width}px` : 'auto',
          height: dimensions.height ? `${dimensions.height}px` : 'auto',
          aspectRatio: '9 / 16',
          maxWidth: '100%',
          maxHeight: '100%',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
          backgroundColor: '#05070c',
        }}
      >
        {/* Loading Spinner / Skeleton while Fabric initializes */}
        {!isReady && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
              Initializing Canvas…
            </span>
          </div>
        )}

        {/* HTML5 Canvas Element managed by Fabric */}
        <canvas
          ref={canvasRef}
          className="block touch-none"
          style={{
            display: isReady ? 'block' : 'none',
          }}
        />

        {/* Optional Overlay Elements / HUD Controls */}
        {isReady && children}
      </div>
    </div>
  );
}
