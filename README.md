# OpenCV Playground

A comprehensive web-based interactive image processing tool powered by OpenCV.js that allows you to apply various image processing operations in real-time with automatic Python code generation.

## Features

### 🎨 **59 OpenCV Functions Organized by 15 Categories**

#### 1. Blur & Smoothing (5 functions)
- Gaussian Blur
- Median Blur
- Bilateral Filter
- Average Blur
- Box Filter

#### 2. Edge Detection (4 functions)
- Canny Edge Detection
- Sobel Edge Detection
- Laplacian
- Scharr

#### 3. Thresholding (3 functions)
- Binary Threshold (5 types: Binary, Binary Inverted, Truncate, To Zero, To Zero Inverted)
- Adaptive Threshold (Mean & Gaussian)
- Otsu's Threshold

#### 4. Morphological Operations (7 functions)
- Dilate
- Erode
- Morphological Opening
- Morphological Closing
- Morphological Gradient
- Top Hat
- Black Hat

#### 5. Color & Enhancement (5 functions)
- Brightness/Contrast Adjustment
- Histogram Equalization
- CLAHE (Contrast Limited Adaptive Histogram Equalization)
- Sharpen
- Gamma Correction

#### 6. Color Space Conversion (4 functions)
- Convert to Grayscale
- Convert to HSV
- Convert to LAB
- Invert Colors

#### 7. Geometric Transformations (5 functions)
- Resize
- Rotate
- Flip (Horizontal, Vertical, Both)
- Crop
- Scale

#### 8. Filters & Effects (6 functions)
- Emboss
- Sepia Tone
- Pencil Sketch
- Stylization
- Detail Enhancement
- Edge Preserving Filter

#### 9. Bitwise Operations (1 function)
- Bitwise NOT

#### 10. Advanced (2 functions)
- Distance Transform
- Hough Line Transform

#### 11. Segmentation (5 functions)
- **K-Means Color Segmentation** - Reduce colors using K-means clustering
- **Watershed Segmentation** - Advanced region-based segmentation
- **Mean Shift Segmentation** - Color and spatial smoothing
- **Pixel Art Segmentation** - Convert images to retro pixel art style (blocks, circles, diamonds, crosses)
- **Paint by Numbers** - Generate paint-by-numbers templates with color regions and numbering

#### 12. Color Channels (6 functions)
- **Isolate Red Channel**
- **Isolate Green Channel**
- **Isolate Blue Channel**
- **Channel Mixer** - Adjust individual RGB channel weights
- **HSV Range Filter** - Filter specific hue, saturation, and value ranges
- **LAB Channel Isolate** - Isolate L, A, or B channels

#### 13. Contour Detection (3 functions)
- **Find & Draw Contours** - Detect and outline object contours
- **Bounding Boxes** - Draw rectangular bounding boxes around objects
- **Convex Hull** - Draw convex hulls around objects

#### 14. Noise (2 functions)
- **Gaussian Noise** - Add Gaussian noise to images
- **Salt & Pepper Noise** - Add random black and white pixels

#### 15. OCR (1 function)
- **Tesseract OCR** - Extract text from processed images
  - 14 language options including Auto Detect (English, Arabic, Chinese Simplified/Traditional, French, German, Hindi, Italian, Japanese, Korean, Portuguese, Russian, Spanish)
  - 14 Page Segmentation Modes (PSM 0-13)
  - 4 OCR Engine Modes (Legacy, LSTM, Combined, Default)
  - Real-time text extraction with progress tracking
  - Copy extracted text to clipboard

### ✨ **Key Features**

1. **Drag & Drop Reordering** - Rearrange the order of applied functions by dragging
2. **Real-time Preview** - See changes instantly as you adjust parameters
3. **Python Code Generation** - Get the exact Python/OpenCV code for your pipeline
4. **OCR Text Extraction** - Extract text from processed images using Tesseract OCR with 14 languages
5. **Enable/Disable Functions** - Toggle functions on/off without removing them
6. **15 Organized Categories** - Functions grouped into logical categories (Blur, Edge Detection, Thresholding, Morphological, Color & Enhancement, Color Space, Geometric, Filters & Effects, Bitwise, Advanced, Segmentation, Color Channels, Contour Detection, Noise, OCR)
7. **Split View** - Compare original and processed images side-by-side
8. **Parameter Controls** - Intuitive UI for adjusting all function parameters
9. **Download Results** - Save your processed images
10. **Copy OCR Results** - Copy extracted text to clipboard
11. **Advanced Segmentation** - K-Means, Watershed, Mean Shift, Pixel Art, and Paint by Numbers
12. **Channel Manipulation** - Isolate and mix RGB channels, HSV filtering, LAB channel isolation
13. **Contour Detection** - Find contours, draw bounding boxes, and convex hulls
14. **Noise Generation** - Add Gaussian or Salt & Pepper noise for testing
15. **Built-in Presets** - Quick-start templates for common workflows

## How to Use

### Setup

1. **Navigate to the application folder**
   ```bash
   cd opencv-playground
   ```

2. **Open in a web browser**
   - Simply open `index.html` in your browser
   - Or use a local server (recommended):
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Or using Node.js
     npx http-server
     ```
   - Then navigate to `http://localhost:8000`

### Using the Application

1. **Upload an Image**
   - Click "Upload Image" button
   - Select an image from your computer

2. **Add Functions**
   - Expand a category in the left sidebar
   - Click the "+" button next to any function to add it

3. **Configure Parameters**
   - Click on any function in the "Applied Functions" panel
   - Adjust parameters in the "Properties" panel below

4. **Reorder Functions**
   - Drag functions up or down using the grip icon (⋮⋮)
   - Functions apply in top-to-bottom order

5. **Enable/Disable Functions**
   - Click the eye icon to toggle a function on/off
   - Disabled functions remain in the pipeline but don't process

6. **View Python Code**
   - Click the "Code" tab in the bottom panel
   - Copy the generated code to use in your own projects

7. **Download Results**
   - Click "Download Result" to save the processed image

8. **Use OCR (Text Extraction)**
   - Add "Tesseract OCR" from the OCR category
   - It will automatically be placed at the bottom of the pipeline
   - Configure OCR parameters (language, PSM mode, engine mode)
   - Click the "OCR" tab in the bottom panel to see extracted text
   - OCR runs automatically on the processed image
   - Copy the extracted text to clipboard using the copy button

## File Structure

```
opencv-playground/
├── index.html              # Main HTML structure with Tesseract.js integration
├── styles.css             # Custom styles and animations
├── app.js                 # React application and OpenCV logic (59 functions)
├── README.md              # This file
├── OCR_GUIDE.md           # Comprehensive OCR usage guide
├── OCR_TROUBLESHOOTING.md # OCR error solutions
├── FIX_403_ERROR.md       # Quick fix for common Tesseract 403 errors
├── OCR_FIX_SUMMARY.md     # Summary of OCR fixes
├── assets/                # Logo and image assets
│   └── logo-icon.png      # Application favicon
└── Archive/               # Previous versions
```

## Technical Details

- **Frontend Framework**: React 18 (via CDN)
- **Image Processing**: OpenCV.js 4.5.2
- **OCR Engine**: Tesseract.js 5 (with fallback CDN)
- **Styling**: Tailwind CSS + Custom CSS + Material Icons
- **Build Tool**: None required (runs directly in browser)
- **Total Functions**: 59 functions across 15 categories

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Internet Explorer (Not supported)

## Tips & Tricks

1. **Performance**: Start with smaller images for faster processing
2. **Order Matters**: The sequence of operations significantly affects results
3. **Experiment**: Try different combinations - disable/enable functions to compare
4. **Save Your Work**: Download intermediate results before applying more functions
5. **Python Code**: Use the generated code as a starting point for your projects
6. **Use Presets**: Try built-in presets like "Edge Detection Combo" or "Pencil Sketch" for quick results
7. **Segmentation Tips**: Use K-Means or Watershed for color reduction, Paint by Numbers for coloring templates
8. **Channel Isolation**: Use HSV Range Filter to isolate specific colors (e.g., red objects)
9. **Contour Detection**: Convert to grayscale and threshold first for better contour detection
10. **OCR Accuracy**: Pre-process with grayscale, CLAHE, and adaptive threshold for best OCR results
11. **Pixel Art**: Adjust cell size and color levels for different retro styles
12. **Noise Testing**: Add noise then denoise to test algorithm effectiveness

## Common Workflows

### Portrait Enhancement
1. Bilateral Filter (smooth skin)
2. Detail Enhancement
3. Brightness/Contrast adjustment

### Edge Detection Pipeline
1. Convert to Grayscale
2. Gaussian Blur (reduce noise)
3. Canny Edge Detection

### Artistic Effects
1. Stylization
2. Sepia Tone or Pencil Sketch
3. Brightness/Contrast adjustment

### Document Processing
1. Convert to Grayscale
2. CLAHE (enhance contrast)
3. Adaptive Threshold
4. Morphological operations (cleanup)

### OCR/Text Extraction Pipeline
1. Convert to Grayscale
2. Gaussian Blur (reduce noise)
3. Adaptive Threshold or Otsu's Threshold
4. Morphological Opening (remove noise)
5. Tesseract OCR (extract text)

### Receipt/Invoice Processing
1. CLAHE (enhance contrast)
2. Adaptive Threshold (Gaussian)
3. Morphological Closing
4. Tesseract OCR with PSM mode 6 (uniform block)

### Color Segmentation
1. K-Means Color Segmentation (reduce to 4-8 colors)
2. Optional: Morphological Closing (smooth regions)
3. Download or further process

### Pixel Art Creation
1. Optional: Sharpen or Detail Enhancement
2. Pixel Art Segmentation (adjust cell size and shape)
3. Adjust color levels and saturation boost

### Paint by Numbers Template
1. Gaussian Blur (smooth details)
2. Paint by Numbers (choose number of colors)
3. Download template (colored or blank)

### Object Detection Preparation
1. Convert to Grayscale
2. Gaussian Blur
3. Adaptive Threshold
4. Find & Draw Contours or Bounding Boxes

### Color Isolation (e.g., finding red objects)
1. HSV Range Filter (set hue range for red)
2. Morphological Opening (remove noise)
3. Find & Draw Contours

### Noise Testing & Denoising
1. Gaussian Noise or Salt & Pepper Noise (add noise)
2. Bilateral Filter or Median Blur (denoise)
3. Compare results

## Troubleshooting

**Issue**: OpenCV not loading
- **Solution**: Wait a few seconds for the library to download (first load only)

**Issue**: Image not processing
- **Solution**: Check browser console for errors, try a different image format

**Issue**: Slow performance
- **Solution**: Reduce image size or apply fewer intensive operations (especially segmentation functions)

**Issue**: Python code doesn't work
- **Solution**: Ensure you have OpenCV installed (`pip install opencv-python`)

**Issue**: OCR showing "Error: undefined" or not working
- **Solution**: Check internet connection (first run downloads language data), try refreshing page, or see [OCR_TROUBLESHOOTING.md](OCR_TROUBLESHOOTING.md) for detailed solutions

**Issue**: OCR Error 403 - "Network error while fetching... Response code: 403"
- **Solution**: 🚨 **COMMON ISSUE** - Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R). See [FIX_403_ERROR.md](FIX_403_ERROR.md) for complete fix.

**Issue**: OCR not detecting text accurately
- **Solution**: Pre-process image with grayscale, CLAHE, adaptive threshold, and noise reduction. Try different PSM modes (PSM 6 for documents, PSM 7 for single lines).

**Issue**: OCR taking too long
- **Solution**: Reduce image size before OCR, or use a simpler PSM mode

**Issue**: Wrong language detected
- **Solution**: Change the language parameter in Tesseract properties to match your document (or use Auto Detect)

**Issue**: Segmentation is slow
- **Solution**: Reduce image size first, or reduce the number of colors/attempts in K-Means

**Issue**: Paint by Numbers template is cluttered
- **Solution**: Increase "Min Region Area to Number" to only label larger regions

**Issue**: Contours not detected
- **Solution**: Convert to grayscale and apply threshold before using contour detection functions

## Contributing

This is an open project! Feel free to:
- Add more OpenCV functions (segmentation, feature detection, etc.)
- Improve the UI/UX (better parameter controls, presets)
- Fix bugs (check Issues tab)
- Add new features (batch processing, export workflows, etc.)
- Improve OCR accuracy (better pre-processing pipelines)
- Add more artistic effects (filters, styles)

### Current Implementation
- **59 functions** across **15 categories**
- **Drag-and-drop** pipeline editor
- **Real-time** processing
- **Python code** generation
- **OCR** with 14 languages
- **Advanced segmentation** (K-Means, Watershed, Mean Shift, Pixel Art, Paint by Numbers)
- **Channel manipulation** (RGB, HSV, LAB)
- **Contour detection** (contours, bounding boxes, convex hulls)
- **Noise generation** (Gaussian, Salt & Pepper)

## License

Released under the [MIT License](LICENSE) — free to use for any purpose (personal or commercial).

## Credits

Built with ❤️ using:
- **OpenCV.js** - Computer vision library
- **Tesseract.js 5** - OCR engine
- **React 18** - UI framework
- **Tailwind CSS** - Styling framework
- **Material Icons** - Icon system
- **Inter Font** - Typography

---

**Enjoy processing images, creating art, and extracting text! 🎨📸📝🎭**
