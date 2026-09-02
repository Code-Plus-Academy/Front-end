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
 * Converts a File, Blob, or URL string into a persistent Data URL or string
 * @param {File | Blob | string} source
 * @returns {Promise<string>} URL string
 */
export async function resolveImageSourceUrl(source) {
  if (typeof source === 'string') {
    return source;
  }
  if (source instanceof Blob || source instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err || new Error('Failed to read image file as data URL'));
      reader.readAsDataURL(source);
    });
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

  const url = await resolveImageSourceUrl(imageSource);

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

  const url = await resolveImageSourceUrl(imageSource);

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
    let cloned;
    try {
      cloned = await obj.clone();
    } catch (cloneErr) {
      // Fallback for FabricImage when underlying image source URL is revoked/unavailable
      const el = (typeof obj.getElement === 'function' ? obj.getElement() : null) || obj._element;
      if (el) {
        cloned = new FabricImage(el, {
          ...obj.toObject(),
        });
      } else {
        throw cloneErr;
      }
    }
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
 * Centers an object horizontally and vertically in logical canvas space
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {import('fabric').FabricObject} obj
 */
export function centerObject(fabricCanvas, obj) {
  if (!fabricCanvas || !obj) return;
  obj.set({
    originX: 'center',
    originY: 'center',
    left: LOGICAL_WIDTH / 2,
    top: LOGICAL_HEIGHT / 2,
  });
  if (typeof obj.setCoords === 'function') obj.setCoords();
  fabricCanvas.requestRenderAll();
}

/**
 * Rotates an object by a relative degree step (e.g. 90 degrees)
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {import('fabric').FabricObject} obj
 * @param {number} [degrees=90]
 */
export function rotateObjectBy(fabricCanvas, obj, degrees = 90) {
  if (!fabricCanvas || !obj) return;
  const currentAngle = obj.angle || 0;
  const nextAngle = (Math.round((currentAngle + degrees) / 90) * 90) % 360;
  obj.set('angle', nextAngle);
  if (typeof obj.setCoords === 'function') obj.setCoords();
  fabricCanvas.requestRenderAll();
}

/**
 * Converts a static background image into a fully movable, interactive layer
 * @param {import('fabric').Canvas} fabricCanvas
 * @returns {import('fabric').FabricImage | null}
 */
export function convertBackgroundToMovableLayer(fabricCanvas) {
  if (!fabricCanvas) return null;

  let bgImg = fabricCanvas.backgroundImage;
  if (!bgImg) {
    bgImg = fabricCanvas.getObjects().find(
      (obj) => obj.name === 'story_background' || obj.customType === 'background_image'
    );
  }

  if (!bgImg) return null;

  fabricCanvas.backgroundImage = null;

  bgImg.set({
    selectable: true,
    evented: true,
    hasControls: true,
    hasBorders: true,
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    lockScalingX: false,
    lockScalingY: false,
    customType: 'overlay_image',
    name: 'movable_image',
  });

  applyDefaultObjectControls(bgImg);

  // If not already in objects list, add it
  if (!fabricCanvas.getObjects().includes(bgImg)) {
    fabricCanvas.add(bgImg);
  }

  fabricCanvas.setActiveObject(bgImg);
  fabricCanvas.requestRenderAll();

  return bgImg;
}

/**
 * Converts an active image object into a locked 1080x1920 cover background
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {import('fabric').FabricImage} obj
 * @returns {import('fabric').FabricImage | null}
 */
export function convertObjectToBackground(fabricCanvas, obj) {
  if (!fabricCanvas || !obj) return null;

  const imgWidth = obj.width || 1;
  const imgHeight = obj.height || 1;

  const scaleX = LOGICAL_WIDTH / imgWidth;
  const scaleY = LOGICAL_HEIGHT / imgHeight;
  const coverScale = Math.max(scaleX, scaleY);

  obj.set({
    scaleX: coverScale,
    scaleY: coverScale,
    originX: 'center',
    originY: 'center',
    left: LOGICAL_WIDTH / 2,
    top: LOGICAL_HEIGHT / 2,
    angle: 0,
    flipX: false,
    flipY: false,
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
  });

  if (fabricCanvas.getObjects().includes(obj)) {
    fabricCanvas.remove(obj);
  }

  fabricCanvas.backgroundImage = obj;
  fabricCanvas.discardActiveObject();
  fabricCanvas.requestRenderAll();

  return obj;
}

/**
 * Returns current layer stack inspection array
 * @param {import('fabric').Canvas} fabricCanvas
 * @returns {Array<{ id: string, type: string, customType: string, isLocked: boolean, isSelected: boolean, zIndex: number, objectRef: any }>}
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

