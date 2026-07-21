const { useState, useEffect, useRef } = React;

// Seeded PRNG (mulberry32): deterministic float stream in [0,1) from an integer seed.
// Used by the stochastic clustering steps so a fixed seed reproduces the exact palette
// across pipeline re-runs, and the Regenerate button rolls a new variation on demand.
const mulberry32 = (a) => () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

// ==================== MATERIAL ICON COMPONENTS ====================
const MaterialIcon = ({ name, size = 24, className = "", style = {}, ...rest }) => (
    <span className={`material-icons ${className}`} style={{ fontSize: size, ...style }} {...rest}>
        {name}
    </span>
);

// Icon component wrappers for Material Icons
const X = ({ size = 24 }) => <MaterialIcon name="close" size={size} />;
const Eye = ({ size = 24 }) => <MaterialIcon name="visibility" size={size} />;
const EyeOff = ({ size = 24 }) => <MaterialIcon name="visibility_off" size={size} />;
const Upload = ({ size = 24 }) => <MaterialIcon name="upload" size={size} />;
const Download = ({ size = 24 }) => <MaterialIcon name="download" size={size} />;
const ChevronDown = ({ size = 24 }) => <MaterialIcon name="keyboard_arrow_down" size={size} />;
const ChevronRight = ({ size = 24 }) => <MaterialIcon name="keyboard_arrow_right" size={size} />;

// ==================== OPENCV FUNCTION DEFINITIONS ====================
const OPENCV_CATEGORIES = {
    'Blur & Smoothing': [
        {
            id: 'gaussianBlur',
            name: 'Gaussian Blur',
            params: [
                { name: 'ksize', label: 'Kernel Size', type: 'number', default: 5, min: 1, max: 31, step: 2 },
                { name: 'sigmaX', label: 'Sigma X', type: 'number', default: 0, min: 0, max: 10, step: 0.1 }
            ]
        },
        {
            id: 'medianBlur',
            name: 'Median Blur',
            params: [
                { name: 'ksize', label: 'Kernel Size', type: 'number', default: 5, min: 1, max: 31, step: 2 }
            ]
        },
        {
            id: 'bilateralFilter',
            name: 'Bilateral Filter',
            params: [
                { name: 'd', label: 'Diameter', type: 'number', default: 9, min: 1, max: 20, step: 1 },
                { name: 'sigmaColor', label: 'Sigma Color', type: 'number', default: 75, min: 0, max: 200, step: 1 },
                { name: 'sigmaSpace', label: 'Sigma Space', type: 'number', default: 75, min: 0, max: 200, step: 1 }
            ]
        },
        {
            id: 'blur',
            name: 'Average Blur',
            params: [
                { name: 'ksize', label: 'Kernel Size', type: 'number', default: 5, min: 1, max: 31, step: 2 }
            ]
        },
        {
            id: 'boxFilter',
            name: 'Box Filter',
            params: [
                { name: 'ksize', label: 'Kernel Size', type: 'number', default: 5, min: 1, max: 31, step: 2 }
            ]
        }
    ],
    'Edge Detection': [
        {
            id: 'canny',
            name: 'Canny Edge Detection',
            params: [
                { name: 'threshold1', label: 'Threshold 1', type: 'number', default: 50, min: 0, max: 300, step: 1 },
                { name: 'threshold2', label: 'Threshold 2', type: 'number', default: 150, min: 0, max: 300, step: 1 }
            ]
        },
        {
            id: 'sobel',
            name: 'Sobel Edge Detection',
            params: [
                { name: 'dx', label: 'Order X', type: 'number', default: 1, min: 0, max: 2, step: 1 },
                { name: 'dy', label: 'Order Y', type: 'number', default: 1, min: 0, max: 2, step: 1 },
                { name: 'ksize', label: 'Kernel Size', type: 'select', default: 3, options: [
                    { value: 1, label: '1' },
                    { value: 3, label: '3' },
                    { value: 5, label: '5' },
                    { value: 7, label: '7' }
                ]}
            ]
        },
        {
            id: 'laplacian',
            name: 'Laplacian',
            params: [
                { name: 'ksize', label: 'Kernel Size', type: 'select', default: 3, options: [
                    { value: 1, label: '1' },
                    { value: 3, label: '3' },
                    { value: 5, label: '5' },
                    { value: 7, label: '7' }
                ]}
            ]
        },
        {
            id: 'scharr',
            name: 'Scharr',
            params: [
                { name: 'dx', label: 'Order X', type: 'number', default: 1, min: 0, max: 1, step: 1 },
                { name: 'dy', label: 'Order Y', type: 'number', default: 0, min: 0, max: 1, step: 1 }
            ]
        }
    ],
    'Thresholding': [
        {
            id: 'threshold',
            name: 'Binary Threshold',
            params: [
                { name: 'thresh', label: 'Threshold Value', type: 'number', default: 127, min: 0, max: 255, step: 1 },
                { name: 'maxval', label: 'Max Value', type: 'number', default: 255, min: 0, max: 255, step: 1 },
                { name: 'type', label: 'Type', type: 'select', default: 0, options: [
                    { value: 0, label: 'Binary' },
                    { value: 1, label: 'Binary Inverted' },
                    { value: 2, label: 'Truncate' },
                    { value: 3, label: 'To Zero' },
                    { value: 4, label: 'To Zero Inverted' }
                ]}
            ]
        },
        {
            id: 'adaptiveThreshold',
            name: 'Adaptive Threshold',
            params: [
                { name: 'maxValue', label: 'Max Value', type: 'number', default: 255, min: 0, max: 255, step: 1 },
                { name: 'blockSize', label: 'Block Size', type: 'number', default: 11, min: 3, max: 99, step: 2 },
                { name: 'C', label: 'Constant C', type: 'number', default: 2, min: -10, max: 10, step: 1 },
                { name: 'method', label: 'Method', type: 'select', default: 0, options: [
                    { value: 0, label: 'Mean' },
                    { value: 1, label: 'Gaussian' }
                ]}
            ]
        },
        {
            id: 'otsuThreshold',
            name: 'Otsu Threshold',
            params: []
        }
    ],
    'Morphological Operations': [
        {
            id: 'dilate',
            name: 'Dilate',
            params: [
                { name: 'ksize', label: 'Kernel Size', type: 'number', default: 5, min: 1, max: 21, step: 2 },
                { name: 'iterations', label: 'Iterations', type: 'number', default: 1, min: 1, max: 10, step: 1 }
            ]
        },
        {
            id: 'erode',
            name: 'Erode',
            params: [
                { name: 'ksize', label: 'Kernel Size', type: 'number', default: 5, min: 1, max: 21, step: 2 },
                { name: 'iterations', label: 'Iterations', type: 'number', default: 1, min: 1, max: 10, step: 1 }
            ]
        },
        {
            id: 'morphologyEx',
            name: 'Morphological Opening',
            params: [
                { name: 'ksize', label: 'Kernel Size', type: 'number', default: 5, min: 1, max: 21, step: 2 },
                { name: 'iterations', label: 'Iterations', type: 'number', default: 1, min: 1, max: 10, step: 1 }
            ],
            morphOp: 'open'
        },
        {
            id: 'morphologyClose',
            name: 'Morphological Closing',
            params: [
                { name: 'ksize', label: 'Kernel Size', type: 'number', default: 5, min: 1, max: 21, step: 2 },
                { name: 'iterations', label: 'Iterations', type: 'number', default: 1, min: 1, max: 10, step: 1 }
            ],
            morphOp: 'close'
        },
        {
            id: 'morphologyGradient',
            name: 'Morphological Gradient',
            params: [
                { name: 'ksize', label: 'Kernel Size', type: 'number', default: 5, min: 1, max: 21, step: 2 }
            ],
            morphOp: 'gradient'
        },
        {
            id: 'morphologyTophat',
            name: 'Top Hat',
            params: [
                { name: 'ksize', label: 'Kernel Size', type: 'number', default: 9, min: 1, max: 21, step: 2 }
            ],
            morphOp: 'tophat'
        },
        {
            id: 'morphologyBlackhat',
            name: 'Black Hat',
            params: [
                { name: 'ksize', label: 'Kernel Size', type: 'number', default: 9, min: 1, max: 21, step: 2 }
            ],
            morphOp: 'blackhat'
        }
    ],
    'Color & Enhancement': [
        {
            id: 'brightness',
            name: 'Brightness/Contrast',
            params: [
                { name: 'alpha', label: 'Contrast', type: 'number', default: 1.0, min: 0.1, max: 3.0, step: 0.1 },
                { name: 'beta', label: 'Brightness', type: 'number', default: 0, min: -100, max: 100, step: 1 }
            ]
        },
        {
            id: 'histogram',
            name: 'Histogram Equalization',
            params: []
        },
        {
            id: 'clahe',
            name: 'CLAHE',
            params: [
                { name: 'clipLimit', label: 'Clip Limit', type: 'number', default: 2.0, min: 1, max: 10, step: 0.1 },
                { name: 'tileSize', label: 'Tile Grid Size', type: 'number', default: 8, min: 2, max: 16, step: 1 }
            ]
        },
        {
            id: 'sharpen',
            name: 'Sharpen',
            params: [
                { name: 'amount', label: 'Amount', type: 'number', default: 1.0, min: 0, max: 5, step: 0.1 }
            ]
        },
        {
            id: 'gamma',
            name: 'Gamma Correction',
            params: [
                { name: 'gamma', label: 'Gamma', type: 'number', default: 1.0, min: 0.1, max: 3.0, step: 0.1 }
            ]
        }
    ],
    'Color Space Conversion': [
        {
            id: 'cvtGray',
            name: 'Convert to Grayscale',
            params: []
        },
        {
            id: 'cvtHSV',
            name: 'Convert to HSV',
            params: []
        },
        {
            id: 'cvtLAB',
            name: 'Convert to LAB',
            params: []
        },
        {
            id: 'invert',
            name: 'Invert Colors',
            params: []
        }
    ],
    'Geometric Transformations': [
        {
            id: 'resize',
            name: 'Resize',
            params: [
                { name: 'width', label: 'Width', type: 'number', default: 500, min: 50, max: 2000, step: 10 },
                { name: 'height', label: 'Height', type: 'number', default: 500, min: 50, max: 2000, step: 10 }
            ]
        },
        {
            id: 'rotate',
            name: 'Rotate',
            params: [
                { name: 'angle', label: 'Angle', type: 'number', default: 0, min: -180, max: 180, step: 1 }
            ]
        },
        {
            id: 'flip',
            name: 'Flip',
            params: [
                { name: 'flipCode', label: 'Flip Code', type: 'select', default: 1, options: [
                    { value: 0, label: 'Vertical' },
                    { value: 1, label: 'Horizontal' },
                    { value: -1, label: 'Both' }
                ]}
            ]
        },
        {
            id: 'crop',
            name: 'Crop',
            params: [
                { name: 'x', label: 'X Position', type: 'number', default: 0, min: 0, max: 2000, step: 10 },
                { name: 'y', label: 'Y Position', type: 'number', default: 0, min: 0, max: 2000, step: 10 },
                { name: 'width', label: 'Width', type: 'number', default: 300, min: 50, max: 2000, step: 10 },
                { name: 'height', label: 'Height', type: 'number', default: 300, min: 50, max: 2000, step: 10 }
            ]
        },
        {
            id: 'scale',
            name: 'Scale',
            params: [
                { name: 'fx', label: 'Scale X', type: 'number', default: 1.0, min: 0.1, max: 5.0, step: 0.1 },
                { name: 'fy', label: 'Scale Y', type: 'number', default: 1.0, min: 0.1, max: 5.0, step: 0.1 }
            ]
        }
    ],
    'Filters & Effects': [
        {
            id: 'emboss',
            name: 'Emboss',
            params: []
        },
        {
            id: 'sepia',
            name: 'Sepia Tone',
            params: []
        },
        {
            id: 'pencilSketch',
            name: 'Pencil Sketch',
            params: [
                { name: 'sigma_s', label: 'Sigma S', type: 'number', default: 60, min: 0, max: 200, step: 1 },
                { name: 'sigma_r', label: 'Sigma R', type: 'number', default: 0.07, min: 0, max: 1, step: 0.01 }
            ]
        },
        {
            id: 'stylization',
            name: 'Stylization',
            params: [
                { name: 'sigma_s', label: 'Sigma S', type: 'number', default: 60, min: 0, max: 200, step: 1 },
                { name: 'sigma_r', label: 'Sigma R', type: 'number', default: 0.45, min: 0, max: 1, step: 0.01 }
            ]
        },
        {
            id: 'detailEnhance',
            name: 'Detail Enhance',
            params: [
                { name: 'sigma_s', label: 'Sigma S', type: 'number', default: 10, min: 0, max: 200, step: 1 },
                { name: 'sigma_r', label: 'Sigma R', type: 'number', default: 0.15, min: 0, max: 1, step: 0.01 }
            ]
        },
        {
            id: 'edgePreserving',
            name: 'Edge Preserving Filter',
            params: [
                { name: 'sigma_s', label: 'Sigma S', type: 'number', default: 60, min: 0, max: 200, step: 1 },
                { name: 'sigma_r', label: 'Sigma R', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01 }
            ]
        }
    ],
    'Bitwise Operations': [
        {
            id: 'bitwiseNot',
            name: 'Bitwise NOT',
            params: []
        }
    ],
    'Advanced': [
        {
            id: 'distanceTransform',
            name: 'Distance Transform',
            params: []
        },
        {
            id: 'houghLines',
            name: 'Hough Line Transform',
            params: [
                { name: 'threshold', label: 'Threshold', type: 'number', default: 100, min: 10, max: 300, step: 10 }
            ]
        }
    ],
    'Segmentation': [
        {
            id: 'kmeansSegment', name: 'K-Means Color Segmentation',
            params: [
                { name: 'k', label: 'Number of Colors (K)', type: 'number', default: 4, min: 2, max: 16, step: 1 },
                { name: 'attempts', label: 'Attempts', type: 'number', default: 3, min: 1, max: 10, step: 1 },
                { name: 'seed', label: 'Random Seed', type: 'seed', default: 1 }
            ]
        },
        {
            id: 'watershedSegment', name: 'Watershed Segmentation',
            params: [
                { name: 'distThresh', label: 'Distance Threshold (0-1)', type: 'number', default: 0.5, min: 0.1, max: 0.9, step: 0.05 },
                { name: 'showBoundaries', label: 'Show Boundaries Only', type: 'select', default: 0, options: [
                    { value: 0, label: 'Colored Regions' },
                    { value: 1, label: 'Boundaries Only' }
                ]}
            ]
        },
        {
            id: 'meanShiftSegment', name: 'Mean Shift Segmentation',
            params: [
                { name: 'sp', label: 'Spatial Strength (passes ÷10)', type: 'number', default: 30, min: 10, max: 80, step: 10 },
                { name: 'sr', label: 'Color Radius', type: 'number', default: 50, min: 10, max: 150, step: 10 }
            ]
        },
        {
            id: 'pixelArt', name: 'Pixel Art Segmentation',
            params: [
                { name: 'cellSize', label: 'Cell Size (px)', type: 'range', default: 12, min: 2, max: 64, step: 1 },
                { name: 'shape', label: 'Pixel Shape', type: 'select', default: 'block', options: [
                    { value: 'block',   label: 'Block (square)' },
                    { value: 'round',   label: 'Round (circle)' },
                    { value: 'diamond', label: 'Diamond' },
                    { value: 'cross',   label: 'Cross' },
                ]},
                { name: 'gap', label: 'Gap Between Pixels', type: 'range', default: 1, min: 0, max: 8, step: 1 },
                { name: 'bgBrightness', label: 'Background Brightness', type: 'range', default: 20, min: 0, max: 255, step: 5 },
                { name: 'colorLevels', label: 'Color Quantization Levels', type: 'range', default: 256, min: 2, max: 256, step: 1 },
                { name: 'satBoost', label: 'Saturation Boost', type: 'range', default: 1, min: 0, max: 3, step: 0.1 },
                { name: 'seed', label: 'Random Seed', type: 'seed', default: 1 },
            ]
        },
    ],
    // Paint-by-numbers pipeline (facet merge + pole-of-inaccessibility labeling) adapted from
    // drake7707/paintbynumbersgenerator — MIT License — https://github.com/drake7707/paintbynumbersgenerator
    'Stylize': [
        {
            id: 'pbnPosterize', name: 'Posterize (Palette)',
            params: [
                { name: 'numColors', label: 'Number of Colors (K)', type: 'range', default: 12, min: 2, max: 24, step: 1 },
                { name: 'smoothingStyle', label: 'Pre-Smoothing Style', type: 'select', default: 'painterly', options: [
                    { value: 'painterly', label: 'Painterly (Kuwahara dabs)' },
                    { value: 'bilateral', label: 'Bilateral (soft blur)' }
                ]},
                { name: 'smoothingStrength', label: 'Pre-Smoothing Strength', type: 'range', default: 2, min: 0, max: 5, step: 1 },
                { name: 'vibrance', label: 'Palette Vibrance', type: 'range', default: 0.35, min: 0, max: 1, step: 0.05 },
                { name: 'colorSpace', label: 'Clustering Color Space', type: 'select', default: 'lab', options: [
                    { value: 'lab', label: 'LAB (perceptual)' },
                    { value: 'rgb', label: 'RGB' }
                ]},
                { name: 'paletteMethod', label: 'Palette Method', type: 'select', default: 'kmeans', options: [
                    { value: 'kmeans',    label: 'K-Means (fair)' },
                    { value: 'mediancut', label: 'Median Cut' }
                ]},
                { name: 'colorFairness', label: 'Colour Fairness (rare-colour preservation)', type: 'range', default: 0.5, min: 0, max: 1, step: 0.05 },
                { name: 'chromaBoost', label: 'Colour Emphasis (LAB a*/b*)', type: 'range', default: 1.6, min: 1, max: 3, step: 0.1 },
                { name: 'seed', label: 'Random Seed', type: 'seed', default: 1 },
            ]
        },
        {
            id: 'pbnMergeRegions', name: 'Merge Small Regions',
            params: [
                { name: 'minRegionArea', label: 'Min Region Area (px)', type: 'range', default: 200, min: 10, max: 5000, step: 10 },
                { name: 'passes', label: 'Merge Passes', type: 'range', default: 2, min: 1, max: 4, step: 1 },
                { name: 'protectVivid', label: 'Protect Vivid Dabs', type: 'select', default: 1, options: [
                    { value: 1, label: 'On (keep small saturated regions)' },
                    { value: 0, label: 'Off' }
                ]},
            ]
        },
        {
            id: 'pbnOutline', name: 'Numbered Outlines',
            params: [
                { name: 'displayMode', label: 'Display Mode', type: 'select', default: 0, options: [
                    { value: 0, label: 'Colored Fill + Outlines + Numbers' },
                    { value: 1, label: 'Blank Template (Outlines + Numbers Only)' }
                ]},
                { name: 'lineThickness', label: 'Outline Thickness (px)', type: 'range', default: 1, min: 1, max: 5, step: 1 },
                { name: 'lineShade', label: 'Border/Number Shade (0=black, higher=lighter)', type: 'range', default: 120, min: 0, max: 200, step: 10 },
                { name: 'fontSize', label: 'Max Number Font Size (px)', type: 'range', default: 16, min: 8, max: 32, step: 1 },
                { name: 'minLabelArea', label: 'Min Region Area to Number (px)', type: 'range', default: 200, min: 20, max: 5000, step: 10 },
            ]
        },
    ],
    'Color Channels': [
        { id: 'channelSplitR', name: 'Isolate Red Channel', params: [] },
        { id: 'channelSplitG', name: 'Isolate Green Channel', params: [] },
        { id: 'channelSplitB', name: 'Isolate Blue Channel', params: [] },
        {
            id: 'channelMixer', name: 'Channel Mixer',
            params: [
                { name: 'rWeight', label: 'Red Weight', type: 'number', default: 1.0, min: 0, max: 3.0, step: 0.1 },
                { name: 'gWeight', label: 'Green Weight', type: 'number', default: 1.0, min: 0, max: 3.0, step: 0.1 },
                { name: 'bWeight', label: 'Blue Weight', type: 'number', default: 1.0, min: 0, max: 3.0, step: 0.1 }
            ]
        },
        {
            id: 'hsvRangeFilter', name: 'HSV Range Filter',
            params: [
                { name: 'hMin', label: 'Hue Min (0-179)', type: 'number', default: 0, min: 0, max: 179, step: 1 },
                { name: 'hMax', label: 'Hue Max (0-179)', type: 'number', default: 179, min: 0, max: 179, step: 1 },
                { name: 'sMin', label: 'Sat Min', type: 'number', default: 0, min: 0, max: 255, step: 1 },
                { name: 'sMax', label: 'Sat Max', type: 'number', default: 255, min: 0, max: 255, step: 1 },
                { name: 'vMin', label: 'Val Min', type: 'number', default: 0, min: 0, max: 255, step: 1 },
                { name: 'vMax', label: 'Val Max', type: 'number', default: 255, min: 0, max: 255, step: 1 }
            ]
        },
        {
            id: 'labChannelIsolate', name: 'LAB Channel Isolate',
            params: [
                { name: 'channel', label: 'Channel', type: 'select', default: 0, options: [
                    { value: 0, label: 'L (Lightness)' },
                    { value: 1, label: 'A (Green-Red)' },
                    { value: 2, label: 'B (Blue-Yellow)' }
                ]}
            ]
        }
    ],
    'Contour Detection': [
        {
            id: 'findContours', name: 'Find & Draw Contours',
            params: [
                { name: 'threshold', label: 'Threshold', type: 'number', default: 100, min: 0, max: 255, step: 1 },
                { name: 'thickness', label: 'Line Thickness', type: 'number', default: 2, min: 1, max: 10, step: 1 },
                { name: 'colorR', label: 'Color R', type: 'number', default: 0, min: 0, max: 255, step: 1 },
                { name: 'colorG', label: 'Color G', type: 'number', default: 255, min: 0, max: 255, step: 1 },
                { name: 'colorB', label: 'Color B', type: 'number', default: 0, min: 0, max: 255, step: 1 }
            ]
        },
        {
            id: 'boundingBoxes', name: 'Bounding Boxes',
            params: [
                { name: 'threshold', label: 'Threshold', type: 'number', default: 100, min: 0, max: 255, step: 1 },
                { name: 'thickness', label: 'Line Thickness', type: 'number', default: 2, min: 1, max: 10, step: 1 },
                { name: 'colorR', label: 'Color R', type: 'number', default: 255, min: 0, max: 255, step: 1 },
                { name: 'colorG', label: 'Color G', type: 'number', default: 0, min: 0, max: 255, step: 1 },
                { name: 'colorB', label: 'Color B', type: 'number', default: 0, min: 0, max: 255, step: 1 }
            ]
        },
        {
            id: 'convexHull', name: 'Convex Hull',
            params: [
                { name: 'threshold', label: 'Threshold', type: 'number', default: 100, min: 0, max: 255, step: 1 },
                { name: 'thickness', label: 'Line Thickness', type: 'number', default: 2, min: 1, max: 10, step: 1 },
                { name: 'colorR', label: 'Color R', type: 'number', default: 255, min: 0, max: 255, step: 1 },
                { name: 'colorG', label: 'Color G', type: 'number', default: 165, min: 0, max: 255, step: 1 },
                { name: 'colorB', label: 'Color B', type: 'number', default: 0, min: 0, max: 255, step: 1 }
            ]
        }
    ],
    'Noise': [
        {
            id: 'gaussianNoise', name: 'Gaussian Noise',
            params: [
                { name: 'sigma', label: 'Sigma', type: 'number', default: 25, min: 1, max: 100, step: 1 }
            ]
        },
        {
            id: 'saltPepperNoise', name: 'Salt & Pepper Noise',
            params: [
                { name: 'density', label: 'Density', type: 'number', default: 0.05, min: 0.01, max: 0.5, step: 0.01 }
            ]
        }
    ],
    'OCR': [
        {
            id: 'tesseract',
            name: 'Tesseract OCR',
            params: [
                { name: 'language', label: 'Language', type: 'select', default: 'eng', options: [
                    { value: 'auto', label: '🌐 Auto Detect' },
                    { value: 'eng', label: 'English' },
                    { value: 'ara', label: 'Arabic' },
                    { value: 'chi_sim', label: 'Chinese Simplified' },
                    { value: 'chi_tra', label: 'Chinese Traditional' },
                    { value: 'fra', label: 'French' },
                    { value: 'deu', label: 'German' },
                    { value: 'hin', label: 'Hindi' },
                    { value: 'ita', label: 'Italian' },
                    { value: 'jpn', label: 'Japanese' },
                    { value: 'kor', label: 'Korean' },
                    { value: 'por', label: 'Portuguese' },
                    { value: 'rus', label: 'Russian' },
                    { value: 'spa', label: 'Spanish' }
                ]},
                { name: 'psm', label: 'Page Segmentation Mode', type: 'select', default: 3, options: [
                    { value: 0, label: '0 - Orientation and script detection' },
                    { value: 1, label: '1 - Auto page segmentation with OSD' },
                    { value: 3, label: '3 - Fully automatic (Default)' },
                    { value: 4, label: '4 - Single column of text' },
                    { value: 6, label: '6 - Single uniform block' },
                    { value: 7, label: '7 - Single text line' },
                    { value: 8, label: '8 - Single word' },
                    { value: 9, label: '9 - Single word in circle' },
                    { value: 10, label: '10 - Single character' },
                    { value: 11, label: '11 - Sparse text' },
                    { value: 12, label: '12 - Sparse text with OSD' },
                    { value: 13, label: '13 - Raw line' }
                ]},
                { name: 'oem', label: 'OCR Engine Mode', type: 'select', default: 3, options: [
                    { value: 0, label: '0 - Legacy engine only' },
                    { value: 1, label: '1 - Neural nets LSTM only' },
                    { value: 2, label: '2 - Legacy + LSTM' },
                    { value: 3, label: '3 - Default (Best available)' }
                ]}
            ]
        }
    ]
};

// Flatten for lookup
const OPENCV_FUNCTIONS = Object.values(OPENCV_CATEGORIES).flat();

const CATEGORY_ICONS = {
    'Blur & Smoothing': 'blur_on',
    'Edge Detection': 'crop_square',
    'Color & Contrast': 'palette',
    'Morphological': 'texture',
    'Geometric': 'transform',
    'Segmentation': 'layers',
    'Stylize': 'brush',
    'Color Channels': 'color_lens',
    'Contour Detection': 'account_tree',
    'Noise': 'grain',
    'OCR': 'text_fields',
};

// ==================== BUILT-IN PRESETS ====================
const BUILTIN_PRESETS = [
    {
        name: 'Edge Detection Combo',
        functions: [
            { id: 'cvtGray', name: 'Convert to Grayscale', enabled: true, params: {} },
            { id: 'gaussianBlur', name: 'Gaussian Blur', enabled: true, params: { ksize: 5, sigmaX: 0 } },
            { id: 'canny', name: 'Canny Edge Detection', enabled: true, params: { threshold1: 50, threshold2: 150 } }
        ]
    },
    {
        name: 'Sharpen + CLAHE',
        functions: [
            { id: 'clahe', name: 'CLAHE', enabled: true, params: { clipLimit: 2.0, tileSize: 8 } },
            { id: 'sharpen', name: 'Sharpen', enabled: true, params: { amount: 1.5 } }
        ]
    },
    {
        name: 'Pencil Sketch',
        functions: [
            { id: 'pencilSketch', name: 'Pencil Sketch', enabled: true, params: { sigma_s: 60, sigma_r: 0.07 } }
        ]
    },
    {
        name: 'Denoising Pipeline',
        functions: [
            { id: 'gaussianNoise', name: 'Gaussian Noise', enabled: true, params: { sigma: 25 } },
            { id: 'bilateralFilter', name: 'Bilateral Filter', enabled: true, params: { d: 9, sigmaColor: 75, sigmaSpace: 75 } }
        ]
    },
    {
        name: 'Color Isolation (Reds)',
        functions: [
            { id: 'hsvRangeFilter', name: 'HSV Range Filter', enabled: true, params: { hMin: 0, hMax: 15, sMin: 80, sMax: 255, vMin: 80, vMax: 255 } }
        ]
    },
    {
        name: 'Shape Analysis',
        functions: [
            { id: 'cvtGray', name: 'Convert to Grayscale', enabled: true, params: {} },
            { id: 'gaussianBlur', name: 'Gaussian Blur', enabled: true, params: { ksize: 5, sigmaX: 0 } },
            { id: 'boundingBoxes', name: 'Bounding Boxes', enabled: true, params: { threshold: 100, thickness: 2, colorR: 255, colorG: 0, colorB: 0 } }
        ]
    },

    // ── Document Processing ──────────────────────────────────────────
    {
        name: 'Document Binarization (OCR Ready)',
        functions: [
            { id: 'clahe',              name: 'CLAHE',                   enabled: true, params: { clipLimit: 3, tileSize: 8 } },
            { id: 'cvtGray',            name: 'Convert to Grayscale',    enabled: true, params: {} },
            { id: 'adaptiveThreshold',  name: 'Adaptive Threshold',      enabled: true, params: { maxValue: 255, blockSize: 15, C: 8, method: 1 } },
            { id: 'morphologyClose',    name: 'Morphological Close',     enabled: true, params: { ksize: 3, iterations: 1 } }
        ]
    },
    {
        name: 'Document Deskew Prep',
        functions: [
            { id: 'cvtGray',        name: 'Convert to Grayscale',    enabled: true, params: {} },
            { id: 'gaussianBlur',   name: 'Gaussian Blur',           enabled: true, params: { ksize: 3, sigmaX: 0 } },
            { id: 'otsuThreshold',  name: 'Otsu Threshold',          enabled: true, params: {} },
            { id: 'morphologyEx',   name: 'Morphological Open',      enabled: true, params: { ksize: 3, iterations: 1 } },
            { id: 'houghLines',     name: 'Hough Lines',             enabled: true, params: { threshold: 80 } }
        ]
    },
    {
        name: 'Table / Form Extraction',
        functions: [
            { id: 'cvtGray',            name: 'Convert to Grayscale',    enabled: true, params: {} },
            { id: 'adaptiveThreshold',  name: 'Adaptive Threshold',      enabled: true, params: { maxValue: 255, blockSize: 15, C: 6, method: 0 } },
            { id: 'dilate',             name: 'Dilate',                  enabled: true, params: { ksize: 3, iterations: 1 } },
            { id: 'morphologyClose',    name: 'Morphological Close',     enabled: true, params: { ksize: 5, iterations: 2 } },
            { id: 'boundingBoxes',      name: 'Bounding Boxes',          enabled: true, params: { threshold: 128, thickness: 1, colorR: 0, colorG: 120, colorB: 255 } }
        ]
    },
    {
        name: 'Handwriting Enhancement',
        functions: [
            { id: 'bilateralFilter', name: 'Bilateral Filter',       enabled: true, params: { d: 9, sigmaColor: 50, sigmaSpace: 50 } },
            { id: 'clahe',           name: 'CLAHE',                  enabled: true, params: { clipLimit: 4, tileSize: 6 } },
            { id: 'cvtGray',         name: 'Convert to Grayscale',   enabled: true, params: {} },
            { id: 'otsuThreshold',   name: 'Otsu Threshold',         enabled: true, params: {} }
        ]
    },

    // ── AI / ML Preprocessing ────────────────────────────────────────
    {
        name: 'Object Detection Normalisation',
        functions: [
            { id: 'resize',          name: 'Resize',            enabled: true, params: { width: 640, height: 640 } },
            { id: 'clahe',           name: 'CLAHE',             enabled: true, params: { clipLimit: 2, tileSize: 8 } },
            { id: 'bilateralFilter', name: 'Bilateral Filter',  enabled: true, params: { d: 5, sigmaColor: 40, sigmaSpace: 40 } }
        ]
    },
    {
        name: 'Semantic Segmentation Prep',
        functions: [
            { id: 'bilateralFilter',  name: 'Bilateral Filter',    enabled: true, params: { d: 9, sigmaColor: 75, sigmaSpace: 75 } },
            { id: 'kmeansSegment',    name: 'K-Means Segmentation',enabled: true, params: { k: 6, attempts: 3 } },
            { id: 'detailEnhance',    name: 'Detail Enhance',      enabled: true, params: { sigma_s: 10, sigma_r: 0.15 } }
        ]
    },
    {
        name: 'Depth / Disparity Pre-filter',
        functions: [
            { id: 'bilateralFilter', name: 'Bilateral Filter (1)', enabled: true, params: { d: 9, sigmaColor: 25, sigmaSpace: 25 } },
            { id: 'bilateralFilter', name: 'Bilateral Filter (2)', enabled: true, params: { d: 9, sigmaColor: 25, sigmaSpace: 25 } },
            { id: 'sharpen',         name: 'Sharpen',              enabled: true, params: { amount: 0.8 } }
        ]
    },
    {
        name: 'Feature Extraction Prep',
        functions: [
            { id: 'cvtGray',      name: 'Convert to Grayscale', enabled: true, params: {} },
            { id: 'clahe',        name: 'CLAHE',                enabled: true, params: { clipLimit: 3, tileSize: 8 } },
            { id: 'gaussianBlur', name: 'Gaussian Blur',        enabled: true, params: { ksize: 3, sigmaX: 0 } }
        ]
    },

    // ── Image Analysis / Segmentation ────────────────────────────────
    {
        name: 'Region Segmentation (Watershed)',
        functions: [
            { id: 'gaussianBlur',     name: 'Gaussian Blur',        enabled: true, params: { ksize: 5, sigmaX: 1 } },
            { id: 'otsuThreshold',    name: 'Otsu Threshold',       enabled: true, params: {} },
            { id: 'distanceTransform',name: 'Distance Transform',   enabled: true, params: {} },
            { id: 'watershedSegment', name: 'Watershed Segmentation',enabled: true, params: { distThresh: 0.4, showBoundaries: 0 } }
        ]
    },
    {
        name: 'Colour Region Analysis',
        functions: [
            { id: 'bilateralFilter',  name: 'Bilateral Filter',     enabled: true, params: { d: 7, sigmaColor: 50, sigmaSpace: 50 } },
            { id: 'meanShiftSegment', name: 'Mean Shift Segment',   enabled: true, params: { sp: 25, sr: 45 } },
            { id: 'findContours',     name: 'Find Contours',        enabled: true, params: { threshold: 30, thickness: 1, colorR: 255, colorG: 80, colorB: 0 } }
        ]
    },
    // ── Stylize ──────────────────────────────────────────────────────
    // Paint by Numbers pipeline — inspired by drake7707/paintbynumbersgenerator (MIT):
    // posterize to a palette, merge away speckle into large paintable facets, then draw
    // shared outlines and number each region.
    {
        name: 'Paint by Numbers',
        functions: [
            { id: 'pbnPosterize',    name: 'Posterize (Palette)',  enabled: true, params: { numColors: 12, smoothingStyle: 'painterly', smoothingStrength: 2, vibrance: 0.35, colorSpace: 'lab', paletteMethod: 'kmeans', colorFairness: 0.5, chromaBoost: 1.6, seed: 1 } },
            { id: 'pbnMergeRegions', name: 'Merge Small Regions',  enabled: true, params: { minRegionArea: 200, passes: 2, protectVivid: 1 } },
            { id: 'pbnOutline',      name: 'Numbered Outlines',    enabled: true, params: { displayMode: 0, lineThickness: 1, lineShade: 120, fontSize: 16, minLabelArea: 200 } }
        ]
    }
];

// ==================== PYTHON CODE GENERATOR ====================
const generatePythonCode = (appliedFunctions) => {
    let code = `import cv2
import numpy as np

# Read the image
img = cv2.imread('input_image.jpg')
`;

    appliedFunctions.forEach((func, index) => {
        if (!func.enabled) {
            code += `\n# Function disabled: ${func.name}\n`;
            return;
        }

        code += `\n# Step ${index + 1}: ${func.name}\n`;

        switch (func.id) {
            case 'gaussianBlur':
                const ksize1 = func.params.ksize % 2 === 0 ? func.params.ksize + 1 : func.params.ksize;
                code += `img = cv2.GaussianBlur(img, (${ksize1}, ${ksize1}), ${func.params.sigmaX})\n`;
                break;
            case 'medianBlur':
                const ksize2 = func.params.ksize % 2 === 0 ? func.params.ksize + 1 : func.params.ksize;
                code += `img = cv2.medianBlur(img, ${ksize2})\n`;
                break;
            case 'bilateralFilter':
                code += `img = cv2.bilateralFilter(img, ${func.params.d}, ${func.params.sigmaColor}, ${func.params.sigmaSpace})\n`;
                break;
            case 'blur':
                const ksize3 = func.params.ksize % 2 === 0 ? func.params.ksize + 1 : func.params.ksize;
                code += `img = cv2.blur(img, (${ksize3}, ${ksize3}))\n`;
                break;
            case 'boxFilter':
                const ksize4 = func.params.ksize % 2 === 0 ? func.params.ksize + 1 : func.params.ksize;
                code += `img = cv2.boxFilter(img, -1, (${ksize4}, ${ksize4}))\n`;
                break;
            case 'canny':
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `img = cv2.Canny(gray, ${func.params.threshold1}, ${func.params.threshold2})\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)\n`;
                break;
            case 'threshold':
                const threshTypes = ['cv2.THRESH_BINARY', 'cv2.THRESH_BINARY_INV', 'cv2.THRESH_TRUNC', 'cv2.THRESH_TOZERO', 'cv2.THRESH_TOZERO_INV'];
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `_, img = cv2.threshold(gray, ${func.params.thresh}, ${func.params.maxval}, ${threshTypes[func.params.type]})\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)\n`;
                break;
            case 'adaptiveThreshold':
                const adaptMethod = func.params.method === 0 ? 'cv2.ADAPTIVE_THRESH_MEAN_C' : 'cv2.ADAPTIVE_THRESH_GAUSSIAN_C';
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `img = cv2.adaptiveThreshold(gray, ${func.params.maxValue}, ${adaptMethod}, cv2.THRESH_BINARY, ${func.params.blockSize}, ${func.params.C})\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)\n`;
                break;
            case 'otsuThreshold':
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `_, img = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)\n`;
                break;
            case 'dilate':
                code += `kernel = np.ones((${func.params.ksize}, ${func.params.ksize}), np.uint8)\n`;
                code += `img = cv2.dilate(img, kernel, iterations=${func.params.iterations})\n`;
                break;
            case 'erode':
                code += `kernel = np.ones((${func.params.ksize}, ${func.params.ksize}), np.uint8)\n`;
                code += `img = cv2.erode(img, kernel, iterations=${func.params.iterations})\n`;
                break;
            case 'morphologyEx':
                code += `kernel = np.ones((${func.params.ksize}, ${func.params.ksize}), np.uint8)\n`;
                code += `img = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel, iterations=${func.params.iterations})\n`;
                break;
            case 'morphologyClose':
                code += `kernel = np.ones((${func.params.ksize}, ${func.params.ksize}), np.uint8)\n`;
                code += `img = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel, iterations=${func.params.iterations})\n`;
                break;
            case 'morphologyGradient':
                code += `kernel = np.ones((${func.params.ksize}, ${func.params.ksize}), np.uint8)\n`;
                code += `img = cv2.morphologyEx(img, cv2.MORPH_GRADIENT, kernel)\n`;
                break;
            case 'morphologyTophat':
                code += `kernel = np.ones((${func.params.ksize}, ${func.params.ksize}), np.uint8)\n`;
                code += `img = cv2.morphologyEx(img, cv2.MORPH_TOPHAT, kernel)\n`;
                break;
            case 'morphologyBlackhat':
                code += `kernel = np.ones((${func.params.ksize}, ${func.params.ksize}), np.uint8)\n`;
                code += `img = cv2.morphologyEx(img, cv2.MORPH_BLACKHAT, kernel)\n`;
                break;
            case 'brightness':
                code += `img = cv2.convertScaleAbs(img, alpha=${func.params.alpha}, beta=${func.params.beta})\n`;
                break;
            case 'resize':
                code += `img = cv2.resize(img, (${func.params.width}, ${func.params.height}), interpolation=cv2.INTER_LINEAR)\n`;
                break;
            case 'rotate':
                code += `(h, w) = img.shape[:2]\n`;
                code += `center = (w // 2, h // 2)\n`;
                code += `M = cv2.getRotationMatrix2D(center, ${func.params.angle}, 1.0)\n`;
                code += `img = cv2.warpAffine(img, M, (w, h))\n`;
                break;
            case 'flip':
                code += `img = cv2.flip(img, ${func.params.flipCode})\n`;
                break;
            case 'sobel':
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `img = cv2.Sobel(gray, cv2.CV_8U, ${func.params.dx}, ${func.params.dy}, ksize=${func.params.ksize})\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)\n`;
                break;
            case 'scharr':
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `img = cv2.Scharr(gray, cv2.CV_8U, ${func.params.dx}, ${func.params.dy})\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)\n`;
                break;
            case 'laplacian':
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `img = cv2.Laplacian(gray, cv2.CV_8U, ksize=${func.params.ksize})\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)\n`;
                break;
            case 'histogram':
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `img = cv2.equalizeHist(gray)\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)\n`;
                break;
            case 'clahe':
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `clahe = cv2.createCLAHE(clipLimit=${func.params.clipLimit}, tileGridSize=(${func.params.tileSize}, ${func.params.tileSize}))\n`;
                code += `img = clahe.apply(gray)\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)\n`;
                break;
            case 'sharpen':
                code += `blurred = cv2.GaussianBlur(img, (0, 0), 3)\n`;
                code += `img = cv2.addWeighted(img, ${1 + func.params.amount}, blurred, ${-func.params.amount}, 0)\n`;
                break;
            case 'gamma':
                code += `inv_gamma = 1.0 / ${func.params.gamma}\n`;
                code += `table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")\n`;
                code += `img = cv2.LUT(img, table)\n`;
                break;
            case 'cvtGray':
                code += `img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)\n`;
                break;
            case 'cvtHSV':
                code += `img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_HSV2BGR)\n`;
                break;
            case 'cvtLAB':
                code += `img = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_LAB2BGR)\n`;
                break;
            case 'invert':
                code += `img = cv2.bitwise_not(img)\n`;
                break;
            case 'crop':
                code += `img = img[${func.params.y}:${func.params.y + func.params.height}, ${func.params.x}:${func.params.x + func.params.width}]\n`;
                break;
            case 'scale':
                code += `img = cv2.resize(img, None, fx=${func.params.fx}, fy=${func.params.fy}, interpolation=cv2.INTER_LINEAR)\n`;
                break;
            case 'emboss':
                code += `kernel = np.array([[-2, -1, 0], [-1, 1, 1], [0, 1, 2]])\n`;
                code += `img = cv2.filter2D(img, -1, kernel)\n`;
                break;
            case 'sepia':
                code += `kernel = np.array([[0.272, 0.534, 0.131],\n`;
                code += `                    [0.349, 0.686, 0.168],\n`;
                code += `                    [0.393, 0.769, 0.189]])\n`;
                code += `img = cv2.transform(img, kernel)\n`;
                code += `img = np.clip(img, 0, 255).astype(np.uint8)\n`;
                break;
            case 'pencilSketch':
                code += `gray, sketch = cv2.pencilSketch(img, sigma_s=${func.params.sigma_s}, sigma_r=${func.params.sigma_r}, shade_factor=0.05)\n`;
                code += `img = cv2.cvtColor(sketch, cv2.COLOR_GRAY2BGR)\n`;
                break;
            case 'stylization':
                code += `img = cv2.stylization(img, sigma_s=${func.params.sigma_s}, sigma_r=${func.params.sigma_r})\n`;
                break;
            case 'detailEnhance':
                code += `img = cv2.detailEnhance(img, sigma_s=${func.params.sigma_s}, sigma_r=${func.params.sigma_r})\n`;
                break;
            case 'edgePreserving':
                code += `img = cv2.edgePreservingFilter(img, sigma_s=${func.params.sigma_s}, sigma_r=${func.params.sigma_r})\n`;
                break;
            case 'bitwiseNot':
                code += `img = cv2.bitwise_not(img)\n`;
                break;
            case 'distanceTransform':
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `_, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)\n`;
                code += `dist_transform = cv2.distanceTransform(binary, cv2.DIST_L2, 5)\n`;
                code += `img = cv2.normalize(dist_transform, None, 0, 255, cv2.NORM_MINMAX, cv2.CV_8U)\n`;
                code += `img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)\n`;
                break;
            case 'houghLines':
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `edges = cv2.Canny(gray, 50, 150)\n`;
                code += `lines = cv2.HoughLines(edges, 1, np.pi/180, ${func.params.threshold})\n`;
                code += `if lines is not None:\n`;
                code += `    for line in lines:\n`;
                code += `        rho, theta = line[0]\n`;
                code += `        a, b = np.cos(theta), np.sin(theta)\n`;
                code += `        x0, y0 = a*rho, b*rho\n`;
                code += `        x1 = int(x0 + 1000*(-b))\n`;
                code += `        y1 = int(y0 + 1000*(a))\n`;
                code += `        x2 = int(x0 - 1000*(-b))\n`;
                code += `        y2 = int(y0 - 1000*(a))\n`;
                code += `        cv2.line(img, (x1, y1), (x2, y2), (0, 0, 255), 2)\n`;
                break;
            case 'kmeansSegment': {
                const k = func.params.k;
                code += `# K-Means Color Segmentation (K=${k})\n`;
                code += `cv2.setRNGSeed(${(parseInt(func.params.seed) >>> 0) || 1})  # reproducible clustering\n`;
                code += `Z = img.reshape((-1, 3)).astype(np.float32)\n`;
                code += `criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)\n`;
                code += `_, labels, centers = cv2.kmeans(Z, ${k}, None, criteria, ${func.params.attempts}, cv2.KMEANS_RANDOM_CENTERS)\n`;
                code += `centers = np.uint8(centers)\n`;
                code += `img = centers[labels.flatten()].reshape(img.shape)\n`;
                break;
            }
            case 'watershedSegment':
                code += `# Watershed Segmentation\n`;
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `_, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)\n`;
                code += `kernel = np.ones((3,3), np.uint8)\n`;
                code += `opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)\n`;
                code += `sure_bg = cv2.dilate(opening, kernel, iterations=3)\n`;
                code += `dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)\n`;
                code += `_, sure_fg = cv2.threshold(dist_transform, ${func.params.distThresh} * dist_transform.max(), 255, 0)\n`;
                code += `sure_fg = np.uint8(sure_fg)\n`;
                code += `unknown = cv2.subtract(sure_bg, sure_fg)\n`;
                code += `_, markers = cv2.connectedComponents(sure_fg)\n`;
                code += `markers = markers + 1\n`;
                code += `markers[unknown == 255] = 0\n`;
                code += `cv2.watershed(img, markers)\n`;
                if (func.params.showBoundaries == 1) {
                    code += `img[markers == -1] = [255, 0, 0]  # boundaries in red\n`;
                } else {
                    code += `# Color each region\n`;
                    code += `colors = np.random.randint(0, 255, (markers.max()+1, 3), dtype=np.uint8)\n`;
                    code += `img = colors[markers]\n`;
                }
                break;
            case 'meanShiftSegment':
                code += `img = cv2.pyrMeanShiftFiltering(img, ${func.params.sp}, ${func.params.sr})\n`;
                break;
            case 'pixelArt': {
                const cs = parseInt(func.params.cellSize), gap = parseInt(func.params.gap);
                const bg = parseInt(func.params.bgBrightness), lvl = parseInt(func.params.colorLevels);
                const sat = parseFloat(func.params.satBoost), shape = func.params.shape;
                code += `# Pixel Art Segmentation — cell=${cs}px gap=${gap}px shape=${shape}\n`;
                code += `h, w = img.shape[:2]\n`;
                code += `out = np.full_like(img, ${bg})\n`;
                if (lvl < 256) code += `# Quantize to ${lvl} colors via k-means\n` +
                    `cv2.setRNGSeed(${(parseInt(func.params.seed) >>> 0) || 1})  # reproducible clustering\n` +
                    `Z = img.reshape((-1, 3)).astype(np.float32)\n` +
                    `criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)\n` +
                    `_, labels, centers = cv2.kmeans(Z, ${lvl}, None, criteria, 3, cv2.KMEANS_PP_CENTERS)\n` +
                    `img = centers[labels.flatten()].reshape(img.shape).astype(np.uint8)\n`;
                if (sat !== 1) code += `hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)\n` +
                    `hsv[:,:,1] = np.clip(hsv[:,:,1] * ${sat}, 0, 255)\n` +
                    `img = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)\n`;
                code += `for y in range(0, h, ${cs}):\n`;
                code += `    for x in range(0, w, ${cs}):\n`;
                code += `        cell = img[y:y+${cs}, x:x+${cs}]\n`;
                code += `        color = cv2.mean(cell)[:3]\n`;
                code += `        cx, cy = x + ${cs}//2, y + ${cs}//2\n`;
                code += `        r = ${cs}//2 - ${gap}\n`;
                if (shape === 'block') code += `        cv2.rectangle(out, (x+${gap}, y+${gap}), (x+${cs}-${gap}-1, y+${cs}-${gap}-1), color, -1)\n`;
                else if (shape === 'round') code += `        cv2.circle(out, (cx, cy), max(1, r), color, -1)\n`;
                else if (shape === 'diamond') code += `        pts = np.array([[cx,y+${gap}],[x+${cs}-${gap},cy],[cx,y+${cs}-${gap}],[x+${gap},cy]])\n` +
                    `        cv2.fillPoly(out, [pts], color)\n`;
                else if (shape === 'cross') code += `        bar = ${cs}//3\n` +
                    `        cv2.rectangle(out, (x+${gap}, cy-bar), (x+${cs}-${gap}, cy+bar), color, -1)\n` +
                    `        cv2.rectangle(out, (cx-bar, y+${gap}), (cx+bar, y+${cs}-${gap}), color, -1)\n`;
                code += `img = out\n`;
                break;
            }
            case 'pbnPosterize': {
                const nk = Math.max(2, Math.min(24, parseInt(func.params.numColors) || 12));
                let passes = parseInt(func.params.smoothingStrength); if (isNaN(passes)) passes = 2;
                const useLab = String(func.params.colorSpace || 'lab') === 'lab';
                const method = String(func.params.paletteMethod || 'kmeans');
                let chroma = parseFloat(func.params.chromaBoost); if (isNaN(chroma)) chroma = 1.6;
                let fairness = parseFloat(func.params.colorFairness); if (isNaN(fairness)) fairness = 0.5;
                const smoothStyle = String(func.params.smoothingStyle || 'painterly');
                let vib = parseFloat(func.params.vibrance); if (isNaN(vib)) vib = 0.35;
                code += `# Posterize (${method === 'mediancut' ? 'Median Cut' : 'K-Means, fair'}) — quantize to ${nk} colors.\n`;
                code += `# Paint-by-numbers steps adapted from drake7707/paintbynumbersgenerator (MIT):\n`;
                code += `#   https://github.com/drake7707/paintbynumbersgenerator\n`;
                if (passes > 0 && smoothStyle === 'painterly') {
                    code += `# The interactive app uses a Kuwahara filter here (painterly dabs, keeps small\n`;
                    code += `# vivid details unmixed); cv2 has no built-in Kuwahara — edgePreservingFilter\n`;
                    code += `# is the closest stock approximation.\n`;
                    code += `img = cv2.edgePreservingFilter(img, flags=cv2.RECURS_FILTER, sigma_s=${20 + passes * 10}, sigma_r=0.25)\n`;
                } else if (passes > 0) {
                    code += `for _ in range(${passes}):  # pre-smoothing so photos collapse into coherent blobs\n`;
                    code += `    img = cv2.bilateralFilter(img, 9, 60, 60)\n`;
                }
                code += `h, w = img.shape[:2]\n`;
                if (method === 'mediancut') {
                    code += `work = ${useLab ? 'cv2.cvtColor(img, cv2.COLOR_BGR2LAB)' : 'img'}  # clustering color space\n`;
                    code += `pts = work.reshape(-1, 3).astype(np.int32)\n`;
                    code += `boxes = [np.arange(len(pts))]\n`;
                    code += `while len(boxes) < ${nk}:  # split the widest colour box at its median\n`;
                    code += `    ranges = [int((pts[b].max(0) - pts[b].min(0)).max()) if len(b) > 1 else -1 for b in boxes]\n`;
                    code += `    q = int(np.argmax(ranges))\n`;
                    code += `    if ranges[q] <= 0: break\n`;
                    code += `    b = boxes[q]; ax = int((pts[b].max(0) - pts[b].min(0)).argmax())\n`;
                    code += `    order = b[np.argsort(pts[b][:, ax])]; vals = pts[order][:, ax]\n`;
                    code += `    thr = (int(vals[0]) + int(vals[-1])) / 2  # split at axis midpoint (isolates outlier colours)\n`;
                    code += `    k = min(max(int(np.searchsorted(vals, thr, side='right')), 1), len(order) - 1)\n`;
                    code += `    boxes[q:q+1] = [order[:k], order[k:]]\n`;
                    code += `out = np.empty_like(pts)\n`;
                    code += `for b in boxes: out[b] = pts[b].mean(0).astype(np.int32)  # box palette = mean colour\n`;
                    code += `quant = np.clip(out, 0, 255).reshape(h, w, 3).astype(np.uint8)\n`;
                    code += `img = ${useLab ? 'cv2.cvtColor(quant, cv2.COLOR_LAB2BGR)' : 'quant'}\n`;
                } else {
                    code += `# NOTE: the interactive app also weights samples by count**${fairness} (colour fairness)\n`;
                    code += `#       to keep rare colours; cv2.kmeans can't weight samples, so this approximates it.\n`;
                    code += `work = ${useLab ? 'cv2.cvtColor(img, cv2.COLOR_BGR2LAB)' : 'img'}.astype(np.float32)\n`;
                    if (useLab && chroma !== 1) {
                        code += `work[..., 1:] = (work[..., 1:] - 128) * ${chroma} + 128  # emphasise a*/b* (hue)\n`;
                    }
                    code += `cv2.setRNGSeed(${(parseInt(func.params.seed) >>> 0) || 1})  # reproducible clustering\n`;
                    code += `Z = work.reshape((-1, 3))\n`;
                    code += `criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)\n`;
                    code += `_, labels, centers = cv2.kmeans(Z, ${nk}, None, criteria, 3, cv2.KMEANS_PP_CENTERS)\n`;
                    if (useLab && chroma !== 1) {
                        code += `centers[:, 1:] = (centers[:, 1:] - 128) / ${chroma} + 128  # unscale a*/b*\n`;
                    }
                    if (useLab && vib > 0) {
                        code += `# Palette punch: cluster means regress to grey — boost vibrance + re-anchor value\n`;
                        code += `centers[:, 1:] = (centers[:, 1:] - 128) * ${(1 + vib).toFixed(2)} + 128  # vibrance\n`;
                        code += `p2, p98 = np.percentile(work[..., 0], [2, 98])\n`;
                        code += `L = centers[:, 0]\n`;
                        code += `t2, t98 = min(p2, L.min()), max(p98, L.max())  # expansion-only value anchoring\n`;
                        code += `centers[:, 0] = t2 + (L - L.min()) * (t98 - t2) / max(L.max() - L.min(), 1)\n`;
                    }
                    code += `centers = np.clip(centers, 0, 255).astype(np.uint8)\n`;
                    code += `quant = centers[labels.flatten()].reshape((h, w, 3))\n`;
                    code += `img = ${useLab ? 'cv2.cvtColor(quant, cv2.COLOR_LAB2BGR)' : 'quant'}\n`;
                }
                break;
            }
            case 'pbnMergeRegions': {
                let minArea = parseInt(func.params.minRegionArea); if (isNaN(minArea)) minArea = 200;
                let passes = parseInt(func.params.passes); if (isNaN(passes)) passes = 2;
                code += `# Merge Small Regions — merge facets below ${minArea}px into their dominant neighbor.\n`;
                code += `# Adapted from drake7707/paintbynumbersgenerator (MIT).\n`;
                code += `# NOTE: the interactive app additionally prefers the closest-COLOUR strong-border\n`;
                code += `#       neighbour and protects small vivid dabs (flowers) from being absorbed.\n`;
                code += `h, w = img.shape[:2]\n`;
                code += `colors, idx = np.unique(img.reshape(-1, 3), axis=0, return_inverse=True)\n`;
                code += `idx = idx.reshape(h, w)\n`;
                code += `k3 = np.ones((3, 3), np.uint8)\n`;
                code += `for _ in range(${passes}):\n`;
                code += `    changed = False\n`;
                code += `    for p in range(len(colors)):\n`;
                code += `        num, comp = cv2.connectedComponents((idx == p).astype(np.uint8))\n`;
                code += `        for c in range(1, num):\n`;
                code += `            region = (comp == c)\n`;
                code += `            if region.sum() >= ${minArea}:\n`;
                code += `                continue\n`;
                code += `            border = cv2.dilate(region.astype(np.uint8), k3).astype(bool) & ~region\n`;
                code += `            neigh = idx[border]\n`;
                code += `            neigh = neigh[neigh != p]\n`;
                code += `            if neigh.size == 0:\n`;
                code += `                continue\n`;
                code += `            idx[region] = np.bincount(neigh).argmax()  # longest shared border wins\n`;
                code += `            changed = True\n`;
                code += `    if not changed:\n`;
                code += `        break\n`;
                code += `img = colors[idx.reshape(-1)].reshape(h, w, 3).astype(np.uint8)\n`;
                break;
            }
            case 'pbnOutline': {
                const dispMode = parseInt(func.params.displayMode) === 1 ? 1 : 0;
                const lineW = Math.max(1, parseInt(func.params.lineThickness) || 1);
                const maxFSize = Math.max(8, parseInt(func.params.fontSize) || 16);
                let minLabelArea = parseInt(func.params.minLabelArea); if (isNaN(minLabelArea)) minLabelArea = 200;
                let ls = parseInt(func.params.lineShade); if (isNaN(ls)) ls = 120; ls = Math.max(0, Math.min(255, ls));
                code += `# Numbered Outlines — shared borders + numbers at each region's pole of inaccessibility.\n`;
                code += `# Adapted from drake7707/paintbynumbersgenerator (MIT).\n`;
                code += `h, w = img.shape[:2]\n`;
                code += `colors, idx = np.unique(img.reshape(-1, 3), axis=0, return_inverse=True)\n`;
                code += `idx = idx.reshape(h, w)\n`;
                if (dispMode === 1) {
                    code += `out = np.full((h, w, 3), 255, np.uint8)  # blank template\n`;
                } else {
                    code += `out = img.copy()\n`;
                }
                code += `# Shared borders: a pixel differs from its right/down neighbor (one line per edge)\n`;
                code += `edge = np.zeros((h, w), np.uint8)\n`;
                code += `edge[:, :-1] |= (idx[:, :-1] != idx[:, 1:]).astype(np.uint8)\n`;
                code += `edge[:-1, :] |= (idx[:-1, :] != idx[1:, :]).astype(np.uint8)\n`;
                if (lineW > 1) {
                    code += `edge = cv2.dilate(edge, np.ones((${lineW}, ${lineW}), np.uint8))\n`;
                }
                code += `out[edge.astype(bool)] = (${ls}, ${ls}, ${ls})  # soft-grey borders (paint-friendly)\n`;
                code += `for p in range(len(colors)):\n`;
                code += `    mask = (idx == p).astype(np.uint8)\n`;
                code += `    num, comp = cv2.connectedComponents(mask)\n`;
                code += `    dist = cv2.distanceTransform(mask, cv2.DIST_L2, 5)\n`;
                code += `    for c in range(1, num):\n`;
                code += `        region = (comp == c)\n`;
                code += `        if region.sum() < ${minLabelArea}:\n`;
                code += `            continue\n`;
                code += `        _, max_dist, _, max_loc = cv2.minMaxLoc(np.where(region, dist, 0))\n`;
                code += `        font_size = min(${maxFSize}, int(max_dist * 1.5))\n`;
                code += `        if font_size < 8:\n`;
                code += `            continue  # inscribed circle too small to label legibly\n`;
                code += `        text = str(p + 1)\n`;
                code += `        cv2.putText(out, text, max_loc, cv2.FONT_HERSHEY_SIMPLEX, font_size/30.0, (255,255,255), 4, cv2.LINE_AA)\n`;
                code += `        cv2.putText(out, text, max_loc, cv2.FONT_HERSHEY_SIMPLEX, font_size/30.0, (${ls},${ls},${ls}), 1, cv2.LINE_AA)\n`;
                code += `img = out\n`;
                break;
            }
            case 'channelSplitR':
                code += `b, g, r, a = cv2.split(img)\n`;
                code += `zeros = np.zeros_like(r)\n`;
                code += `img = cv2.merge([zeros, zeros, r, a]) if img.shape[2] == 4 else cv2.merge([zeros, zeros, r])\n`;
                break;
            case 'channelSplitG':
                code += `b, g, r, a = cv2.split(img)\n`;
                code += `zeros = np.zeros_like(g)\n`;
                code += `img = cv2.merge([zeros, g, zeros, a]) if img.shape[2] == 4 else cv2.merge([zeros, g, zeros])\n`;
                break;
            case 'channelSplitB':
                code += `b, g, r, a = cv2.split(img)\n`;
                code += `zeros = np.zeros_like(b)\n`;
                code += `img = cv2.merge([b, zeros, zeros, a]) if img.shape[2] == 4 else cv2.merge([b, zeros, zeros])\n`;
                break;
            case 'channelMixer':
                code += `b, g, r = cv2.split(img[:,:,:3])\n`;
                code += `r = np.clip(r.astype(np.float32) * ${func.params.rWeight}, 0, 255).astype(np.uint8)\n`;
                code += `g = np.clip(g.astype(np.float32) * ${func.params.gWeight}, 0, 255).astype(np.uint8)\n`;
                code += `b = np.clip(b.astype(np.float32) * ${func.params.bWeight}, 0, 255).astype(np.uint8)\n`;
                code += `img = cv2.merge([b, g, r])\n`;
                break;
            case 'hsvRangeFilter':
                code += `hsv = cv2.cvtColor(img[:,:,:3], cv2.COLOR_BGR2HSV)\n`;
                code += `lower = np.array([${func.params.hMin}, ${func.params.sMin}, ${func.params.vMin}])\n`;
                code += `upper = np.array([${func.params.hMax}, ${func.params.sMax}, ${func.params.vMax}])\n`;
                code += `mask = cv2.inRange(hsv, lower, upper)\n`;
                code += `img = cv2.bitwise_and(img, img, mask=mask)\n`;
                break;
            case 'labChannelIsolate': {
                const labNames = ['L', 'A', 'B'];
                const ch = parseInt(func.params.channel) || 0;
                code += `lab = cv2.cvtColor(img[:,:,:3], cv2.COLOR_BGR2LAB)\n`;
                code += `channel = lab[:,:,${ch}]  # ${labNames[ch]} channel\n`;
                code += `img = cv2.cvtColor(channel, cv2.COLOR_GRAY2BGR)\n`;
                break;
            }
            case 'findContours':
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `_, binary = cv2.threshold(gray, ${func.params.threshold}, 255, cv2.THRESH_BINARY)\n`;
                code += `contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)\n`;
                code += `img = cv2.drawContours(img.copy(), contours, -1, (${func.params.colorB}, ${func.params.colorG}, ${func.params.colorR}), ${func.params.thickness})\n`;
                break;
            case 'boundingBoxes':
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `_, binary = cv2.threshold(gray, ${func.params.threshold}, 255, cv2.THRESH_BINARY)\n`;
                code += `contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)\n`;
                code += `img = img.copy()\n`;
                code += `for cnt in contours:\n`;
                code += `    x, y, w, h = cv2.boundingRect(cnt)\n`;
                code += `    cv2.rectangle(img, (x, y), (x+w, y+h), (${func.params.colorB}, ${func.params.colorG}, ${func.params.colorR}), ${func.params.thickness})\n`;
                break;
            case 'convexHull':
                code += `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n`;
                code += `_, binary = cv2.threshold(gray, ${func.params.threshold}, 255, cv2.THRESH_BINARY)\n`;
                code += `contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)\n`;
                code += `img = img.copy()\n`;
                code += `for cnt in contours:\n`;
                code += `    hull = cv2.convexHull(cnt)\n`;
                code += `    cv2.drawContours(img, [hull], 0, (${func.params.colorB}, ${func.params.colorG}, ${func.params.colorR}), ${func.params.thickness})\n`;
                break;
            case 'gaussianNoise':
                code += `noise = np.random.normal(0, ${func.params.sigma}, img.shape).astype(np.int16)\n`;
                code += `img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)\n`;
                break;
            case 'saltPepperNoise': {
                const density = func.params.density;
                code += `mask = np.random.random(img.shape[:2])\n`;
                code += `img = img.copy()\n`;
                code += `img[mask < ${(density/2).toFixed(3)}] = 0    # pepper\n`;
                code += `img[mask > ${(1 - density/2).toFixed(3)}] = 255  # salt\n`;
                break;
            }
            case 'tesseract':
                code += `# Note: Install pytesseract first: pip install pytesseract\n`;
                code += `# Also install Tesseract OCR: https://github.com/tesseract-ocr/tesseract\n`;
                code += `import pytesseract\n\n`;
                code += `# Configure Tesseract parameters\n`;
                code += `custom_config = r'--oem ${func.params.oem} --psm ${func.params.psm}'\n`;
                code += `text = pytesseract.image_to_string(img, lang='${func.params.language}', config=custom_config)\n`;
                code += `print("Extracted Text:")\n`;
                code += `print(text)\n`;
                code += `\n# Save text to file\n`;
                code += `with open('ocr_output.txt', 'w', encoding='utf-8') as f:\n`;
                code += `    f.write(text)\n`;
                break;
        }
    });

    code += `\n# Save the result\ncv2.imwrite('output_image.jpg', img)\n`;
    return code;
};

// ==================== MAIN COMPONENT ====================
const OpenCVInteractive = () => {
    const [appliedFunctions, setAppliedFunctions] = useState([]);
    const [selectedFunction, setSelectedFunction] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [opencvReady, setOpencvReady] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [ocrResult, setOcrResult] = useState('Add Tesseract OCR from the OCR category and upload an image to extract text.');
    const [ocrProgress, setOcrProgress] = useState(0);
    const [isProcessingOCR, setIsProcessingOCR] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    // Per-step processing errors, keyed by index into appliedFunctions
    const [stepErrors, setStepErrors] = useState({});

    // Right panel tabs
    const [activeRightTab, setActiveRightTab] = useState('pipeline'); // 'pipeline' | 'analysis'

    // Bottom panel (Code & OCR) — VS Code-style docked panel
    const [bottomPanelHeight, setBottomPanelHeight] = useState(220);
    const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);
    const [activeBottomTab, setActiveBottomTab] = useState('code');

    // View mode for image canvas
    const [viewMode, setViewMode] = useState('Side by side'); // 'Side by side' | 'Overlay' | 'Original' | 'Processed'

    // Compare slider (used by Overlay mode)
    const [comparePos, setComparePos] = useState(50);
    const [isDraggingCompare, setIsDraggingCompare] = useState(false);

    // Analysis data
    const [paletteColors, setPaletteColors] = useState([]);
    const [imageMetrics, setImageMetrics] = useState(null);

    // Presets & search
    const [showPresets, setShowPresets] = useState(false);
    const [showUserPresets, setShowUserPresets] = useState(true);
    const [userPresets, setUserPresets] = useState(() => {
        try { return JSON.parse(localStorage.getItem('cv-user-presets') || '[]'); } catch { return []; }
    });
    const [savePresetName, setSavePresetName] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('cv-theme') || 'light');

    // Apply theme to document
    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('cv-theme', theme);
    }, [theme]);
    const [searchQuery, setSearchQuery] = useState('');

    const fileInputRef = useRef(null);
    const compareRef = useRef(null);
    const histogramCanvasRef = useRef(null);
    const presetImportRef = useRef(null);
    // Captures the exact k-means palette when pixelArt is the last applied function
    const pixelArtPaletteRef = useRef(null);
    const historyRef = useRef([[]]);
    const historyIndexRef = useRef(0);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.5.2/opencv.js';
        script.async = true;
        script.onload = () => {
            const checkOpenCV = setInterval(() => {
                if (window.cv && window.cv.Mat) {
                    setOpencvReady(true);
                    clearInterval(checkOpenCV);
                }
            }, 100);
        };
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (originalImage && opencvReady) {
            processImage();
        }
    }, [appliedFunctions, originalImage, opencvReady]);

    // Run OCR when processed image changes and Tesseract is in the pipeline
    useEffect(() => {
        const hasTesseract = appliedFunctions.some(f => f.id === 'tesseract' && f.enabled);
        if (hasTesseract && processedImage && !isProcessingOCR) {
            const timer = setTimeout(() => { runOCR(); }, 300);
            return () => clearTimeout(timer);
        } else if (hasTesseract && !processedImage) {
            setOcrResult('Waiting for image to be processed...');
        } else if (!hasTesseract) {
            const inPipeline = appliedFunctions.some(f => f.id === 'tesseract');
            setOcrResult(inPipeline
                ? 'Tesseract OCR is disabled. Enable it in the Pipeline tab to extract text.'
                : 'Add Tesseract OCR from the OCR category and upload an image to extract text.'
            );
        }
    }, [processedImage, appliedFunctions]);

    // Undo / redo
    const pushHistory = (fns) => {
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(JSON.parse(JSON.stringify(fns)));
        if (historyRef.current.length > 50) historyRef.current.shift();
        historyIndexRef.current = historyRef.current.length - 1;
    };

    const setFunctions = (fns) => {
        pushHistory(fns);
        setAppliedFunctions(fns);
    };

    const undo = () => {
        if (historyIndexRef.current > 0) {
            historyIndexRef.current--;
            const fns = JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current]));
            setAppliedFunctions(fns);
            setSelectedFunction(null);
        }
    };

    const redo = () => {
        if (historyIndexRef.current < historyRef.current.length - 1) {
            historyIndexRef.current++;
            const fns = JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current]));
            setAppliedFunctions(fns);
            setSelectedFunction(null);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    // Compare slider global mouseup
    useEffect(() => {
        const up = () => setIsDraggingCompare(false);
        document.addEventListener('mouseup', up);
        return () => document.removeEventListener('mouseup', up);
    }, []);

    // Histogram + palette + metrics whenever processedImage changes
    useEffect(() => {
        if (processedImage) {
            drawHistogram(processedImage);
            computeColorPalette(processedImage);
            computeImageMetrics(processedImage);
        }
    }, [processedImage]);

    // Redraw histogram when switching to Analysis tab (canvas may not have existed before)
    useEffect(() => {
        if (activeRightTab === 'analysis' && processedImage) {
            setTimeout(() => drawHistogram(processedImage), 50);
        }
    }, [activeRightTab]);

    const drawHistogram = (imageUrl) => {
        const img = new Image();
        img.onload = () => {
            const tmp = document.createElement('canvas');
            tmp.width = img.width; tmp.height = img.height;
            const tctx = tmp.getContext('2d');
            tctx.drawImage(img, 0, 0);
            const data = tctx.getImageData(0, 0, img.width, img.height).data;
            const rH = new Array(256).fill(0), gH = new Array(256).fill(0), bH = new Array(256).fill(0);
            for (let i = 0; i < data.length; i += 4) { rH[data[i]]++; gH[data[i+1]]++; bH[data[i+2]]++; }
            const canvas = histogramCanvasRef.current;
            if (!canvas) return;

            // HiDPI-aware sizing
            const dpr = window.devicePixelRatio || 1;
            const cssW = canvas.clientWidth || 256;
            const cssH = canvas.clientHeight || 100;
            canvas.width = Math.floor(cssW * dpr);
            canvas.height = Math.floor(cssH * dpr);
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            const w = cssW, h = cssH;

            ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, w, h);

            // Subtle grid lines
            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
            for (let g = 0.25; g < 1; g += 0.25) {
                const gy = Math.floor(h * (1 - g)) + 0.5;
                ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
            }

            const maxV = Math.max(...rH, ...gH, ...bH, 1);
            const binW = w / 256;

            // Draw filled bars per channel, blended
            const drawBars = (hist, r, g, b) => {
                for (let i = 0; i < 256; i++) {
                    const barH = (hist[i] / maxV) * (h - 2);
                    const x = Math.floor(i * binW);
                    const bw = Math.max(1, Math.ceil(binW));
                    ctx.fillStyle = `rgba(${r},${g},${b},0.55)`;
                    ctx.fillRect(x, h - barH, bw, barH);
                }
            };

            drawBars(bH, 96, 165, 250);   // blue
            drawBars(gH, 52, 211, 153);   // green
            drawBars(rH, 248, 113, 113);  // red

            // Crisp top-line overlay per channel
            const drawLine = (hist, color) => {
                ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 1;
                ctx.beginPath();
                for (let i = 0; i < 256; i++) {
                    const x = i * binW + binW / 2;
                    const y = h - (hist[i] / maxV) * (h - 2);
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
            };
            drawLine(bH, '#93c5fd');
            drawLine(gH, '#6ee7b7');
            drawLine(rH, '#fca5a5');
            ctx.globalAlpha = 1;
        };
        img.src = imageUrl;
    };

    const computeColorPalette = (imageUrl) => {
        // If pixelArt was the last applied function, use its exact k-means palette directly
        if (pixelArtPaletteRef.current) {
            setPaletteColors(pixelArtPaletteRef.current);
            pixelArtPaletteRef.current = null;
            return;
        }
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, 150 / Math.max(img.width, img.height));
            const tmp = document.createElement('canvas');
            tmp.width = Math.max(1, Math.floor(img.width * scale));
            tmp.height = Math.max(1, Math.floor(img.height * scale));
            const ctx = tmp.getContext('2d');
            // Nearest-neighbour: never blends pixels, so no new colours are invented
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, tmp.width, tmp.height);
            const data = ctx.getImageData(0, 0, tmp.width, tmp.height).data;

            // Count exact unique colours
            const exactMap = {};
            for (let i = 0; i < data.length; i += 4) {
                const k = `${data[i]},${data[i+1]},${data[i+2]}`;
                exactMap[k] = (exactMap[k] || 0) + 1;
            }

            let colors;
            if (Object.keys(exactMap).length <= 24) {
                // Quantized / palette image — show all exact colours sorted by coverage
                colors = Object.entries(exactMap)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k]) => { const [r,g,b] = k.split(','); return `rgb(${r},${g},${b})`; });
            } else {
                // Photo — bin into coarse buckets and show top 10 dominant colours
                const map = {};
                for (let i = 0; i < data.length; i += 4) {
                    const r = Math.round(data[i] / 24) * 24;
                    const g = Math.round(data[i+1] / 24) * 24;
                    const b = Math.round(data[i+2] / 24) * 24;
                    const k = `${r},${g},${b}`;
                    map[k] = (map[k] || 0) + 1;
                }
                colors = Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0, 10)
                    .map(([k]) => { const [r,g,b] = k.split(','); return `rgb(${r},${g},${b})`; });
            }
            setPaletteColors(colors);
        };
        img.src = imageUrl;
    };

    const computeImageMetrics = (imageSrc) => {
        const img = new Image();
        img.onload = () => {
            const W = img.naturalWidth, H = img.naturalHeight;

            // Aspect ratio as simplified fraction
            const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
            const g = gcd(W, H);
            const arW = W / g, arH = H / g;
            const arStr = (arW <= 20 && arH <= 20) ? `${arW}:${arH}` : (W/H).toFixed(2)+':1';

            // Detect format from data URL prefix
            const fmtMatch = imageSrc.match(/^data:image\/([a-zA-Z0-9+]+)/);
            const fmt = fmtMatch ? fmtMatch[1].toUpperCase().replace('JPEG','JPG') : 'IMG';

            // Approx file size from base64 length
            const b64len = imageSrc.length - (imageSrc.indexOf(',') + 1);
            const bytes = Math.floor(b64len * 0.75);
            const sizeStr = bytes > 1048576 ? (bytes/1048576).toFixed(1)+' MB'
                          : bytes > 1024    ? (bytes/1024).toFixed(0)+' KB'
                          : bytes+' B';

            // Sample pixels (downsample for speed)
            const canvas = document.createElement('canvas');
            const scale = Math.min(1, 400 / Math.max(W, H));
            canvas.width  = Math.max(1, Math.floor(W * scale));
            canvas.height = Math.max(1, Math.floor(H * scale));
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

            let sumL=0, sumR=0, sumG=0, sumB=0, minL=255, maxL=0, count=0;
            for (let i = 0; i < data.length; i += 4) {
                const r=data[i], g=data[i+1], b=data[i+2];
                const lum = 0.299*r + 0.587*g + 0.114*b;
                sumL += lum; sumR += r; sumG += g; sumB += b;
                if (lum < minL) minL = lum;
                if (lum > maxL) maxL = lum;
                count++;
            }
            const mean = sumL / count;
            let varSum = 0;
            for (let i = 0; i < data.length; i += 4) {
                const lum = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
                varSum += (lum - mean) ** 2;
            }
            const std = Math.sqrt(varSum / count);
            // Contrast: Michelson contrast (0–1)
            const contrast = (maxL - minL) / (maxL + minL + 0.001);

            setImageMetrics({
                width: W, height: H,
                aspectRatio: arStr,
                format: fmt,
                size: sizeStr,
                mean: mean.toFixed(1),
                std: std.toFixed(1),
                minBright: minL.toFixed(0),
                maxBright: maxL.toFixed(0),
                contrast: (contrast * 100).toFixed(1),
                avgR: (sumR/count).toFixed(0),
                avgG: (sumG/count).toFixed(0),
                avgB: (sumB/count).toFixed(0),
            });
        };
        img.src = imageSrc;
    };

    // Preset handlers
    const loadPreset = (preset) => {
        setFunctions(JSON.parse(JSON.stringify(preset.functions)));
        setSelectedFunction(null);
    };

    const saveUserPreset = (name) => {
        if (!name.trim() || appliedFunctions.length === 0) return;
        const newPreset = { name: name.trim(), functions: JSON.parse(JSON.stringify(appliedFunctions)) };
        const updated = [...userPresets.filter(p => p.name !== name.trim()), newPreset];
        setUserPresets(updated);
        localStorage.setItem('cv-user-presets', JSON.stringify(updated));
    };

    const deleteUserPreset = (name) => {
        const updated = userPresets.filter(p => p.name !== name);
        setUserPresets(updated);
        localStorage.setItem('cv-user-presets', JSON.stringify(updated));
    };

    const exportPipeline = () => {
        const json = JSON.stringify(appliedFunctions, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'pipeline.json'; a.click();
        URL.revokeObjectURL(url);
    };

    const importPipeline = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const fns = JSON.parse(evt.target.result);
                if (Array.isArray(fns)) setFunctions(fns);
                else alert('Invalid pipeline file');
            } catch { alert('Failed to parse pipeline JSON'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // Compare slider handlers
    const updateComparePos = (e) => {
        if (!compareRef.current) return;
        const rect = compareRef.current.getBoundingClientRect();
        setComparePos(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
    };

    const handleCompareMouseDown = (e) => { setIsDraggingCompare(true); updateComparePos(e); };
    const handleCompareMouse = (e) => { if (isDraggingCompare) updateComparePos(e); };

    // Test CDN availability and return best option
    const findBestCDN = async () => {
        const cdnOptions = [
            {
                name: 'default-tesseract',
                langPath: null,
                corePath: null,
                testUrl: null
            },
            {
                name: 'JSDelivr-v2',
                langPath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v2/tessdata',
                corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v2',
                testUrl: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v2/tessdata/eng.traineddata.gz'
            },
            {
                name: 'unpkg-v2',
                langPath: 'https://unpkg.com/tesseract.js-core@v2/tessdata',
                corePath: 'https://unpkg.com/tesseract.js-core@v2',
                testUrl: 'https://unpkg.com/tesseract.js-core@v2/tessdata/eng.traineddata.gz'
            },
            {
                name: 'JSDelivr-latest',
                langPath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core/tessdata',
                corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core',
                testUrl: 'https://cdn.jsdelivr.net/npm/tesseract.js-core/tessdata/eng.traineddata.gz'
            }
        ];

        // Skip direct CDN testing to avoid CORS issues
        // Instead, we'll try CDNs in order and let Tesseract handle the testing
        console.log('Selecting CDN based on priority order (JSDelivr-v4 first)');
        
        for (const cdn of cdnOptions) {
            if (!cdn.testUrl) {
                console.log(`Using ${cdn.name} CDN as fallback`);
                return cdn; // Return default as last resort
            }
            
            // Return the first CDN option for now
            // Tesseract will handle the actual connectivity testing
            console.log(`Selected ${cdn.name} CDN for testing`);
            return cdn;
        }
        
        // This shouldn't happen, but just in case
        return cdnOptions[cdnOptions.length - 1];
    };

    const runOCR = async () => {
        // Pre-check: Ensure Tesseract library is available
        if (typeof Tesseract === 'undefined' || !Tesseract) {
            setOcrResult('❌ Tesseract library not loaded!\n\n🔧 Fix:\n→ Hard refresh: Ctrl+Shift+R (Win) or Cmd+Shift+R (Mac)\n→ Check internet connection\n→ Wait 30 seconds after page loads\n→ Try different browser');
            return;
        }

        const tesseractFunc = appliedFunctions.find(f => f.id === 'tesseract' && f.enabled);
        if (!tesseractFunc || !processedImage) {
            setOcrResult('Please add and enable Tesseract OCR function, and ensure an image is processed.');
            return;
        }

        setIsProcessingOCR(true);
        setOcrProgress(0);
        setOcrResult('Checking Tesseract availability...');

        // Additional check for Tesseract methods
        if (!Tesseract.createWorker && !Tesseract.recognize) {
            setOcrResult('❌ Tesseract library corrupted!\n\n🔧 Fix:\n→ Hard refresh: Ctrl+Shift+R\n→ Clear cache completely\n→ Reload page and wait 1 minute');
            setIsProcessingOCR(false);
            return;
        }

        setOcrResult('Creating Tesseract worker...');

        // Script → language bundle map for auto-detect
        const SCRIPT_LANG_MAP = {
            'Latin':      'eng+fra+deu+spa+ita+por',
            'Han':        'chi_sim+chi_tra+jpn',
            'Hiragana':   'jpn',
            'Katakana':   'jpn',
            'Hangul':     'kor',
            'Cyrillic':   'rus+eng',
            'Arabic':     'ara',
            'Devanagari': 'hin',
            'Greek':      'ell+eng',
        };
        const SCRIPT_LABEL_MAP = {
            'Latin':      'Latin (EN/FR/DE/ES/IT/PT)',
            'Han':        'CJK (Chinese/Japanese)',
            'Hiragana':   'Japanese',
            'Katakana':   'Japanese',
            'Hangul':     'Korean',
            'Cyrillic':   'Cyrillic (Russian)',
            'Arabic':     'Arabic',
            'Devanagari': 'Devanagari (Hindi)',
            'Greek':      'Greek',
        };

        const makeWorkerOptions = (label) => ({
            logger: m => {
                if (m.status === 'recognizing text' && m.progress > 0) {
                    const pct = Math.round(m.progress * 100);
                    setOcrProgress(pct);
                    setOcrResult(`${label}: ${pct}%`);
                } else if (m.status === 'loading language traineddata') {
                    setOcrResult('Downloading language data (first time only)…');
                } else if (m.status === 'initializing api') {
                    setOcrResult('Initializing OCR engine…');
                }
            }
        });

        let worker = null;

        try {
            if (typeof Tesseract === 'undefined' || !Tesseract) {
                throw new Error('Tesseract library not loaded. Please refresh the page.');
            }

            const oemMode = tesseractFunc.params.oem ?? 3;
            const psm     = tesseractFunc.params.psm  ?? 3;
            const selectedLang = tesseractFunc.params.language || 'eng';
            const isAuto  = selectedLang === 'auto';

            const oemNames = {
                0: 'Legacy engine only', 1: 'Neural nets LSTM only',
                2: 'Legacy + LSTM',      3: 'Default (Best available)'
            };

            let finalLang = selectedLang;
            let detectedScriptLabel = null;

            // ── Phase 1: Script detection (Auto mode only) ──────────────
            if (isAuto) {
                setOcrResult('🔍 Detecting script / language…');
                let osdWorker = null;
                try {
                    osdWorker = await Tesseract.createWorker('osd', 0, makeWorkerOptions('Detecting'));
                    await osdWorker.setParameters({ tessedit_pageseg_mode: 0 }); // OSD only
                    const osdResult = await Promise.race([
                        osdWorker.recognize(processedImage),
                        new Promise((_, rej) => setTimeout(() => rej(new Error('OSD timeout')), 20000))
                    ]);
                    const script = osdResult.data.script || '';
                    finalLang = SCRIPT_LANG_MAP[script] || 'eng+fra+deu+spa+ita+por';
                    detectedScriptLabel = SCRIPT_LABEL_MAP[script] || `Unknown script (${script || 'Latin fallback'})`;
                    setOcrResult(`✅ Detected: ${detectedScriptLabel}\n⏳ Running OCR…`);
                } catch (osdErr) {
                    // OSD failed — fall back to broad Latin bundle silently
                    finalLang = 'eng+fra+deu+spa+ita+por';
                    detectedScriptLabel = 'Latin (fallback — OSD unavailable)';
                    setOcrResult(`⚠️ Script detection failed, using Latin bundle…`);
                } finally {
                    if (osdWorker) { try { await osdWorker.terminate(); } catch (_) {} }
                }
            }

            // ── Phase 2: Actual OCR ──────────────────────────────────────
            setOcrResult(`Initializing OCR (${isAuto ? detectedScriptLabel : finalLang})…`);

            const workerOpts = makeWorkerOptions('Recognizing text');
            if (oemMode === 0 || oemMode === 1) {
                workerOpts.legacyCore = true;
                workerOpts.legacyLang = true;
            }

            worker = await Tesseract.createWorker(finalLang, oemMode, workerOpts);

            if (psm !== 3) {
                await worker.setParameters({ tessedit_pageseg_mode: psm });
            }

            setOcrResult('Processing image…');

            const result = await Promise.race([
                worker.recognize(processedImage),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('OCR timeout after 90 seconds')), 90000)
                )
            ]);

            const text       = result.data.text;
            const confidence = result.data.confidence;

            if (text && text.trim().length > 0) {
                const langLine   = isAuto ? `🌐 Detected: ${detectedScriptLabel}\n` : '';
                const engineLine = `⚙️ Engine: ${oemNames[oemMode] || `OEM ${oemMode}`}\n`;
                const confLine   = confidence ? `📊 Confidence: ${Math.round(confidence)}%\n` : '';
                setOcrResult(`${langLine}${engineLine}${confLine}\n${text}`);
            } else {
                setOcrResult('❌ No text detected in the image.\n\n💡 Tips:\n• Pre-process with: Grayscale → Threshold\n• Try different PSM modes\n• Ensure text is clear and readable\n• Try increasing image size with Resize\n• Check if image actually contains text');
            }
        } catch (error) {
            const errorMsg = error && error.message ? error.message : 'Unknown error occurred';
            let troubleshootMsg = '\n\n🔧 Quick Fixes:\n';
            
            if (errorMsg.includes('SetVariable') || errorMsg.includes('null') || errorMsg.includes('worker is null') || errorMsg.includes('Worker initialization incomplete') || errorMsg.includes('library not loaded') || errorMsg.includes('missing required methods')) {
                troubleshootMsg += '❌ Critical Tesseract initialization failure\n';
                troubleshootMsg += '→ IMMEDIATE FIX: Hard refresh Ctrl+Shift+R (Win) or Cmd+Shift+R (Mac)\n';
                troubleshootMsg += '→ Clear browser cache: Settings → Privacy → Clear browsing data\n';
                troubleshootMsg += '→ Wait 1 full minute after page loads before trying OCR\n';
                troubleshootMsg += '→ Try Chrome browser (best compatibility)\n';
                troubleshootMsg += '→ Disable ALL extensions in Incognito mode\n';
                troubleshootMsg += '→ Check if https://unpkg.com loads in new tab\n';
                troubleshootMsg += '→ Try mobile hotspot if on corporate network\n';
            } else if (errorMsg.includes('403') || errorMsg.includes('Network error') || errorMsg.includes('tessdata') || errorMsg.includes('projectnaptha')) {
                troubleshootMsg += '❌ CDN/Language data access blocked (403 error)\n';
                troubleshootMsg += '→ IMMEDIATE FIX: Hard refresh Ctrl+Shift+R (Win) or Cmd+Shift+R (Mac)\n';
                troubleshootMsg += '→ The app now uses JSDelivr CDN (more reliable than projectnaptha)\n';
                troubleshootMsg += '→ Clear browser cache completely\n';
                troubleshootMsg += '→ Disable VPN/proxy temporarily\n';
                troubleshootMsg += '→ Try different network (mobile hotspot)\n';
                troubleshootMsg += '→ Check firewall/antivirus settings\n';
                troubleshootMsg += '→ Test CDN access: https://cdn.jsdelivr.net in new tab\n';
                troubleshootMsg += '→ Try Incognito mode (Ctrl+Shift+N)\n';
            } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
                troubleshootMsg += '❌ Connection issue\n';
                troubleshootMsg += '→ Check internet connection\n';
                troubleshootMsg += '→ Disable browser extensions\n';
                troubleshootMsg += '→ Try Incognito mode: Ctrl+Shift+N\n';
            } else if (errorMsg.includes('memory') || errorMsg.includes('allocation')) {
                troubleshootMsg += '❌ Memory issue\n';
                troubleshootMsg += '→ Image too large - add Resize function first\n';
                troubleshootMsg += '→ Close other browser tabs\n';
                troubleshootMsg += '→ Try smaller image\n';
            } else if (errorMsg.includes('timeout') || errorMsg.includes('took too long')) {
                troubleshootMsg += '❌ Processing timeout\n';
                troubleshootMsg += '→ Image too complex or large - add Resize function\n';
                troubleshootMsg += '→ Pre-process with blur reduction and contrast enhancement\n';
                troubleshootMsg += '→ Try different PSM mode (6 for single uniform block)\n';
                troubleshootMsg += '→ Try simpler image (plain text on white background)\n';
                troubleshootMsg += '→ Pre-process with Grayscale → Threshold\n';
                troubleshootMsg += '→ Check internet connection speed\n';
            } else if (errorMsg.includes('Legacy model') || errorMsg.includes('code missing') || errorMsg.includes('legacyCore') || errorMsg.includes('legacyLang') || errorMsg.includes('OEM')) {
                troubleshootMsg += '🔧 OCR Engine Mode Issue\n';
                troubleshootMsg += '→ App now supports ALL OEM modes (0, 1, 2, 3)\n';
                troubleshootMsg += '→ Legacy modes (0,1) automatically use legacyCore and legacyLang\n';
                troubleshootMsg += '→ Try different OEM mode in Properties panel:\n';
                troubleshootMsg += '  • Mode 0: Legacy engine only\n';
                troubleshootMsg += '  • Mode 1: Neural nets LSTM only\n';
                troubleshootMsg += '  • Mode 2: Legacy + LSTM engines\n';
                troubleshootMsg += '  • Mode 3: Default (Best available) ← Recommended\n';
                troubleshootMsg += '→ Test all modes: window.testAllOEMModes()\n';
            } else {
                troubleshootMsg += '→ Hard refresh: Ctrl+Shift+R\n';
                troubleshootMsg += '→ Check browser console (F12) for details\n';
                troubleshootMsg += '→ Try pre-processing: Grayscale → Threshold\n';
                troubleshootMsg += '→ Try simple test: screenshot of text\n';
            }
            
            troubleshootMsg += '\n💡 Still stuck? See FIX_403_ERROR.md for detailed solutions.';
            
            setOcrResult(`❌ OCR Error: ${errorMsg}${troubleshootMsg}`);
            console.error('OCR Error Details:', error);
        } finally {
            // Clean up worker
            if (worker) {
                try {
                    await worker.terminate();
                } catch (terminateError) {
                    console.warn('Worker termination warning:', terminateError);
                }
            }
            setIsProcessingOCR(false);
            setOcrProgress(100);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setOriginalImage(img);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => setOriginalImage(img);
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const processImage = () => {
        if (!originalImage || !opencvReady) return;
        setIsProcessing(true);

        try {
            const cv = window.cv;
            let src = cv.imread(originalImage);
            let dst = src.clone();

            pixelArtPaletteRef.current = null;
            const errors = {};
            for (const [fnIndex, func] of appliedFunctions.entries()) {
                // Skip Tesseract - it processes separately on the final image
                if (func.id === 'tesseract') continue;
                if (!func.enabled) continue;

                // Reset palette ref on every iteration — only set if pixelArt is last
                pixelArtPaletteRef.current = null;
                const temp = dst.clone();
                
                try {
                    switch (func.id) {
                        case 'gaussianBlur': {
                            const ksize = func.params.ksize;
                            const ksizeOdd = ksize % 2 === 0 ? ksize + 1 : ksize;
                            cv.GaussianBlur(temp, dst, new cv.Size(ksizeOdd, ksizeOdd), func.params.sigmaX);
                            break;
                        }
                        case 'medianBlur': {
                            const ksize = func.params.ksize;
                            const ksizeOdd = ksize % 2 === 0 ? ksize + 1 : ksize;
                            cv.medianBlur(temp, dst, ksizeOdd);
                            break;
                        }
                        case 'bilateralFilter': {
                            // bilateralFilter only accepts 1/3-channel input; imread gives RGBA (4ch).
                            const rgb = new cv.Mat();
                            cv.cvtColor(temp, rgb, cv.COLOR_RGBA2RGB);
                            const filt = new cv.Mat();
                            cv.bilateralFilter(rgb, filt, func.params.d, func.params.sigmaColor, func.params.sigmaSpace);
                            cv.cvtColor(filt, dst, cv.COLOR_RGB2RGBA);
                            rgb.delete(); filt.delete();
                            break;
                        }
                        case 'blur': {
                            const ksize = func.params.ksize;
                            const ksizeOdd = ksize % 2 === 0 ? ksize + 1 : ksize;
                            cv.blur(temp, dst, new cv.Size(ksizeOdd, ksizeOdd));
                            break;
                        }
                        case 'boxFilter': {
                            const ksize = func.params.ksize;
                            const ksizeOdd = ksize % 2 === 0 ? ksize + 1 : ksize;
                            cv.boxFilter(temp, dst, -1, new cv.Size(ksizeOdd, ksizeOdd));
                            break;
                        }
                        case 'canny': {
                            cv.cvtColor(temp, temp, cv.COLOR_RGBA2GRAY);
                            cv.Canny(temp, dst, func.params.threshold1, func.params.threshold2);
                            cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
                            break;
                        }
                        case 'threshold': {
                            cv.cvtColor(temp, temp, cv.COLOR_RGBA2GRAY);
                            cv.threshold(temp, dst, func.params.thresh, func.params.maxval, func.params.type);
                            cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
                            break;
                        }
                        case 'adaptiveThreshold': {
                            cv.cvtColor(temp, temp, cv.COLOR_RGBA2GRAY);
                            const method = func.params.method === 0 ? cv.ADAPTIVE_THRESH_MEAN_C : cv.ADAPTIVE_THRESH_GAUSSIAN_C;
                            cv.adaptiveThreshold(temp, dst, func.params.maxValue, method, cv.THRESH_BINARY, func.params.blockSize, func.params.C);
                            cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
                            break;
                        }
                        case 'otsuThreshold': {
                            cv.cvtColor(temp, temp, cv.COLOR_RGBA2GRAY);
                            cv.threshold(temp, dst, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
                            cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
                            break;
                        }
                        case 'dilate': {
                            const M = cv.Mat.ones(func.params.ksize, func.params.ksize, cv.CV_8U);
                            cv.dilate(temp, dst, M, new cv.Point(-1, -1), func.params.iterations);
                            M.delete();
                            break;
                        }
                        case 'erode': {
                            const M = cv.Mat.ones(func.params.ksize, func.params.ksize, cv.CV_8U);
                            cv.erode(temp, dst, M, new cv.Point(-1, -1), func.params.iterations);
                            M.delete();
                            break;
                        }
                        case 'morphologyEx': {
                            const M = cv.Mat.ones(func.params.ksize, func.params.ksize, cv.CV_8U);
                            cv.morphologyEx(temp, dst, cv.MORPH_OPEN, M, new cv.Point(-1, -1), func.params.iterations);
                            M.delete();
                            break;
                        }
                        case 'morphologyClose': {
                            const M = cv.Mat.ones(func.params.ksize, func.params.ksize, cv.CV_8U);
                            cv.morphologyEx(temp, dst, cv.MORPH_CLOSE, M, new cv.Point(-1, -1), func.params.iterations);
                            M.delete();
                            break;
                        }
                        case 'morphologyGradient': {
                            const M = cv.Mat.ones(func.params.ksize, func.params.ksize, cv.CV_8U);
                            cv.morphologyEx(temp, dst, cv.MORPH_GRADIENT, M);
                            M.delete();
                            break;
                        }
                        case 'morphologyTophat': {
                            const M = cv.Mat.ones(func.params.ksize, func.params.ksize, cv.CV_8U);
                            cv.morphologyEx(temp, dst, cv.MORPH_TOPHAT, M);
                            M.delete();
                            break;
                        }
                        case 'morphologyBlackhat': {
                            const M = cv.Mat.ones(func.params.ksize, func.params.ksize, cv.CV_8U);
                            cv.morphologyEx(temp, dst, cv.MORPH_BLACKHAT, M);
                            M.delete();
                            break;
                        }
                        case 'brightness': {
                            temp.convertTo(dst, -1, func.params.alpha, func.params.beta);
                            break;
                        }
                        case 'resize': {
                            const dsize = new cv.Size(func.params.width, func.params.height);
                            cv.resize(temp, dst, dsize, 0, 0, cv.INTER_LINEAR);
                            break;
                        }
                        case 'rotate': {
                            const center = new cv.Point(temp.cols / 2, temp.rows / 2);
                            const M = cv.getRotationMatrix2D(center, func.params.angle, 1);
                            cv.warpAffine(temp, dst, M, new cv.Size(temp.cols, temp.rows));
                            M.delete();
                            break;
                        }
                        case 'flip': {
                            cv.flip(temp, dst, func.params.flipCode);
                            break;
                        }
                        case 'sobel': {
                            cv.cvtColor(temp, temp, cv.COLOR_RGBA2GRAY);
                            cv.Sobel(temp, dst, cv.CV_8U, func.params.dx, func.params.dy, func.params.ksize);
                            cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
                            break;
                        }
                        case 'scharr': {
                            cv.cvtColor(temp, temp, cv.COLOR_RGBA2GRAY);
                            cv.Scharr(temp, dst, cv.CV_8U, func.params.dx, func.params.dy);
                            cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
                            break;
                        }
                        case 'laplacian': {
                            cv.cvtColor(temp, temp, cv.COLOR_RGBA2GRAY);
                            cv.Laplacian(temp, dst, cv.CV_8U, func.params.ksize);
                            cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
                            break;
                        }
                        case 'histogram': {
                            cv.cvtColor(temp, temp, cv.COLOR_RGBA2GRAY);
                            cv.equalizeHist(temp, dst);
                            cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
                            break;
                        }
                        case 'clahe': {
                            cv.cvtColor(temp, temp, cv.COLOR_RGBA2GRAY);
                            const clahe = new cv.CLAHE(func.params.clipLimit, new cv.Size(func.params.tileSize, func.params.tileSize));
                            clahe.apply(temp, dst);
                            cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
                            clahe.delete();
                            break;
                        }
                        case 'sharpen': {
                            const blurred = new cv.Mat();
                            cv.GaussianBlur(temp, blurred, new cv.Size(0, 0), 3);
                            cv.addWeighted(temp, 1 + func.params.amount, blurred, -func.params.amount, 0, dst);
                            blurred.delete();
                            break;
                        }
                        case 'gamma': {
                            // cv.LUT isn't exposed in this OpenCV.js build — apply the gamma curve in JS.
                            const invGamma = 1.0 / func.params.gamma;
                            const lut = new Uint8Array(256);
                            for (let i = 0; i < 256; i++) {
                                lut[i] = Math.min(255, Math.pow(i / 255.0, invGamma) * 255);
                            }
                            dst = temp.clone();
                            const d = dst.data;
                            for (let i = 0; i < d.length; i += 4) {
                                d[i] = lut[d[i]]; d[i+1] = lut[d[i+1]]; d[i+2] = lut[d[i+2]];
                            }
                            break;
                        }
                        case 'cvtGray': {
                            cv.cvtColor(temp, dst, cv.COLOR_RGBA2GRAY);
                            cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
                            break;
                        }
                        case 'cvtHSV': {
                            cv.cvtColor(temp, dst, cv.COLOR_RGBA2RGB);
                            cv.cvtColor(dst, dst, cv.COLOR_RGB2HSV);
                            cv.cvtColor(dst, dst, cv.COLOR_HSV2RGB);
                            cv.cvtColor(dst, dst, cv.COLOR_RGB2RGBA);
                            break;
                        }
                        case 'cvtLAB': {
                            cv.cvtColor(temp, dst, cv.COLOR_RGBA2RGB);
                            cv.cvtColor(dst, dst, cv.COLOR_RGB2Lab);
                            cv.cvtColor(dst, dst, cv.COLOR_Lab2RGB);
                            cv.cvtColor(dst, dst, cv.COLOR_RGB2RGBA);
                            break;
                        }
                        case 'invert': {
                            cv.bitwise_not(temp, dst);
                            for (let i = 3; i < dst.data.length; i += 4) {
                                dst.data[i] = temp.data[i];
                            }
                            break;
                        }
                        case 'crop': {
                            const rect = new cv.Rect(func.params.x, func.params.y, func.params.width, func.params.height);
                            dst = temp.roi(rect);
                            break;
                        }
                        case 'scale': {
                            cv.resize(temp, dst, new cv.Size(0, 0), func.params.fx, func.params.fy, cv.INTER_LINEAR);
                            break;
                        }
                        case 'emboss': {
                            const kernel = cv.matFromArray(3, 3, cv.CV_32FC1, [-2, -1, 0, -1, 1, 1, 0, 1, 2]);
                            cv.filter2D(temp, dst, cv.CV_8U, kernel);
                            kernel.delete();
                            break;
                        }
                        case 'sepia': {
                            const sepiaKernel = cv.matFromArray(4, 4, cv.CV_32FC1, [
                                0.272, 0.534, 0.131, 0,
                                0.349, 0.686, 0.168, 0,
                                0.393, 0.769, 0.189, 0,
                                0, 0, 0, 1
                            ]);
                            cv.transform(temp, dst, sepiaKernel);
                            sepiaKernel.delete();
                            break;
                        }
                        case 'bitwiseNot': {
                            cv.bitwise_not(temp, dst);
                            break;
                        }
                        case 'distanceTransform': {
                            cv.cvtColor(temp, temp, cv.COLOR_RGBA2GRAY);
                            const binary = new cv.Mat();
                            cv.threshold(temp, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
                            cv.distanceTransform(binary, dst, cv.DIST_L2, 5);
                            cv.normalize(dst, dst, 0, 255, cv.NORM_MINMAX, cv.CV_8U);
                            cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
                            binary.delete();
                            break;
                        }
                        case 'houghLines': {
                            cv.cvtColor(temp, temp, cv.COLOR_RGBA2GRAY);
                            const edges = new cv.Mat();
                            cv.Canny(temp, edges, 50, 150);
                            const lines = new cv.Mat();
                            cv.HoughLines(edges, lines, 1, Math.PI / 180, func.params.threshold);

                            dst = temp.clone();
                            cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);

                            for (let i = 0; i < lines.rows; i++) {
                                const rho = lines.data32F[i * 2];
                                const theta = lines.data32F[i * 2 + 1];
                                const a = Math.cos(theta);
                                const b = Math.sin(theta);
                                const x0 = a * rho;
                                const y0 = b * rho;
                                const pt1 = new cv.Point(x0 + 1000 * (-b), y0 + 1000 * a);
                                const pt2 = new cv.Point(x0 - 1000 * (-b), y0 - 1000 * a);
                                cv.line(dst, pt1, pt2, new cv.Scalar(0, 0, 255, 255), 2);
                            }

                            edges.delete();
                            lines.delete();
                            break;
                        }

                        // ---- Segmentation cases ----
                        case 'kmeansSegment': {
                            // Pure-JS k-means++ — avoids fragile OpenCV.js kmeans API
                            dst = temp.clone();
                            const d = dst.data;
                            const K = Math.max(2, Math.min(16, Math.round(func.params.k) || 4));
                            const n = d.length >> 2; // total pixels
                            const rand = mulberry32((parseInt(func.params.seed) >>> 0) || 1); // seeded → reproducible

                            // k-means++ initialisation: spread initial centers
                            const cx = new Float32Array(K * 3);
                            const firstIdx = Math.floor(rand() * n);
                            cx[0] = d[firstIdx*4]; cx[1] = d[firstIdx*4+1]; cx[2] = d[firstIdx*4+2];
                            for (let ci = 1; ci < K; ci++) {
                                let sumD = 0;
                                const dists = new Float32Array(n);
                                for (let i = 0; i < n; i++) {
                                    let minD = Infinity;
                                    for (let j = 0; j < ci; j++) {
                                        const dr = d[i*4]-cx[j*3], dg = d[i*4+1]-cx[j*3+1], db = d[i*4+2]-cx[j*3+2];
                                        const dist = dr*dr + dg*dg + db*db;
                                        if (dist < minD) minD = dist;
                                    }
                                    dists[i] = minD; sumD += minD;
                                }
                                let r = rand() * sumD;
                                for (let i = 0; i < n; i++) {
                                    r -= dists[i];
                                    if (r <= 0) { cx[ci*3]=d[i*4]; cx[ci*3+1]=d[i*4+1]; cx[ci*3+2]=d[i*4+2]; break; }
                                }
                            }

                            const labels = new Int32Array(n);
                            const sums  = new Float64Array(K * 3);
                            const cnts  = new Int32Array(K);

                            // Iterate — 10 passes is enough for visual convergence
                            for (let iter = 0; iter < 10; iter++) {
                                let changed = false;
                                for (let i = 0; i < n; i++) {
                                    const r = d[i*4], g = d[i*4+1], b = d[i*4+2];
                                    let minD = Infinity, best = 0;
                                    for (let c = 0; c < K; c++) {
                                        const dr=r-cx[c*3], dg=g-cx[c*3+1], db=b-cx[c*3+2];
                                        const dist = dr*dr + dg*dg + db*db;
                                        if (dist < minD) { minD=dist; best=c; }
                                    }
                                    if (labels[i] !== best) { labels[i]=best; changed=true; }
                                }
                                if (!changed && iter > 0) break;
                                sums.fill(0); cnts.fill(0);
                                for (let i = 0; i < n; i++) {
                                    const c = labels[i];
                                    sums[c*3]+=d[i*4]; sums[c*3+1]+=d[i*4+1]; sums[c*3+2]+=d[i*4+2]; cnts[c]++;
                                }
                                for (let c = 0; c < K; c++) if (cnts[c]>0) {
                                    cx[c*3]=sums[c*3]/cnts[c]; cx[c*3+1]=sums[c*3+1]/cnts[c]; cx[c*3+2]=sums[c*3+2]/cnts[c];
                                }
                            }
                            // Paint each pixel with its cluster's average color
                            for (let i = 0; i < n; i++) {
                                const c = labels[i];
                                d[i*4]=Math.round(cx[c*3]); d[i*4+1]=Math.round(cx[c*3+1]); d[i*4+2]=Math.round(cx[c*3+2]);
                            }
                            break;
                        }
                        case 'watershedSegment': {
                            // Watershed via OpenCV.js connectedComponents + watershed colorisation
                            const gray = new cv.Mat();
                            cv.cvtColor(temp, gray, cv.COLOR_RGBA2GRAY);
                            const thresh = new cv.Mat();
                            cv.threshold(gray, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
                            const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
                            const opened = new cv.Mat();
                            cv.morphologyEx(thresh, opened, cv.MORPH_OPEN, kernel, new cv.Point(-1,-1), 2);
                            const sureBg = new cv.Mat();
                            cv.dilate(opened, sureBg, kernel, new cv.Point(-1,-1), 3);
                            const dist = new cv.Mat();
                            cv.distanceTransform(opened, dist, cv.DIST_L2, 5);
                            const distNorm = new cv.Mat();
                            cv.normalize(dist, distNorm, 0, 255, cv.NORM_MINMAX, cv.CV_8U);
                            const sureFg = new cv.Mat();
                            cv.threshold(distNorm, sureFg, Math.round(func.params.distThresh * 255), 255, cv.THRESH_BINARY);
                            // markers: connectedComponents needs CV_32S output
                            const markers32s = new cv.Mat();
                            cv.connectedComponents(sureFg, markers32s);
                            const unknown = new cv.Mat();
                            cv.subtract(sureBg, sureFg, unknown);
                            // increment all markers by 1; mark unknown as 0
                            const mArr = markers32s.data32S;
                            const uArr = unknown.data;
                            for (let i = 0; i < mArr.length; i++) {
                                mArr[i] += 1;
                                if (uArr[i] === 255) mArr[i] = 0;
                            }
                            // watershed needs 3-channel BGR
                            const bgr3 = new cv.Mat();
                            cv.cvtColor(temp, bgr3, cv.COLOR_RGBA2RGB);
                            cv.watershed(bgr3, markers32s);
                            // find max label without spreading typed array (avoids stack overflow)
                            let maxLabel = 0;
                            for (let i = 0; i < mArr.length; i++) if (mArr[i] > maxLabel) maxLabel = mArr[i];
                            // pre-build color table using golden-angle hue spacing
                            const hsvToRgb = (h) => {
                                const s=0.75, v=0.9, hi=Math.floor(h/60)%6, f=h/60-Math.floor(h/60);
                                const p=v*(1-s), q=v*(1-f*s), t=v*(1-(1-f)*s);
                                const [r,g,b] = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][hi];
                                return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
                            };
                            const colorTable = new Array(maxLabel + 2).fill(null).map((_,i) => i===0 ? [0,0,0] : hsvToRgb((i*137.508)%360));
                            dst = temp.clone();
                            const dstArr = dst.data;
                            const showBoundaries = parseInt(func.params.showBoundaries) === 1;
                            for (let i = 0; i < mArr.length; i++) {
                                const label = mArr[i];
                                if (showBoundaries) {
                                    if (label === -1) { dstArr[i*4]=255; dstArr[i*4+1]=0; dstArr[i*4+2]=0; }
                                } else {
                                    const col = label === -1 ? [255,255,255] : (colorTable[label] || [0,0,0]);
                                    dstArr[i*4]=col[0]; dstArr[i*4+1]=col[1]; dstArr[i*4+2]=col[2];
                                }
                            }
                            gray.delete(); thresh.delete(); kernel.delete(); opened.delete(); sureBg.delete();
                            dist.delete(); distNorm.delete(); sureFg.delete(); markers32s.delete(); unknown.delete(); bgr3.delete();
                            break;
                        }
                        case 'meanShiftSegment': {
                            // Spatial color smoothing via iterated bilateral filter (pyrMeanShift not in OpenCV.js build).
                            // Each bilateral pass approximates one mean-shift iteration.
                            // bilateralFilter only accepts 1/3-channel input, so convert RGBA->RGB and back.
                            const passes = Math.max(1, Math.round(func.params.sp / 10));
                            const sigma = func.params.sr;
                            let cur = new cv.Mat();
                            cv.cvtColor(temp, cur, cv.COLOR_RGBA2RGB);
                            for (let p = 0; p < passes; p++) {
                                const next = new cv.Mat();
                                cv.bilateralFilter(cur, next, 9, sigma, sigma * 1.5);
                                cur.delete();
                                cur = next;
                            }
                            dst = new cv.Mat();
                            cv.cvtColor(cur, dst, cv.COLOR_RGB2RGBA);
                            cur.delete();
                            break;
                        }

                        case 'pixelArt': {
                            const cellSize   = Math.max(2, parseInt(func.params.cellSize) ?? 12) || 12;
                            const gap        = Math.max(0, Math.min(parseInt(func.params.gap) ?? 1, Math.floor(cellSize / 2) - 1));
                            const bgBright   = parseInt(func.params.bgBrightness) ?? 20;
                            const colorLevels= parseInt(func.params.colorLevels) ?? 256;
                            const satBoost   = parseFloat(func.params.satBoost) ?? 1;
                            const shape      = func.params.shape || 'block';
                            const W = temp.cols, H = temp.rows;

                            // Work on a plain canvas (no OpenCV Mat for the drawing — pure pixel ops)
                            const offCanvas = document.createElement('canvas');
                            offCanvas.width = W; offCanvas.height = H;
                            const offCtx = offCanvas.getContext('2d');

                            // Fill background
                            offCtx.fillStyle = `rgb(${bgBright},${bgBright},${bgBright})`;
                            offCtx.fillRect(0, 0, W, H);

                            // Read source pixels from temp Mat into an ImageData
                            const srcCanvas = document.createElement('canvas');
                            srcCanvas.width = W; srcCanvas.height = H;
                            const srcCtx = srcCanvas.getContext('2d');
                            const srcImgData = srcCtx.createImageData(W, H);
                            srcImgData.data.set(temp.data);
                            srcCtx.putImageData(srcImgData, 0, 0);

                            // Build k-means palette for true N-color quantization
                            let palette = null; // null = no quantization (colorLevels >= 256)
                            if (colorLevels < 256) {
                                const K = Math.max(2, Math.min(colorLevels, 64));
                                const srcD = temp.data;
                                const totalPx = W * H;
                                // Subsample for speed — cap at ~4000 sample points
                                const sStep = Math.max(1, Math.floor(totalPx / 4000));
                                const samples = [];
                                for (let i = 0; i < totalPx; i += sStep) {
                                    samples.push(srcD[i*4], srcD[i*4+1], srcD[i*4+2]);
                                }
                                const ns = samples.length / 3;
                                const rand = mulberry32((parseInt(func.params.seed) >>> 0) || 1); // seeded → reproducible
                                // k-means++ initialisation
                                const kmcx = new Float32Array(K * 3);
                                const fi = Math.floor(rand() * ns);
                                kmcx[0]=samples[fi*3]; kmcx[1]=samples[fi*3+1]; kmcx[2]=samples[fi*3+2];
                                for (let ci = 1; ci < K; ci++) {
                                    let sumD = 0;
                                    const dists = new Float32Array(ns);
                                    for (let i = 0; i < ns; i++) {
                                        let minD = Infinity;
                                        for (let j = 0; j < ci; j++) {
                                            const dr=samples[i*3]-kmcx[j*3], dg=samples[i*3+1]-kmcx[j*3+1], db=samples[i*3+2]-kmcx[j*3+2];
                                            const dist=dr*dr+dg*dg+db*db;
                                            if (dist<minD) minD=dist;
                                        }
                                        dists[i]=minD; sumD+=minD;
                                    }
                                    let rr = rand() * sumD;
                                    for (let i = 0; i < ns; i++) { rr-=dists[i]; if (rr<=0) { kmcx[ci*3]=samples[i*3]; kmcx[ci*3+1]=samples[i*3+1]; kmcx[ci*3+2]=samples[i*3+2]; break; } }
                                }
                                // k-means iterate (10 passes)
                                const lbs = new Int32Array(ns);
                                const sums = new Float64Array(K*3);
                                const cnts = new Int32Array(K);
                                for (let iter = 0; iter < 10; iter++) {
                                    let changed = false;
                                    for (let i = 0; i < ns; i++) {
                                        let minD=Infinity, best=0;
                                        for (let c = 0; c < K; c++) {
                                            const dr=samples[i*3]-kmcx[c*3], dg=samples[i*3+1]-kmcx[c*3+1], db=samples[i*3+2]-kmcx[c*3+2];
                                            const dist=dr*dr+dg*dg+db*db;
                                            if (dist<minD) { minD=dist; best=c; }
                                        }
                                        if (lbs[i]!==best) { lbs[i]=best; changed=true; }
                                    }
                                    if (!changed && iter>0) break;
                                    sums.fill(0); cnts.fill(0);
                                    for (let i = 0; i < ns; i++) { const c=lbs[i]; sums[c*3]+=samples[i*3]; sums[c*3+1]+=samples[i*3+1]; sums[c*3+2]+=samples[i*3+2]; cnts[c]++; }
                                    for (let c = 0; c < K; c++) if (cnts[c]>0) { kmcx[c*3]=sums[c*3]/cnts[c]; kmcx[c*3+1]=sums[c*3+1]/cnts[c]; kmcx[c*3+2]=sums[c*3+2]/cnts[c]; }
                                }
                                palette = kmcx;
                            }

                            // Store exact palette for the Analysis tab swatches
                            if (palette) {
                                pixelArtPaletteRef.current = Array.from(
                                    {length: palette.length / 3},
                                    (_, i) => `rgb(${Math.round(palette[i*3])},${Math.round(palette[i*3+1])},${Math.round(palette[i*3+2])})`
                                );
                            }

                            // Snap an average cell color to the nearest palette entry
                            const snapToPalette = (r, g, b) => {
                                if (!palette) return [r, g, b];
                                const K = palette.length / 3;
                                let minD=Infinity, best=0;
                                for (let c = 0; c < K; c++) {
                                    const dr=r-palette[c*3], dg=g-palette[c*3+1], db=b-palette[c*3+2];
                                    const dist=dr*dr+dg*dg+db*db;
                                    if (dist<minD) { minD=dist; best=c; }
                                }
                                return [palette[best*3], palette[best*3+1], palette[best*3+2]];
                            };

                            // Helper: boost saturation of rgb via HSL
                            const boostSat = (r, g, b) => {
                                if (satBoost === 1) return [r, g, b];
                                // rgb → hsl
                                const rn=r/255, gn=g/255, bn=b/255;
                                const max=Math.max(rn,gn,bn), min=Math.min(rn,gn,bn), l=(max+min)/2;
                                if (max===min) return [r,g,b];
                                const d=max-min;
                                let s = l>0.5 ? d/(2-max-min) : d/(max+min);
                                s = Math.min(1, s * satBoost);
                                let h;
                                if (max===rn) h=((gn-bn)/d+6)%6;
                                else if (max===gn) h=(bn-rn)/d+2;
                                else h=(rn-gn)/d+4;
                                h /= 6;
                                // hsl → rgb
                                const hue2rgb = (p,q,t) => { if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p; };
                                const q2 = l<0.5 ? l*(1+s) : l+s-l*s, p2=2*l-q2;
                                return [
                                    Math.round(hue2rgb(p2,q2,h+1/3)*255),
                                    Math.round(hue2rgb(p2,q2,h)*255),
                                    Math.round(hue2rgb(p2,q2,h-1/3)*255),
                                ];
                            };

                            for (let cy = 0; cy < H; cy += cellSize) {
                                for (let cx = 0; cx < W; cx += cellSize) {
                                    // Compute average RGBA for this cell
                                    const cellW = Math.min(cellSize, W - cx);
                                    const cellH = Math.min(cellSize, H - cy);
                                    let rSum=0, gSum=0, bSum=0, count=0;
                                    const srcData = temp.data;
                                    for (let py = cy; py < cy+cellH; py++) {
                                        for (let px = cx; px < cx+cellW; px++) {
                                            const idx = (py*W + px)*4;
                                            rSum += srcData[idx]; gSum += srcData[idx+1]; bSum += srcData[idx+2];
                                            count++;
                                        }
                                    }
                                    let [r, g, b] = count > 0
                                        ? boostSat(...snapToPalette(rSum/count, gSum/count, bSum/count))
                                        : [bgBright, bgBright, bgBright];

                                    const color = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
                                    offCtx.fillStyle = color;

                                    const midX = cx + Math.floor(cellSize/2);
                                    const midY = cy + Math.floor(cellSize/2);
                                    const innerR = Math.max(1, Math.floor(cellSize/2) - gap);

                                    if (shape === 'round') {
                                        offCtx.beginPath();
                                        offCtx.arc(midX, midY, innerR, 0, Math.PI*2);
                                        offCtx.fill();
                                    } else if (shape === 'diamond') {
                                        offCtx.beginPath();
                                        offCtx.moveTo(midX, cy + gap);
                                        offCtx.lineTo(cx + cellSize - gap, midY);
                                        offCtx.lineTo(midX, cy + cellSize - gap);
                                        offCtx.lineTo(cx + gap, midY);
                                        offCtx.closePath();
                                        offCtx.fill();
                                    } else if (shape === 'cross') {
                                        const bar = Math.max(1, Math.floor(cellSize/3));
                                        offCtx.fillRect(cx+gap, midY-bar, cellSize-gap*2, bar*2);
                                        offCtx.fillRect(midX-bar, cy+gap, bar*2, cellSize-gap*2);
                                    } else {
                                        // block (default)
                                        offCtx.fillRect(cx+gap, cy+gap, cellSize-gap*2, cellSize-gap*2);
                                    }
                                }
                            }

                            // Read result back into a cv.Mat
                            const resultImgData = offCtx.getImageData(0, 0, W, H);
                            dst = cv.matFromArray(H, W, cv.CV_8UC4, resultImgData.data);
                            break;
                        }

                        // ============================================================================
                        // Paint by Numbers pipeline (Stylize category). Decomposed into three
                        // composable steps: Posterize → Merge Small Regions → Numbered Outlines.
                        // The facet-merge and pole-of-inaccessibility labeling approach is adapted
                        // from drake7707/paintbynumbersgenerator — MIT License —
                        // https://github.com/drake7707/paintbynumbersgenerator
                        // Each step passes a flat, quantized RGBA image, which itself IS the facet
                        // map (unique color = palette entry, connected component = facet).
                        // ============================================================================
                        case 'pbnPosterize': {
                            // Pre-smooth then build a quantized palette — the foundation the later
                            // paint-by-numbers steps build on. Clustering runs on a colour HISTOGRAM
                            // (not per-pixel) so we can cheaply de-weight large flat areas (fairness)
                            // and emphasise hue (chroma) — fixing the "one dominant colour swallows
                            // the small vivid regions" failure of plain area-weighted k-means.
                            const W = temp.cols, H = temp.rows;
                            const K = Math.max(2, Math.min(24, Math.round(func.params.numColors) || 12));
                            let smoothPasses = parseInt(func.params.smoothingStrength);
                            if (isNaN(smoothPasses)) smoothPasses = 2;
                            smoothPasses = Math.max(0, Math.min(5, smoothPasses));
                            const smoothStyle = String(func.params.smoothingStyle || 'painterly');
                            const useLab = String(func.params.colorSpace || 'lab') === 'lab';
                            const method = String(func.params.paletteMethod || 'kmeans');
                            let fairness = parseFloat(func.params.colorFairness);
                            if (isNaN(fairness)) fairness = 0.5;
                            fairness = Math.max(0, Math.min(1, fairness));
                            let chroma = parseFloat(func.params.chromaBoost);
                            if (isNaN(chroma)) chroma = 1.6;
                            chroma = Math.max(1, Math.min(3, chroma));
                            const chromaScale = useLab ? chroma : 1; // a*/b* emphasis only meaningful in LAB
                            let vibrance = parseFloat(func.params.vibrance);
                            if (isNaN(vibrance)) vibrance = 0.35;
                            vibrance = Math.max(0, Math.min(1, vibrance));

                            // cvtColor/bilateralFilter want 3-channel — drop alpha first.
                            const rgb = new cv.Mat();
                            cv.cvtColor(temp, rgb, cv.COLOR_RGBA2RGB);
                            let smoothed = rgb;
                            if (smoothPasses > 0 && smoothStyle === 'painterly') {
                                // Kuwahara filter: per pixel, evaluate the 4 overlapping (r+1)x(r+1)
                                // quadrant windows and output the per-channel mean of the quadrant with
                                // the lowest luminance variance. Produces flat painterly "dabs" with
                                // crisp edges — unlike a blur, it never mixes a small vivid flower into
                                // its surroundings, so minority colours reach clustering unpolluted.
                                const r = 1 + smoothPasses;
                                const sd = smoothed.data;
                                const W1 = W + 1;
                                // Integral images: luminance, luminance², and each RGB channel.
                                const iL  = new Float64Array(W1 * (H + 1));
                                const iL2 = new Float64Array(W1 * (H + 1));
                                const iR  = new Float64Array(W1 * (H + 1));
                                const iG  = new Float64Array(W1 * (H + 1));
                                const iB  = new Float64Array(W1 * (H + 1));
                                for (let y = 0; y < H; y++) {
                                    let rowL = 0, rowL2 = 0, rowR = 0, rowG = 0, rowB = 0;
                                    for (let x = 0; x < W; x++) {
                                        const i3 = (y * W + x) * 3;
                                        const rr = sd[i3], gg = sd[i3+1], bb = sd[i3+2];
                                        const lum = 0.299*rr + 0.587*gg + 0.114*bb;
                                        rowL += lum; rowL2 += lum*lum; rowR += rr; rowG += gg; rowB += bb;
                                        const o = (y + 1) * W1 + (x + 1), u = y * W1 + (x + 1);
                                        iL[o]  = iL[u]  + rowL;
                                        iL2[o] = iL2[u] + rowL2;
                                        iR[o]  = iR[u]  + rowR;
                                        iG[o]  = iG[u]  + rowG;
                                        iB[o]  = iB[u]  + rowB;
                                    }
                                }
                                const boxSum = (img, x0, y0, x1, y1) => // inclusive pixel coords
                                    img[(y1+1)*W1 + (x1+1)] - img[y0*W1 + (x1+1)] - img[(y1+1)*W1 + x0] + img[y0*W1 + x0];
                                const outK = new cv.Mat(H, W, cv.CV_8UC3);
                                const od = outK.data;
                                for (let y = 0; y < H; y++) {
                                    for (let x = 0; x < W; x++) {
                                        // 4 quadrants, each spanning [±r] and including the centre pixel.
                                        let bestVar = Infinity, bR = 0, bG = 0, bB = 0;
                                        for (let q = 0; q < 4; q++) {
                                            const x0 = (q & 1) ? x : Math.max(0, x - r);
                                            const x1 = (q & 1) ? Math.min(W - 1, x + r) : x;
                                            const y0 = (q & 2) ? y : Math.max(0, y - r);
                                            const y1 = (q & 2) ? Math.min(H - 1, y + r) : y;
                                            const cntQ = (x1 - x0 + 1) * (y1 - y0 + 1);
                                            const sL = boxSum(iL, x0, y0, x1, y1);
                                            const v = boxSum(iL2, x0, y0, x1, y1) / cntQ - (sL / cntQ) * (sL / cntQ);
                                            if (v < bestVar) {
                                                bestVar = v;
                                                bR = boxSum(iR, x0, y0, x1, y1) / cntQ;
                                                bG = boxSum(iG, x0, y0, x1, y1) / cntQ;
                                                bB = boxSum(iB, x0, y0, x1, y1) / cntQ;
                                            }
                                        }
                                        const i3 = (y * W + x) * 3;
                                        od[i3] = Math.round(bR); od[i3+1] = Math.round(bG); od[i3+2] = Math.round(bB);
                                    }
                                }
                                smoothed.delete();
                                smoothed = outK;
                            } else {
                                // Bilateral: soft edge-preserving blur so photos collapse into blobs.
                                for (let p = 0; p < smoothPasses; p++) {
                                    const next = new cv.Mat();
                                    cv.bilateralFilter(smoothed, next, 9, 60, 60);
                                    smoothed.delete();
                                    smoothed = next;
                                }
                            }

                            // Cluster in a perceptual space (LAB) by default so grouping matches the eye.
                            let clusterMat = smoothed;
                            if (useLab) {
                                clusterMat = new cv.Mat();
                                cv.cvtColor(smoothed, clusterMat, cv.COLOR_RGB2Lab);
                            }
                            const srcD = clusterMat.data; // 3-channel (L,a,b or R,G,B)
                            const n = W * H;

                            // ---- Build the colour histogram (5 bits/channel) ----
                            const binOf = new Int32Array(n);          // pixel -> compact bin index
                            const binMap = new Map();                 // packed key -> compact index
                            const bSum0 = [], bSum1 = [], bSum2 = [], bCount = [];
                            for (let i = 0; i < n; i++) {
                                const c0 = srcD[i*3], c1 = srcD[i*3+1], c2 = srcD[i*3+2];
                                const key = ((c0>>3)<<10) | ((c1>>3)<<5) | (c2>>3);
                                let bi = binMap.get(key);
                                if (bi === undefined) { bi = bCount.length; binMap.set(key, bi); bSum0.push(0); bSum1.push(0); bSum2.push(0); bCount.push(0); }
                                bSum0[bi]+=c0; bSum1[bi]+=c1; bSum2[bi]+=c2; bCount[bi]++;
                                binOf[i] = bi;
                            }
                            const B = bCount.length;
                            // Per-bin: true mean colour (for faithful palette), chroma-scaled clustering
                            // coords (for the distance metric), and fairness weight = count^fairness.
                            const bx = new Float32Array(B*3);    // clustering coords
                            const bTrue = new Float32Array(B*3); // true (unscaled) mean colour
                            const bw = new Float64Array(B);
                            for (let bi = 0; bi < B; bi++) {
                                const cnt = bCount[bi];
                                const m0 = bSum0[bi]/cnt, m1 = bSum1[bi]/cnt, m2 = bSum2[bi]/cnt;
                                bTrue[bi*3]=m0; bTrue[bi*3+1]=m1; bTrue[bi*3+2]=m2;
                                bx[bi*3]   = m0;
                                bx[bi*3+1] = useLab ? (m1-128)*chromaScale + 128 : m1;
                                bx[bi*3+2] = useLab ? (m2-128)*chromaScale + 128 : m2;
                                bw[bi] = Math.pow(cnt, fairness);
                            }

                            // ---- Partition bins into palette labels (binLabel[bi] in [0..usedK-1]) ----
                            const binLabel = new Int32Array(B);
                            let usedK;
                            if (method === 'mediancut') {
                                // Median cut: repeatedly split the box with the largest weighted extent
                                // at the weighted median of its longest axis. Partitions by colour-space
                                // volume, so distinct colours get their own slot regardless of area.
                                let boxes = [ Array.from({length:B}, (_, i) => i) ];
                                while (boxes.length < K) {
                                    let bestBox = -1, bestRange = -1, bestAxis = 0;
                                    for (let q = 0; q < boxes.length; q++) {
                                        const box = boxes[q];
                                        if (box.length < 2) continue;
                                        for (let ax = 0; ax < 3; ax++) {
                                            let mn = Infinity, mx = -Infinity;
                                            for (let t = 0; t < box.length; t++) { const v = bx[box[t]*3+ax]; if (v<mn) mn=v; if (v>mx) mx=v; }
                                            const range = mx - mn;
                                            if (range > bestRange) { bestRange = range; bestBox = q; bestAxis = ax; }
                                        }
                                    }
                                    if (bestBox < 0) break; // nothing left to split
                                    const box = boxes[bestBox], ax = bestAxis;
                                    box.sort((a, b) => bx[a*3+ax] - bx[b*3+ax]);
                                    // Split at the axis MIDPOINT (not the population median): this halves
                                    // the colour range each time, so a sparse but far-out cluster (a vivid
                                    // flower colour) gets carved into its own box instead of staying stuck
                                    // to the dense mass a median cut would keep subdividing.
                                    const mid = (bx[box[0]*3+ax] + bx[box[box.length-1]*3+ax]) / 2;
                                    let splitIdx = 0;
                                    for (let t = 0; t < box.length; t++) { if (bx[box[t]*3+ax] <= mid) splitIdx = t; else break; }
                                    if (splitIdx >= box.length-1) splitIdx = box.length-2; // keep both sides non-empty
                                    if (splitIdx < 0) splitIdx = 0;
                                    boxes.splice(bestBox, 1, box.slice(0, splitIdx+1), box.slice(splitIdx+1));
                                }
                                for (let q = 0; q < boxes.length; q++) for (let t = 0; t < boxes[q].length; t++) binLabel[boxes[q][t]] = q;
                                usedK = boxes.length;
                            } else {
                                // Fairness-weighted k-means over the histogram bins.
                                const rand = mulberry32((parseInt(func.params.seed) >>> 0) || 1); // seeded → reproducible
                                const cxs = new Float32Array(K*3);
                                let totalW = 0; for (let bi = 0; bi < B; bi++) totalW += bw[bi];
                                let rseed = rand()*totalW, seed0 = 0;
                                for (let bi = 0; bi < B; bi++) { rseed -= bw[bi]; if (rseed <= 0) { seed0 = bi; break; } }
                                cxs[0]=bx[seed0*3]; cxs[1]=bx[seed0*3+1]; cxs[2]=bx[seed0*3+2];
                                const nearest = new Float64Array(B).fill(Infinity);
                                for (let ci = 1; ci < K; ci++) {
                                    let sumW = 0;
                                    for (let bi = 0; bi < B; bi++) {
                                        const dr=bx[bi*3]-cxs[(ci-1)*3], dg=bx[bi*3+1]-cxs[(ci-1)*3+1], db=bx[bi*3+2]-cxs[(ci-1)*3+2];
                                        const d = dr*dr+dg*dg+db*db;
                                        if (d < nearest[bi]) nearest[bi] = d;
                                        sumW += bw[bi]*nearest[bi];
                                    }
                                    if (sumW <= 0) { cxs[ci*3]=cxs[0]; cxs[ci*3+1]=cxs[1]; cxs[ci*3+2]=cxs[2]; continue; }
                                    let rr = rand()*sumW, pick = seed0;
                                    for (let bi = 0; bi < B; bi++) { rr -= bw[bi]*nearest[bi]; if (rr <= 0) { pick = bi; break; } }
                                    cxs[ci*3]=bx[pick*3]; cxs[ci*3+1]=bx[pick*3+1]; cxs[ci*3+2]=bx[pick*3+2];
                                }
                                const acc0=new Float64Array(K), acc1=new Float64Array(K), acc2=new Float64Array(K), accW=new Float64Array(K);
                                const worstServedBin = () => {
                                    // Bin whose weighted distance to its assigned centroid is largest.
                                    let worst = -1, worstD = -1;
                                    for (let bi = 0; bi < B; bi++) {
                                        const cc = binLabel[bi];
                                        const dr=bx[bi*3]-cxs[cc*3], dg=bx[bi*3+1]-cxs[cc*3+1], db=bx[bi*3+2]-cxs[cc*3+2];
                                        const d = bw[bi]*(dr*dr+dg*dg+db*db);
                                        if (d > worstD) { worstD = d; worst = bi; }
                                    }
                                    return worst;
                                };
                                const runLloyd = (maxIter) => {
                                    for (let iter = 0; iter < maxIter; iter++) {
                                        let changed = false;
                                        for (let bi = 0; bi < B; bi++) {
                                            let md = Infinity, best = 0;
                                            for (let c = 0; c < K; c++) {
                                                const dr=bx[bi*3]-cxs[c*3], dg=bx[bi*3+1]-cxs[c*3+1], db=bx[bi*3+2]-cxs[c*3+2];
                                                const d = dr*dr+dg*dg+db*db;
                                                if (d < md) { md = d; best = c; }
                                            }
                                            if (binLabel[bi] !== best) { binLabel[bi] = best; changed = true; }
                                        }
                                        if (!changed && iter > 0) break;
                                        acc0.fill(0); acc1.fill(0); acc2.fill(0); accW.fill(0);
                                        for (let bi = 0; bi < B; bi++) {
                                            const c = binLabel[bi], w = bw[bi];
                                            acc0[c]+=bx[bi*3]*w; acc1[c]+=bx[bi*3+1]*w; acc2[c]+=bx[bi*3+2]*w; accW[c]+=w;
                                        }
                                        for (let c = 0; c < K; c++) {
                                            if (accW[c] > 0) { cxs[c*3]=acc0[c]/accW[c]; cxs[c*3+1]=acc1[c]/accW[c]; cxs[c*3+2]=acc2[c]/accW[c]; }
                                            else {
                                                // Reinit an empty cluster to the worst-served bin so all K
                                                // slots stay in use — a spare slot goes to a rare colour.
                                                const worst = worstServedBin();
                                                if (worst >= 0) { cxs[c*3]=bx[worst*3]; cxs[c*3+1]=bx[worst*3+1]; cxs[c*3+2]=bx[worst*3+2]; }
                                            }
                                        }
                                    }
                                };
                                runLloyd(20);
                                // Dedup: near-identical centroids (e.g. three barely-different browns)
                                // waste palette slots. Merge each too-close pair's lower-weight member
                                // and reinit it to the worst-served bin, then let Lloyd resettle. This
                                // is how a 20-colour kit affords slots for pinks/greens/highlights.
                                const MIN_SEP2 = 12 * 12; // in scaled cluster space
                                let dedupHit = false;
                                const freed = new Uint8Array(K);
                                for (let a = 0; a < K; a++) {
                                    if (freed[a]) continue;
                                    for (let b2 = a + 1; b2 < K; b2++) {
                                        if (freed[b2]) continue;
                                        const dr=cxs[a*3]-cxs[b2*3], dg=cxs[a*3+1]-cxs[b2*3+1], db=cxs[a*3+2]-cxs[b2*3+2];
                                        if (dr*dr+dg*dg+db*db < MIN_SEP2) {
                                            const loser = (accW[a] < accW[b2]) ? a : b2;
                                            freed[loser] = 1;
                                            const worst = worstServedBin();
                                            if (worst >= 0) { cxs[loser*3]=bx[worst*3]; cxs[loser*3+1]=bx[worst*3+1]; cxs[loser*3+2]=bx[worst*3+2]; dedupHit = true; }
                                            if (loser === a) break; // 'a' was freed; move to next 'a'
                                        }
                                    }
                                }
                                if (dedupHit) runLloyd(5);
                                usedK = K;
                            }
                            if (useLab) clusterMat.delete();
                            smoothed.delete();

                            // ---- Palette = weighted mean of the TRUE bin colours per label ----
                            const pS0=new Float64Array(usedK), pS1=new Float64Array(usedK), pS2=new Float64Array(usedK), pW=new Float64Array(usedK);
                            for (let bi = 0; bi < B; bi++) {
                                const c = binLabel[bi], w = bw[bi];
                                pS0[c]+=bTrue[bi*3]*w; pS1[c]+=bTrue[bi*3+1]*w; pS2[c]+=bTrue[bi*3+2]*w; pW[c]+=w;
                            }
                            // Compact away any empty labels and remap.
                            const labelToPal = new Int32Array(usedK).fill(-1);
                            const palCoords = []; // [ch0,ch1,ch2] in cluster-channel (true) space
                            for (let c = 0; c < usedK; c++) {
                                if (pW[c] > 0) { labelToPal[c] = palCoords.length; palCoords.push([pS0[c]/pW[c], pS1[c]/pW[c], pS2[c]/pW[c]]); }
                            }
                            const P = palCoords.length;

                            // Convert the palette from clustering space to displayable RGB (tiny 1xP strip).
                            const palMat = new cv.Mat(1, P, cv.CV_8UC3);
                            const pmd = palMat.data;
                            for (let c = 0; c < P; c++) {
                                pmd[c*3]   = Math.max(0, Math.min(255, Math.round(palCoords[c][0])));
                                pmd[c*3+1] = Math.max(0, Math.min(255, Math.round(palCoords[c][1])));
                                pmd[c*3+2] = Math.max(0, Math.min(255, Math.round(palCoords[c][2])));
                            }

                            // ---- Palette punch (kit-look): cluster means regress toward grey, but
                            // commercial kits use vivid representative colours. Punch in Lab space.
                            if (!useLab) cv.cvtColor(palMat, palMat, cv.COLOR_RGB2Lab);
                            const pd = palMat.data;
                            // Vibrance: push a*/b* away from neutral; skip near-greys so they don't tint.
                            if (vibrance > 0) {
                                for (let c = 0; c < P; c++) {
                                    const ca = pd[c*3+1] - 128, cb = pd[c*3+2] - 128;
                                    if (ca*ca + cb*cb >= 16) { // chroma >= 4
                                        pd[c*3+1] = Math.max(0, Math.min(255, Math.round(128 + ca * (1 + vibrance))));
                                        pd[c*3+2] = Math.max(0, Math.min(255, Math.round(128 + cb * (1 + vibrance))));
                                    }
                                }
                            }
                            // Value anchoring (LAB clustering only): stretch palette L so the darkest
                            // entry hits the image's 2nd-percentile L and the lightest its 98th —
                            // restores the near-black darks and bright highlights that averaging crushes.
                            if (useLab && P > 1) {
                                const order = Array.from({ length: B }, (_, i) => i).sort((x, y) => bTrue[x*3] - bTrue[y*3]);
                                let accPix = 0, p2 = 0, p98 = 255, seenLo = false;
                                const lo = n * 0.02, hi = n * 0.98;
                                for (const bi of order) {
                                    accPix += bCount[bi];
                                    if (!seenLo && accPix >= lo) { p2 = bTrue[bi*3]; seenLo = true; }
                                    if (accPix >= hi) { p98 = bTrue[bi*3]; break; }
                                }
                                let Lmin = 255, Lmax = 0;
                                for (let c = 0; c < P; c++) { const L = pd[c*3]; if (L < Lmin) Lmin = L; if (L > Lmax) Lmax = L; }
                                // Expansion-only: a vivid outlier cluster (e.g. a bright green dab) can
                                // sit ABOVE the image's p98, and mapping straight onto [p2,p98] would
                                // then COMPRESS the range and darken everything. Only ever widen.
                                const t2 = Math.min(p2, Lmin), t98 = Math.max(p98, Lmax);
                                if (Lmax - Lmin > 8 && t98 - t2 > Lmax - Lmin) {
                                    for (let c = 0; c < P; c++) {
                                        pd[c*3] = Math.max(0, Math.min(255, Math.round(t2 + (pd[c*3] - Lmin) * (t98 - t2) / (Lmax - Lmin))));
                                    }
                                }
                            }
                            cv.cvtColor(palMat, palMat, cv.COLOR_Lab2RGB);
                            const palRGB = new Uint8Array(palMat.data); // copy out of WASM before delete
                            palMat.delete();

                            pixelArtPaletteRef.current = Array.from(
                                { length: P },
                                (_, i) => `rgb(${palRGB[i*3]},${palRGB[i*3+1]},${palRGB[i*3+2]})`
                            );

                            // Paint each pixel its palette color (pixel -> bin -> label -> palette).
                            const outP = new cv.Mat(H, W, cv.CV_8UC4);
                            const odP = outP.data;
                            for (let i = 0; i < n; i++) {
                                const c = labelToPal[binLabel[binOf[i]]];
                                odP[i*4] = palRGB[c*3]; odP[i*4+1] = palRGB[c*3+1]; odP[i*4+2] = palRGB[c*3+2]; odP[i*4+3] = 255;
                            }
                            dst.delete();
                            dst = outP;
                            break;
                        }

                        case 'pbnMergeRegions': {
                            // Merge facets below the area threshold into the neighbor they share the
                            // longest border with (largest→smallest). This is the key step that turns
                            // speckly quantization into few, large, paintable regions.
                            const W = temp.cols, H = temp.rows;
                            const n = W * H;
                            let minArea = parseInt(func.params.minRegionArea);
                            if (isNaN(minArea)) minArea = 200;
                            minArea = Math.max(1, minArea);
                            let passes = parseInt(func.params.passes);
                            if (isNaN(passes)) passes = 2;
                            passes = Math.max(1, Math.min(4, passes));
                            const protectVivid = parseInt(func.params.protectVivid) !== 0; // default On

                            const td = temp.data; // RGBA
                            // Map each pixel to a palette index (unique color -> index).
                            const colorKey = new Int32Array(n);
                            const keyToIdx = new Map();
                            const palList = []; // [r,g,b] per index
                            for (let i = 0; i < n; i++) {
                                const r = td[i*4], g = td[i*4+1], b = td[i*4+2];
                                const key = (r << 16) | (g << 8) | b;
                                let idx = keyToIdx.get(key);
                                if (idx === undefined) { idx = palList.length; keyToIdx.set(key, idx); palList.push([r,g,b]); }
                                colorKey[i] = idx;
                            }
                            if (palList.length > 256) throw new Error('Too many colors — add "Posterize (K-Means)" before this step');

                            const mask = new cv.Mat(H, W, cv.CV_8U);
                            const labelsMat = new cv.Mat();
                            for (let pass = 0; pass < passes; pass++) {
                                // Build a global facet id per pixel via connectedComponents per color.
                                const facetOf = new Int32Array(n).fill(-1);
                                const facetColor = [];
                                const facetArea = [];
                                const P = palList.length;
                                for (let p = 0; p < P; p++) {
                                    const mdata = mask.data;
                                    for (let i = 0; i < n; i++) mdata[i] = (colorKey[i] === p) ? 255 : 0;
                                    const numLabels = cv.connectedComponents(mask, labelsMat);
                                    if (numLabels <= 1) continue;
                                    const lm = labelsMat.data32S;
                                    const base = facetColor.length;
                                    for (let l = 1; l < numLabels; l++) { facetColor.push(p); facetArea.push(0); }
                                    for (let i = 0; i < n; i++) {
                                        const l = lm[i];
                                        if (l === 0) continue;
                                        const fid = base + (l - 1);
                                        facetOf[i] = fid;
                                        facetArea[fid]++;
                                    }
                                }
                                const F = facetColor.length;
                                if (F === 0) break;

                                // Tally shared-border length between each small facet and its neighbors.
                                const neighborTally = new Map(); // smallFacet -> Map(neighbor -> borderCount)
                                const addBorder = (a, b) => {
                                    if (a === b || a < 0 || b < 0) return;
                                    if (facetArea[a] < minArea) {
                                        let m = neighborTally.get(a); if (!m) { m = new Map(); neighborTally.set(a, m); }
                                        m.set(b, (m.get(b) || 0) + 1);
                                    }
                                    if (facetArea[b] < minArea) {
                                        let m = neighborTally.get(b); if (!m) { m = new Map(); neighborTally.set(b, m); }
                                        m.set(a, (m.get(a) || 0) + 1);
                                    }
                                };
                                for (let y = 0; y < H; y++) {
                                    for (let x = 0; x < W; x++) {
                                        const i = y * W + x;
                                        const f = facetOf[i];
                                        if (x + 1 < W) addBorder(f, facetOf[i + 1]);
                                        if (y + 1 < H) addBorder(f, facetOf[i + W]);
                                    }
                                }

                                // Merge large→small so small facets prefer merging into bigger survivors.
                                const smallFacets = [];
                                for (let f = 0; f < F; f++) if (facetArea[f] < minArea && neighborTally.has(f)) smallFacets.push(f);
                                smallFacets.sort((a, b) => facetArea[b] - facetArea[a]);

                                const newColorOfFacet = new Int32Array(F);
                                for (let f = 0; f < F; f++) newColorOfFacet[f] = facetColor[f];
                                let changed = false;
                                for (const f of smallFacets) {
                                    const m = neighborTally.get(f);
                                    const fc = palList[facetColor[f]];
                                    // Candidates: neighbours with a substantial shared border (≥30% of
                                    // the longest). Among them prefer the CLOSEST COLOUR — a pink dab
                                    // merges into another rose region rather than the wood it touches
                                    // most (pure longest-border was eating the flowers).
                                    let maxCount = 0;
                                    for (const cnt of m.values()) if (cnt > maxCount) maxCount = cnt;
                                    let bestN = -1, bestColorDist = Infinity;
                                    for (const [nb, count] of m) {
                                        if (count < 0.3 * maxCount) continue;
                                        const nc = palList[facetColor[nb]];
                                        const cd = (fc[0]-nc[0])*(fc[0]-nc[0]) + (fc[1]-nc[1])*(fc[1]-nc[1]) + (fc[2]-nc[2])*(fc[2]-nc[2]);
                                        if (cd < bestColorDist) { bestColorDist = cd; bestN = nb; }
                                    }
                                    if (bestN < 0) continue;
                                    // Vivid-dab protection: a saturated facet with no similar-coloured
                                    // neighbour is a deliberate accent (flower on wood) — keep it unless
                                    // truly tiny. Commercial kits keep these dabs; they're the charm.
                                    if (protectVivid) {
                                        const spread = Math.max(fc[0], fc[1], fc[2]) - Math.min(fc[0], fc[1], fc[2]);
                                        if (spread > 60 && bestColorDist > 8100 && facetArea[f] >= minArea / 4) continue;
                                    }
                                    if (facetColor[bestN] !== facetColor[f]) {
                                        newColorOfFacet[f] = facetColor[bestN];
                                        changed = true;
                                    }
                                }
                                if (!changed) break;
                                for (let i = 0; i < n; i++) {
                                    const f = facetOf[i];
                                    if (f >= 0) colorKey[i] = newColorOfFacet[f];
                                }
                            }
                            mask.delete(); labelsMat.delete();

                            // Narrow single-pixel cleanup: reassign stray dots / 1px strips (a pixel whose
                            // 4-neighbors are all a different color) to the surrounding color.
                            const cleanKey = new Int32Array(colorKey);
                            for (let y = 0; y < H; y++) {
                                for (let x = 0; x < W; x++) {
                                    const i = y * W + x;
                                    const me = colorKey[i];
                                    const up = y > 0 ? colorKey[i-W] : -1;
                                    const dn = y < H-1 ? colorKey[i+W] : -1;
                                    const lf = x > 0 ? colorKey[i-1] : -1;
                                    const rt = x < W-1 ? colorKey[i+1] : -1;
                                    if (up !== me && dn !== me && lf !== me && rt !== me) {
                                        if (lf >= 0 && lf === rt) cleanKey[i] = lf;
                                        else if (up >= 0 && up === dn) cleanKey[i] = up;
                                        else if (lf >= 0) cleanKey[i] = lf;
                                        else if (up >= 0) cleanKey[i] = up;
                                    }
                                }
                            }

                            // Rebuild output + palette of surviving colors.
                            const usedOrder = [];
                            const usedSet = new Set();
                            const outM = new cv.Mat(H, W, cv.CV_8UC4);
                            const odM = outM.data;
                            for (let i = 0; i < n; i++) {
                                const idx = cleanKey[i];
                                const col = palList[idx];
                                odM[i*4]=col[0]; odM[i*4+1]=col[1]; odM[i*4+2]=col[2]; odM[i*4+3]=255;
                                if (!usedSet.has(idx)) { usedSet.add(idx); usedOrder.push(idx); }
                            }
                            pixelArtPaletteRef.current = usedOrder.map(idx => {
                                const c = palList[idx]; return `rgb(${c[0]},${c[1]},${c[2]})`;
                            });
                            dst.delete();
                            dst = outM;
                            break;
                        }

                        case 'pbnOutline': {
                            // Draw shared region borders + place each palette color's number at the pole
                            // of inaccessibility (largest-inscribed-circle center) of every facet.
                            const W = temp.cols, H = temp.rows;
                            const n = W * H;
                            const displayMode = parseInt(func.params.displayMode) === 1 ? 1 : 0;
                            const lineThickness = Math.max(1, Math.min(5, parseInt(func.params.lineThickness) || 1));
                            // Border/number shade: 0 = black, higher = softer grey. A light grey still
                            // reads on paper but doesn't fight the paint once the regions are filled in.
                            let lineShade = parseInt(func.params.lineShade);
                            if (isNaN(lineShade)) lineShade = 120;
                            lineShade = Math.max(0, Math.min(255, lineShade));
                            const maxFontSize = Math.max(8, parseInt(func.params.fontSize) || 16);
                            let minLabelArea = parseInt(func.params.minLabelArea);
                            if (isNaN(minLabelArea)) minLabelArea = 200;
                            minLabelArea = Math.max(1, minLabelArea);
                            const MIN_FONT_SIZE = 8; // below this a number isn't legible — skip labeling

                            const td = temp.data; // RGBA
                            // Unique colors in scan order → palette; each color's number is index + 1.
                            const colorIdx = new Int32Array(n);
                            const keyToIdx = new Map();
                            const palList = [];
                            for (let i = 0; i < n; i++) {
                                const r = td[i*4], g = td[i*4+1], b = td[i*4+2];
                                const key = (r << 16) | (g << 8) | b;
                                let idx = keyToIdx.get(key);
                                if (idx === undefined) { idx = palList.length; keyToIdx.set(key, idx); palList.push([r,g,b]); }
                                colorIdx[i] = idx;
                            }
                            const P = palList.length;
                            if (P > 256) throw new Error('Too many colors — add "Posterize (K-Means)" before this step');
                            pixelArtPaletteRef.current = palList.map(c => `rgb(${c[0]},${c[1]},${c[2]})`);

                            const canvas = document.createElement('canvas');
                            canvas.width = W; canvas.height = H;
                            const ctx = canvas.getContext('2d');
                            const img = ctx.createImageData(W, H);
                            const fd = img.data;
                            if (displayMode === 1) {
                                fd.fill(255); // blank white template
                            } else {
                                for (let i = 0; i < n; i++) {
                                    const c = palList[colorIdx[i]];
                                    fd[i*4]=c[0]; fd[i*4+1]=c[1]; fd[i*4+2]=c[2]; fd[i*4+3]=255;
                                }
                            }

                            // Shared borders: a pixel is a border if a 4-neighbor has a different color
                            // index. Built from the unified index map so adjacent regions share ONE line
                            // (no doubled/misaligned outlines like the old per-color approach).
                            const border = new cv.Mat(H, W, cv.CV_8U);
                            const bd = border.data;
                            for (let y = 0; y < H; y++) {
                                for (let x = 0; x < W; x++) {
                                    const i = y*W + x;
                                    const c = colorIdx[i];
                                    let edge = false;
                                    if (x+1 < W && colorIdx[i+1] !== c) edge = true;
                                    else if (y+1 < H && colorIdx[i+W] !== c) edge = true;
                                    else if (x > 0 && colorIdx[i-1] !== c) edge = true;
                                    else if (y > 0 && colorIdx[i-W] !== c) edge = true;
                                    bd[i] = edge ? 255 : 0;
                                }
                            }
                            if (lineThickness > 1) {
                                const k = cv.Mat.ones(lineThickness, lineThickness, cv.CV_8U);
                                cv.dilate(border, border, k);
                                k.delete();
                            }
                            const bd2 = border.data;
                            for (let i = 0; i < n; i++) {
                                if (bd2[i]) { fd[i*4]=lineShade; fd[i*4+1]=lineShade; fd[i*4+2]=lineShade; fd[i*4+3]=255; }
                            }
                            border.delete();
                            ctx.putImageData(img, 0, 0);

                            // Per palette color: connectedComponents + distanceTransform → the pixel of
                            // maximum distance-to-edge is the center of the largest inscribed circle,
                            // always strictly inside the region and bounding a legible font size.
                            const numberJobs = [];
                            const mask = new cv.Mat(H, W, cv.CV_8U);
                            const markers = new cv.Mat();
                            const dist = new cv.Mat();
                            for (let p = 0; p < P; p++) {
                                const md = mask.data;
                                for (let i = 0; i < n; i++) md[i] = (colorIdx[i] === p) ? 255 : 0;
                                const numLabels = cv.connectedComponents(mask, markers);
                                if (numLabels <= 1) continue;
                                cv.distanceTransform(mask, dist, cv.DIST_L2, 5);
                                const mArr = markers.data32S;
                                const dArr = dist.data32F;
                                const compCount = new Int32Array(numLabels);
                                const compMaxDist = new Float32Array(numLabels);
                                const compMaxX = new Int32Array(numLabels);
                                const compMaxY = new Int32Array(numLabels);
                                for (let y = 0; y < H; y++) {
                                    for (let x = 0; x < W; x++) {
                                        const idx = y*W + x;
                                        const comp = mArr[idx];
                                        if (comp === 0) continue;
                                        compCount[comp]++;
                                        const d = dArr[idx];
                                        if (d > compMaxDist[comp]) { compMaxDist[comp] = d; compMaxX[comp] = x; compMaxY[comp] = y; }
                                    }
                                }
                                for (let comp = 1; comp < numLabels; comp++) {
                                    if (compCount[comp] < minLabelArea) continue;
                                    const fitFontSize = Math.min(maxFontSize, Math.floor(compMaxDist[comp] * 1.5));
                                    if (fitFontSize < MIN_FONT_SIZE) continue;
                                    numberJobs.push({ x: compMaxX[comp], y: compMaxY[comp], text: String(p + 1), fontSize: fitFontSize });
                                }
                            }
                            mask.delete(); markers.delete(); dist.delete();

                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            for (const job of numberJobs) {
                                ctx.font = `bold ${job.fontSize}px sans-serif`;
                                ctx.lineWidth = Math.max(2, Math.round(job.fontSize / 5));
                                ctx.strokeStyle = '#ffffff'; // white halo keeps the soft-grey number legible on coloured fills
                                ctx.fillStyle = `rgb(${lineShade},${lineShade},${lineShade})`;
                                ctx.strokeText(job.text, job.x, job.y);
                                ctx.fillText(job.text, job.x, job.y);
                            }

                            const resultImg = ctx.getImageData(0, 0, W, H);
                            const outO = cv.matFromArray(H, W, cv.CV_8UC4, resultImg.data);
                            dst.delete();
                            dst = outO;
                            break;
                        }

                        // ---- Color Channel cases ----
                        case 'channelSplitR': {
                            dst = temp.clone();
                            const d = dst.data;
                            for (let i = 0; i < d.length; i += 4) { d[i+1] = 0; d[i+2] = 0; }
                            break;
                        }
                        case 'channelSplitG': {
                            dst = temp.clone();
                            const d = dst.data;
                            for (let i = 0; i < d.length; i += 4) { d[i] = 0; d[i+2] = 0; }
                            break;
                        }
                        case 'channelSplitB': {
                            dst = temp.clone();
                            const d = dst.data;
                            for (let i = 0; i < d.length; i += 4) { d[i] = 0; d[i+1] = 0; }
                            break;
                        }
                        case 'channelMixer': {
                            dst = temp.clone();
                            const d = dst.data;
                            const rW = func.params.rWeight, gW = func.params.gWeight, bW = func.params.bWeight;
                            for (let i = 0; i < d.length; i += 4) {
                                d[i]   = Math.min(255, Math.max(0, d[i]   * rW));
                                d[i+1] = Math.min(255, Math.max(0, d[i+1] * gW));
                                d[i+2] = Math.min(255, Math.max(0, d[i+2] * bW));
                            }
                            break;
                        }
                        case 'hsvRangeFilter': {
                            const rgb = new cv.Mat();
                            cv.cvtColor(temp, rgb, cv.COLOR_RGBA2RGB);
                            const hsv = new cv.Mat();
                            cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);
                            dst = temp.clone();
                            const dstData = dst.data;
                            const hsvData = hsv.data;
                            const hMin = func.params.hMin, hMax = func.params.hMax;
                            const sMin = func.params.sMin, sMax = func.params.sMax;
                            const vMin = func.params.vMin, vMax = func.params.vMax;
                            for (let i = 0; i < hsvData.length; i += 3) {
                                const h = hsvData[i], s = hsvData[i+1], v = hsvData[i+2];
                                if (!(h >= hMin && h <= hMax && s >= sMin && s <= sMax && v >= vMin && v <= vMax)) {
                                    const px = (i / 3) * 4;
                                    dstData[px] = 0; dstData[px+1] = 0; dstData[px+2] = 0;
                                }
                            }
                            rgb.delete(); hsv.delete();
                            break;
                        }
                        case 'labChannelIsolate': {
                            const rgb = new cv.Mat();
                            cv.cvtColor(temp, rgb, cv.COLOR_RGBA2RGB);
                            const lab = new cv.Mat();
                            cv.cvtColor(rgb, lab, cv.COLOR_RGB2Lab);
                            dst = temp.clone();
                            const dstData = dst.data;
                            const labData = lab.data;
                            const ch = parseInt(func.params.channel) || 0;
                            for (let i = 0; i < labData.length; i += 3) {
                                const val = labData[i + ch];
                                const px = (i / 3) * 4;
                                dstData[px] = val; dstData[px+1] = val; dstData[px+2] = val;
                            }
                            rgb.delete(); lab.delete();
                            break;
                        }

                        // ---- Contour Detection cases ----
                        case 'findContours': {
                            const gray = new cv.Mat();
                            cv.cvtColor(temp, gray, cv.COLOR_RGBA2GRAY);
                            const binary = new cv.Mat();
                            cv.threshold(gray, binary, func.params.threshold, 255, cv.THRESH_BINARY);
                            const contours = new cv.MatVector();
                            const hierarchy = new cv.Mat();
                            cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                            dst = temp.clone();
                            const color = new cv.Scalar(func.params.colorR, func.params.colorG, func.params.colorB, 255);
                            cv.drawContours(dst, contours, -1, color, func.params.thickness);
                            gray.delete(); binary.delete(); contours.delete(); hierarchy.delete();
                            break;
                        }
                        case 'boundingBoxes': {
                            const gray = new cv.Mat();
                            cv.cvtColor(temp, gray, cv.COLOR_RGBA2GRAY);
                            const binary = new cv.Mat();
                            cv.threshold(gray, binary, func.params.threshold, 255, cv.THRESH_BINARY);
                            const contours = new cv.MatVector();
                            const hierarchy = new cv.Mat();
                            cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                            dst = temp.clone();
                            const color = new cv.Scalar(func.params.colorR, func.params.colorG, func.params.colorB, 255);
                            for (let i = 0; i < contours.size(); i++) {
                                const rect = cv.boundingRect(contours.get(i));
                                cv.rectangle(dst, new cv.Point(rect.x, rect.y),
                                    new cv.Point(rect.x + rect.width, rect.y + rect.height), color, func.params.thickness);
                            }
                            gray.delete(); binary.delete(); contours.delete(); hierarchy.delete();
                            break;
                        }
                        case 'convexHull': {
                            const gray = new cv.Mat();
                            cv.cvtColor(temp, gray, cv.COLOR_RGBA2GRAY);
                            const binary = new cv.Mat();
                            cv.threshold(gray, binary, func.params.threshold, 255, cv.THRESH_BINARY);
                            const contours = new cv.MatVector();
                            const hierarchy = new cv.Mat();
                            cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                            dst = temp.clone();
                            const color = new cv.Scalar(func.params.colorR, func.params.colorG, func.params.colorB, 255);
                            for (let i = 0; i < contours.size(); i++) {
                                const hull = new cv.Mat();
                                cv.convexHull(contours.get(i), hull);
                                const hullVec = new cv.MatVector();
                                hullVec.push_back(hull);
                                cv.drawContours(dst, hullVec, 0, color, func.params.thickness);
                                hull.delete(); hullVec.delete();
                            }
                            gray.delete(); binary.delete(); contours.delete(); hierarchy.delete();
                            break;
                        }

                        // ---- Noise cases ----
                        case 'gaussianNoise': {
                            dst = temp.clone();
                            const d = dst.data;
                            const sigma = func.params.sigma;
                            for (let i = 0; i < d.length; i += 4) {
                                const u1 = Math.max(1e-10, Math.random()), u2 = Math.random();
                                const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
                                d[i]   = Math.min(255, Math.max(0, d[i]   + z));
                                d[i+1] = Math.min(255, Math.max(0, d[i+1] + z));
                                d[i+2] = Math.min(255, Math.max(0, d[i+2] + z));
                            }
                            break;
                        }
                        case 'saltPepperNoise': {
                            dst = temp.clone();
                            const d = dst.data;
                            const density = func.params.density;
                            const total = d.length / 4;
                            const numPx = Math.floor(total * density);
                            for (let i = 0; i < numPx; i++) {
                                const idx = Math.floor(Math.random() * total) * 4;
                                const val = Math.random() > 0.5 ? 255 : 0;
                                d[idx] = val; d[idx+1] = val; d[idx+2] = val;
                            }
                            break;
                        }
                    }
                } catch (err) {
                    console.error(`Error applying ${func.name}:`, err);
                    // OpenCV.js often throws a raw numeric pointer instead of an Error;
                    // surface something readable either way.
                    const msg = (err && err.message) ? err.message
                        : (typeof err === 'number' ? 'OpenCV error (unsupported input for this build)' : String(err));
                    errors[fnIndex] = msg;
                }

                if (temp !== dst) {
                    temp.delete();
                }
            }
            setStepErrors(errors);

            const canvas = document.createElement('canvas');
            cv.imshow(canvas, dst);
            setProcessedImage(canvas.toDataURL());

            src.delete();
            dst.delete();
        } catch (err) {
            console.error('Error processing image:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const addFunction = (funcDef) => {
        const newFunc = {
            id: funcDef.id,
            name: funcDef.name,
            enabled: true,
            params: {}
        };
        
        funcDef.params.forEach(param => {
            newFunc.params[param.name] = param.default;
        });

        // If it's Tesseract, always add it at the end
        if (funcDef.id === 'tesseract') {
            const tesseractIndex = appliedFunctions.findIndex(f => f.id === 'tesseract');
            if (tesseractIndex !== -1) {
                const updated = [...appliedFunctions];
                updated[tesseractIndex] = newFunc;
                setFunctions(updated);
                setSelectedFunction(tesseractIndex);
            } else {
                setFunctions([...appliedFunctions, newFunc]);
                setSelectedFunction(appliedFunctions.length);
            }
        } else {
            const tesseractIndex = appliedFunctions.findIndex(f => f.id === 'tesseract');
            if (tesseractIndex !== -1) {
                const updated = [...appliedFunctions];
                updated.splice(tesseractIndex, 0, newFunc);
                setFunctions(updated);
                setSelectedFunction(tesseractIndex);
            } else {
                setFunctions([...appliedFunctions, newFunc]);
                setSelectedFunction(appliedFunctions.length);
            }
        }
    };

    const removeFunction = (index) => {
        const updated = appliedFunctions.filter((_, i) => i !== index);
        setFunctions(updated);
        if (selectedFunction === index) setSelectedFunction(null);
        else if (selectedFunction > index) setSelectedFunction(selectedFunction - 1);
    };

    const toggleFunction = (index) => {
        const updated = [...appliedFunctions];
        updated[index] = { ...updated[index], enabled: !updated[index].enabled };
        setFunctions(updated);
    };

    const updateParameter = (funcIndex, paramName, value) => {
        const updated = [...appliedFunctions];
        updated[funcIndex].params[paramName] = parseFloat(value) || value;
        setAppliedFunctions(updated);
    };

    const downloadImage = () => {
        if (processedImage) {
            const link = document.createElement('a');
            link.download = 'processed-image.png';
            link.href = processedImage;
            link.click();
        }
    };

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const draggedItem = appliedFunctions[draggedIndex];
        
        // Prevent moving Tesseract or moving items after Tesseract
        if (draggedItem.id === 'tesseract') {
            alert('Tesseract OCR must remain at the bottom of the pipeline');
            setDraggedIndex(null);
            return;
        }

        const tesseractIndex = appliedFunctions.findIndex(f => f.id === 'tesseract');
        
        // Prevent dropping after Tesseract
        if (tesseractIndex !== -1 && dropIndex >= tesseractIndex) {
            alert('Cannot place functions after Tesseract OCR');
            setDraggedIndex(null);
            return;
        }

        const newFunctions = [...appliedFunctions];
        newFunctions.splice(draggedIndex, 1);
        
        // Adjust drop index if needed
        let adjustedDropIndex = dropIndex;
        if (draggedIndex < dropIndex) {
            adjustedDropIndex = dropIndex - 1;
        }
        
        newFunctions.splice(adjustedDropIndex, 0, draggedItem);

        setFunctions(newFunctions);
        
        if (selectedFunction === draggedIndex) {
            setSelectedFunction(adjustedDropIndex);
        } else if (selectedFunction > draggedIndex && selectedFunction <= dropIndex) {
            setSelectedFunction(selectedFunction - 1);
        } else if (selectedFunction < draggedIndex && selectedFunction >= dropIndex) {
            setSelectedFunction(selectedFunction + 1);
        }
        
        setDraggedIndex(null);
    };

    // Resize functionality (kept for any future use)
    const handleResizeStart = (e, panel) => {};

    const handleBottomPanelResizeStart = (e) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = bottomPanelHeight;
        const onMouseMove = (ev) => {
            const newHeight = Math.max(80, Math.min(600, startHeight + (startY - ev.clientY)));
            setBottomPanelHeight(newHeight);
            if (bottomPanelCollapsed) setBottomPanelCollapsed(false);
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const selectedFuncDef = selectedFunction !== null && appliedFunctions[selectedFunction]
        ? OPENCV_FUNCTIONS.find(f => f.id === appliedFunctions[selectedFunction].id)
        : null;

    const pythonCode = generatePythonCode(appliedFunctions);

    // CSS-variable-aware muted text colour (used in a few inline spots)
    const T = {
        muted:   'var(--text-muted)',
        secondary:'var(--text-secondary)',
        primary: 'var(--text-primary)',
        accent:  'var(--accent)',
        border:  'var(--border)',
        surface: 'var(--bg-surface)',
        input:   'var(--bg-input)',
        card:    'var(--bg-card)',
    };

    return (
        <div className="grid-container" style={{gridTemplateRows:`48px 1fr ${bottomPanelCollapsed?36:bottomPanelHeight}px`}}>
            {/* ── Header Logo ── */}
            <div className="header-logo">
                <img src={theme === 'dark' ? 'assets/logo_dark.png' : 'assets/logo.png'} alt="OpenCV Playground"
                    style={{height:32,width:'auto',objectFit:'contain',display:'block'}}/>
            </div>

            {/* ── Header Actions ── */}
            <div className="header-actions">
                {isProcessing && <div className="processing-stripe" />}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <input ref={presetImportRef} type="file" accept=".json" onChange={importPipeline} className="hidden" />

                <button onClick={() => fileInputRef.current?.click()} className="topbar-btn">
                    <Upload size={13}/> Upload
                </button>
                <div className="divider-v"/>
                <button onClick={undo} title="Undo (Ctrl+Z)" className="topbar-btn">
                    <MaterialIcon name="undo" size={14}/> Undo
                </button>
                <button onClick={redo} title="Redo (Ctrl+Y)" className="topbar-btn">
                    <MaterialIcon name="redo" size={14}/> Redo
                </button>
                <div className="divider-v"/>
                <button onClick={() => setViewMode(v => v==='Overlay'?'Side by side':'Overlay')}
                    disabled={!originalImage||!processedImage}
                    className={`topbar-btn${viewMode==='Overlay'?' topbar-btn-active':''}`}>
                    <MaterialIcon name="compare" size={14}/> Compare
                </button>

                <div style={{flex:1}}/>
                {!opencvReady && <span style={{fontSize:11,color:T.muted,marginRight:6}}>Loading OpenCV…</span>}

                {/* Theme toggle */}
                <button className="theme-toggle" onClick={() => setTheme(t => t==='light'?'dark':'light')}
                    title={theme==='light'?'Switch to dark mode':'Switch to light mode'}>
                    <MaterialIcon name={theme==='light'?'dark_mode':'light_mode'} size={16}/>
                </button>
                <div className="divider-v"/>
                <button onClick={downloadImage} disabled={!processedImage} className="btn-export">
                    <Download size={13}/> Export
                </button>
            </div>

            {/* ── Left Sidebar ── */}
            <div className="app-sidebar">
                <div className="panel-header">
                        <span className="panel-heading">Functions</span>
                    </div>

                    <div style={{flex:1,overflowY:'auto',padding:'8px'}}>
                        {/* Search */}
                        <input type="text" placeholder="Search…" value={searchQuery}
                            onChange={e=>setSearchQuery(e.target.value)}
                            className="sidebar-search" style={{marginBottom:8}}/>

                        {/* Built-in Presets */}
                        <div style={{marginBottom:6}}>
                            <button onClick={()=>setShowPresets(!showPresets)} className="category-button"
                                style={{marginBottom: showPresets?4:0}}>
                                <span style={{display:'flex',alignItems:'center',gap:6}}>
                                    <MaterialIcon name="bookmarks" size={14} style={{color:T.muted}}/>
                                    Built-in Presets
                                </span>
                                {showPresets ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                            </button>
                            {showPresets && (
                                <div style={{paddingLeft:8}}>
                                    {BUILTIN_PRESETS.map(preset=>(
                                        <div key={preset.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',marginBottom:3,borderRadius:6,background:T.surface,border:`1px solid ${T.border}`}}>
                                            <span style={{fontSize:11,color:T.secondary,flex:1,marginRight:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{preset.name}</span>
                                            <button onClick={()=>loadPreset(preset)}
                                                style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:4,background:'var(--accent-light)',border:'1px solid var(--accent)',color:T.accent,cursor:'pointer',flexShrink:0}}>
                                                Load
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* User Presets */}
                        <div style={{marginBottom:6}}>
                            <button onClick={()=>setShowUserPresets(!showUserPresets)} className="category-button"
                                style={{marginBottom: showUserPresets?4:0}}>
                                <span style={{display:'flex',alignItems:'center',gap:6}}>
                                    <MaterialIcon name="bookmark_add" size={14} style={{color:T.muted}}/>
                                    My Presets
                                    {userPresets.length>0 && (
                                        <span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:99,background:'var(--accent-light)',color:T.accent,border:'1px solid var(--accent)'}}>
                                            {userPresets.length}
                                        </span>
                                    )}
                                </span>
                                {showUserPresets ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                            </button>
                            {showUserPresets && (
                                <div style={{paddingLeft:8}}>
                                    {userPresets.length===0 ? (
                                        <p style={{fontSize:11,color:T.muted,padding:'4px 8px'}}>No saved presets yet. Build a pipeline and click "Save as Preset".</p>
                                    ) : userPresets.map(preset=>(
                                        <div key={preset.name} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 8px',marginBottom:3,borderRadius:6,background:T.surface,border:`1px solid ${T.border}`}}>
                                            <span style={{fontSize:11,color:T.secondary,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{preset.name}</span>
                                            <button onClick={()=>loadPreset(preset)}
                                                style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:4,background:'var(--accent-light)',border:'1px solid var(--accent)',color:T.accent,cursor:'pointer',flexShrink:0}}>
                                                Load
                                            </button>
                                            <button onClick={()=>deleteUserPreset(preset.name)} title="Delete preset"
                                                style={{background:'none',border:'none',cursor:'pointer',padding:'2px 3px',color:T.muted,display:'flex',alignItems:'center',flexShrink:0,borderRadius:3,transition:'color 0.12s'}}
                                                onMouseEnter={e=>e.currentTarget.style.color='#E5534B'}
                                                onMouseLeave={e=>e.currentTarget.style.color=T.muted}>
                                                <X size={12}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Categories */}
                        {Object.entries(OPENCV_CATEGORIES).map(([category, functions])=>{
                            const filtered = searchQuery
                                ? functions.filter(f=>f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                : functions;
                            if (searchQuery && filtered.length===0) return null;
                            const isOpen = expandedCategories[category] || !!searchQuery;
                            return (
                                <div key={category} style={{marginBottom:2}}>
                                    <button onClick={()=>toggleCategory(category)}
                                        className={`category-button${isOpen?' open':''}`}>
                                        <span>{category}</span>
                                        {isOpen ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
                                    </button>
                                    {isOpen && (
                                        <div style={{paddingLeft:8,paddingTop:2}}>
                                            {filtered.map(func=>(
                                                <div key={func.id} className="function-card">
                                                    <span className="fn-name">{func.name}</span>
                                                    <button onClick={()=>addFunction(func)}
                                                        title="Add to pipeline"
                                                        style={{background:'none',border:'none',cursor:'pointer',padding:2,display:'flex',color:T.accent,flexShrink:0,transition:'transform 0.1s,color 0.1s'}}
                                                        onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.2)';e.currentTarget.style.color='#01B27C';}}
                                                        onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.color=T.accent;}}>
                                                        <span className="material-symbols-outlined" style={{fontSize:19,fontVariationSettings:"'FILL' 1,'wght' 300"}}>add_circle</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pinned bottom */}
                    <div className="sidebar-bottom">
                        <button onClick={exportPipeline} className="sidebar-btn sidebar-btn-green">
                            <MaterialIcon name="file_upload" size={13}/> Export Pipeline
                        </button>
                        <button onClick={()=>presetImportRef.current?.click()} className="sidebar-btn sidebar-btn-teal">
                            <MaterialIcon name="file_download" size={13}/> Import Pipeline
                        </button>
                    </div>
            </div>

            {/* ── Center ── */}
            <div className="center-content">
                {viewMode==='Overlay' && originalImage && processedImage ? (
                    <div ref={compareRef} style={{flex:1,position:'relative',background:'#111',cursor:'ew-resize',userSelect:'none',overflow:'hidden'}}
                        onMouseDown={handleCompareMouseDown} onMouseMove={handleCompareMouse}>
                        <img src={processedImage} alt="Processed" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain'}}/>
                        <img src={originalImage.src} alt="Original" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',clipPath:`inset(0 ${100-comparePos}% 0 0)`}}/>
                        <div style={{position:'absolute',top:0,bottom:0,left:`${comparePos}%`,width:'3px',background:'white',transform:'translateX(-50%)',boxShadow:'0 0 8px rgba(0,0,0,0.5)',pointerEvents:'none'}}>
                            <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:32,height:32,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.4)',pointerEvents:'none'}}>
                                <MaterialIcon name="swap_horiz" size={17} style={{color:'#333'}}/>
                            </div>
                        </div>
                        <div style={{position:'absolute',top:8,left:8,background:'rgba(0,0,0,0.6)',padding:'3px 8px',borderRadius:4,fontSize:11,color:'#fff',pointerEvents:'none'}}>Original</div>
                        <div style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,0.6)',padding:'3px 8px',borderRadius:4,fontSize:11,color:'#fff',pointerEvents:'none'}}>Processed</div>
                    </div>
                ) : (
                    <div className="canvas-area">
                        {/* Original panel */}
                        <div className="image-panel">
                            <div className="image-panel-header">Original</div>
                            <div className="image-panel-content">
                                {originalImage ? (
                                    <img src={originalImage.src} alt="Original" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',borderRadius:4}}/>
                                ) : (
                                    <div className="upload-drop-zone" onClick={()=>fileInputRef.current?.click()}
                                        onDragOver={e=>e.preventDefault()} onDrop={handleImageDrop}>
                                        <Upload size={44} className="upload-pulse" style={{color:'var(--accent)',display:'block',margin:'0 auto 12px'}}/>
                                        <p className="dz-title">Upload an image</p>
                                        <p className="dz-sub">or drag and drop</p>
                                        <p className="dz-types">PNG · JPG · WEBP</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Processed panel */}
                        <div className="image-panel" style={isProcessing?{outline:'2px solid var(--accent)',outlineOffset:-2}:{}}>
                            <div className="image-panel-header">Processed</div>
                            <div className="image-panel-content">
                                {processedImage ? (
                                    <img src={processedImage} alt="Processed" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',borderRadius:4}}/>
                                ) : (
                                    <span style={{fontSize:12,color:T.muted}}>{originalImage?'Apply functions to see results':'No image loaded'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Right Column — Tabs ── */}
            <div className="right-column">
                <div className="right-tabs">
                    {['Pipeline','Analysis'].map(tab=>(
                        <button key={tab} className={`right-tab${activeRightTab===tab.toLowerCase()?' active':''}`}
                            onClick={()=>setActiveRightTab(tab.toLowerCase())}>{tab}</button>
                    ))}
                </div>

                {/* Pipeline tab */}
                {activeRightTab==='pipeline' && (
                    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
                        <div style={{flex:1,overflowY:'auto',padding:'8px 8px 0'}}>
                            {appliedFunctions.length===0 ? (
                                <div style={{padding:'32px 16px',textAlign:'center'}}>
                                    <MaterialIcon name="account_tree" size={32} style={{color:T.muted,display:'block',margin:'0 auto 10px',opacity:0.5}}/>
                                    <p style={{fontSize:13,color:T.secondary,marginBottom:4}}>No functions applied</p>
                                    <p style={{fontSize:11,color:T.muted}}>Add from the left sidebar</p>
                                </div>
                            ) : appliedFunctions.map((func,index)=>{
                                const isSelected = selectedFunction===index;
                                const funcDef = OPENCV_FUNCTIONS.find(f=>f.id===func.id);
                                const stepError = func.enabled ? stepErrors[index] : undefined;
                                return (
                                    <div key={index} draggable={func.id!=='tesseract'}
                                        onDragStart={e=>handleDragStart(e,index)}
                                        onDragOver={e=>handleDragOver(e,index)}
                                        onDrop={e=>handleDrop(e,index)}
                                        onDragEnd={handleDragEnd}
                                        className={`pipeline-step${isSelected?' selected':''}${draggedIndex===index?' dragging':''}${!func.enabled?' disabled':''}${stepError?' errored':''}`}>
                                        <div className="step-header" onClick={()=>setSelectedFunction(isSelected?null:index)}>
                                            <MaterialIcon name={func.id==='tesseract'?'text_fields':'drag_indicator'} size={14} style={{color:T.muted,flexShrink:0}}/>
                                            <span className="step-name">{func.name}</span>
                                            {stepError && (
                                                <MaterialIcon name="error" size={15}
                                                    title={`This step failed and was skipped: ${stepError}`}
                                                    style={{color:'#E5534B',flexShrink:0}}/>
                                            )}
                                            <span className="step-status-dot" style={{background:stepError?'#E5534B':(func.enabled?'#01B27C':'var(--border-strong)')}}/>
                                            <button onClick={e=>{e.stopPropagation();toggleFunction(index);}} title={func.enabled?'Disable':'Enable'}>
                                                {func.enabled?<Eye size={13}/>:<EyeOff size={13}/>}
                                            </button>
                                            <button onClick={e=>{e.stopPropagation();removeFunction(index);}} title="Remove"
                                                onMouseEnter={e=>e.currentTarget.style.color='#E5534B'}
                                                onMouseLeave={e=>e.currentTarget.style.color=''}>
                                                <X size={13}/>
                                            </button>
                                        </div>
                                        {stepError && (
                                            <div className="step-error" title={stepError}>
                                                <MaterialIcon name="warning" size={12}/>
                                                <span>Failed & skipped — output passes through unchanged.</span>
                                            </div>
                                        )}
                                        {isSelected && funcDef && (
                                            <div className="step-body">
                                                {funcDef.params.length===0 ? (
                                                    <p style={{fontSize:11,color:T.muted}}>No parameters</p>
                                                ) : funcDef.params.map(param=>(
                                                    <div key={param.name} className="prop-row">
                                                        <span className="prop-label">{param.label}</span>
                                                        {param.type==='select' ? (
                                                            <select value={func.params[param.name]}
                                                                onChange={e=>updateParameter(index,param.name,e.target.value)}
                                                                className="prop-input">
                                                                {param.options.map(opt=>(
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        ) : param.type==='seed' ? (
                                                            <div style={{display:'flex',gap:5,alignItems:'center'}}>
                                                                <input type="number" value={func.params[param.name]}
                                                                    onChange={e=>updateParameter(index,param.name,parseInt(e.target.value)||1)}
                                                                    className="prop-input" style={{flex:1,minWidth:0}}/>
                                                                <button title="Regenerate — roll a new random variation of this result"
                                                                    onClick={()=>updateParameter(index,param.name,Math.floor(Math.random()*1e9))}
                                                                    style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'3px 6px',borderRadius:5,background:'var(--bg-surface)',border:`1px solid ${T.border}`,color:'var(--text-secondary)',cursor:'pointer',flexShrink:0}}>
                                                                    <MaterialIcon name="casino" size={14}/>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <input type="number"
                                                                value={func.params[param.name]}
                                                                onChange={e=>updateParameter(index,param.name,parseFloat(e.target.value))}
                                                                min={param.min} max={param.max} step={param.step||1}
                                                                className="prop-input"/>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Save as Preset */}
                        {appliedFunctions.length > 0 && (
                            <div style={{padding:'8px 12px',borderTop:`1px solid ${T.border}`}}>
                                {!showSaveModal ? (
                                    <button className="add-step-btn" onClick={()=>{setSavePresetName('');setShowSaveModal(true);}}>
                                        <MaterialIcon name="bookmark_add" size={14}/> Save as Preset
                                    </button>
                                ) : (
                                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Preset name…"
                                            value={savePresetName}
                                            onChange={e=>setSavePresetName(e.target.value)}
                                            onKeyDown={e=>{
                                                if (e.key==='Enter' && savePresetName.trim()) { saveUserPreset(savePresetName); setShowSaveModal(false); }
                                                if (e.key==='Escape') setShowSaveModal(false);
                                            }}
                                            style={{width:'100%',background:'var(--bg-input)',border:'1px solid var(--accent)',borderRadius:5,color:'var(--text-primary)',fontSize:11,padding:'5px 8px',outline:'none',fontFamily:'inherit'}}
                                        />
                                        <div style={{display:'flex',gap:5}}>
                                            <button
                                                onClick={()=>{ saveUserPreset(savePresetName); setShowSaveModal(false); }}
                                                disabled={!savePresetName.trim()}
                                                style={{flex:1,fontSize:11,fontWeight:600,padding:'4px 0',borderRadius:5,background:'var(--accent)',border:'none',color:'#fff',cursor:'pointer',opacity:savePresetName.trim()?1:0.4}}>
                                                Save
                                            </button>
                                            <button
                                                onClick={()=>setShowSaveModal(false)}
                                                style={{flex:1,fontSize:11,padding:'4px 0',borderRadius:5,background:'var(--bg-surface)',border:`1px solid ${T.border}`,color:'var(--text-secondary)',cursor:'pointer'}}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {imageMetrics && (
                            <div className="metrics-section">
                                <p className="metrics-label">Image Info</p>
                                <div className="metric-row" style={{marginBottom:5}}>
                                    <div className="metric-card metric-card-full">
                                        <p className="metric-card-label">Resolution</p>
                                        <p className="metric-card-val">{imageMetrics.width} × {imageMetrics.height}</p>
                                    </div>
                                </div>
                                <div className="metric-row metric-row-3">
                                    <div className="metric-card">
                                        <p className="metric-card-label">Aspect</p>
                                        <p className="metric-card-val">{imageMetrics.aspectRatio}</p>
                                    </div>
                                    <div className="metric-card">
                                        <p className="metric-card-label">Format</p>
                                        <p className="metric-card-val">{imageMetrics.format}</p>
                                    </div>
                                    <div className="metric-card">
                                        <p className="metric-card-label">Size</p>
                                        <p className="metric-card-val">{imageMetrics.size}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Analysis tab */}
                {activeRightTab==='analysis' && (
                    <div style={{flex:1,overflowY:'auto',padding:'12px'}}>
                        {!processedImage ? (
                            <p style={{fontSize:11,color:T.muted,marginTop:16,textAlign:'center'}}>Upload an image to see analysis</p>
                        ) : (<>
                            <p className="metrics-label">RGB Histogram</p>
                            <canvas ref={histogramCanvasRef} style={{width:'100%',height:130,display:'block',background:'#1A1B2E',borderRadius:6,border:`1px solid ${T.border}`,flexShrink:0,marginBottom:14}}/>

                            {imageMetrics && (<>
                                <p className="metrics-label">Luminance</p>
                                <div className="metric-row" style={{marginBottom:5}}>
                                    <div className="metric-card">
                                        <p className="metric-card-label">Mean</p>
                                        <p className="metric-card-val">{imageMetrics.mean}</p>
                                    </div>
                                    <div className="metric-card">
                                        <p className="metric-card-label">Std Dev</p>
                                        <p className="metric-card-val">{imageMetrics.std}</p>
                                    </div>
                                </div>
                                <div className="metric-row" style={{marginBottom:5}}>
                                    <div className="metric-card">
                                        <p className="metric-card-label">Min</p>
                                        <p className="metric-card-val">{imageMetrics.minBright}</p>
                                    </div>
                                    <div className="metric-card">
                                        <p className="metric-card-label">Max</p>
                                        <p className="metric-card-val">{imageMetrics.maxBright}</p>
                                    </div>
                                </div>
                                <div className="metric-row" style={{marginBottom:14}}>
                                    <div className="metric-card metric-card-full">
                                        <p className="metric-card-label">Contrast (Michelson)</p>
                                        <p className="metric-card-val">{imageMetrics.contrast}%</p>
                                    </div>
                                </div>

                                <p className="metrics-label">Avg Channel Values</p>
                                <div className="metric-row metric-row-3" style={{marginBottom:14}}>
                                    <div className="metric-card metric-card-r">
                                        <p className="metric-card-label">Red</p>
                                        <p className="metric-card-val">{imageMetrics.avgR}</p>
                                    </div>
                                    <div className="metric-card metric-card-g">
                                        <p className="metric-card-label">Green</p>
                                        <p className="metric-card-val">{imageMetrics.avgG}</p>
                                    </div>
                                    <div className="metric-card metric-card-b">
                                        <p className="metric-card-label">Blue</p>
                                        <p className="metric-card-val">{imageMetrics.avgB}</p>
                                    </div>
                                </div>
                            </>)}

                            {paletteColors.length>0 && (
                                <div>
                                    <p className="metrics-label">Dominant Colors</p>
                                    <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:4}}>
                                        {paletteColors.map((c,i)=>(
                                            <div key={i} title={`${c} — click to copy`}
                                                style={{width:28,height:28,background:c,borderRadius:5,border:`1px solid ${T.border}`,cursor:'pointer',transition:'transform 0.1s'}}
                                                onClick={()=>navigator.clipboard.writeText(c).catch(()=>{})}
                                                onMouseEnter={e=>e.currentTarget.style.transform='scale(1.15)'}
                                                onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}/>
                                        ))}
                                    </div>
                                    <p style={{fontSize:10,color:T.muted}}>Click swatch to copy hex</p>
                                </div>
                            )}
                        </>)}
                    </div>
                )}

            </div>

            {/* ── Bottom Panel — VS Code-style docked panel ── */}
            <div className="bottom-panel" style={{height:bottomPanelCollapsed?36:bottomPanelHeight}}>
                {/* Drag-to-resize handle */}
                <div className="bottom-panel-resize-handle" onMouseDown={handleBottomPanelResizeStart}/>

                {/* Tab bar */}
                <div className="bottom-panel-tabs">
                    {['Code','OCR'].map(tab=>(
                        <button key={tab}
                            className={`bottom-panel-tab${activeBottomTab===tab.toLowerCase()?' active':''}`}
                            onClick={()=>{ setActiveBottomTab(tab.toLowerCase()); setBottomPanelCollapsed(false); }}>
                            {tab}
                        </button>
                    ))}
                    <div style={{flex:1}}/>
                    <button className="bottom-panel-collapse-btn"
                        title={bottomPanelCollapsed?'Expand panel':'Collapse panel'}
                        onClick={()=>setBottomPanelCollapsed(c=>!c)}>
                        <MaterialIcon name={bottomPanelCollapsed?'expand_less':'expand_more'} size={16}/>
                    </button>
                </div>

                {/* Tab content */}
                {!bottomPanelCollapsed && (
                    <div className="bottom-panel-content">
                        {/* Code tab */}
                        {activeBottomTab==='code' && (
                            <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
                                <div style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'flex-end',background:T.surface,flexShrink:0}}>
                                    <button onClick={()=>navigator.clipboard.writeText(pythonCode).catch(()=>{})} className="btn-export" style={{padding:'3px 10px',fontSize:11}}>
                                        <MaterialIcon name="content_copy" size={12}/> Copy
                                    </button>
                                </div>
                                <div style={{flex:1,overflowY:'auto',padding:'10px'}}>
                                    <pre style={{background:'var(--bg-code)',color:'var(--text-code)',borderRadius:7,padding:'10px 12px',fontSize:11,lineHeight:1.65,overflowX:'auto',margin:0}}>
                                        <code>{pythonCode}</code>
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* OCR tab */}
                        {activeBottomTab==='ocr' && (
                            <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
                                <div style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'flex-end',background:T.surface,flexShrink:0}}>
                                    <button onClick={()=>navigator.clipboard.writeText(ocrResult).catch(()=>{})}
                                        disabled={!ocrResult} className="btn-export"
                                        style={{padding:'3px 10px',fontSize:11,opacity:ocrResult?1:0.4}}>
                                        <MaterialIcon name="content_copy" size={12}/> Copy
                                    </button>
                                </div>
                                <div style={{flex:1,overflowY:'auto',padding:'10px'}}>
                                    {ocrProgress>0 && ocrProgress<100 && (
                                        <div style={{marginBottom:10}}>
                                            <div className="progress-container"><div className="progress-bar" style={{width:`${ocrProgress}%`}}/></div>
                                            <p style={{fontSize:11,color:T.muted,marginTop:4}}>Processing: {ocrProgress.toFixed(1)}%</p>
                                        </div>
                                    )}
                                    {ocrResult ? (
                                        <div className="ocr-result">{ocrResult}</div>
                                    ) : (
                                        <p style={{fontSize:11,color:T.muted}}>Add Tesseract OCR from the sidebar and upload an image to extract text.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Show CDN information
window.showCDNInfo = function() {
    console.log('📋 OCR Method (Modern Tesseract.js v5+ Implementation):');
    console.log('');
    console.log('🚀 createWorker API: Modern approach with proper worker management');
    console.log('✅ Benefits: Better performance, proper resource cleanup, latest features');
    console.log('📦 Uses official Tesseract.js v5+ from JSDelivr CDN');
    console.log('🔧 Automatic language data downloading and caching');
    console.log('🎯 Supports ALL OEM modes (0, 1, 2, 3) with automatic legacy setup');
    console.log('');
    console.log('🧪 Testing commands:');
    console.log('   window.testCDN() - Test Tesseract createWorker API');
    console.log('   window.testOCR() - Test OCR with sample "Hello World" image');
    console.log('   window.testAllOEMModes() - Test all OCR Engine Modes (0-3)');
    console.log('');
    console.log('🔧 OEM Modes supported:');
    console.log('   • Mode 0: Legacy engine only (auto-configured)');
    console.log('   • Mode 1: Neural nets LSTM only (auto-configured)');
    console.log('   • Mode 2: Legacy + LSTM engines');
    console.log('   • Mode 3: Default (Best available) ← Recommended');
    console.log('');
    console.log('💡 This modern approach provides better reliability and performance');
    console.log('📚 Based on official documentation: https://github.com/naptha/tesseract.js');
};

// Test Tesseract availability using modern createWorker API
window.testCDN = async function() {
    console.log('🧪 Testing Tesseract.js v5+ createWorker API...');
    console.log('⚠️ This uses the same approach as the main OCR function');
    
    // Create a tiny test image
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    
    // White background with black text
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 100, 30);
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText('TEST', 10, 20);
    
    const testImage = canvas.toDataURL();
    
    let worker = null;
    
    try {
        console.log('⏳ Creating Tesseract worker...');
        
        // Test with default OEM mode (most compatible) and logger in createWorker
        worker = await Tesseract.createWorker('eng', {
            logger: m => {
                if (m.progress > 0) {
                    console.log('Worker Test:', m.status, Math.round(m.progress * 100) + '%');
                }
            }
        });
        
        console.log('✅ Worker created successfully');
        
        const result = await Promise.race([
            worker.recognize(testImage),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Test timeout (30s)')), 30000)
            )
        ]);
        
        console.log('✅ OCR Test completed!');
        console.log('📝 Test result:', result.data.text.trim());
        console.log('📊 Confidence:', Math.round(result.data.confidence) + '%');
        console.log('🎯 Tesseract.js v5+ worker API working correctly');
        
        return [{ name: 'Tesseract.js v5+ Worker', working: true }];
        
    } catch (error) {
        const errorMsg = error && error.message ? error.message : 'Unknown error';
        console.error('❌ Worker test failed:', errorMsg);
        console.log('🔧 Try these fixes:');
        console.log('1. Hard refresh: Ctrl+Shift+R');  
        console.log('2. Clear browser cache completely');
        console.log('3. Try different browser (Chrome recommended)');
        console.log('4. Check internet connection');
        
        return [];
    } finally {
        // Clean up worker
        if (worker) {
            try {
                await worker.terminate();
                console.log('🧹 Worker terminated successfully');
            } catch (terminateError) {
                console.warn('Worker termination warning:', terminateError);
            }
        }
    }
};

// Test OCR functionality with sample text using modern createWorker API
window.testOCR = async function() {
    console.log('🧪 Starting OCR test with Tesseract.js v5+...');
    
    // Create a simple test image with text
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 200, 50);
    
    // Black text
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Hello World', 10, 30);
    
    // Convert to data URL
    const testImageDataUrl = canvas.toDataURL();
    console.log('📷 Test image created');
    
    console.log('🚀 Using modern createWorker API (Tesseract.js v5+)');
    console.log('⏳ This may take a moment for first-time language download...');
    
    let worker = null;
    
    try {
        console.log('⏳ Creating worker...');
        
        // Test with default OEM mode (most compatible) and logger in createWorker
        worker = await Tesseract.createWorker('eng', {
            logger: m => {
                if (m.progress > 0) {
                    console.log('OCR Test:', m.status, Math.round(m.progress * 100) + '%');
                }
            }
        });
        
        console.log('✅ Worker created, processing test image...');
        
        const result = await Promise.race([
            worker.recognize(testImageDataUrl),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('OCR test timeout (60s)')), 60000)
            )
        ]);
        
        console.log('✅ OCR Test Result:', result.data.text.trim());
        console.log('📊 Confidence:', Math.round(result.data.confidence) + '%');
        console.log('🎯 Tesseract.js v5+ working correctly');
        return result.data.text.trim();
        
    } catch (error) {
        const errorMsg = error && error.message ? error.message : 'Unknown error';
        console.error('❌ OCR Test Failed:', errorMsg);
        console.log('🔧 Troubleshooting:');
        console.log('1. Hard refresh: Ctrl+Shift+R (Win) or Cmd+Shift+R (Mac)');
        console.log('2. Clear browser cache completely');
        console.log('3. Try different browser (Chrome recommended)');
        console.log('4. Check internet connection');
        console.log('5. Disable VPN/firewall temporarily');
        return null;
    } finally {
        // Clean up worker
        if (worker) {
            try {
                await worker.terminate();
                console.log('🧹 Worker terminated successfully');
            } catch (terminateError) {
                console.warn('Worker termination warning:', terminateError);
            }
        }
    }
};

// Test all OEM modes (for development/testing)
window.testAllOEMModes = async function() {
    console.log('🧪 Testing all OEM modes...');
    
    // Create test image
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 150, 30);
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText('TEST OCR', 10, 20);
    const testImage = canvas.toDataURL();
    
    const oemModes = [
        { mode: 0, name: 'Legacy engine only', requiresLegacy: true },
        { mode: 1, name: 'Neural nets LSTM only', requiresLegacy: true },
        { mode: 2, name: 'Legacy + LSTM engines', requiresLegacy: false },
        { mode: 3, name: 'Default (Best available)', requiresLegacy: false }
    ];
    
    const results = [];
    
    for (const oemInfo of oemModes) {
        let worker = null;
        try {
            console.log(`\n⏳ Testing OEM ${oemInfo.mode}: ${oemInfo.name}`);
            
            const workerOptions = {
                logger: m => {
                    if (m.progress > 0.5) {
                        console.log(`  OEM ${oemInfo.mode}:`, m.status, Math.round(m.progress * 100) + '%');
                    }
                }
            };
            
            // Add legacy support if needed
            if (oemInfo.requiresLegacy) {
                workerOptions.legacyCore = true;
                workerOptions.legacyLang = true;
            }
            
            // Create worker with specific OEM mode and logger in createWorker (consistent API)
            worker = await Tesseract.createWorker('eng', oemInfo.mode, workerOptions);
            
            const result = await Promise.race([
                worker.recognize(testImage),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 30000)
                )
            ]);
            
            const text = result.data.text.trim();
            const confidence = Math.round(result.data.confidence);
            
            console.log(`✅ OEM ${oemInfo.mode} SUCCESS: "${text}" (${confidence}% confidence)`);
            results.push({
                mode: oemInfo.mode,
                name: oemInfo.name,
                success: true,
                text: text,
                confidence: confidence
            });
            
        } catch (error) {
            const errorMsg = error.message;
            console.warn(`❌ OEM ${oemInfo.mode} FAILED: ${errorMsg}`);
            results.push({
                mode: oemInfo.mode,
                name: oemInfo.name,
                success: false,
                error: errorMsg
            });
        } finally {
            if (worker) {
                try {
                    await worker.terminate();
                } catch (e) {
                    console.warn(`Warning terminating OEM ${oemInfo.mode} worker:`, e);
                }
            }
        }
    }
    
    console.log('\n📊 OEM Mode Test Results:');
    results.forEach(result => {
        if (result.success) {
            console.log(`✅ Mode ${result.mode}: ${result.name} - "${result.text}" (${result.confidence}%)`);
        } else {
            console.log(`❌ Mode ${result.mode}: ${result.name} - ${result.error}`);
        }
    });
    
    return results;
};

// Check Tesseract availability on app load
window.addEventListener('load', function() {
    setTimeout(function() {
        if (typeof Tesseract === 'undefined') {
            console.error('Tesseract failed to load - OCR will not work');
        } else {
            console.log('✅ Tesseract loaded successfully');
            // Test basic Tesseract functionality
            try {
                if (Tesseract.createWorker) {
                    console.log('✅ Tesseract.js v5+ API available');
                    console.log('');
                    console.log('🧪 Testing Commands:');
                    console.log('   window.showCDNInfo() - Show implementation details');
                    console.log('   window.testCDN() - Test Tesseract createWorker API');
                    console.log('   window.testOCR() - Test OCR functionality with sample text');
                    console.log('');
                    
                    // Indicate OCR is ready in the UI
                    setTimeout(() => {
                        const ocrSection = document.querySelector('.text-white');
                        if (ocrSection && ocrSection.textContent.includes('Tesseract OCR')) {
                            // Add a subtle ready indicator
                            console.log('🟢 OCR functionality is ready!');
                        }
                    }, 1000);
                } else {
                    console.warn('⚠️ Tesseract API methods missing');
                }
            } catch (e) {
                console.error('❌ Tesseract API test failed:', e);
            }
        }
    }, 2000); // Wait 2 seconds for everything to load
});

ReactDOM.render(<OpenCVInteractive />, document.getElementById('root'));
