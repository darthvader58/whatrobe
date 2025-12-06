import React, { useState } from 'react';
import { ExternalLink, ShoppingCart, TrendingUp } from 'lucide-react';

const Shop = () => {
  const [loading] = useState(false);

  // Placeholder data - in production, this would come from your API
  const suggestions = [
    {
      id: 1,
      name: 'Classic White T-Shirt',
      price: '$29.99',
      image: 'https://via.placeholder.com/300x400/6366f1/ffffff?text=White+Tee',
      brand: 'Example Brand',
      matchScore: 95,
      link: 'https://amazon.com'
    },
    {
      id: 2,
      name: 'Slim Fit Jeans',
      price: '$79.99',
      image: 'https://via.placeholder.com/300x400/8b5cf6/ffffff?text=Jeans',
      brand: 'Denim Co.',
      matchScore: 92,
      link: 'https://amazon.com'
    },
    {
      id: 3,
      name: 'Leather Sneakers',
      price: '$129.99',
      image: 'https://via.placeholder.com/300x400/ec4899/ffffff?text=Sneakers',
      brand: 'Shoe Brand',
      matchScore: 88,
      link: 'https://amazon.com'
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Shop Recommendations</h1>
          <p style={styles.subtitle}>
            Curated items that match your style and wardrobe
          </p>
        </div>
      </div>

      <div className="card" style={styles.comingSoon}>
        <ShoppingCart size={48} style={{color: 'var(--primary)'}} />
        <h2 style={styles.comingSoonTitle}>Coming Soon!</h2>
        <p style={styles.comingSoonText}>
          We're working on bringing you personalized shopping recommendations
          from top brands and retailers. Soon you'll be able to:
        </p>
        <ul style={styles.featureList}>
          <li style={styles.featureItem}>
            <TrendingUp size={20} style={{color: 'var(--primary)', flexShrink: 0}} />
            <span>Get AI-powered recommendations based on your wardrobe</span>
          </li>
          <li style={styles.featureItem}>
            <TrendingUp size={20} style={{color: 'var(--primary)', flexShrink: 0}} />
            <span>Find items that complete your existing outfits</span>
          </li>
          <li style={styles.featureItem}>
            <TrendingUp size={20} style={{color: 'var(--primary)', flexShrink: 0}} />
            <span>Shop directly from Amazon and top fashion retailers</span>
          </li>
        </ul>
      </div>

      <div style={styles.preview}>
        <h3 style={styles.previewTitle}>Preview: What's Coming</h3>
        <div style={styles.grid}>
          {suggestions.map(item => (
            <div key={item.id} className="card" style={styles.productCard}>
              <div style={styles.imageContainer}>
                <img src={item.image} alt={item.name} style={styles.image} />
                <div style={styles.matchBadge}>
                  {item.matchScore}% Match
                </div>
              </div>
              <div style={styles.productInfo}>
                <h4 style={styles.productName}>{item.name}</h4>
                <p style={styles.productBrand}>{item.brand}</p>
                <div style={styles.productFooter}>
                  <span style={styles.price}>{item.price}</span>
                  <button className="btn btn-primary" style={styles.shopBtn} disabled>
                    <ExternalLink size={16} />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '32px'
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
  comingSoon: {
    textAlign: 'center',
    padding: '60px 40px',
    marginBottom: '48px'
  },
  comingSoonTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '20px 0 16px'
  },
  comingSoonText: {
    fontSize: '18px',
    color: '#cbd5e1',
    marginBottom: '32px',
    maxWidth: '600px',
    margin: '0 auto 32px'
  },
  featureList: {
    listStyle: 'none',
    maxWidth: '500px',
    margin: '0 auto',
    textAlign: 'left'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 0',
    fontSize: '16px',
    color: '#cbd5e1'
  },
  preview: {
    marginTop: '48px'
  },
  previewTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    textAlign: 'center'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px'
  },
  productCard: {
    overflow: 'hidden',
    padding: '0'
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '133%',
    background: 'var(--surface-light)'
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  matchBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  productInfo: {
    padding: '20px'
  },
  productName: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  productBrand: {
    fontSize: '14px',
    color: '#cbd5e1',
    marginBottom: '12px'
  },
  productFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  price: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'var(--primary)'
  },
  shopBtn: {
    padding: '8px 16px',
    fontSize: '14px'
  }
};

export default Shop;