import { Heart, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-brand">
            <h3 className="footer-brand-title">Whatrobe</h3>
            <p className="footer-brand-description">
              Get trending outfit recommendations based on your wardrobe for the right occasion.
            </p>
            <div className="footer-social-links">
              <a href="https://github.com/darthvader58/whatrobe" className="footer-social-link" target="_blank" rel="noopener noreferrer">
                <Github size={20} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="footer-section">
            <h4 className="footer-section-title">Product</h4>
            <ul className="footer-link-list">
              <li><Link to="/" className="footer-link">Home</Link></li>
              <li><Link to="/wardrobe" className="footer-link">My Wardrobe</Link></li>
              <li><Link to="/recommendations" className="footer-link">Recommendations</Link></li>
              <li><Link to="/shop" className="footer-link">Shop</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="footer-section">
            <h4 className="footer-section-title">Support</h4>
            <ul className="footer-link-list">
              <li><Link to="/feedback" className="footer-link">Feedback</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p className="footer-copyright">
              © 2025 Whatrobe. All rights reserved.
            </p>
          </div>
          <div className="footer-bottom-right">
            <p className="footer-made-with">
              Made with &lt;3 by Shashwat Raj
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;