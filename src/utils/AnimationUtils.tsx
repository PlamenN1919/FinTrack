import { 
  withSpring, 
  withTiming, 
  withSequence, 
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate,
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Конфигурации за анимации
export const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

export const TIMING_CONFIG = {
  duration: 300,
};

export const SMOOTH_TIMING_CONFIG = {
  duration: 500,
};

// Анимационни утилити
export class AnimationUtils {
  // Spring анимация с callback
  static springWithCallback(
    value: SharedValue<number>,
    toValue: number,
    callback?: () => void,
    config = SPRING_CONFIG
  ) {
    value.value = withSpring(toValue, config, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    });
  }

  // Timing анимация с callback
  static timingWithCallback(
    value: SharedValue<number>,
    toValue: number,
    callback?: () => void,
    config = TIMING_CONFIG
  ) {
    value.value = withTiming(toValue, config, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    });
  }

  // Bounce ефект за бутони
  static bouncePress(scale: SharedValue<number>) {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, SPRING_CONFIG)
    );
  }

  // Shake анимация за грешки
  static shake(translateX: SharedValue<number>) {
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withRepeat(withTiming(10, { duration: 100 }), 3, true),
      withTiming(0, { duration: 50 })
    );
  }

  // Fade in анимация
  static fadeIn(opacity: SharedValue<number>, delay = 0) {
    opacity.value = withDelay(delay, withTiming(1, SMOOTH_TIMING_CONFIG));
  }

  // Slide in from bottom
  static slideInFromBottom(translateY: SharedValue<number>, delay = 0) {
    translateY.value = withDelay(
      delay,
      withSpring(0, SPRING_CONFIG)
    );
  }

  // Slide in from right
  static slideInFromRight(translateX: SharedValue<number>, delay = 0) {
    translateX.value = withDelay(
      delay,
      withSpring(0, SPRING_CONFIG)
    );
  }

  // Scale in анимация
  static scaleIn(scale: SharedValue<number>, delay = 0) {
    scale.value = withDelay(
      delay,
      withSpring(1, SPRING_CONFIG)
    );
  }

  // Staggered анимация за списъци
  static staggeredAnimation(
    items: SharedValue<number>[],
    animationType: 'fadeIn' | 'slideIn' | 'scaleIn' = 'fadeIn',
    staggerDelay = 100
  ) {
    items.forEach((item, index) => {
      const delay = index * staggerDelay;
      
      switch (animationType) {
        case 'fadeIn':
          this.fadeIn(item, delay);
          break;
        case 'slideIn':
          this.slideInFromBottom(item, delay);
          break;
        case 'scaleIn':
          this.scaleIn(item, delay);
          break;
      }
    });
  }

  // Pulse анимация
  static pulse(scale: SharedValue<number>) {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );
  }

  // Rotation анимация
  static rotate(rotation: SharedValue<number>, degrees = 360) {
    rotation.value = withRepeat(
      withTiming(degrees, { duration: 2000 }),
      -1,
      false
    );
  }

  // Parallax ефект
  static parallax(
    scrollY: SharedValue<number>,
    index: number,
    itemHeight: number
  ) {
    return interpolate(
      scrollY.value,
      [(index - 1) * itemHeight, index * itemHeight, (index + 1) * itemHeight],
      [-itemHeight * 0.3, 0, itemHeight * 0.3],
      Extrapolate.CLAMP
    );
  }

  // Card flip анимация
  static flipCard(rotateY: SharedValue<number>) {
    rotateY.value = withSequence(
      withTiming(90, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );
  }

  // Morphing анимация за форми
  static morphShape(
    progress: SharedValue<number>,
    fromRadius: number,
    toRadius: number
  ) {
    return interpolate(
      progress.value,
      [0, 1],
      [fromRadius, toRadius],
      Extrapolate.CLAMP
    );
  }
}

// Hook за анимирани стилове
export const useAnimatedStyles = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const translateX = useSharedValue(SCREEN_WIDTH);
  const rotation = useSharedValue(0);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const slideUpStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const slideRightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    values: { scale, opacity, translateY, translateX, rotation },
    styles: { 
      scaleStyle, 
      fadeStyle, 
      slideUpStyle, 
      slideRightStyle, 
      rotationStyle,
      bounceStyle 
    },
  };
};

// Preset анимации за различни компоненти
export const ANIMATION_PRESETS = {
  // Бутон анимации
  button: {
    press: (scale: SharedValue<number>) => AnimationUtils.bouncePress(scale),
    hover: (scale: SharedValue<number>) => {
      scale.value = withSpring(1.02, SPRING_CONFIG);
    },
    release: (scale: SharedValue<number>) => {
      scale.value = withSpring(1, SPRING_CONFIG);
    },
  },

  // Карта анимации
  card: {
    enter: (opacity: SharedValue<number>, translateY: SharedValue<number>) => {
      AnimationUtils.fadeIn(opacity);
      AnimationUtils.slideInFromBottom(translateY);
    },
    press: (scale: SharedValue<number>) => {
      scale.value = withSpring(0.98, SPRING_CONFIG);
    },
    release: (scale: SharedValue<number>) => {
      scale.value = withSpring(1, SPRING_CONFIG);
    },
  },

  // Модал анимации
  modal: {
    enter: (opacity: SharedValue<number>, scale: SharedValue<number>) => {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, SPRING_CONFIG);
    },
    exit: (opacity: SharedValue<number>, scale: SharedValue<number>) => {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
    },
  },

  // Списък анимации
  list: {
    staggeredEnter: (items: SharedValue<number>[]) => {
      AnimationUtils.staggeredAnimation(items, 'slideIn', 80);
    },
  },
}; 