import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface FlameIconProps {
  size?: number;
  color?: string;
  animated?: boolean;
}

const FlameIcon: React.FC<FlameIconProps> = ({ 
  size = 48, 
  color = '#FF6B6B',
  animated = true 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      // Breathing/pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.8,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
  }, [animated, scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
          <Stop offset="50%" stopColor="#FF8C00" stopOpacity="1" />
          <Stop offset="100%" stopColor="#FF4500" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Main flame */}
      <Path
        d="M12 2C12 2 8 6 8 10C8 12.21 9.79 14 12 14C14.21 14 16 12.21 16 10C16 6 12 2 12 2Z"
        fill="url(#flameGradient)"
      />
      
      {/* Middle flame */}
      <Path
        d="M12 6C12 6 10 8.5 10 10.5C10 11.88 10.67 13 12 13C13.33 13 14 11.88 14 10.5C14 8.5 12 6 12 6Z"
        fill="#FFD700"
        opacity="0.8"
      />
      
      {/* Bottom flame base */}
      <Path
        d="M12 14C9.79 14 8 15.79 8 18C8 20.21 9.79 22 12 22C14.21 22 16 20.21 16 18C16 15.79 14.21 14 12 14Z"
        fill="url(#flameGradient)"
        opacity="0.9"
      />
      
      {/* Inner glow */}
      <Path
        d="M12 16C12 16 11 17 11 18C11 18.55 11.45 19 12 19C12.55 19 13 18.55 13 18C13 17 12 16 12 16Z"
        fill="#FFF"
        opacity="0.6"
      />
    </Svg>
    </Animated.View>
  );
};

export default FlameIcon;

