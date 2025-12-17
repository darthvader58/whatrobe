import React from 'react';
import { X, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginModal = ({ onClose }) => {
  const { signIn } = useAuth();

  React.useEffect(() => {
    // Listen for successful sign-in to close modal
    const handleSignIn = () => {
      onClose();
    };
    
    window.addEventListener('userSignedIn', handleSignIn);
    
    // Trigger Google button rendering when modal opens
    const timer = setTimeout(() => {
      if (window.google && window.google.accounts) {
        const buttonElement = document.getElementById('google-signin-button');
        if (buttonElement) {
          window.google.accounts.id.renderButton(buttonElement, { 
            theme: 'outline', 
            size: 'large',
            width: 300,
            text: 'continue_with'
          });
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('userSignedIn', handleSignIn);
    };
  }, [onClose]);

  const handleGoogleSignIn = () => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <div style={styles.content}>
          <div style={styles.icon}>
            <User size={48} />
          </div>
          
          <h2 style={styles.title}>Welcome to Whatrobe</h2>
          <p style={styles.subtitle}>
            Sign in to save your wardrobe and get personalized outfit recommendations
          </p>

          <div id="google-signin-button" style={styles.googleBtnContainer}></div>
          
          <button style={styles.fallbackBtn} onClick={handleGoogleSignIn}>
            <svg width="20" height="20" viewBox="0 0 24 24" style={styles.googleIcon}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google (Fallback)
          </button>

          <p style={styles.privacy}>
            We'll never post anything without your permission
          </p>
        </div>
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
    zIndex: 9999,
    padding: '20px',
    minHeight: '100vh',
    boxSizing: 'border-box'
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    position: 'relative',
    border: '1px solid var(--surface-light)',
    textAlign: 'center',
    margin: 'auto',
    transform: 'translateY(0)',
    maxHeight: '90vh',
    overflow: 'auto'
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px'
  },
  icon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0
  },
  subtitle: {
    fontSize: '16px',
    color: '#cbd5e1',
    margin: 0,
    lineHeight: '1.5'
  },
  googleBtnContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  fallbackBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    padding: '16px 24px',
    background: 'white',
    color: '#1f2937',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    border: '1px solid #e5e7eb'
  },
  googleIcon: {
    flexShrink: 0
  },
  privacy: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0
  }
};

export default LoginModal;