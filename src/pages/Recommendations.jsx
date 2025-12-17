import React, { useState, useEffect } from 'react';
import { Sparkles, Settings } from 'lucide-react';
import SwipeCard from '../components/SwipeCard';
import { getOutfitRecommendations } from '../lib/api';

const Recommendations = () => {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [preferences, setPreferences] = useState({
    occasion: 'casual',
    style: 'comfortable',
    weather: 'moderate'
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [preferences]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      console.log('Loading recommendations with preferences:', preferences);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Current user:', user);
      
      const data = await getOutfitRecommendations(preferences);
      console.log('Received outfit data:', data);
      
      setOutfits(Array.isArray(data) ? data : []);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setOutfits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    if (direction === 'right') {
      // Save outfit as favorite
      try {
        const { saveFavoriteOutfit } = await import('../lib/api');
        await saveFavoriteOutfit(outfits[currentIndex]);
        console.log('Saved outfit:', outfits[currentIndex]);
      } catch (error) {
        console.error('Failed to save outfit:', error);
      }
    }
    
    if (currentIndex < outfits.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Load more recommendations
      loadRecommendations();
    }
  };

  const occasions = ['casual', 'formal', 'business', 'party', 'athletic', 'date night', 'travel'];
  const styles = ['comfortable', 'trendy', 'classic', 'minimalist', 'bold', 'elegant'];
  const weathers = ['hot', 'warm', 'moderate', 'cool', 'cold'];

  return (
    <div style={stylesObj.container}>
      <div style={stylesObj.header}>
        <div>
          <h1 style={stylesObj.title}>Outfit Recommendations</h1>
          <p style={stylesObj.subtitle}>
            Swipe right to save, left to skip
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings size={20} />
          Preferences
        </button>
      </div>

      {showSettings && (
        <div className="card" style={stylesObj.settings}>
          <h3 style={stylesObj.settingsTitle}>Customize Your Recommendations</h3>
          
          <div style={stylesObj.settingGroup}>
            <label style={stylesObj.label}>Occasion</label>
            <select
              style={stylesObj.select}
              value={preferences.occasion}
              onChange={(e) => setPreferences({...preferences, occasion: e.target.value})}
            >
              {occasions.map(occ => (
                <option key={occ} value={occ}>
                  {occ.charAt(0).toUpperCase() + occ.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={stylesObj.settingGroup}>
            <label style={stylesObj.label}>Style</label>
            <select
              style={stylesObj.select}
              value={preferences.style}
              onChange={(e) => setPreferences({...preferences, style: e.target.value})}
            >
              {styles.map(style => (
                <option key={style} value={style}>
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={stylesObj.settingGroup}>
            <label style={stylesObj.label}>Weather</label>
            <select
              style={stylesObj.select}
              value={preferences.weather}
              onChange={(e) => setPreferences({...preferences, weather: e.target.value})}
            >
              {weathers.map(weather => (
                <option key={weather} value={weather}>
                  {weather.charAt(0).toUpperCase() + weather.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div style={stylesObj.swipeContainer}>
        {loading ? (
          <div style={stylesObj.loading}>
            <div className="loading" style={{width: '40px', height: '40px'}}></div>
            <p style={stylesObj.loadingText}>Creating perfect outfits for you...</p>
          </div>
        ) : outfits.length > 0 && currentIndex < outfits.length ? (
          <SwipeCard
            outfit={outfits[currentIndex]}
            onSwipe={handleSwipe}
          />
        ) : (
          <div className="card" style={stylesObj.empty}>
            <Sparkles size={48} style={{color: 'var(--primary)'}} />
            <h3 style={stylesObj.emptyTitle}>No Outfits Yet</h3>
            <p style={stylesObj.emptyText}>
              Add some clothes to your wardrobe to get personalized recommendations!
            </p>
          </div>
        )}
      </div>

      {outfits.length > 0 && !loading && (
        <div style={stylesObj.progress}>
          <span style={stylesObj.progressText}>
            {currentIndex + 1} / {outfits.length}
          </span>
        </div>
      )}
    </div>
  );
};

const stylesObj = {
  container: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '20px'
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#cbd5e1'
  },
  settings: {
    marginBottom: '32px'
  },
  settingsTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '24px'
  },
  settingGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#cbd5e1'
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'var(--surface-light)',
    border: '2px solid var(--surface-light)',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.3s ease'
  },
  swipeContainer: {
    minHeight: '500px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loading: {
    textAlign: 'center'
  },
  loadingText: {
    marginTop: '20px',
    fontSize: '16px',
    color: '#cbd5e1'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 40px'
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '20px 0 12px'
  },
  emptyText: {
    fontSize: '16px',
    color: '#cbd5e1'
  },
  progress: {
    textAlign: 'center',
    marginTop: '24px'
  },
  progressText: {
    fontSize: '16px',
    color: '#cbd5e1',
    fontWeight: '500'
  }
};

export default Recommendations;