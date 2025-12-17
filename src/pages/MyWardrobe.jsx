import React, { useState, useEffect } from 'react';
import { Plus, Grid, List, Heart, ShoppingBag } from 'lucide-react';
import UploadModal from '../components/UploadModal';
import Wardrobe from '../components/Wardrobe';
import OutfitCard from '../components/OutfitCard';
import { getClothingItems, getFavoriteOutfits, deleteFavoriteOutfit } from '../lib/api';

const MyWardrobe = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [items, setItems] = useState([]);
  const [favoriteOutfits, setFavoriteOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('clothes'); // 'clothes' or 'outfits'

  useEffect(() => {
    loadItems();
    loadFavoriteOutfits();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      console.log('Loading clothing items...');
      const data = await getClothingItems();
      console.log('Loaded items:', data);
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load items:', error);
      setItems([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteOutfits = async () => {
    try {
      const data = await getFavoriteOutfits();
      console.log('Loaded favorite outfits:', data);
      setFavoriteOutfits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load favorite outfits:', error);
      setFavoriteOutfits([]);
    }
  };

  const handleDeleteOutfit = async (outfitId) => {
    if (!confirm('Remove this outfit from favorites?')) return;
    
    try {
      await deleteFavoriteOutfit(outfitId);
      loadFavoriteOutfits();
    } catch (error) {
      console.error('Failed to delete outfit:', error);
      alert('Failed to remove outfit. Please try again.');
    }
  };

  const handleUploadSuccess = () => {
    loadItems();
    setIsUploadOpen(false);
  };

  const categories = ['all', 'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.category === filter);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Wardrobe</h1>
          <p style={styles.subtitle}>
            {items.length} {items.length === 1 ? 'item' : 'items'} • {favoriteOutfits.length} saved {favoriteOutfits.length === 1 ? 'outfit' : 'outfits'}
          </p>
        </div>
        <div style={styles.actions}>
          {activeTab === 'clothes' && (
            <>
              <div style={styles.viewToggle}>
                <button
                  style={{
                    ...styles.viewBtn,
                    ...(viewMode === 'grid' ? styles.viewBtnActive : {})
                  }}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid size={18} />
                </button>
                <button
                  style={{
                    ...styles.viewBtn,
                    ...(viewMode === 'list' ? styles.viewBtnActive : {})
                  }}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setIsUploadOpen(true)}
              >
                <Plus size={20} />
                Add Clothes
              </button>
            </>
          )}
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'clothes' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('clothes')}
        >
          <ShoppingBag size={18} />
          Clothes
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'outfits' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('outfits')}
        >
          <Heart size={18} />
          Saved Outfits
        </button>
      </div>

      {activeTab === 'clothes' ? (
        <>
          <div style={styles.filters}>
            {categories.map(category => (
              <button
                key={category}
                style={{
                  ...styles.filterBtn,
                  ...(filter === category ? styles.filterBtnActive : {})
                }}
                onClick={() => setFilter(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={styles.loading}>
              <div className="loading"></div>
              <p style={styles.loadingText}>Loading your wardrobe...</p>
            </div>
          ) : (
            <Wardrobe items={filteredItems} viewMode={viewMode} onRefresh={loadItems} />
          )}
        </>
      ) : (
        <div style={styles.outfitsGrid}>
          {favoriteOutfits.length === 0 ? (
            <div className="card" style={styles.emptyOutfits}>
              <Heart size={48} style={{color: 'var(--primary)', opacity: 0.5}} />
              <h3 style={styles.emptyTitle}>No saved outfits yet</h3>
              <p style={styles.emptyText}>
                Swipe right on outfit recommendations to save them here!
              </p>
            </div>
          ) : (
            favoriteOutfits.map(outfit => (
              <div key={outfit.id} style={styles.outfitWrapper}>
                <OutfitCard outfit={outfit} />
                <button
                  style={styles.deleteOutfitBtn}
                  onClick={() => handleDeleteOutfit(outfit.id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
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
  actions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  viewToggle: {
    display: 'flex',
    background: 'var(--surface)',
    borderRadius: '10px',
    padding: '4px',
    gap: '4px'
  },
  viewBtn: {
    padding: '8px 12px',
    borderRadius: '8px',
    color: '#cbd5e1',
    transition: 'all 0.3s ease'
  },
  viewBtnActive: {
    background: 'var(--surface-light)',
    color: '#f1f5f9'
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    flexWrap: 'wrap'
  },
  filterBtn: {
    padding: '10px 20px',
    borderRadius: '20px',
    background: 'var(--surface)',
    color: '#cbd5e1',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    border: '2px solid transparent'
  },
  filterBtnActive: {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
    color: '#f1f5f9',
    borderColor: 'var(--primary)'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: '20px'
  },
  loadingText: {
    fontSize: '16px',
    color: '#cbd5e1'
  },
  tabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    borderBottom: '2px solid var(--surface-light)',
    paddingBottom: '0'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'transparent',
    color: '#cbd5e1',
    fontSize: '16px',
    fontWeight: '500',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    transition: 'all 0.3s ease'
  },
  tabActive: {
    color: '#f1f5f9',
    borderBottomColor: 'var(--primary)'
  },
  outfitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px'
  },
  outfitWrapper: {
    position: 'relative'
  },
  deleteOutfitBtn: {
    marginTop: '12px',
    width: '100%',
    padding: '10px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  emptyOutfits: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '80px 40px'
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '20px 0 12px'
  },
  emptyText: {
    fontSize: '16px',
    color: '#cbd5e1',
    lineHeight: '1.6'
  }
};

export default MyWardrobe;