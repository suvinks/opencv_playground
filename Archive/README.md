# OpenCV Interactive Image Processing Application

A comprehensive web-based interactive image processing tool powered by OpenCV.js that allows you to apply various image processing operations in real-time with automatic Python code generation.

## Features

### 🎨 **60+ OpenCV Functions Organized by Category**

#### Blur & Smoothing
- Gaussian Blur
- Median Blur
- Bilateral Filter
- Average Blur
- Box Filter

#### Edge Detection
- Canny Edge Detection
- Sobel Edge Detection
- Laplacian
- Scharr

#### Thresholding
- Binary Threshold (5 types)
- Adaptive Threshold (Mean & Gaussian)
- Otsu's Threshold

#### Morphological Operations
- Dilate
- Erode
- Morphological Opening
- Morphological Closing
- Morphological Gradient
- Top Hat
- Black Hat

#### Color & Enhancement
- Brightness/Contrast Adjustment
- Histogram Equalization
- CLAHE (Contrast Limited Adaptive Histogram Equalization)
- Sharpen
- Gamma Correction

#### Color Space Conversion
- Convert to Grayscale
- Convert to HSV
- Convert to LAB
- Invert Colors

#### Geometric Transformations
- Resize
- Rotate
- Flip (Horizontal, Vertical, Both)
- Crop
- Scale

#### Filters & Effects
- Emboss
- Sepia Tone
- Pencil Sketch
- Stylization
- Detail Enhancement
- Edge Preserving Filter

#### Bitwise Operations
- Bitwise NOT

#### Advanced
- Distance Transform
- Hough Line Transform

### ✨ **Key Features**

1. **Drag & Drop Reordering** - Rearrange the order of applied functions by dragging
2. **Real-time Preview** - See changes instantly as you adjust parameters
3. **Python Code Generation** - Get the exact Python/OpenCV code for your pipeline
4. **Enable/Disable Functions** - Toggle functions on/off without removing them
5. **Organized Categories** - Functions grouped into logical categories
6. **Split View** - Compare original and processed images side-by-side
7. **Parameter Controls** - Intuitive UI for adjusting all function parameters
8. **Download Results** - Save your processed images

## How to Use

### Setup

1. **Navigate to the application folder**
   ```bash
   cd opencv-app
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
   - Click "Show Python Code" button
   - Copy the generated code to use in your own projects

7. **Download Results**
   - Click "Download Result" to save the processed image

## File Structure

```
opencv-app/
├── index.html       # Main HTML structure
├── styles.css       # Custom styles and animations
├── app.js          # React application and OpenCV logic
└── README.md       # This file
```

## Technical Details

- **Frontend Framework**: React 18 (via CDN)
- **Image Processing**: OpenCV.js 4.5.2
- **Styling**: Tailwind CSS + Custom CSS
- **Build Tool**: None required (runs directly in browser)

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

## Troubleshooting

**Issue**: OpenCV not loading
- **Solution**: Wait a few seconds for the library to download (first load only)

**Issue**: Image not processing
- **Solution**: Check browser console for errors, try a different image format

**Issue**: Slow performance
- **Solution**: Reduce image size or apply fewer intensive operations

**Issue**: Python code doesn't work
- **Solution**: Ensure you have OpenCV installed (`pip install opencv-python`)

## Contributing

This is an open project! Feel free to:
- Add more OpenCV functions
- Improve the UI/UX
- Fix bugs
- Add new features

## License

Free to use for any purpose (personal or commercial).

## Credits

Built with ❤️ using:
- OpenCV.js
- React
- Tailwind CSS

---

**Enjoy processing images! 🎨📸**
