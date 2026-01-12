import React from 'react';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface GiftIconProps {
  size?: number;
}

const GiftIcon: React.FC<GiftIconProps> = ({ size = 24 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="giftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#9B59B6" stopOpacity="1" />
          <Stop offset="50%" stopColor="#8E44AD" stopOpacity="1" />
          <Stop offset="100%" stopColor="#6C3483" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Gift box */}
      <Rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="1"
        fill="url(#giftGradient)"
      />
      
      {/* Gift lid */}
      <Rect
        x="4"
        y="7"
        width="16"
        height="3"
        rx="0.5"
        fill="url(#giftGradient)"
        opacity="0.9"
      />
      
      {/* Ribbon vertical */}
      <Rect
        x="11"
        y="7"
        width="2"
        height="14"
        fill="#FFD700"
      />
      
      {/* Ribbon horizontal */}
      <Rect
        x="4"
        y="13"
        width="16"
        height="2"
        fill="#FFD700"
        opacity="0.9"
      />
      
      {/* Bow left */}
      <Path
        d="M8 7C8 7 6 5 6 4C6 3 7 2 8 3C9 4 8 7 8 7Z"
        fill="#FFD700"
      />
      
      {/* Bow right */}
      <Path
        d="M16 7C16 7 18 5 18 4C18 3 17 2 16 3C15 4 16 7 16 7Z"
        fill="#FFD700"
      />
      
      {/* Bow center */}
      <Circle
        cx="12"
        cy="7"
        r="1.5"
        fill="#FFD700"
      />
    </Svg>
  );
};

export default GiftIcon;

