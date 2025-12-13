import React, { useState, useRef, useCallback } from 'react';

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
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            setCameraError(null);
            setShowCamera(true);

            // Small delay to ensure video element is in DOM
            await new Promise(resolve => setTimeout(resolve, 100));

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(console.error);
                };
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setShowCamera(false);
            setCameraError('Unable to access camera. Please check permissions or upload a photo instead.');
        }
    }, []);

    // Capture photo from camera
    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                onPhotoCapture(dataUrl);
                stopCamera();
            }
        }
    }, [onPhotoCapture]);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    }, []);

    // Handle file upload
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onPhotoCapture(reader.result as string);
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
    }, [onPhotoCapture]);

    const buttonBaseStyle: React.CSSProperties = {
        padding: '10px 20px',
        borderRadius: '8px',
        border: '2px solid #2D3436',
        fontWeight: 'bold',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    };

    const primaryButtonStyle: React.CSSProperties = {
        ...buttonBaseStyle,
        backgroundColor: '#6C5CE7',
        color: 'white',
    };

    const successButtonStyle: React.CSSProperties = {
        ...buttonBaseStyle,
        backgroundColor: '#00B894',
        color: 'white',
    };

    const dangerButtonStyle: React.CSSProperties = {
        ...buttonBaseStyle,
        backgroundColor: '#FF7675',
        color: 'white',
    };

    return (
        <div style={{
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#F8F9FA',
            borderRadius: '12px',
            border: '2px dashed #DFE6E9'
        }}>
            <h3 style={{
                margin: '0 0 15px 0',
                color: '#2D3436',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                {label}
            </h3>

            {cameraError && (
                <div style={{
                    padding: '10px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    backgroundColor: '#FFEBEE',
                    color: '#C62828',
                    border: '1px solid #FFCDD2'
                }}>
                    {cameraError}
                </div>
            )}

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {/* Photo Preview */}
                {showPreview && (
                    <div style={{
                        width: `${previewWidth}px`,
                        height: `${previewHeight}px`,
                        backgroundColor: '#E0E0E0',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '3px solid #DFE6E9',
                        flexShrink: 0,
                    }}>
                        {photo ? (
                            <img src={photo} alt="Customer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : showCamera ? (
                            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ textAlign: 'center', color: '#636E72' }}>
                                <div style={{ fontSize: '48px' }}>👤</div>
                                <div style={{ fontSize: '12px' }}>No Photo</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Camera/Upload Controls */}
                <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 15px 0', color: '#636E72', fontSize: '14px' }}>
                        {description}
                    </p>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {!showCamera && !photo && (
                            <>
                                <button type="button" onClick={startCamera} style={primaryButtonStyle}>
                                    📸 Open Camera
                                </button>
                                <button type="button" onClick={() => fileInputRef.current?.click()} style={primaryButtonStyle}>
                                    📁 Upload Photo
                                </button>
                            </>
                        )}

                        {showCamera && (
                            <>
                                <button type="button" onClick={capturePhoto} style={successButtonStyle}>
                                    📷 Capture
                                </button>
                                <button type="button" onClick={stopCamera} style={dangerButtonStyle}>
                                    ✕ Cancel
                                </button>
                            </>
                        )}

                        {photo && (
                            <>
                                <button type="button" onClick={removePhoto} style={dangerButtonStyle}>
                                    🗑️ Remove Photo
                                </button>
                                <button type="button" onClick={startCamera} style={primaryButtonStyle}>
                                    🔄 Retake
                                </button>
                            </>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default CameraCapture;
