import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import OutfitCard from './OutfitCard';
import '../styles/SwipeCard.css';

const SwipeCard = ({ outfit, onSwipe }) => {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event, info) => {
    if (Math.abs(info.offset.x) > 100) {
      setExitX(info.offset.x > 0 ? 200 : -200);
      onSwipe(info.offset.x > 0 ? 'right' : 'left');
    }
  };

  return (
    <div className="swipe-container">
      <motion.div
        className="swipe-card"
        style={{
          x,
          rotate,
          opacity
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={exitX !== 0 ? { x: exitX } : {}}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20
        }}
      >
        <OutfitCard outfit={outfit} />
        
        <div className="swipe-indicators">
          <div className="swipe-indicator swipe-indicator-left">
            <X size={48} />
          </div>
          <div className="swipe-indicator swipe-indicator-right">
            <Heart size={48} />
          </div>
        </div>
      </motion.div>

      <div className="swipe-buttons">
        <button
          className="swipe-btn swipe-btn-reject"
          onClick={() => {
            setExitX(-200);
            onSwipe('left');
          }}
        >
          <X size={28} />
        </button>
        <button
          className="swipe-btn swipe-btn-like"
          onClick={() => {
            setExitX(200);
            onSwipe('right');
          }}
        >
          <Heart size={28} />
        </button>
      </div>
    </div>
  );
};

export default SwipeCard;