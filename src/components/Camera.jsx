import React, { useRef, useState, useEffect } from 'react';
import { Camera as CameraIcon } from 'lucide-react';
import '../styles/Camera.css';

const Camera = ({ onCapture }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      onCapture(blob);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  if (error) {
    return (
      <div className="camera-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="camera-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="camera-video"
      />
      <button
        className="capture-btn"
        onClick={capturePhoto}
      >
        <CameraIcon size={32} />
      </button>
    </div>
  );
};

export default Camera;