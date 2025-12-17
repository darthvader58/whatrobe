import React from 'react';
import { Calendar, CloudRain, Sparkles } from 'lucide-react';
import { getImageUrl } from '../lib/api';
import '../styles/OutfitCard.css';

const OutfitCard = ({ outfit }) => {
  return (
    <div className="outfit-card">
      <div className="outfit-images">
        {outfit.items && outfit.items.map((item, index) => (
          <div key={index} className="outfit-item">
            <img
              src={getImageUrl(item.imageUrl)}
              alt={item.category}
              className="outfit-item-image"
              onError={(e) => {
                console.log('Outfit image failed to load:', item.imageUrl, 'processed:', getImageUrl(item.imageUrl));
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
              }}
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