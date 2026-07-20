const { useState, useEffect, useRef } = React;

// ==================== ICON COMPONENTS ====================
const Plus = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const X = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const Eye = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const EyeOff = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

const Upload = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

const Download = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const ChevronDown = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const ChevronRight = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

const GripVertical = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="12" r="1"></circle>
        <circle cx="9" cy="5" r="1"></circle>
        <circle cx="9" cy="19" r="1"></circle>
        <circle cx="15" cy="12" r="1"></circle>
        <circle cx="15" cy="5" r="1"></circle>
        <circle cx="15" cy="19" r="1"></circle>
    </svg>
);

const Code = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
);

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
    ]
};

// Flatten for lookup
const OPENCV_FUNCTIONS = Object.values(OPENCV_CATEGORIES).flat();

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
    const [showCode, setShowCode] = useState(false);
    const fileInputRef = useRef(null);

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

    const processImage = () => {
        if (!originalImage || !opencvReady) return;

        try {
            const cv = window.cv;
            let src = cv.imread(originalImage);
            let dst = src.clone();

            for (const func of appliedFunctions) {
                if (!func.enabled) continue;

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
                            cv.bilateralFilter(temp, dst, func.params.d, func.params.sigmaColor, func.params.sigmaSpace);
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
                            const invGamma = 1.0 / func.params.gamma;
                            const table = new cv.Mat(1, 256, cv.CV_8U);
                            for (let i = 0; i < 256; i++) {
                                table.data[i] = Math.pow(i / 255.0, invGamma) * 255;
                            }
                            cv.LUT(temp, table, dst);
                            table.delete();
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
                    }
                } catch (err) {
                    console.error(`Error applying ${func.name}:`, err);
                }
                
                if (temp !== dst) {
                    temp.delete();
                }
            }

            const canvas = document.createElement('canvas');
            cv.imshow(canvas, dst);
            setProcessedImage(canvas.toDataURL());

            src.delete();
            dst.delete();
        } catch (err) {
            console.error('Error processing image:', err);
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

        setAppliedFunctions([...appliedFunctions, newFunc]);
        setSelectedFunction(appliedFunctions.length);
    };

    const removeFunction = (index) => {
        const updated = appliedFunctions.filter((_, i) => i !== index);
        setAppliedFunctions(updated);
        if (selectedFunction === index) {
            setSelectedFunction(null);
        } else if (selectedFunction > index) {
            setSelectedFunction(selectedFunction - 1);
        }
    };

    const toggleFunction = (index) => {
        const updated = [...appliedFunctions];
        updated[index].enabled = !updated[index].enabled;
        setAppliedFunctions(updated);
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

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const newFunctions = [...appliedFunctions];
        const draggedItem = newFunctions[draggedIndex];
        newFunctions.splice(draggedIndex, 1);
        newFunctions.splice(dropIndex, 0, draggedItem);

        setAppliedFunctions(newFunctions);
        
        if (selectedFunction === draggedIndex) {
            setSelectedFunction(dropIndex);
        } else if (selectedFunction > draggedIndex && selectedFunction <= dropIndex) {
            setSelectedFunction(selectedFunction - 1);
        } else if (selectedFunction < draggedIndex && selectedFunction >= dropIndex) {
            setSelectedFunction(selectedFunction + 1);
        }
        
        setDraggedIndex(null);
    };

    const selectedFuncDef = selectedFunction !== null 
        ? OPENCV_FUNCTIONS.find(f => f.id === appliedFunctions[selectedFunction].id)
        : null;

    const pythonCode = generatePythonCode(appliedFunctions);

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            {/* Left Sidebar */}
            <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold">OpenCV Functions</h2>
                </div>
                <div className="p-2">
                    {Object.entries(OPENCV_CATEGORIES).map(([category, functions]) => (
                        <div key={category} className="mb-2">
                            <button
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center justify-between p-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                            >
                                <span className="text-sm font-semibold">{category}</span>
                                {expandedCategories[category] ? 
                                    <ChevronDown size={16} /> : 
                                    <ChevronRight size={16} />
                                }
                            </button>
                            {expandedCategories[category] && (
                                <div className="mt-1 ml-2">
                                    {functions.map(func => (
                                        <div
                                            key={func.id}
                                            className="flex items-center justify-between p-2 mb-1 bg-gray-750 rounded hover:bg-gray-600 transition-colors"
                                        >
                                            <span className="text-xs">{func.name}</span>
                                            <button
                                                onClick={() => addFunction(func)}
                                                className="p-1 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                                title="Add function"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center gap-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                        <Upload size={18} />
                        Upload Image
                    </button>
                    <button
                        onClick={downloadImage}
                        disabled={!processedImage}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <Download size={18} />
                        Download Result
                    </button>
                    <button
                        onClick={() => setShowCode(!showCode)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                    >
                        <Code size={18} />
                        {showCode ? 'Hide' : 'Show'} Python Code
                    </button>
                    {!opencvReady && (
                        <span className="text-yellow-400 text-sm">Loading OpenCV...</span>
                    )}
                </div>

                {/* Image Display */}
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-850 border-r border-gray-700 p-4">
                        <h3 className="text-sm font-semibold mb-2 text-gray-400">Original</h3>
                        {originalImage ? (
                            <img src={originalImage.src} alt="Original" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <div className="text-gray-500 text-center">
                                <Upload size={48} className="mx-auto mb-2 opacity-50" />
                                <p>Upload an image to get started</p>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-850 p-4">
                        <h3 className="text-sm font-semibold mb-2 text-gray-400">Processed</h3>
                        {processedImage ? (
                            <img src={processedImage} alt="Processed" className="max-w-full max-h-full object-contain" />
                        ) : originalImage ? (
                            <div className="text-gray-500">Apply functions to see results</div>
                        ) : (
                            <div className="text-gray-500">No processing applied</div>
                        )}
                    </div>
                </div>

                {/* Python Code Panel */}
                {showCode && (
                    <div className="bg-gray-800 border-t border-gray-700 p-4 max-h-80 overflow-y-auto">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">Python Code</h3>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(pythonCode);
                                    alert('Code copied to clipboard!');
                                }}
                                className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700"
                            >
                                Copy Code
                            </button>
                        </div>
                        <pre className="bg-gray-900 p-4 rounded text-sm text-green-400 overflow-x-auto">
                            <code>{pythonCode}</code>
                        </pre>
                    </div>
                )}
            </div>

            {/* Right Sidebar */}
            <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                {/* Applied Functions */}
                <div className="flex-1 overflow-y-auto border-b border-gray-700">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-lg font-bold">Applied Functions</h2>
                        <p className="text-xs text-gray-400 mt-1">Drag to reorder</p>
                    </div>
                    <div className="p-2">
                        {appliedFunctions.length === 0 ? (
                            <div className="text-gray-500 text-sm text-center p-4">
                                No functions applied yet
                            </div>
                        ) : (
                            appliedFunctions.map((func, index) => (
                                <div
                                    key={index}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    className={`p-3 mb-2 rounded cursor-move transition-colors ${
                                        selectedFunction === index ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                                    } ${draggedIndex === index ? 'dragging' : ''}`}
                                    onClick={() => setSelectedFunction(index)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <GripVertical size={14} className="text-gray-400" />
                                            <span className="text-sm font-medium">{func.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFunction(index);
                                                }}
                                                className="p-1 hover:bg-gray-800 rounded transition-colors"
                                                title={func.enabled ? 'Disable' : 'Enable'}
                                            >
                                                {func.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFunction(index);
                                                }}
                                                className="p-1 hover:bg-red-600 rounded transition-colors"
                                                title="Remove"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {func.enabled ? 'Active' : 'Disabled'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Properties */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-lg font-bold">Properties</h2>
                    </div>
                    <div className="p-4">
                        {selectedFunction !== null && selectedFuncDef ? (
                            <>
                                <h3 className="text-md font-semibold mb-4 text-blue-400">
                                    {appliedFunctions[selectedFunction].name}
                                </h3>
                                {selectedFuncDef.params.length === 0 ? (
                                    <div className="text-sm text-gray-400">
                                        No parameters for this function
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedFuncDef.params.map(param => (
                                            <div key={param.name} className="flex flex-col">
                                                <label className="text-sm text-gray-400 mb-2">{param.label}</label>
                                                {param.type === 'select' ? (
                                                    <select
                                                        value={appliedFunctions[selectedFunction].params[param.name]}
                                                        onChange={(e) => updateParameter(selectedFunction, param.name, e.target.value)}
                                                        className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                                    >
                                                        {param.options.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={param.type}
                                                        value={appliedFunctions[selectedFunction].params[param.name]}
                                                        onChange={(e) => updateParameter(selectedFunction, param.name, e.target.value)}
                                                        min={param.min}
                                                        max={param.max}
                                                        step={param.step}
                                                        className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-gray-500 text-center">
                                Select a function to view its properties
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

ReactDOM.render(<OpenCVInteractive />, document.getElementById('root'));
