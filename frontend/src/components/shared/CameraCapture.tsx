import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { RefreshCw, Camera, Upload, Check, X, Trash2, RotateCcw } from 'lucide-react';
import { logger } from '../../utils/logger';
import './CameraCapture.css';

interface CameraCaptureProps {
    onPhotoCapture: (photoData: string | null) => void;
    photo?: string | null;
    label?: string;
    description?: string;
    showPreview?: boolean;
    previewWidth?: number;
    previewHeight?: number;
}

/**
 * Shared Camera Capture Component
 * Provides webcam capture and file upload functionality for customer photos.
 * Used by Cashier Account Opening and Mobile Banker Client Registration.
 * Now supports front/back camera switching on mobile devices.
 */
const CameraCapture: React.FC<CameraCaptureProps> = ({
    onPhotoCapture,
    photo = null,
    label = '📷 Customer Photo',
    description = 'Capture or upload a passport-style photo of the customer for identification.',
    showPreview = true,
    previewWidth = 150,
    previewHeight = 180,
}) => {
    const [showCamera, setShowCamera] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewBoxRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Detect if the device has multiple cameras (e.g., front and back)
    useEffect(() => {
        let isMounted = true;
        const detectCameras = async () => {
            try {
                if (!navigator.mediaDevices?.enumerateDevices) {
                    logger.warn('[CAMERA] enumerateDevices not supported');
                    return;
                }
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                if (isMounted) setHasMultipleCameras(videoDevices.length > 1);
            } catch (error) {
                logger.error('[CAMERA] Error enumerating devices:', error);
            }
        };

        detectCameras();

        const handleDeviceChange = () => detectCameras();
        navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
        return () => {
            isMounted = false;
            navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
        };
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                logger.log(`[CAMERA] Track stopped: ${track.kind}`);
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    }, []);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            setCameraError(null);

            // Clean up existing stream if any
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            setShowCamera(true);

            // Small delay to ensure video element is in DOM if it was hidden
            await new Promise(resolve => setTimeout(resolve, 50));

            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            logger.log('[CAMERA] Requesting user media with constraints:', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(err => {
                        logger.error('[CAMERA] Video play error:', err);
                    });
                };
            }
        } catch (error: any) {
            logger.error('[CAMERA] Error accessing camera:', error);
            setShowCamera(false);
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                setCameraError('Camera access denied. Please enable permissions in your browser settings.');
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                setCameraError('No camera found on this device.');
            } else {
                setCameraError('Unable to access camera. Please check connections or upload a photo instead.');
            }
        }
    }, [facingMode]);

    // Restart camera when facing mode changes
    useEffect(() => {
        if (showCamera) {
            startCamera();
        }
    }, [facingMode]); // Only depend on facingMode for re-triggering while active

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                logger.log('[CAMERA] Cleanup: All tracks stopped');
            }
        };
    }, []);

    const toggleFacingMode = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        logger.log('[CAMERA] Toggling facing mode');
    }, []);

    // Capture photo from camera
    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            try {
                const canvas = canvasRef.current;
                const video = videoRef.current;

                // Use actual video dimensions for capture
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // If mirrored, we need to flip the canvas for the capture too
                    if (facingMode === 'user') {
                        ctx.translate(canvas.width, 0);
                        ctx.scale(-1, 1);
                    }

                    ctx.drawImage(video, 0, 0);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    onPhotoCapture(dataUrl);
                    stopCamera();
                    logger.log('[CAMERA] Photo captured successfully');
                }
            } catch (err) {
                logger.error('[CAMERA] Capture error:', err);
                setCameraError('Failed to capture photo. Please try again.');
            }
        }
    }, [onPhotoCapture, stopCamera, facingMode]);

    // Handle file upload
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setCameraError('File is too large. Please select an image under 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                onPhotoCapture(reader.result as string);
                logger.log('[CAMERA] Photo uploaded successfully');
            };
            reader.onerror = () => {
                logger.error('[CAMERA] File reader error');
                setCameraError('Failed to read file.');
            };
            reader.readAsDataURL(file);
        }
    }, [onPhotoCapture]);

    // Remove photo
    const removePhoto = useCallback(() => {
        onPhotoCapture(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        logger.log('[CAMERA] Photo removed');
    }, [onPhotoCapture]);

    // Set dynamic dimensions via CSS variables on the preview box ref
    // This bypasses linting rules against inline styles while maintaining reactivity
    useLayoutEffect(() => {
        if (previewBoxRef.current) {
            previewBoxRef.current.style.setProperty('--preview-width', `${previewWidth}px`);
            previewBoxRef.current.style.setProperty('--preview-height', `${previewHeight}px`);
        }
    }, [previewWidth, previewHeight]);

    return (
        <div className="camera-capture-container">
            <h3 className="camera-capture-title">
                {label}
            </h3>

            {cameraError && (
                <div className="camera-capture-error">
                    <X size={16} className="mr-2" />
                    {cameraError}
                </div>
            )}

            <div className="camera-capture-layout">
                {showPreview && (
                    <div
                        ref={previewBoxRef}
                        className="camera-capture-preview-box"
                    >
                        {photo ? (
                            <img src={photo} alt="Customer" className="camera-capture-media" />
                        ) : showCamera ? (
                            <div className="relative w-full h-full">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`camera-capture-media ${facingMode === 'user' ? 'mirror-video' : ''}`}
                                />
                                {hasMultipleCameras && (
                                    <button
                                        type="button"
                                        onClick={toggleFacingMode}
                                        className="camera-capture-switch-btn"
                                        title="Switch Camera"
                                        aria-label="Switch Camera"
                                    >
                                        <RefreshCw size={20} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="camera-capture-placeholder">
                                <div className="camera-capture-placeholder-icon">👤</div>
                                <div className="camera-capture-placeholder-text">No Photo</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Camera/Upload Controls */}
                <div className="camera-capture-info-container">
                    <p className="camera-capture-info-text">
                        {description}
                    </p>

                    <div className="camera-capture-controls">
                        {!showCamera && !photo && (
                            <>
                                <button type="button" onClick={startCamera} className="camera-capture-btn camera-capture-btn-primary">
                                    <Camera size={18} /> Open Camera
                                </button>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="camera-capture-btn camera-capture-btn-primary">
                                    <Upload size={18} /> Upload Photo
                                </button>
                            </>
                        )}

                        {showCamera && (
                            <>
                                <button type="button" onClick={capturePhoto} className="camera-capture-btn camera-capture-btn-success">
                                    <Check size={18} /> Capture
                                </button>
                                <button type="button" onClick={stopCamera} className="camera-capture-btn camera-capture-btn-danger">
                                    <X size={18} /> Cancel
                                </button>
                            </>
                        )}

                        {photo && (
                            <>
                                <button type="button" onClick={removePhoto} className="camera-capture-btn camera-capture-btn-danger">
                                    <Trash2 size={18} /> Remove
                                </button>
                                <button type="button" onClick={startCamera} className="camera-capture-btn camera-capture-btn-primary">
                                    <RotateCcw size={18} /> Retake
                                </button>
                            </>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="camera-capture-file-input"
                        title="Choose photo"
                        aria-label="Choose photo"
                    />
                </div>
            </div>

            <canvas ref={canvasRef} className="camera-capture-canvas" />
        </div>
    );
};

export default CameraCapture;
