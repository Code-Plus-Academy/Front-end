'use client';

import { useState, useEffect } from 'react';
import {
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
  duplicateObject,
  deleteObject,
  flipObjectX,
  flipObjectY,
  lockObject,
  getLayerStack,
} from '../utils/imageLayerUtils';
import {
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  FlipHorizontal,
  FlipVertical,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Layers,
  X,
} from 'lucide-react';

/**
 * LayerControls Component
 * Provides layer ordering, transform controls (flip/duplicate/delete/lock),
 * and layer stack visibility when an object is selected.
 *
 * @param {Object} props
 * @param {import('fabric').Canvas} props.fabricCanvas
 * @param {import('fabric').FabricObject} props.activeObject
 * @param {() => void} [props.onDeselect]
 */
export default function LayerControls({ fabricCanvas, activeObject, onDeselect }) {
  const [isLocked, setIsLocked] = useState(false);
  const [showLayerStack, setShowLayerStack] = useState(false);
  const [layers, setLayers] = useState([]);

  useEffect(() => {
    if (activeObject) {
      setIsLocked(!!activeObject.lockMovementX);
    }
  }, [activeObject]);

  const refreshLayers = () => {
    if (fabricCanvas) {
      setLayers(getLayerStack(fabricCanvas));
    }
  };

  useEffect(() => {
    refreshLayers();
  }, [fabricCanvas, activeObject, showLayerStack]);

  if (!fabricCanvas || !activeObject) {
    return null;
  }

  const handleBringToFront = () => {
    bringToFront(fabricCanvas, activeObject);
    refreshLayers();
  };

  const handleSendToBack = () => {
    sendToBack(fabricCanvas, activeObject);
    refreshLayers();
  };

  const handleBringForward = () => {
    bringForward(fabricCanvas, activeObject);
    refreshLayers();
  };

  const handleSendBackward = () => {
    sendBackward(fabricCanvas, activeObject);
    refreshLayers();
  };

  const handleDuplicate = async () => {
    await duplicateObject(fabricCanvas, activeObject);
    refreshLayers();
  };

  const handleDelete = () => {
    deleteObject(fabricCanvas, activeObject);
    refreshLayers();
  };

  const handleFlipX = () => {
    flipObjectX(fabricCanvas, activeObject);
  };

  const handleFlipY = () => {
    flipObjectY(fabricCanvas, activeObject);
  };

  const handleToggleLock = () => {
    const nextLocked = lockObject(fabricCanvas, activeObject);
    setIsLocked(nextLocked);
    refreshLayers();
  };

  const handleSelectLayer = (layer) => {
    if (fabricCanvas && layer.objectRef) {
      fabricCanvas.setActiveObject(layer.objectRef);
      fabricCanvas.requestRenderAll();
    }
  };

  return (
    <div className="relative z-30 flex flex-col items-center">
      {/* Floating Action Bar */}
      <div className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-2xl bg-gray-900/90 dark:bg-gray-950/95 backdrop-blur-md border border-white/10 shadow-2xl text-white">
        {/* Layer Ordering Buttons */}
        <button
          type="button"
          onClick={handleBringToFront}
          title="Bring to Front"
          aria-label="Bring to Front"
          className="p-1.5 rounded-xl hover:bg-white/15 active:scale-95 transition-all text-gray-200 hover:text-white"
        >
          <ArrowUpToLine className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleBringForward}
          title="Bring Forward"
          aria-label="Bring Forward"
          className="p-1.5 rounded-xl hover:bg-white/15 active:scale-95 transition-all text-gray-200 hover:text-white"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleSendBackward}
          title="Send Backward"
          aria-label="Send Backward"
          className="p-1.5 rounded-xl hover:bg-white/15 active:scale-95 transition-all text-gray-200 hover:text-white"
        >
          <ArrowDown className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleSendToBack}
          title="Send to Back"
          aria-label="Send to Back"
          className="p-1.5 rounded-xl hover:bg-white/15 active:scale-95 transition-all text-gray-200 hover:text-white"
        >
          <ArrowDownToLine className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/20 my-auto mx-0.5" />

        {/* Flip Controls */}
        <button
          type="button"
          onClick={handleFlipX}
          title="Flip Horizontal"
          aria-label="Flip Horizontal"
          className="p-1.5 rounded-xl hover:bg-white/15 active:scale-95 transition-all text-gray-200 hover:text-white"
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleFlipY}
          title="Flip Vertical"
          aria-label="Flip Vertical"
          className="p-1.5 rounded-xl hover:bg-white/15 active:scale-95 transition-all text-gray-200 hover:text-white"
        >
          <FlipVertical className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/20 my-auto mx-0.5" />

        {/* Duplicate */}
        <button
          type="button"
          onClick={handleDuplicate}
          title="Duplicate Object"
          aria-label="Duplicate Object"
          className="p-1.5 rounded-xl hover:bg-white/15 active:scale-95 transition-all text-gray-200 hover:text-white"
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Lock/Unlock */}
        <button
          type="button"
          onClick={handleToggleLock}
          title={isLocked ? 'Unlock Object' : 'Lock Object'}
          aria-label={isLocked ? 'Unlock Object' : 'Lock Object'}
          className={`p-1.5 rounded-xl transition-all ${
            isLocked
              ? 'bg-amber-500/25 text-amber-300 hover:bg-amber-500/35'
              : 'hover:bg-white/15 text-gray-200 hover:text-white'
          }`}
        >
          {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>

        {/* Layer Stack View Toggle */}
        <button
          type="button"
          onClick={() => {
            refreshLayers();
            setShowLayerStack((prev) => !prev);
          }}
          title="View Layer Stack"
          aria-label="View Layer Stack"
          className={`p-1.5 rounded-xl transition-all ${
            showLayerStack
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-white/15 text-gray-200 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={handleDelete}
          title="Delete Object"
          aria-label="Delete Object"
          className="p-1.5 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 active:scale-95 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Close/Deselect */}
        {onDeselect && (
          <button
            type="button"
            onClick={onDeselect}
            title="Deselect"
            aria-label="Deselect"
            className="p-1.5 rounded-xl hover:bg-white/15 text-gray-400 hover:text-white active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Layer Stack Inspector Drawer */}
      {showLayerStack && (
        <div className="absolute top-full mt-2 w-72 max-h-60 overflow-y-auto rounded-2xl bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-md border border-white/10 shadow-2xl p-2.5 text-white flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Layers ({layers.length})</span>
            <button
              type="button"
              onClick={() => setShowLayerStack(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {layers.length === 0 ? (
            <div className="text-center py-4 text-xs text-gray-400">No objects on canvas</div>
          ) : (
            layers
              .slice()
              .reverse()
              .map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => handleSelectLayer(layer)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs transition-all ${
                    layer.isSelected
                      ? 'bg-indigo-600/40 border border-indigo-500 text-white font-medium'
                      : 'hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] text-gray-400 w-4">#{layer.zIndex + 1}</span>
                    <span className="truncate">{layer.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {layer.isLocked && <Lock className="w-3 h-3 text-amber-400" />}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteObject(fabricCanvas, layer.objectRef);
                        refreshLayers();
                      }}
                      className="p-1 hover:text-red-400 text-gray-400 rounded transition-colors"
                      title="Delete layer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
