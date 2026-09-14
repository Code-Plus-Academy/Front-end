/**
 * Canvas Configuration & Object Control Defaults for Fabric.js v7/v6 Story Editor
 * Fixed Logical Resolution: 1080 x 1920 (9:16 Instagram/Story standard)
 */

import { InteractiveFabricObject, FabricObject } from 'fabric';

/**
 * Story Canvas Logical Dimensions
 */
export const LOGICAL_WIDTH = 1080;
export const LOGICAL_HEIGHT = 1920;
export const ASPECT_RATIO = 9 / 16;
export const ASPECT_RATIO_STRING = '9:16';

/**
 * Modern Touch-Friendly Object Control Defaults
 * Customized for high-fidelity manipulation on touchscreens & desktop
 */
export const DEFAULT_OBJECT_CONTROLS = {
  selectable: true,
  evented: true,
  hasControls: true,
  hasBorders: true,
  lockMovementX: false,
  lockMovementY: false,
  lockRotation: false,
  lockScalingX: false,
  lockScalingY: false,
  hoverCursor: 'move',
  moveCursor: 'move',
  perPixelTargetFind: false,
  targetFindTolerance: 12,
  touchCornerSize: 44,
  cornerSize: 22,
  cornerColor: '#ffffff',
  cornerStrokeColor: '#6366f1',
  cornerStyle: 'circle',
  transparentCorners: false,
  borderColor: '#6366f1',
  borderScaleFactor: 2.5,
  padding: 8,
  borderOpacityWhenMoving: 0.9,
  centeredRotation: true,
  centeredScaling: false,
};

/**
 * Base Canvas Options
 */
export const DEFAULT_CANVAS_OPTIONS = {
  preserveObjectStacking: true,
  selection: true,
  selectionColor: 'rgba(99, 102, 241, 0.15)',
  selectionBorderColor: '#6366f1',
  selectionLineWidth: 1.5,
  backgroundColor: '#05070c',
  enableRetinaScaling: true,
  imageSmoothingEnabled: true,
  uniformScaling: false,
  stopContextMenu: true,
  fireRightClick: false,
  perPixelTargetFind: false,
  targetFindTolerance: 12,
};

/**
 * Applies default control styling to a FabricObject or ActiveSelection instance
 * @param {import('fabric').FabricObject} fabricObject
 */
export function applyDefaultObjectControls(fabricObject) {
  if (!fabricObject) return;
  fabricObject.set({
    ...DEFAULT_OBJECT_CONTROLS,
    selectable: true,
    evented: true,
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    lockScalingX: false,
    lockScalingY: false,
  });
  if (typeof fabricObject.setCoords === 'function') {
    fabricObject.setCoords();
  }
}

/**
 * Global configuration helper to set Fabric.js prototype / ownDefaults
 * Ensures any new FabricObject inherits touch-friendly controls automatically
 */
export function configureFabricDefaults() {
  if (typeof window === 'undefined') return;

  try {
    if (InteractiveFabricObject && InteractiveFabricObject.ownDefaults) {
      Object.assign(InteractiveFabricObject.ownDefaults, DEFAULT_OBJECT_CONTROLS);
    }
    if (FabricObject && FabricObject.ownDefaults) {
      Object.assign(FabricObject.ownDefaults, {
        padding: DEFAULT_OBJECT_CONTROLS.padding,
      });
    }
  } catch (err) {
    console.warn('[StoryEditor:canvasConfig] Failed to apply global Fabric defaults:', err);
  }
}

/**
 * Computes responsive display scale matrix S = min(containerWidth / 1080, containerHeight / 1920)
 * and corresponding physical canvas dimensions
 * 
 * @param {number} containerWidth Available width in px
 * @param {number} containerHeight Available height in px
 * @param {number} [logicalWidth=LOGICAL_WIDTH] Fixed logical width
 * @param {number} [logicalHeight=LOGICAL_HEIGHT] Fixed logical height
 * @returns {{ scale: number, width: number, height: number, offsetX: number, offsetY: number }}
 */
export function computeCanvasScale(
  containerWidth,
  containerHeight,
  logicalWidth = LOGICAL_WIDTH,
  logicalHeight = LOGICAL_HEIGHT
) {
  if (!containerWidth || !containerHeight || containerWidth <= 0 || containerHeight <= 0) {
    return {
      scale: 1,
      width: logicalWidth,
      height: logicalHeight,
      offsetX: 0,
      offsetY: 0,
    };
  }

  // Calculate scale to fit 9:16 box inside container while maintaining aspect ratio
  const scaleX = containerWidth / logicalWidth;
  const scaleY = containerHeight / logicalHeight;
  const scale = Math.min(scaleX, scaleY);

  const displayWidth = Math.round(logicalWidth * scale);
  const displayHeight = Math.round(logicalHeight * scale);

  const offsetX = Math.max(0, (containerWidth - displayWidth) / 2);
  const offsetY = Math.max(0, (containerHeight - displayHeight) / 2);

  return {
    scale,
    width: displayWidth,
    height: displayHeight,
    offsetX,
    offsetY,
  };
}
