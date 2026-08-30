# Project: Production-Grade Instagram-Inspired Story Editor (Fabric.js v6)

## Architecture
- **Framework**: Next.js 16 (App Router), React 19, TypeScript/ESM, Tailwind CSS v4.
- **Canvas Subsystem**: Fabric.js v7/v6 modern named ESM API (`Canvas`, `FabricImage`, `FabricText`, `IText`, `Textbox`, `PencilBrush`, `loadSVGFromString`).
- **Coordinate Space**: Fixed 1080 x 1920 logical resolution with dynamic scale factor $S = \min(\text{viewportWidth}/1080, \text{viewportHeight}/1920)$ applied to the visual viewport while keeping internal object coordinates standard.
- **Data Flow**:
  - `CreateStoryModal.jsx` -> `StoryEditor.jsx` (Client-only / dynamic SSR bypass)
  - `StoryEditor.jsx` orchestrates:
    - Canvas Hook (`useFabricCanvas`)
    - History Hook (`useCanvasHistory`)
    - Image Manager (`imageLayerUtils`)
    - Sticker System (`StickerPickerModal`, `stickerUtils` with DOMPurify)
    - Typography Toolbar (`TypographyToolbar`, `IText`/`Textbox` with pill backgrounds)
    - Vector Drawing Toolbar (`DrawingToolbar`, `PencilBrush`, vector eraser)
    - Export Pipeline (`exportUtils` generating 1080x1920 PNG Blob + `editable_json` + `interactive_metadata`)
  - Story Viewer: `StoryModal.jsx` renders `content_url` with dynamic interactive tap zones overlaying location and link stickers based on `interactive_metadata`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 9:16 Fixed Coordinate Canvas | 1080x1920 logical canvas resolution with dynamic viewport scaling matrix | M1 | R1 |
| 2 | Canvas Lifecycle & Memory Cleanup | Memory leak prevention (`canvas.dispose()`, `URL.revokeObjectURL()`, timer cleanup) | M1 | R1 |
| 3 | Touch Control Configuration | Touch-friendly bounding boxes (`touchCornerSize: 34`, `cornerSize: 18`, circle handles) | M1 | R1 |
| 4 | Background Image Cover Mode | Proportional image fitting in 1080x1920 canvas background | M2 | R2 |
| 5 | Overlay Image Mode | Movable, rotatable, scalable image overlays with flip/duplicate/delete | M2 | R2 |
| 6 | Visual Layer Reordering | Z-index stack management (Bring to Front, Send to Back, Forward, Backward) | M2 | R2 |
| 7 | Categorized Sticker Catalog | Sticker picker reading `public/stickers/manifest.json` (Badges, Tech, Reactions, Emojis) | M3 | R3 |
| 8 | SVG Sanitization | DOMPurify sanitization of SVGs before rendering on canvas | M3 | R3 |
| 9 | Custom Sticker Upload | User PNG upload as custom sticker overlay | M3 | R3 |
| 10 | Interactive Location Sticker | Visual label on canvas + separated `locationId`, `name`, `lat`, `lng` metadata | M3 | R3 |
| 11 | Interactive Link Sticker | Visual link chip + HTTPS-validated URL and link text metadata | M3 | R3 |
| 12 | Rich Typography Editor | IText/Textbox with fonts (`Clash Display`, `Geist`, `JetBrains Mono`), size, colors, alignments | M4 | R4 |
| 13 | Text Pill Backgrounds | Toggleable translucent/solid pill background on text objects | M4 | R4 |
| 14 | Freehand Vector Drawing | PencilBrush with customizable stroke width, colors, opacity | M4 | R4 |
| 15 | Non-Destructive Vector Eraser | Vector erasing that removes drawing paths without raster flattening | M4 | R4 |
| 16 | Undo/Redo History Engine | Debounced snapshot stack (<= 30 states) with object event listeners | M5 | R5 |
| 17 | High-Res Dual Export | 1080x1920 crisp PNG rendering + structured `editable_json` + `interactive_metadata` | M5 | R5 |
| 18 | CreateStoryModal Integration | Upgraded modal embedding the Story Editor with media picker & direct publishing | M5 | R5 |
| 19 | StoryModal Interactive Taps | Interactive tap zones overlaying location & link stickers in viewer with backwards compatibility | M5 | R5 |
| 20 | Build & Integrity Verification | Clean `npm run build` validation, zero TypeScript/ESM errors, security verification | M6 | Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core 9:16 Canvas & Scaling Engine | `useFabricCanvas.js`, `StoryEditorCanvas.jsx`, touch controls, responsive matrix, lifecycle | none | PLANNED |
| M2 | Multi-Layer Image Management | Full-screen cover vs movable overlay, flip, duplicate, delete, visual layer reordering | M1 | PLANNED |
| M3 | Sticker Catalog & Interactive Metadata | Sticker catalog modal, DOMPurify SVG sanitization, custom PNG upload, Location & Link sticker metadata | M1 | PLANNED |
| M4 | Typography & Vector Drawing | Font formatting, pill backgrounds, freehand brush, eraser mode | M1 | PLANNED |
| M5 | History, Dual Export & Story Integration | History stack, 1080x1920 export, `StoryEditor.jsx`, `CreateStoryModal.jsx`, `StoryModal.jsx` | M1, M2, M3, M4 | PLANNED |
| M6 | End-to-End Verification & Build Audit | Build verification, security audit, responsive checks, manual/E2E test suite | M5 | PLANNED |

## Interface Contracts
### `useFabricCanvas`
```javascript
const {
  canvasRef,      // React ref attached to <canvas>
  containerRef,   // React ref attached to container <div>
  fabricCanvas,   // fabric.Canvas instance
  scale,          // current display scale (e.g. 0.35)
  isReady,        // boolean
} = useFabricCanvas({
  width: 1080,
  height: 1920,
  onSelectionCreated: (e) => void,
  onSelectionCleared: (e) => void,
  onObjectModified: (e) => void,
});
```

### `interactive_metadata` Schema
```javascript
{
  version: 1,
  canvas_dimensions: { width: 1080, height: 1920 },
  locations: [
    {
      id: "loc_123",
      name: "San Francisco, CA",
      latitude: 37.7749,
      longitude: -122.4194,
      box: { x: 100, y: 300, width: 250, height: 60, rotation: 0 } // normalized to 1080x1920
    }
  ],
  links: [
    {
      url: "https://codeplus.academy",
      text: "Visit Academy",
      box: { x: 400, y: 800, width: 280, height: 60, rotation: -5 }
    }
  ]
}
```

### `exportUtils`
```javascript
export async function exportStoryPayload(fabricCanvas) {
  // Returns:
  // {
  //   pngBlob: Blob (1080x1920 high-res PNG),
  //   pngDataUrl: string,
  //   editableJson: object,
  //   interactiveMetadata: object
  // }
}
```

## Code Layout
```
src/
├── components/
│   ├── CreateStoryModal.jsx          // Upgraded creation modal embedding StoryEditor
│   ├── StoryModal.jsx                // Viewer modal with interactive tap zones
│   └── story-editor/
│       ├── StoryEditor.jsx           // Main Editor Orchestrator component
│       ├── StoryEditorCanvas.jsx     // Responsive 9:16 Canvas viewport
│       ├── hooks/
│       │   ├── useFabricCanvas.js    // Fabric.js v6 lifecycle, 1080x1920 scaling, touch controls
│       │   └── useCanvasHistory.js   // Debounced undo/redo snapshot stack (<= 30)
│       ├── components/
│       │   ├── TopNavigation.jsx     // Undo/Redo, Clear, Close, Save/Publish buttons
│       │   ├── BottomToolbar.jsx     // Tool switcher: Media, Text, Draw, Stickers, Filters
│       │   ├── LayerControls.jsx     // Z-index layer stack management
│       │   ├── StickerPickerModal.jsx // Categorized SVG/PNG catalog + custom upload
│       │   ├── InteractiveStickerModals.jsx // Location & Link sticker configuration
│       │   ├── TypographyToolbar.jsx // Font family, size, pill background, color
│       │   └── DrawingToolbar.jsx    // Brush size, colors, vector eraser mode
│       └── utils/
│           ├── imageLayerUtils.js    // Cover fitting, overlay loading, duplicate, flip
│           ├── stickerUtils.js       // SVG sanitization (DOMPurify), sticker loading
│           ├── drawingUtils.js       // Freehand brush, eraser configuration
│           ├── exportUtils.js        // 1080x1920 PNG export & metadata extraction
│           └── sanitizeUtils.js      // URL protocol and SVG validation helpers
```
