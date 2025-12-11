import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface TrophyIconProps {
  size?: number;
}

const TrophyIcon: React.FC<TrophyIconProps> = ({ size = 24 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="trophyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
          <Stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Trophy cup */}
      <Path
        d="M7 4V8C7 10.21 8.79 12 11 12H13C15.21 12 17 10.21 17 8V4H7Z"
        fill="url(#trophyGradient)"
      />
      
      {/* Trophy handles */}
      <Path
        d="M5 6H7V8C7 8.55 6.55 9 6 9C5.45 9 5 8.55 5 8V6Z"
        fill="url(#trophyGradient)"
        opacity="0.8"
      />
      <Path
        d="M17 6H19V8C19 8.55 18.55 9 18 9C17.45 9 17 8.55 17 8V6Z"
        fill="url(#trophyGradient)"
        opacity="0.8"
      />
      
      {/* Trophy stem */}
      <Path
        d="M11 12V15H13V12H11Z"
        fill="url(#trophyGradient)"
      />
      
      {/* Trophy base */}
      <Path
        d="M8 15H16C16.55 15 17 15.45 17 16V18C17 18.55 16.55 19 16 19H8C7.45 19 7 18.55 7 18V16C7 15.45 7.45 15 8 15Z"
        fill="url(#trophyGradient)"
      />
      
      {/* Shine effect */}
      <Path
        d="M9 5H10V7H9V5Z"
        fill="#FFF"
        opacity="0.6"
      />
    </Svg>
  );
};

export default TrophyIcon;

