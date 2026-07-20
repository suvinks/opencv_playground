const { useState, useEffect, useRef } = React;

// ==================== MATERIAL ICON COMPONENTS ====================
const MaterialIcon = ({ name, size = 24, className = "" }) => (
    <span className={`material-icons ${className}`} style={{ fontSize: size }}>
        {name}
    </span>
);

// Icon component wrappers for Material Icons
const Plus = ({ size = 24 }) => <MaterialIcon name="add" size={size} />;
const X = ({ size = 24 }) => <MaterialIcon name="close" size={size} />;
const Eye = ({ size = 24 }) => <MaterialIcon name="visibility" size={size} />;
const EyeOff = ({ size = 24 }) => <MaterialIcon name="visibility_off" size={size} />;
const Upload = ({ size = 24 }) => <MaterialIcon name="upload" size={size} />;
const Download = ({ size = 24 }) => <MaterialIcon name="download" size={size} />;
const ChevronDown = ({ size = 24 }) => <MaterialIcon name="keyboard_arrow_down" size={size} />;
const ChevronRight = ({ size = 24 }) => <MaterialIcon name="keyboard_arrow_right" size={size} />;
const GripVertical = ({ size = 24 }) => <MaterialIcon name="drag_indicator" size={size} />;
const Code = ({ size = 24 }) => <MaterialIcon name="code" size={size} />;
const FileText = ({ size = 24 }) => <MaterialIcon name="description" size={size} />;
const ZoomIn = ({ size = 24 }) => <MaterialIcon name="zoom_in" size={size} />;
const ZoomOut = ({ size = 24 }) => <MaterialIcon name="zoom_out" size={size} />;
const FitScreen = ({ size = 24 }) => <MaterialIcon name="fit_screen" size={size} />;
const CenterFocusStrong = ({ size = 24 }) => <MaterialIcon name="center_focus_strong" size={size} />;
const Sync = ({ size = 24 }) => <MaterialIcon name="sync" size={size} />;
const SyncDisabled = ({ size = 24 }) => <MaterialIcon name="sync_disabled" size={size} />;
const Map = ({ size = 24 }) => <MaterialIcon name="map" size={size} />;

// ==================== ZOOM STATE MANAGEMENT ====================

// ==================== ZOOMABLE IMAGE COMPONENT ====================
const ZoomableImage = ({ 
    src, 
    alt, 
    className = "", 
    imageType = "original", // "original" or "processed"
    zoomSync,
    showMinimap = true 
}) => {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showMinimapPanel, setShowMinimapPanel] = useState(false);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    const minZoom = 0.1;
    const maxZoom = 5;
    const zoomStep = 0.2;

    // Reset zoom and position when image changes
    useEffect(() => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    }, [src]);

    // Sync zoom when enabled
    useEffect(() => {
        if (zoomSync?.isZoomSyncEnabled) {
            setZoom(zoomSync.syncedZoom);
            setPosition(zoomSync.syncedPosition);
        }
    }, [zoomSync?.syncedZoom, zoomSync?.syncedPosition, zoomSync?.isZoomSyncEnabled]);

    const updateZoom = (newZoom) => {
        setZoom(newZoom);
        if (zoomSync?.isZoomSyncEnabled) {
            zoomSync.setSyncedZoom(newZoom);
        }
    };

    const updatePosition = (newPosition) => {
        setPosition(newPosition);
        if (zoomSync?.isZoomSyncEnabled) {
            zoomSync.setSyncedPosition(newPosition);
        }
    };

    const handleZoomIn = () => {
        const newZoom = Math.min(zoom + zoomStep, maxZoom);
        updateZoom(newZoom);
    };

    const handleZoomOut = () => {
        const newZoom = Math.max(zoom - zoomStep, minZoom);
        updateZoom(newZoom);
    };

    const handleReset = () => {
        updateZoom(1);
        updatePosition({ x: 0, y: 0 });
    };

    const handleFitToScreen = () => {
        if (!containerRef.current || !imageRef.current) return;
        
        const container = containerRef.current.getBoundingClientRect();
        const image = imageRef.current;
        
        // Calculate zoom to fit the image in the container
        const scaleX = (container.width - 32) / image.naturalWidth; // 32px for padding
        const scaleY = (container.height - 32) / image.naturalHeight;
        const newZoom = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%
        
        updateZoom(newZoom);
        updatePosition({ x: 0, y: 0 });
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + delta));
        updateZoom(newZoom);
    };

    const handleDoubleClick = () => {
        if (zoom === 1) {
            // If at 100%, zoom to fit screen
            handleFitToScreen();
        } else {
            // If zoomed, reset to 100%
            handleReset();
        }
    };

    const handleMouseDown = (e) => {
        if (zoom <= 1) return; // Only allow panning when zoomed in
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging || zoom <= 1) return;
        
        const newPosition = {
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        };
        updatePosition(newPosition);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStart]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '=':
                    case '+':
                        e.preventDefault();
                        handleZoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        handleZoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        handleReset();
                        break;
                    case 'f':
                        e.preventDefault();
                        handleFitToScreen();
                        break;
                }
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('keydown', handleKeyDown);
            return () => container.removeEventListener('keydown', handleKeyDown);
        }
    }, [zoom]);

    if (!src) return null;

    return (
        <div className="zoomable-image-container" ref={containerRef} tabIndex={0}>
            {/* Horizontal Zoom Controls */}
            <div className="zoom-controls-horizontal">
                <button
                    onClick={handleZoomOut}
                    disabled={zoom <= minZoom}
                    className="zoom-btn"
                    title="Zoom Out (Ctrl + -)"
                >
                    <ZoomOut size={16} />
                </button>
                <button
                    onClick={handleZoomIn}
                    disabled={zoom >= maxZoom}
                    className="zoom-btn"
                    title="Zoom In (Ctrl + +)"
                >
                    <ZoomIn size={16} />
                </button>
                <button
                    onClick={handleReset}
                    className="zoom-btn"
                    title="Reset Zoom (Ctrl + 0)"
                >
                    <CenterFocusStrong size={16} />
                </button>
                <button
                    onClick={handleFitToScreen}
                    className="zoom-btn"
                    title="Fit to Screen (Ctrl + F)"
                >
                    <FitScreen size={16} />
                </button>
                {imageType === "original" && zoomSync && (
                    <button
                        onClick={() => zoomSync.setIsZoomSyncEnabled(!zoomSync.isZoomSyncEnabled)}
                        className={`zoom-btn ${zoomSync.isZoomSyncEnabled ? 'active' : ''}`}
                        title={`Zoom Sync ${zoomSync.isZoomSyncEnabled ? 'Enabled' : 'Disabled'}`}
                    >
                        {zoomSync.isZoomSyncEnabled ? <Sync size={16} /> : <SyncDisabled size={16} />}
                    </button>
                )}
                {showMinimap && zoom > 1 && (
                    <button
                        onClick={() => setShowMinimapPanel(!showMinimapPanel)}
                        className={`zoom-btn ${showMinimapPanel ? 'active' : ''}`}
                        title="Toggle Minimap"
                    >
                        <Map size={16} />
                    </button>
                )}
                <div className="zoom-level">
                    {Math.round(zoom * 100)}%
                </div>
            </div>

            {/* Minimap */}
            {showMinimap && zoom > 1 && showMinimapPanel && imageRef.current && (
                <div className="minimap">
                    <div className="minimap-image">
                        <img
                            src={src}
                            alt={`${alt} minimap`}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                        <div 
                            className="minimap-viewport"
                            style={{
                                left: `${50 - (position.x / zoom / (imageRef.current.naturalWidth || 1)) * 100}%`,
                                top: `${50 - (position.y / zoom / (imageRef.current.naturalHeight || 1)) * 100}%`,
                                width: `${100 / zoom}%`,
                                height: `${100 / zoom}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Image Container */}
            <div 
                className="image-viewport"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
                <img
                    ref={imageRef}
                    src={src}
                    alt={alt}
                    className={`zoomable-image ${className}`}
                    style={{
                        transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                        transformOrigin: 'center center'
                    }}
                    draggable={false}
                />
            </div>

            {/* Keyboard shortcuts help */}
            <div className="keyboard-shortcuts-hint">
                <small>
                    Ctrl + Plus/Minus: Zoom | Ctrl + 0: Reset | Ctrl + F: Fit | Double-click: Toggle zoom
                </small>
            </div>
        </div>
    );
};

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
    'OCR': [
        {
            id: 'tesseract',
            name: 'Tesseract OCR',
            params: [
                { name: 'language', label: 'Language', type: 'select', default: 'eng', options: [
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
    const [showCode, setShowCode] = useState(false);
    const [showOCR, setShowOCR] = useState(false);
    const [ocrResult, setOcrResult] = useState('Add Tesseract OCR from the OCR category and upload an image to extract text.');
    const [ocrProgress, setOcrProgress] = useState(0);
    const [isProcessingOCR, setIsProcessingOCR] = useState(false);
    const fileInputRef = useRef(null);
    
    // Zoom sync state
    const [isZoomSyncEnabled, setIsZoomSyncEnabled] = useState(false);
    const [syncedZoom, setSyncedZoom] = useState(1);
    const [syncedPosition, setSyncedPosition] = useState({ x: 0, y: 0 });
    
    const zoomSync = {
        isZoomSyncEnabled,
        setIsZoomSyncEnabled,
        syncedZoom,
        setSyncedZoom,
        syncedPosition,
        setSyncedPosition
    };

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
            // Small delay to ensure image is ready
            const timer = setTimeout(() => {
                runOCR();
            }, 300);
            return () => clearTimeout(timer);
        } else if (hasTesseract && !processedImage) {
            setOcrResult('Waiting for image to be processed...');
        }
    }, [processedImage, appliedFunctions]);

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

        let worker = null;

        try {
            // Check if Tesseract is available
            if (typeof Tesseract === 'undefined' || !Tesseract) {
                throw new Error('Tesseract library not loaded. Please refresh the page.');
            }

            // Use modern createWorker approach with support for all OEM modes
            const oemMode = tesseractFunc.params.oem || 3; // Default to mode 3 if not specified
            setOcrResult(`Initializing worker with OEM mode ${oemMode}...`);
            
            // Prepare worker options based on OEM mode with logger
            const workerOptions = {
                logger: m => {
                    if (m.status === 'recognizing text' && m.progress > 0) {
                        const progress = Math.round(m.progress * 100);
                        setOcrProgress(progress);
                        setOcrResult(`Recognizing text: ${progress}%`);
                    } else if (m.status === 'loading language traineddata') {
                        setOcrResult('Downloading language data (first time only)...');
                    } else if (m.status === 'initializing api') {
                        setOcrResult('Initializing OCR engine...');
                    } else if (m.status === 'initialized api') {
                        setOcrResult('OCR ready, processing image...');
                    }
                }
            };
            
            // Add legacy support for OEM modes 0 and 1
            if (oemMode === 0 || oemMode === 1) {
                setOcrResult(`Setting up legacy OEM mode ${oemMode}...`);
                workerOptions.legacyCore = true;
                workerOptions.legacyLang = true;
                console.log(`🔧 Using legacy mode ${oemMode} with legacyCore and legacyLang enabled`);
            }
            
            // Create worker with appropriate OEM mode (consistent API usage)
            // Always use the 3-parameter form to avoid parameter position confusion
            worker = await Tesseract.createWorker(tesseractFunc.params.language, oemMode, workerOptions);

            // Set additional parameters if specified
            if (tesseractFunc.params.psm !== 3) { // Only if not default PSM
                setOcrResult('Setting page segmentation mode...');
                await worker.setParameters({
                    tessedit_pageseg_mode: tesseractFunc.params.psm
                });
            }

            // Log the OEM mode being used
            const oemNames = {
                0: 'Legacy engine only',
                1: 'Neural nets LSTM only', 
                2: 'Legacy + LSTM engines',
                3: 'Default (Best available)'
            };
            console.log(`✅ OCR initialized with OEM mode ${oemMode}: ${oemNames[oemMode] || 'Custom mode'}`);
            setOcrResult(`Using ${oemNames[oemMode] || `OEM mode ${oemMode}`} engine...`);

            setOcrResult('Processing image with OCR...');
            
            // Perform OCR with timeout protection (logger configured during worker creation)
            const recognizeOptions = {};
            
            const result = await Promise.race([
                worker.recognize(processedImage, recognizeOptions),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('OCR timeout after 90 seconds')), 90000)
                )
            ]);

            const text = result.data.text;
            const confidence = result.data.confidence;

            if (text && text.trim().length > 0) {
                const confidenceMsg = confidence ? `\n\n📊 Confidence: ${Math.round(confidence)}%` : '';
                setOcrResult(text + confidenceMsg);
            } else {
                setOcrResult('❌ No text detected in the image.\n\n💡 Tips:\n• Pre-process with: Grayscale → Threshold\n• Try different PSM modes (Properties panel)\n• Ensure text is clear and readable\n• Try increasing image size with Resize function\n• Check if image actually contains text');
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

    const processImage = () => {
        if (!originalImage || !opencvReady) return;

        try {
            const cv = window.cv;
            let src = cv.imread(originalImage);
            let dst = src.clone();

            for (const func of appliedFunctions) {
                // Skip Tesseract - it processes separately on the final image
                if (func.id === 'tesseract') continue;
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

        // If it's Tesseract, always add it at the end
        if (funcDef.id === 'tesseract') {
            // Check if Tesseract already exists
            const tesseractIndex = appliedFunctions.findIndex(f => f.id === 'tesseract');
            if (tesseractIndex !== -1) {
                // Replace existing Tesseract
                const updated = [...appliedFunctions];
                updated[tesseractIndex] = newFunc;
                setAppliedFunctions(updated);
                setSelectedFunction(tesseractIndex);
            } else {
                // Add Tesseract at the end
                setAppliedFunctions([...appliedFunctions, newFunc]);
                setSelectedFunction(appliedFunctions.length);
            }
        } else {
            // For non-Tesseract functions, insert before Tesseract if it exists
            const tesseractIndex = appliedFunctions.findIndex(f => f.id === 'tesseract');
            if (tesseractIndex !== -1) {
                const updated = [...appliedFunctions];
                updated.splice(tesseractIndex, 0, newFunc);
                setAppliedFunctions(updated);
                setSelectedFunction(tesseractIndex);
            } else {
                // No Tesseract, add at the end
                setAppliedFunctions([...appliedFunctions, newFunc]);
                setSelectedFunction(appliedFunctions.length);
            }
        }
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

        setAppliedFunctions(newFunctions);
        
        if (selectedFunction === draggedIndex) {
            setSelectedFunction(adjustedDropIndex);
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
        <div className="grid-container">
            {/* Header Logo Block */}
            <div className="header-logo">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-xl font-bold text-white">CV</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">OpenCV Playground</h1>
                        <p className="text-xs text-gray-400">Image Processing Tool</p>
                    </div>
                </div>
            </div>

            {/* Header Action Buttons */}
            <div className="header-actions">
                <div className="flex items-center gap-4 w-full">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors flex-1"
                    >
                        <Upload size={18} />
                        Upload Image
                    </button>
                    <button
                        onClick={downloadImage}
                        disabled={!processedImage}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex-1"
                    >
                        <Download size={18} />
                        Download Result
                    </button>
                    <button
                        onClick={() => setShowCode(!showCode)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors flex-1"
                    >
                        <Code size={18} />
                        {showCode ? 'Hide' : 'Show'} Code
                    </button>
                    <button
                        onClick={() => setShowOCR(!showOCR)}
                        disabled={!appliedFunctions.some(f => f.id === 'tesseract')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex-1"
                    >
                        <FileText size={18} />
                        {showOCR ? 'Hide' : 'View'} OCR
                    </button>
                    {!opencvReady && (
                        <span className="text-yellow-400 text-sm whitespace-nowrap">Loading OpenCV...</span>
                    )}
                </div>
            </div>

            {/* Left Sidebar - Menu Items */}
            <div className="app-sidebar">
                <div className="panel-header p-4">
                    <h2 className="text-lg font-bold">Toolbar</h2>
                </div>
                <div className="panel-content flex-1 overflow-y-auto">
                    <div className="p-2">
                        {Object.entries(OPENCV_CATEGORIES).map(([category, functions]) => (
                            <div key={category} className="mb-2">
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="category-button w-full flex items-center justify-between p-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
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
            </div>

            {/* Center Content Column */}
            <div className={`center-content ${
                !showCode && !showOCR ? 'images-only' :
                showCode && !showOCR ? 'images-code' :
                !showCode && showOCR ? 'images-ocr' :
                'images-code-ocr'
            }`}>
                {/* Original & Processed Images Area (Top 50%) */}
                <div className="images-area">
                    <div className="image-panel">
                        <div className="image-panel-header">
                            <h2 className="text-lg font-bold">Original</h2>
                        </div>
                        <div className="image-panel-content">
                            {originalImage ? (
                                <ZoomableImage 
                                    src={originalImage.src} 
                                    alt="Original" 
                                    className="max-w-full max-h-full object-contain"
                                    imageType="original"
                                    zoomSync={zoomSync}
                                    showMinimap={true}
                                />
                            ) : (
                                <div className="text-gray-500 text-center">
                                    <Upload size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>Upload an image to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="image-panel">
                        <div className="image-panel-header">
                            <h2 className="text-lg font-bold">Processed</h2>
                        </div>
                        <div className="image-panel-content">
                            {processedImage ? (
                                <ZoomableImage 
                                    src={processedImage} 
                                    alt="Processed" 
                                    className="max-w-full max-h-full object-contain"
                                    imageType="processed"
                                    zoomSync={zoomSync}
                                    showMinimap={true}
                                />
                            ) : originalImage ? (
                                <div className="text-gray-500">Apply functions to see results</div>
                            ) : (
                                <div className="text-gray-500">No processing applied</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Python Code Area (Middle 25%, toggleable) */}
                <div className={`code-area ${showCode ? '' : 'hidden'}`}>
                    <div className="panel-header p-4">
                        <div className="flex items-center justify-between">
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
                    </div>
                    <div className="panel-content flex-1 overflow-y-auto p-4">
                        <pre className="bg-gray-900 p-4 rounded text-sm text-green-400 overflow-x-auto">
                            <code>{pythonCode}</code>
                        </pre>
                    </div>
                </div>

                {/* OCR Results Area (Bottom 25%, toggleable) */}
                <div className={`ocr-area ${showOCR ? '' : 'hidden'}`}>
                    <div className="panel-header p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="ocr-badge">OCR</span>
                            Tesseract Results
                        </h3>
                    </div>
                    <div className="panel-content flex-1 overflow-y-auto p-4">
                        {ocrProgress > 0 && ocrProgress < 100 && (
                            <div className="mb-4">
                                <div className="progress-container">
                                    <div className="progress-bar" style={{width: `${ocrProgress}%`}}></div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Processing: {ocrProgress.toFixed(1)}%</p>
                            </div>
                        )}
                        {ocrResult ? (
                            <div className="ocr-result">
                                {ocrResult}
                            </div>
                        ) : (
                            <div className="text-gray-500 text-sm">
                                No OCR results yet. Make sure Tesseract is enabled and an image is uploaded.
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* Right Column */}
            <div className="right-column">
                {/* Applied Functions Area (Top 60%) */}
                <div className="applied-functions-area">
                    <div className="panel-header p-4">
                        <h2 className="text-lg font-bold">Applied Functions</h2>
                    </div>
                    <div className="panel-content flex-1 overflow-y-auto p-4">
                        {appliedFunctions.length === 0 ? (
                            <div className="text-gray-500 text-sm text-center p-4">
                                No functions applied yet <br />
                                Drag to reorder
                            </div>
                        ) : (
                            appliedFunctions.map((func, index) => (
                                <div
                                    key={index}
                                    draggable={func.id !== 'tesseract'}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    className={`applied-function-card p-3 mb-2 transition-colors ${
                                        func.id === 'tesseract' ? 'cursor-default' : 'cursor-move'
                                    } ${
                                        selectedFunction === index ? 'selected' : ''
                                    } ${draggedIndex === index ? 'dragging' : ''}`}
                                    onClick={() => setSelectedFunction(index)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {func.id !== 'tesseract' && <GripVertical size={14} className="text-gray-400" />}
                                            {func.id === 'tesseract' && <FileText size={14} className="text-indigo-400" />}
                                            <span className="text-sm font-medium">{func.name}</span>
                                            {func.id === 'tesseract' && (
                                                <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded">OCR</span>
                                            )}
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
                                        {func.id === 'tesseract' && ' • Processes final image'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Function Properties Area (Bottom 40%) */}
                <div className="function-properties-area">
                    <div className="panel-header p-4">
                        <h2 className="text-lg font-bold">Function Properties</h2>
                    </div>
                    <div className="panel-content flex-1 overflow-y-auto p-4">
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
                    
                    console.log('✅ Tesseract.js v5+ API available');
                } else {
                    console.warn('⚠️ Tesseract.createWorker not available');
                }
            } catch (e) {
                console.error('❌ Tesseract check failed:', e);
            }
        }
    }, 2000);
});
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
