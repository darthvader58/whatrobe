import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <p style={styles.text}>
          Made with &lt;3 by Shashwat Raj
        </p>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    background: 'var(--surface)',
    borderTop: '1px solid var(--surface-light)',
    padding: '20px 0',
    marginTop: 'auto',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    textAlign: 'center',
  },
  text: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  }
};

export default Footer;