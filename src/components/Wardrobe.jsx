import React from 'react';
import ClothingCard from './ClothingCard';
import { Shirt } from 'lucide-react';

const Wardrobe = ({ items = [], viewMode, onRefresh }) => {
  console.log('Wardrobe rendering with items:', items);
  
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div style={styles.empty}>
        <div className="card" style={styles.emptyCard}>
          <Shirt size={64} style={{color: 'var(--primary)', opacity: 0.5}} />
          <h3 style={styles.emptyTitle}>Your wardrobe is empty</h3>
          <p style={styles.emptyText}>
            Start adding your clothes to get personalized outfit recommendations!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.grid,
      ...(viewMode === 'list' ? styles.gridList : {})
    }}>
      {items.map(item => {
        try {
          return (
            <ClothingCard
              key={item.id}
              item={item}
              viewMode={viewMode}
              onDelete={onRefresh}
            />
          );
        } catch (error) {
          console.error('Error rendering clothing card:', error, item);
          return null;
        }
      })}
    </div>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '24px'
  },
  gridList: {
    gridTemplateColumns: '1fr'
  },
  empty: {
    display: 'flex',
    justifyContent: 'center',
    padding: '80px 20px'
  },
  emptyCard: {
    textAlign: 'center',
    maxWidth: '400px',
    padding: '60px 40px'
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

export default Wardrobe;