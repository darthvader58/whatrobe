import React from 'react';
import { Calendar, CloudRain, Sparkles } from 'lucide-react';
import '../styles/OutfitCard.css';

const OutfitCard = ({ outfit }) => {
  return (
    <div className="outfit-card">
      <div className="outfit-images">
        {outfit.items && outfit.items.map((item, index) => (
          <div key={index} className="outfit-item">
            <img
              src={item.imageUrl || 'https://via.placeholder.com/200'}
              alt={item.category}
              className="outfit-item-image"
            />
            <span className="outfit-item-label">{item.category}</span>
          </div>
        ))}
      </div>

      <div className="outfit-info">
        <h3 className="outfit-title">{outfit.name || 'Suggested Outfit'}</h3>
        
        <div className="outfit-tags">
          {outfit.occasion && (
            <div className="outfit-tag">
              <Calendar size={16} />
              <span>{outfit.occasion}</span>
            </div>
          )}
          {outfit.weather && (
            <div className="outfit-tag">
              <CloudRain size={16} />
              <span>{outfit.weather}</span>
            </div>
          )}
          {outfit.style && (
            <div className="outfit-tag">
              <Sparkles size={16} />
              <span>{outfit.style}</span>
            </div>
          )}
        </div>

        {outfit.description && (
          <p className="outfit-description">{outfit.description}</p>
        )}

        {outfit.aiReason && (
          <div className="outfit-ai-reason">
            <strong>Why this works:</strong> {outfit.aiReason}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitCard;