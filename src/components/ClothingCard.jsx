import React, { useState } from 'react';
import { Trash2, Tag } from 'lucide-react';
import { deleteClothingItem } from '../lib/api';

const ClothingCard = ({ item, viewMode, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this item?')) return;

    try {
      setDeleting(true);
      await deleteClothingItem(item.id);
      onDelete();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const tags = [
    item.category,
    item.color,
    item.style,
    item.fit
  ].filter(Boolean);

  if (viewMode === 'list') {
    return (
      <div className="card" style={styles.listCard}>
        <img
          src={item.imageUrl || 'https://via.placeholder.com/150'}
          alt={item.category}
          style={styles.listImage}
        />
        <div style={styles.listInfo}>
          <h3 style={styles.listTitle}>{item.category}</h3>
          <div style={styles.tags}>
            {tags.map((tag, index) => (
              <span key={index} style={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button
          style={styles.deleteBtn}
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={styles.gridCard}>
      <div style={styles.imageContainer}>
        <img
          src={item.imageUrl || 'https://via.placeholder.com/300x400'}
          alt={item.category}
          style={styles.gridImage}
        />
        <button
          style={styles.deleteOverlay}
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 size={20} />
        </button>
      </div>
      <div style={styles.gridInfo}>
        <h3 style={styles.gridTitle}>{item.category}</h3>
        <div style={styles.tags}>
          {tags.slice(0, 3).map((tag, index) => (
            <span key={index} style={styles.tag}>
              <Tag size={12} />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  listCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '16px'
  },
  listImage: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    background: 'var(--surface-light)'
  },
  listInfo: {
    flex: 1
  },
  listTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
    textTransform: 'capitalize'
  },
  gridCard: {
    padding: 0,
    overflow: 'hidden'
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '133%',
    background: 'var(--surface-light)',
    overflow: 'hidden'
  },
  gridImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  deleteOverlay: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(239, 68, 68, 0.9)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    cursor: 'pointer'
  },
  gridInfo: {
    padding: '16px'
  },
  gridTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '8px',
    textTransform: 'capitalize'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: 'var(--surface-light)',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#cbd5e1',
    textTransform: 'capitalize'
  },
  deleteBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'var(--surface-light)',
    color: 'var(--error)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease'
  }
};

export default ClothingCard;