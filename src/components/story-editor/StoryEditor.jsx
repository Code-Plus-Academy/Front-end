'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FabricImage } from 'fabric';
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
import {
  setBackgroundCoverImage,
  addImageOverlay,
  resolveImageSourceUrl,
  duplicateObject,
  deleteObject,
} from './utils/imageLayerUtils';
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  applyDefaultObjectControls,
} from './utils/canvasConfig';
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
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);

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
          // Load initial photo as a movable, editable layer fitted to 9:16 canvas
          const url = await resolveImageSourceUrl(initialImage);
          const img = await FabricImage.fromURL(url, {
            crossOrigin: 'anonymous',
          });

          const imgWidth = img.width || 1;
          const imgHeight = img.height || 1;

          // Scale to cover 9:16 proportionally
          const scaleX = LOGICAL_WIDTH / imgWidth;
          const scaleY = LOGICAL_HEIGHT / imgHeight;
          const coverScale = Math.max(scaleX, scaleY);

          img.set({
            scaleX: coverScale,
            scaleY: coverScale,
            originX: 'center',
            originY: 'center',
            left: LOGICAL_WIDTH / 2,
            top: LOGICAL_HEIGHT / 2,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
            name: 'story_photo',
            customType: 'overlay_image',
          });

          applyDefaultObjectControls(img);

          fabricCanvas.add(img);
          fabricCanvas.setActiveObject(img);
          fabricCanvas.requestRenderAll();
          saveState(true);
        } catch (err) {
          console.warn('[StoryEditor] Failed to load initialImage:', err);
        }
      }
    }

    loadInitialData();
  }, [isReady, fabricCanvas, initialImage, initialJson, saveState]);

  // 4. Keyboard Shortcuts (Delete, Esc, Undo, Redo, Duplicate, Arrows nudge)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input or textarea
      const targetTag = e.target?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || e.target?.isContentEditable) {
        return;
      }

      // If active object is currently in text editing mode, let Fabric handle typing
      if (activeObject && activeObject.isEditing) {
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeObject && fabricCanvas) {
          e.preventDefault();
          deleteObject(fabricCanvas, activeObject);
          setActiveObject(null);
          saveState(true);
        }
      }

      // Escape key -> deselect active object
      if (e.key === 'Escape') {
        if (activeObject && fabricCanvas) {
          e.preventDefault();
          discardActiveObject();
          setActiveObject(null);
        }
      }

      // Ctrl+Z / Cmd+Z -> Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Y or Ctrl+Shift+Z / Cmd+Shift+Z -> Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
      }

      // Ctrl+D / Cmd+D -> Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (activeObject && fabricCanvas) {
          e.preventDefault();
          duplicateObject(fabricCanvas, activeObject).then(() => {
            saveState(true);
          });
        }
      }

      // Arrow keys nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (activeObject && fabricCanvas && !activeObject.lockMovementX) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 2;
          if (e.key === 'ArrowUp') activeObject.top = (activeObject.top || 0) - step;
          if (e.key === 'ArrowDown') activeObject.top = (activeObject.top || 0) + step;
          if (e.key === 'ArrowLeft') activeObject.left = (activeObject.left || 0) - step;
          if (e.key === 'ArrowRight') activeObject.left = (activeObject.left || 0) + step;

          if (typeof activeObject.setCoords === 'function') activeObject.setCoords();
          fabricCanvas.requestRenderAll();
          saveState(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeObject, fabricCanvas, undo, redo, saveState, discardActiveObject]);

  // 5. Clipboard Paste Support (Ctrl+V / Cmd+V for images)
  useEffect(() => {
    const handlePaste = async (e) => {
      if (!fabricCanvas) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            try {
              await addImageOverlay(fabricCanvas, blob);
              saveState(true);
            } catch (err) {
              console.error('[StoryEditor] Failed to paste image from clipboard:', err);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [fabricCanvas, saveState]);

  // Direct Drag & Drop image files onto Canvas
  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    if (!isCanvasDragOver) setIsCanvasDragOver(true);
  };

  const handleCanvasDragLeave = (e) => {
    e.preventDefault();
    setIsCanvasDragOver(false);
  };

  const handleCanvasDrop = async (e) => {
    e.preventDefault();
    setIsCanvasDragOver(false);
    if (!fabricCanvas) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        try {
          await addImageOverlay(fabricCanvas, droppedFile);
          saveState(true);
        } catch (err) {
          console.error('[StoryEditor] Failed to add dropped image:', err);
        }
      }
    }
  };

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
      <main
        onDragOver={handleCanvasDragOver}
        onDragLeave={handleCanvasDragLeave}
        onDrop={handleCanvasDrop}
        className="relative flex-1 w-full h-full min-h-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
      >
        <StoryEditorCanvas
          canvasRef={canvasRef}
          containerRef={containerRef}
          isReady={isReady}
          scale={scale}
          dimensions={dimensions}
          isDragOver={isCanvasDragOver}
        >
          {/* Floating Contextual Toolbars inside Viewport HUD */}
          {activeTool === TOOL_MODES.DRAW && (
            <div className="absolute top-3 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-30 pointer-events-none flex justify-center">
              <div className="pointer-events-auto max-w-full">
                <DrawingToolbar
                  fabricCanvas={fabricCanvas}
                  onClose={() => setActiveTool(TOOL_MODES.SELECT)}
                />
              </div>
            </div>
          )}

          {(activeTool === TOOL_MODES.TEXT || isTextSelected) && activeTool !== TOOL_MODES.DRAW && (
            <div className="absolute top-3 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-30 pointer-events-none flex justify-center">
              <div className="pointer-events-auto max-w-full">
                <TypographyToolbar
                  fabricCanvas={fabricCanvas}
                  activeObject={activeObject}
                  onClose={() => {
                    discardActiveObject();
                    setActiveTool(TOOL_MODES.SELECT);
                  }}
                />
              </div>
            </div>
          )}

          {activeObject && activeTool !== TOOL_MODES.DRAW && !isTextSelected && (
            <div className="absolute top-3 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-30 pointer-events-none flex justify-center">
              <div className="pointer-events-auto max-w-full">
                <LayerControls
                  fabricCanvas={fabricCanvas}
                  activeObject={activeObject}
                  onDeselect={discardActiveObject}
                />
              </div>
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
        onClose={() => {
          setIsMediaModalOpen(false);
          setActiveTool(TOOL_MODES.SELECT);
        }}
        fabricCanvas={fabricCanvas}
        onImageAdded={() => {
          saveState(true);
          setIsMediaModalOpen(false);
          setActiveTool(TOOL_MODES.SELECT);
        }}
      />

      <StickerPickerModal
        isOpen={isStickerModalOpen}
        onClose={() => {
          setIsStickerModalOpen(false);
          setActiveTool(TOOL_MODES.SELECT);
        }}
        fabricCanvas={fabricCanvas}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenLinkModal={() => setIsLinkModalOpen(true)}
        onStickerAdded={() => {
          saveState(true);
          setIsStickerModalOpen(false);
          setActiveTool(TOOL_MODES.SELECT);
        }}
      />

      <LocationStickerModal
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          setActiveTool(TOOL_MODES.SELECT);
        }}
        fabricCanvas={fabricCanvas}
        onAdded={() => {
          saveState(true);
          setIsLocationModalOpen(false);
          setActiveTool(TOOL_MODES.SELECT);
        }}
      />

      <LinkStickerModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          setActiveTool(TOOL_MODES.SELECT);
        }}
        fabricCanvas={fabricCanvas}
        onAdded={() => {
          saveState(true);
          setIsLinkModalOpen(false);
          setActiveTool(TOOL_MODES.SELECT);
        }}
      />
    </div>
  );
}
