import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Sparkles, Store, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

const Header = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/wardrobe', label: 'My Wardrobe' },
    { path: '/recommendations', label: 'Get Outfits' },
    { path: '/shop', label: 'Shop' }
  ];

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoText}>What</span>
          <span style={styles.logoAccent}>robe</span>
        </Link>

        <div style={styles.rightSection}>
          <nav style={styles.nav}>
            {navItems.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                style={{
                  ...styles.navLink,
                  ...(location.pathname === path ? styles.navLinkActive : {})
                }}
              >
                <span style={styles.navLabel}>{label}</span>
              </Link>
            ))}
          </nav>

          <div style={styles.userSection}>
            {user ? (
              <div style={styles.userMenu}>
                <img 
                  src={user.picture} 
                  alt={user.name}
                  style={styles.avatar}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8b5cf6&color=fff`;
                  }}
                />
                <span style={styles.userName}>{user.name}</span>
                <button 
                  style={styles.signOutBtn}
                  onClick={signOut}
                  title="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                style={styles.signInBtn}
                onClick={() => setShowLogin(true)}
              >
                <User size={18} />
                Sign In
              </button>
            )}
          </div>
        </div>

        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </div>
    </header>
  );
};

const styles = {
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  logoText: {
    color: '#f1f5f9'
  },
  logoAccent: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  nav: {
    display: 'flex',
    gap: '8px'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    color: '#cbd5e1'
  },
  navLinkActive: {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
    color: '#f1f5f9'
  },
  navLabel: {
    fontSize: '14px',
    fontWeight: '500'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center'
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px'
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.2)'
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#f1f5f9'
  },
  signOutBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease'
  },
  signInBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  }
};

export default Header;