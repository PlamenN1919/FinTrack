import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface IconProps {
  color: string;
  size: number;
}

const ScannerIcon: React.FC<IconProps> = ({ color, size }) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M7 7H4a1 1 0 00-1 1v3M17 7h3a1 1 0 011 1v3M7 17H4a1 1 0 01-1-1v-3M17 17h3a1 1 0 001-1v-3"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Rect
          x="8"
          y="8"
          width="8"
          height="8"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ScannerIcon; 