import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [onLoginSuccess, setOnLoginSuccess] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);

    // Initialize Google Sign-In with a delay to ensure the script is loaded
    const initializeGoogle = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_OAUTHID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } else {
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
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: response.credential }),
      });

      console.log('Backend response status:', res.status);
      
      if (res.ok) {
        const userData = await res.json();
        console.log('User data received:', userData);
        setUser(userData.user);
        localStorage.setItem('user', JSON.stringify(userData.user));
        
        // Close any open modals
        const event = new CustomEvent('userSignedIn');
        window.dispatchEvent(event);
      } else {
        const errorData = await res.text();
        console.error('Authentication failed:', errorData);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const signIn = () => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.prompt();
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('user');
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