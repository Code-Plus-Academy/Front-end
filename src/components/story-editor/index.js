/**
 * Story Editor Module Exports (Fabric.js v7/v6)
 * Multi-layer Image Management, Stickers & Interactive Metadata, Typography,
 * Freehand Vector Drawing, Undo/Redo History & High-Res Dual Export.
 */

// Core Canvas, Editor & Hooks
export { default as StoryEditor } from './StoryEditor';
export { default as StoryEditorCanvas } from './StoryEditorCanvas';
export { useFabricCanvas, default as useFabricCanvasDefault } from './hooks/useFabricCanvas';
export { useCanvasHistory, default as useCanvasHistoryDefault, HISTORY_CUSTOM_PROPERTIES } from './hooks/useCanvasHistory';

// Components & Toolbars
export { default as TopNavigation } from './components/TopNavigation';
export { default as BottomToolbar } from './components/BottomToolbar';
export { default as LayerControls } from './components/LayerControls';
export { default as ImageUploadControls } from './components/ImageUploadControls';
export { default as StickerPickerModal } from './components/StickerPickerModal';
export { LocationStickerModal, LinkStickerModal } from './components/InteractiveStickerModals';
export { default as TypographyToolbar } from './components/TypographyToolbar';
export { default as DrawingToolbar } from './components/DrawingToolbar';

// Utilities
export * from './utils/canvasConfig';
export * from './utils/imageLayerUtils';
export * from './utils/sanitizeUtils';
export * from './utils/stickerUtils';
export * from './utils/typographyUtils';
export * from './utils/drawingUtils';
export * from './utils/exportUtils';

// Types & Contracts
export * from './types/storyEditorTypes';
