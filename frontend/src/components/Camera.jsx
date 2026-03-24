import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import './Camera.css';

const Camera = forwardRef(function Camera({ onCapture, onError, showOverlay = true }, ref) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setActive(true);
      setError(null);
    } catch (err) {
      const msg = 'Camera access denied. Please allow camera permissions.';
      setError(msg);
      onError?.(msg);
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        onCapture?.(blob);
        resolve(blob);
      }, 'image/jpeg', 0.92);
    });
  }, [onCapture]);

  useImperativeHandle(ref, () => ({ capture, startCamera, stopCamera, isActive: active }), [capture, startCamera, stopCamera, active]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="camera-wrapper">
      {error ? (
        <div className="camera-error">
          <span className="camera-error-icon">📷</span>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={startCamera}>Retry</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="camera-video" playsInline muted />
          {showOverlay && (
            <div className="camera-overlay">
              <div className="camera-face-guide" />
              {!active && <div className="camera-loading">Initialising camera…</div>}
            </div>
          )}
        </>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
});

export default Camera;
