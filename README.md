# Color Palette Extractor

A desktop app built with Electron that extracts a dominant color palette from any image — pick a photo, get back a set of pastel-framed swatches with click-to-copy hex codes. Built as a plain HTML/CSS/JS Electron project (no frontend framework), inspired by a Flutter tutorial using `image_picker` + `palette_generator`.

## What it does

- Lets you pick an image file (via a file input dialog)
- Supports standard formats (jpg, png, webp, gif, bmp) **and** `.heic` / `.heif` (iPhone photos), which are converted to PNG behind the scenes since Chromium/Electron can't decode HEIC natively
- Downscales the image and samples its pixels on an off-screen `<canvas>`
- Groups similar colors together (color quantization via bucketing) and ranks them by frequency
- Displays the top 6 dominant colors as a Pinterest-style masonry grid of swatches
- Click any swatch to copy its hex code to the clipboard (shows a "copied!" confirmation)
- Hex codes are also selectable text, so you can manually highlight and copy them too

## How it works (architecture)

| Piece | Role |
|---|---|
| `main.js` | Electron main process. Creates the app window and handles HEIC→PNG conversion (via Node's file system access, which the renderer doesn't have). |
| `preload.js` | Securely bridges the main process and the renderer using `contextBridge`, exposing only two safe functions: `convertHeic` and `getPathForFile`. |
| `index.html` | The UI shell: file input, image preview, and swatch container, wrapped in a centered `.app-container`. |
| `style.css` | Pastel gradient background, centered card layout, and a CSS-columns-based masonry grid for the swatches (Pinterest-style flow). |
| `renderer.js` | All the logic: handles file selection, detects HEIC files and routes them through the main process for conversion, draws the image to a hidden canvas, extracts pixel data, quantizes/ranks colors, and renders the swatches. |

### The color extraction pipeline

1. Image is drawn onto a small (100px-wide) off-screen canvas — downscaling keeps pixel sampling fast regardless of the original image size.
2. `canvas.getImageData()` returns a flat array of every pixel's RGBA values.
3. Each pixel's R, G, and B values are rounded down into buckets of 32 (e.g. 137 → 128) so that visually similar colors get grouped together instead of counted as thousands of unique values.
4. Fully/mostly transparent pixels (alpha < 125) are skipped.
5. Bucketed colors are tallied in a frequency map, sorted by count, and the top 6 are converted to hex and rendered as swatches.

This mirrors what Flutter's `palette_generator` package does internally, just reimplemented in plain JS using the Canvas API instead of a Dart package.

### HEIC/HEIF handling

Chromium (Electron's rendering engine) cannot decode HEIC images directly in `<img>` or `<canvas>`. To work around this:

1. `renderer.js` checks the picked file's extension. If it's `.heic` or `.heif`, it resolves the file's real filesystem path using `webUtils.getPathForFile()` (the current Electron-recommended replacement for the removed `file.path` property).
2. That path is sent to the main process via IPC (`window.electronAPI.convertHeic(filePath)`).
3. The main process reads the file and converts it to PNG using the `heic-convert` package (a WASM-based library, chosen to avoid native compilation issues on Windows).
4. The resulting PNG is returned to the renderer as a base64 string and set directly as the preview image's `src` (`data:image/png;base64,...`), then processed through the same palette extraction pipeline as any other format.

## Installation & running

**Prerequisites:** Node.js and npm installed.

```bash
# from the project folder
npm install
npm install heic-convert

npm start
```

This runs `electron .`, which launches `main.js` and opens the app window.

## Project structure

```
color-palette-app/
├── main.js          # Electron main process: window creation + HEIC conversion IPC handler
├── preload.js        # contextBridge: exposes convertHeic() and getPathForFile() to renderer
├── index.html        # UI markup
├── style.css          # Pastel/Pinterest-style styling
├── renderer.js        # File handling, canvas sampling, color quantization, swatch rendering
└── package.json
```
## Installation

1. **Open a terminal** in the project folder (e.g. in PowerShell):
   ```
   cd "C:\Users\...."
   ```

2. **Install dependencies:**
   ```
   npm install
   npm install electron --save-dev   
   ```

## Running the App

Start the app with:
```
npm run start

## Possible future upgrades

- Drag-and-drop image zone instead of (or alongside) the file picker button
- Export the palette as a `.json` file or CSS custom properties (`:root { --color-1: #... }`)
- Dark mode toggle
- Swap the bucket-counting quantization for a proper k-means clustering algorithm for more refined palettes
