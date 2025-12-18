import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Upload, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Upload,
      title: 'Upload Your Wardrobe',
      description: 'Take photos or upload images of your clothes. Our AI automatically tags and categorizes them.'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Suggestions',
      description: 'Get personalized outfit recommendations based on occasion, weather, and your style preferences.'
    },
    {
      icon: Zap,
      title: 'Swipe & Save',
      description: 'Tinder-style interface to quickly approve or skip outfit suggestions. Save your favorites.'
    }
  ];

  return (
    <div style={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={styles.hero}
      >
        <h1 style={styles.title}>
          Your AI-Powered
          <br />
          <span style={styles.titleAccent}>Wardrobe Assistant</span>
        </h1>
        <p style={styles.subtitle}>
          Never wonder what to wear again. Get personalized outfit recommendations
          based on your wardrobe, occasion, and style.
        </p>
        <div style={styles.ctaButtons}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/wardrobe')}
            style={styles.primaryBtn}
          >
            <Upload size={20} />
            Build My Wardrobe
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/recommendations')}
            style={styles.secondaryBtn}
          >
            <Sparkles size={20} />
            Get Outfit Ideas
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={styles.features}
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
            className="card"
            style={styles.featureCard}
          >
            <div style={styles.featureIcon}>
              <feature.icon size={32} />
            </div>
            <h3 style={styles.featureTitle}>{feature.title}</h3>
            <p style={styles.featureDescription}>{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        style={styles.stats}
      >
        <div style={styles.stat}>
          <div style={styles.statNumber}>∞</div>
          <div style={styles.statLabel}>Occasions</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statNumber}>∞</div>
          <div style={styles.statLabel}>Combinations</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statNumber}>∞</div>
          <div style={styles.statLabel}>Fashion Sense</div>
        </div>
      </motion.div>
      
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px'
  },
  hero: {
    textAlign: 'center',
    marginBottom: '80px'
  },
  title: {
    fontSize: 'clamp(36px, 8vw, 64px)',
    fontWeight: 'bold',
    marginBottom: '24px',
    lineHeight: '1.2'
  },
  titleAccent: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    fontSize: '20px',
    color: '#cbd5e1',
    maxWidth: '600px',
    margin: '0 auto 40px',
    lineHeight: '1.6'
  },
  ctaButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryBtn: {
    fontSize: '18px',
    padding: '16px 32px'
  },
  secondaryBtn: {
    fontSize: '18px',
    padding: '16px 32px'
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '80px'
  },
  featureCard: {
    textAlign: 'center'
  },
  featureIcon: {
    width: '64px',
    height: '64px',
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
    borderRadius: '16px',
    color: '#8b5cf6'
  },
  featureTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '12px'
  },
  featureDescription: {
    fontSize: '16px',
    color: '#cbd5e1',
    lineHeight: '1.6'
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '60px',
    flexWrap: 'wrap'
  },
  stat: {
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '16px',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  }
};

export default Home;