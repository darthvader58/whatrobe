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

    // Initialize Google Sign-In with a delay to ensure the script is loaded
    const initializeGoogle = () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_OAUTHID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (error) {
          console.error('Error initializing Google Sign-In:', error);
        }
      } else {
        setTimeout(initializeGoogle, 100);
      }
    };
    
    initializeGoogle();
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      const anonymousSessionId = sessionStorage.getItem('anonymous_session_id');
      
      const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8787/api/auth/google'
        : 'https://whatrobe-api.rajayshashwat.workers.dev/api/auth/google';
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: response.credential }),
      });
      
      if (res.ok) {
        const userData = await res.json();
        
        // If there was an anonymous session, migrate the data
        if (anonymousSessionId && userData.user.id !== anonymousSessionId) {
          try {
            const migrationResponse = await fetch(`${apiUrl.replace('/auth/google', '/migrate/user-data')}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fromUserId: anonymousSessionId,
                toUserId: userData.user.id
              }),
            });
            
            if (!migrationResponse.ok) {
              console.error('Data migration failed:', await migrationResponse.text());
            }
          } catch (migrationError) {
            console.error('Error during data migration:', migrationError);
          }
        }
        
        setUser(userData.user);
        localStorage.setItem('user', JSON.stringify(userData.user));
        sessionStorage.removeItem('anonymous_session_id');
        
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
    if (window.google && window.google.accounts) {
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