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

  privacy: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0
  }
};

export default LoginModal;