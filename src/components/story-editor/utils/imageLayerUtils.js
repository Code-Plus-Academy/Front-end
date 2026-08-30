/**
 * Multi-Layer Image & Media Management Utilities for Story Editor (Fabric.js v7/v6)
 * Handles Cover Background fitting, Movable Overlays, Layer Z-Index ordering, and Object Transforms.
 */

import { FabricImage } from 'fabric';
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  applyDefaultObjectControls,
} from './canvasConfig.js';

/**
 * Converts a File, Blob, or URL string into an object URL or string
 * @param {File | Blob | string} source
 * @returns {string} URL string
 */
export function resolveImageSourceUrl(source) {
  if (typeof source === 'string') {
    return source;
  }
  if (source instanceof Blob || source instanceof File) {
    return URL.createObjectURL(source);
  }
  throw new Error('[imageLayerUtils] Invalid image source provided.');
}

/**
 * Loads an image and fits it proportionally to cover 1080x1920 without distortion.
 * Sets the image as the canvas background or locked bottom layer.
 * 
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {File | Blob | string} imageSource
 * @param {Object} [options]
 * @returns {Promise<FabricImage>}
 */
export async function setBackgroundCoverImage(fabricCanvas, imageSource, options = {}) {
  if (!fabricCanvas) {
    throw new Error('[imageLayerUtils:setBackgroundCoverImage] Fabric canvas is required.');
  }

  const url = resolveImageSourceUrl(imageSource);
  const isCreatedBlob = typeof imageSource !== 'string';

  try {
    const img = await FabricImage.fromURL(url, {
      crossOrigin: 'anonymous',
    });

    const imgWidth = img.width || 1;
    const imgHeight = img.height || 1;

    // Calculate cover scale: max of width/height ratios
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
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      name: 'story_background',
      customType: 'background_image',
      ...options,
    });

    // Remove previous background layer object if present
    const existingBg = fabricCanvas.getObjects().find(
      (obj) => obj.name === 'story_background' || obj.customType === 'background_image'
    );
    if (existingBg) {
      fabricCanvas.remove(existingBg);
    }

    // Set background image on canvas and insert as bottom layer object
    fabricCanvas.backgroundImage = img;
    fabricCanvas.requestRenderAll();

    return img;
  } finally {
    // Revoke object URL after image loads if we created one
    if (isCreatedBlob && url.startsWith('blob:')) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 1000);
    }
  }
}

/**
 * Clears background image from canvas
 * @param {import('fabric').Canvas} fabricCanvas
 */
export function clearBackgroundImage(fabricCanvas) {
  if (!fabricCanvas) return;
  fabricCanvas.backgroundImage = null;

  const existingBg = fabricCanvas.getObjects().find(
    (obj) => obj.name === 'story_background' || obj.customType === 'background_image'
  );
  if (existingBg) {
    fabricCanvas.remove(existingBg);
  }

  fabricCanvas.requestRenderAll();
}

/**
 * Loads an image as a movable, scalable, rotatable overlay object on top of the canvas
 * 
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {File | Blob | string} imageSource
 * @param {Object} [options]
 * @returns {Promise<FabricImage>}
 */
export async function addImageOverlay(fabricCanvas, imageSource, options = {}) {
  if (!fabricCanvas) {
    throw new Error('[imageLayerUtils:addImageOverlay] Fabric canvas is required.');
  }

  const url = resolveImageSourceUrl(imageSource);
  const isCreatedBlob = typeof imageSource !== 'string';

  try {
    const img = await FabricImage.fromURL(url, {
      crossOrigin: 'anonymous',
    });

    const imgWidth = img.width || 1;
    const imgHeight = img.height || 1;

    // Scale to fit comfortably within 720x1080 bounding box initially
    const maxInitialWidth = 720;
    const maxInitialHeight = 1080;
    const fitScale = Math.min(
      maxInitialWidth / imgWidth,
      maxInitialHeight / imgHeight,
      1
    );

    img.set({
      scaleX: fitScale,
      scaleY: fitScale,
      originX: 'center',
      originY: 'center',
      left: LOGICAL_WIDTH / 2,
      top: LOGICAL_HEIGHT / 2,
      customType: 'overlay_image',
      ...options,
    });

    applyDefaultObjectControls(img);

    fabricCanvas.add(img);
    fabricCanvas.setActiveObject(img);
    fabricCanvas.requestRenderAll();

    return img;
  } finally {
    if (isCreatedBlob && url.startsWith('blob:')) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 1000);
    }
  }
}

/**
 * Moves object to the top of the z-index stack
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {import('fabric').FabricObject} obj
 */
export function bringToFront(fabricCanvas, obj) {
  if (!fabricCanvas || !obj) return;
  if (typeof fabricCanvas.bringObjectToFront === 'function') {
    fabricCanvas.bringObjectToFront(obj);
  } else if (typeof fabricCanvas.bringToFront === 'function') {
    fabricCanvas.bringToFront(obj);
  }
  fabricCanvas.requestRenderAll();
}

/**
 * Moves object to the bottom of the z-index stack (above background)
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {import('fabric').FabricObject} obj
 */
export function sendToBack(fabricCanvas, obj) {
  if (!fabricCanvas || !obj) return;
  if (typeof fabricCanvas.sendObjectToBack === 'function') {
    fabricCanvas.sendObjectToBack(obj);
  } else if (typeof fabricCanvas.sendToBack === 'function') {
    fabricCanvas.sendToBack(obj);
  }
  fabricCanvas.requestRenderAll();
}

/**
 * Moves object one step forward in the z-index stack
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {import('fabric').FabricObject} obj
 */
export function bringForward(fabricCanvas, obj) {
  if (!fabricCanvas || !obj) return;
  if (typeof fabricCanvas.bringObjectForward === 'function') {
    fabricCanvas.bringObjectForward(obj);
  } else if (typeof fabricCanvas.bringForward === 'function') {
    fabricCanvas.bringForward(obj);
  }
  fabricCanvas.requestRenderAll();
}

/**
 * Moves object one step backward in the z-index stack
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {import('fabric').FabricObject} obj
 */
export function sendBackward(fabricCanvas, obj) {
  if (!fabricCanvas || !obj) return;
  if (typeof fabricCanvas.sendObjectBackward === 'function') {
    fabricCanvas.sendObjectBackward(obj);
  } else if (typeof fabricCanvas.sendBackward === 'function') {
    fabricCanvas.sendBackward(obj);
  }
  fabricCanvas.requestRenderAll();
}

/**
 * Clones and duplicates an object with a slight position offset
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {import('fabric').FabricObject} obj
 * @returns {Promise<import('fabric').FabricObject>}
 */
export async function duplicateObject(fabricCanvas, obj) {
  if (!fabricCanvas || !obj) return null;

  try {
    const cloned = await obj.clone();
    if (!cloned) return null;

    const offset = 40;
    cloned.set({
      left: Math.min((obj.left || 0) + offset, LOGICAL_WIDTH - 100),
      top: Math.min((obj.top || 0) + offset, LOGICAL_HEIGHT - 100),
      evented: true,
    });

    applyDefaultObjectControls(cloned);

    fabricCanvas.add(cloned);
    fabricCanvas.setActiveObject(cloned);
    fabricCanvas.requestRenderAll();

    return cloned;
  } catch (err) {
    console.error('[imageLayerUtils:duplicateObject] Failed to clone object:', err);
    return null;
  }
}

/**
 * Deletes the selected object or active selection from canvas
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {import('fabric').FabricObject} [targetObj]
 */
export function deleteObject(fabricCanvas, targetObj) {
  if (!fabricCanvas) return;
  const obj = targetObj || fabricCanvas.getActiveObject();
  if (!obj) return;

  if (obj.type === 'activeSelection' || obj.type === 'ActiveSelection') {
    const objects = typeof obj.getObjects === 'function' ? [...obj.getObjects()] : [];
    objects.forEach((subObj) => {
      fabricCanvas.remove(subObj);
    });
    fabricCanvas.discardActiveObject();
  } else {
    fabricCanvas.remove(obj);
    fabricCanvas.discardActiveObject();
  }

  fabricCanvas.requestRenderAll();
}

/**
 * Flips object horizontally (X-axis)
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {import('fabric').FabricObject} obj
 */
export function flipObjectX(fabricCanvas, obj) {
  if (!fabricCanvas || !obj) return;
  obj.set('flipX', !obj.flipX);
  if (typeof obj.setCoords === 'function') obj.setCoords();
  fabricCanvas.requestRenderAll();
}

/**
 * Flips object vertically (Y-axis)
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {import('fabric').FabricObject} obj
 */
export function flipObjectY(fabricCanvas, obj) {
  if (!fabricCanvas || !obj) return;
  obj.set('flipY', !obj.flipY);
  if (typeof obj.setCoords === 'function') obj.setCoords();
  fabricCanvas.requestRenderAll();
}

/**
 * Toggles lock state on an object (preventing movement/scaling/rotation)
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {import('fabric').FabricObject} obj
 * @param {boolean} [isLocked]
 * @returns {boolean} New lock state
 */
export function lockObject(fabricCanvas, obj, isLocked) {
  if (!fabricCanvas || !obj) return false;
  const targetLock = isLocked !== undefined ? isLocked : !obj.lockMovementX;

  obj.set({
    lockMovementX: targetLock,
    lockMovementY: targetLock,
    lockRotation: targetLock,
    lockScalingX: targetLock,
    lockScalingY: targetLock,
    hasControls: !targetLock,
  });

  if (typeof obj.setCoords === 'function') obj.setCoords();
  fabricCanvas.requestRenderAll();

  return targetLock;
}

/**
 * Returns current layer stack inspection array
 * @param {import('fabric').Canvas} fabricCanvas
 * @returns {Array<{ id: string, type: string, customType: string, isLocked: boolean, isSelected: boolean, zIndex: number }>}
 */
export function getLayerStack(fabricCanvas) {
  if (!fabricCanvas) return [];
  const objects = fabricCanvas.getObjects();
  const activeObj = fabricCanvas.getActiveObject();

  return objects.map((obj, index) => ({
    id: obj.id || `layer_${index}`,
    type: obj.type,
    customType: obj.customType || obj.type,
    name: obj.name || `${obj.customType || obj.type} #${index + 1}`,
    isLocked: !!obj.lockMovementX,
    isSelected: activeObj === obj,
    zIndex: index,
    objectRef: obj,
  }));
}
