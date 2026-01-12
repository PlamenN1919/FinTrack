import React from 'react';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface TargetIconProps {
  size?: number;
}

const TargetIcon: React.FC<TargetIconProps> = ({ size = 24 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="targetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF6B6B" stopOpacity="1" />
          <Stop offset="50%" stopColor="#EE5A6F" stopOpacity="1" />
          <Stop offset="100%" stopColor="#C44569" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Outer circle */}
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke="url(#targetGradient)"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Middle circle */}
      <Circle
        cx="12"
        cy="12"
        r="6"
        stroke="url(#targetGradient)"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
      
      {/* Inner circle */}
      <Circle
        cx="12"
        cy="12"
        r="3"
        fill="url(#targetGradient)"
      />
      
      {/* Arrow */}
      <Path
        d="M12 2L13 8L12 12L11 8L12 2Z"
        fill="#FFD700"
      />
      <Path
        d="M10 3L12 2L14 3L12 4L10 3Z"
        fill="#FFD700"
      />
    </Svg>
  );
};

export default TargetIcon;

