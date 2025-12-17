import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);

    // Debug environment variables
    console.log('Environment check:', {
      VITE_OAUTHID: import.meta.env.VITE_OAUTHID,
      PROD: import.meta.env.PROD,
      DEV: import.meta.env.DEV,
      MODE: import.meta.env.MODE
    });

    // Initialize Google Sign-In with a delay to ensure the script is loaded
    const initializeGoogle = () => {
      console.log('Attempting to initialize Google Sign-In...');
      console.log('window.google available:', !!window.google);
      console.log('window.google.accounts available:', !!(window.google && window.google.accounts));
      
      if (window.google && window.google.accounts) {
        console.log('Initializing Google Sign-In with client ID:', import.meta.env.VITE_OAUTHID);
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_OAUTHID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          console.log('Google Sign-In initialized successfully');
        } catch (error) {
          console.error('Error initializing Google Sign-In:', error);
        }
      } else {
        console.log('Google Sign-In not ready, retrying in 100ms...');
        // Retry after a short delay
        setTimeout(initializeGoogle, 100);
      }
    };
    
    initializeGoogle();
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      console.log('Google credential received:', response);
      console.log('Token length:', response.credential?.length);
      console.log('Token preview:', response.credential?.substring(0, 50) + '...');
      
      // Send the credential to your backend
      const apiUrl = import.meta.env.PROD 
        ? 'https://whatrobe-api.rajayshashwat.workers.dev/api/auth/google'
        : 'http://localhost:8788/api/auth/google';
      
      console.log('Using API URL:', apiUrl);
      console.log('Environment PROD flag:', import.meta.env.PROD);
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: response.credential }),
      });

      console.log('Backend response status:', res.status);
      console.log('Backend response headers:', Object.fromEntries(res.headers.entries()));
      
      if (res.ok) {
        const userData = await res.json();
        console.log('User data received:', userData);
        setUser(userData.user);
        localStorage.setItem('user', JSON.stringify(userData.user));
        
        // Clear anonymous session data when user signs in
        sessionStorage.removeItem('anonymous_session_id');
        
        // Close any open modals
        const event = new CustomEvent('userSignedIn');
        window.dispatchEvent(event);
      } else {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          errorData = await res.text();
        }
        console.error('Authentication failed:', res.status, errorData);
        const errorMsg = errorData.details || errorData.error || errorData;
        alert(`Authentication failed: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert(`Network error: ${error.message}`);
    }
  };

  const signIn = () => {
    console.log('signIn called');
    console.log('Google available:', !!window.google);
    console.log('Google accounts available:', !!(window.google && window.google.accounts));
    
    if (window.google && window.google.accounts) {
      console.log('Prompting Google Sign-In...');
      window.google.accounts.id.prompt();
    } else {
      console.error('Google Sign-In not available');
      alert('Google Sign-In is not available. Please refresh the page and try again.');
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Clear anonymous session so user gets a fresh anonymous session
    sessionStorage.removeItem('anonymous_session_id');
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};