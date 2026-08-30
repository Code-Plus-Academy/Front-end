'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import useFabricCanvas from './hooks/useFabricCanvas';
import useCanvasHistory from './hooks/useCanvasHistory';
import StoryEditorCanvas from './StoryEditorCanvas';
import TopNavigation from './components/TopNavigation';
import BottomToolbar from './components/BottomToolbar';
import LayerControls from './components/LayerControls';
import TypographyToolbar from './components/TypographyToolbar';
import DrawingToolbar from './components/DrawingToolbar';
import StickerPickerModal from './components/StickerPickerModal';
import ImageUploadControls from './components/ImageUploadControls';
import { LocationStickerModal, LinkStickerModal } from './components/InteractiveStickerModals';
import { exportStoryPayload, downloadBlob } from './utils/exportUtils';
import { setBackgroundCoverImage } from './utils/imageLayerUtils';
import { addTextToCanvas } from './utils/typographyUtils';
import { TOOL_MODES } from './types/storyEditorTypes';

/**
 * StoryEditor - Main Orchestrator Component for Rich Story Creation
 * 
 * Coordinates:
 * - 9:16 Responsive Viewport & Fabric.js Canvas lifecycle
 * - Undo / Redo history tracking (30-snapshot cap)
 * - Multi-layer Image upload, background presets, & transform controls
 * - Typography customization, font families, pill backgrounds
 * - Freehand vector drawing, highlighter, and eraser
 * - Interactive Location and HTTPS Link Stickers
 * - Crisp 1080x1920 PNG export + JSON + interactive metadata
 * 
 * @param {Object} props
 * @param {() => void} props.onClose Callback when user exits the editor
 * @param {(payload: import('./types/storyEditorTypes').StoryExportPayload) => void | Promise<void>} props.onExport
 * @param {File | Blob | string} [props.initialImage] Initial image file or URL to place as background
 * @param {object} [props.initialJson] Initial editable JSON state to restore
 * @param {boolean} [props.isSubmitting=false] Whether external publish is processing
 * @param {string} [props.exportButtonText='Share Story']
 * @param {string} [props.className='']
 */
export default function StoryEditor({
  onClose,
  onExport,
  initialImage,
  initialJson,
  isSubmitting = false,
  exportButtonText = 'Share Story',
  className = '',
}) {
  const [activeTool, setActiveTool] = useState(TOOL_MODES.SELECT);
  const [activeObject, setActiveObject] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Modal visibility states
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const initialLoadedRef = useRef(false);

  // 1. Initialize Fabric Canvas hook with selection callbacks
  const {
    canvasRef,
    containerRef,
    fabricCanvas,
    scale,
    isReady,
    dimensions,
    clearObjects,
    discardActiveObject,
  } = useFabricCanvas({
    onSelectionCreated: (e) => {
      setActiveObject(e.selected?.[0] || e.target || null);
    },
    onSelectionUpdated: (e) => {
      setActiveObject(e.selected?.[0] || e.target || null);
    },
    onSelectionCleared: () => {
      setActiveObject(null);
    },
  });

  // 2. Initialize Canvas History tracking
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    clearHistory,
    saveState,
  } = useCanvasHistory(fabricCanvas);

  // 3. Load initial image or initial JSON when canvas is ready
  useEffect(() => {
    if (!isReady || !fabricCanvas || initialLoadedRef.current) return;
    initialLoadedRef.current = true;

    async function loadInitialData() {
      if (initialJson) {
        try {
          if (typeof fabricCanvas.loadFromJSON === 'function') {
            const res = fabricCanvas.loadFromJSON(initialJson);
            if (res && typeof res.then === 'function') {
              await res;
            }
          }
          fabricCanvas.requestRenderAll();
          saveState(true);
        } catch (err) {
          console.warn('[StoryEditor] Failed to load initialJson:', err);
        }
      } else if (initialImage) {
        try {
          await setBackgroundCoverImage(fabricCanvas, initialImage);
          saveState(true);
        } catch (err) {
          console.warn('[StoryEditor] Failed to load initialImage:', err);
        }
      }
    }

    loadInitialData();
  }, [isReady, fabricCanvas, initialImage, initialJson, saveState]);

  // Handle Bottom Toolbar Tool Selection
  const handleSelectTool = useCallback(
    (toolId) => {
      setActiveTool((prev) => (prev === toolId ? TOOL_MODES.SELECT : toolId));

      switch (toolId) {
        case TOOL_MODES.MEDIA:
          setIsMediaModalOpen(true);
          break;
        case TOOL_MODES.TEXT:
          if (
            !activeObject ||
            (activeObject.type !== 'textbox' &&
              activeObject.type !== 'Textbox' &&
              activeObject.customType !== 'story_text')
          ) {
            if (fabricCanvas) {
              addTextToCanvas(fabricCanvas, 'Tap to edit text', {
                fontSize: 56,
                fill: '#ffffff',
                textAlign: 'center',
              });
            }
          }
          break;
        case TOOL_MODES.DRAW:
          // DrawingToolbar handles activation via useEffect
          break;
        case TOOL_MODES.STICKER:
          setIsStickerModalOpen(true);
          break;
        case TOOL_MODES.LAYERS:
          // Layers mode shows floating controls or drawer
          break;
        default:
          break;
      }
    },
    [activeObject, fabricCanvas]
  );

  // Export & Share Handler
  const handleExport = async () => {
    if (!fabricCanvas || isExporting || isSubmitting) return;

    setIsExporting(true);
    try {
      const payload = await exportStoryPayload(fabricCanvas);
      if (onExport) {
        await onExport(payload);
      }
    } catch (err) {
      console.error('[StoryEditor] Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Download Direct PNG Handler
  const handleDownload = async () => {
    if (!fabricCanvas || isExporting) return;

    setIsExporting(true);
    try {
      const payload = await exportStoryPayload(fabricCanvas);
      downloadBlob(payload.pngBlob, `story_${Date.now()}.png`);
    } catch (err) {
      console.error('[StoryEditor] Download failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Clear Canvas Handler
  const handleClearCanvas = () => {
    if (fabricCanvas) {
      clearObjects();
      fabricCanvas.backgroundColor = '#05070c';
      fabricCanvas.requestRenderAll();
      saveState(true);
      setActiveObject(null);
    }
  };

  const isTextSelected =
    activeObject &&
    (activeObject.type === 'textbox' ||
      activeObject.type === 'Textbox' ||
      activeObject.type === 'i-text' ||
      activeObject.type === 'IText' ||
      activeObject.customType === 'story_text');

  return (
    <div
      className={`fixed inset-0 z-[99990] flex flex-col justify-between overflow-hidden bg-slate-950 text-white select-none ${className}`}
      style={{
        backgroundColor: '#04070d',
      }}
    >
      {/* Top Action Bar */}
      <TopNavigation
        onClose={onClose}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onClearCanvas={handleClearCanvas}
        onDownload={handleDownload}
        onExport={handleExport}
        isExporting={isExporting || isSubmitting}
        exportButtonText={exportButtonText}
      />

      {/* Main 9:16 Canvas Viewport Container */}
      <main className="relative flex-1 w-full h-full min-h-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        <StoryEditorCanvas
          canvasRef={canvasRef}
          containerRef={containerRef}
          isReady={isReady}
          scale={scale}
          dimensions={dimensions}
        >
          {/* Floating Contextual Toolbars inside Viewport HUD */}
          {activeTool === TOOL_MODES.DRAW && (
            <div className="absolute top-4 left-4 right-4 z-30 pointer-events-auto">
              <DrawingToolbar
                fabricCanvas={fabricCanvas}
                onClose={() => setActiveTool(TOOL_MODES.SELECT)}
              />
            </div>
          )}

          {(activeTool === TOOL_MODES.TEXT || isTextSelected) && activeTool !== TOOL_MODES.DRAW && (
            <div className="absolute top-4 left-4 right-4 z-30 pointer-events-auto">
              <TypographyToolbar
                fabricCanvas={fabricCanvas}
                activeObject={activeObject}
                onClose={() => {
                  discardActiveObject();
                  setActiveTool(TOOL_MODES.SELECT);
                }}
              />
            </div>
          )}

          {activeObject && activeTool !== TOOL_MODES.DRAW && !isTextSelected && (
            <div className="absolute top-4 left-4 right-4 z-30 pointer-events-auto flex justify-center">
              <LayerControls
                fabricCanvas={fabricCanvas}
                activeObject={activeObject}
                onDeselect={discardActiveObject}
              />
            </div>
          )}
        </StoryEditorCanvas>
      </main>

      {/* Bottom Tool Dock */}
      <BottomToolbar
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
      />

      {/* Modals & Dialogs */}
      <ImageUploadControls
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        fabricCanvas={fabricCanvas}
        onImageAdded={() => {
          saveState(true);
          setIsMediaModalOpen(false);
        }}
      />

      <StickerPickerModal
        isOpen={isStickerModalOpen}
        onClose={() => setIsStickerModalOpen(false)}
        fabricCanvas={fabricCanvas}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenLinkModal={() => setIsLinkModalOpen(true)}
      />

      <LocationStickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        fabricCanvas={fabricCanvas}
      />

      <LinkStickerModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        fabricCanvas={fabricCanvas}
      />
    </div>
  );
}
