import React, { useState } from 'react';
import { X, Upload, Camera as CameraIcon } from 'lucide-react';
import Camera from './Camera';
import { uploadClothingItem } from '../lib/api';

const UploadModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState('choose'); // 'choose', 'camera', 'upload'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStep('preview');
    }
  };

  const handleCapture = (blob) => {
    setFile(blob);
    setPreview(URL.createObjectURL(blob));
    setStep('preview');
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      await uploadClothingItem(file);
      onSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <h2 style={styles.title}>Add to Wardrobe</h2>

        {step === 'choose' && (
          <div style={styles.chooseContainer}>
            <button
              style={styles.optionBtn}
              onClick={() => setStep('camera')}
            >
              <CameraIcon size={48} />
              <span style={styles.optionText}>Take Photo</span>
            </button>

            <label style={styles.optionBtn}>
              <Upload size={48} />
              <span style={styles.optionText}>Upload Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{display: 'none'}}
              />
            </label>
          </div>
        )}

        {step === 'camera' && (
          <div style={styles.cameraContainer}>
            <Camera onCapture={handleCapture} />
            <button
              className="btn btn-secondary"
              onClick={() => setStep('choose')}
              style={{marginTop: '16px'}}
            >
              Back
            </button>
          </div>
        )}

        {step === 'preview' && preview && (
          <div style={styles.previewContainer}>
            <img src={preview} alt="Preview" style={styles.previewImage} />
            <div style={styles.previewActions}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setStep('choose');
                }}
              >
                Retake
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? <div className="loading"></div> : 'Upload'}
              </button>
            </div>
            <p style={styles.aiNote}>
              Our AI will automatically tag this item with category, color, style, and fit information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    border: '1px solid var(--surface-light)'
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'var(--surface-light)',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.3s ease'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '32px',
    textAlign: 'center'
  },
  chooseContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  optionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '48px 32px',
    background: 'var(--surface-light)',
    borderRadius: '16px',
    color: 'var(--text)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '2px solid transparent'
  },
  optionText: {
    fontSize: '18px',
    fontWeight: '600'
  },
  cameraContainer: {
    textAlign: 'center'
  },
  previewContainer: {
    textAlign: 'center'
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '12px',
    marginBottom: '24px'
  },
  previewActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  aiNote: {
    fontSize: '14px',
    color: '#cbd5e1',
    fontStyle: 'italic'
  }
};

export default UploadModal;