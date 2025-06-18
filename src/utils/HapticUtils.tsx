import { Platform, Vibration } from 'react-native';

// Опитваме се да импортираме haptic feedback пакета, ако е наличен
let ReactNativeHapticFeedback: any = null;
try {
  ReactNativeHapticFeedback = require('react-native-haptic-feedback');
} catch (error) {
  console.warn('react-native-haptic-feedback не е инсталиран, използваме Vibration API');
}

// Типове haptic feedback
export enum HapticType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection',
  IMPACT_LIGHT = 'impactLight',
  IMPACT_MEDIUM = 'impactMedium',
  IMPACT_HEAVY = 'impactHeavy',
}

// Haptic feedback система
export class HapticUtils {
  private static isEnabled = true;

  // Включване/изключване на haptic feedback
  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  static getEnabled(): boolean {
    return this.isEnabled;
  }

  // Основен haptic feedback
  static trigger(type: HapticType) {
    if (!this.isEnabled) {
      return;
    }

    try {
      this.triggerIOS(type);
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }

  // iOS специфичен haptic feedback
  private static triggerIOS(type: HapticType) {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    };

    if (Platform.OS === 'ios' && ReactNativeHapticFeedback) {
      switch (type) {
        case HapticType.LIGHT:
        case HapticType.IMPACT_LIGHT:
          ReactNativeHapticFeedback.trigger('impactLight', options);
          break;
        case HapticType.MEDIUM:
        case HapticType.IMPACT_MEDIUM:
          ReactNativeHapticFeedback.trigger('impactMedium', options);
          break;
        case HapticType.HEAVY:
        case HapticType.IMPACT_HEAVY:
          ReactNativeHapticFeedback.trigger('impactHeavy', options);
          break;
        case HapticType.SUCCESS:
          ReactNativeHapticFeedback.trigger('notificationSuccess', options);
          break;
        case HapticType.WARNING:
          ReactNativeHapticFeedback.trigger('notificationWarning', options);
          break;
        case HapticType.ERROR:
          ReactNativeHapticFeedback.trigger('notificationError', options);
          break;
        case HapticType.SELECTION:
          ReactNativeHapticFeedback.trigger('selection', options);
          break;
        default:
          ReactNativeHapticFeedback.trigger('impactLight', options);
      }
    } else {
      // Fallback към Vibration API за Android или ако haptic feedback не е наличен
      switch (type) {
        case HapticType.LIGHT:
        case HapticType.SELECTION:
          Vibration.vibrate(10);
          break;
        case HapticType.MEDIUM:
        case HapticType.IMPACT_MEDIUM:
          Vibration.vibrate(25);
          break;
        case HapticType.HEAVY:
        case HapticType.IMPACT_HEAVY:
          Vibration.vibrate(50);
          break;
        case HapticType.SUCCESS:
          Vibration.vibrate([10, 50, 10]);
          break;
        case HapticType.WARNING:
          Vibration.vibrate([25, 25, 25]);
          break;
        case HapticType.ERROR:
          Vibration.vibrate([50, 100, 50]);
          break;
        default:
          Vibration.vibrate(20);
      }
    }
  }

  // Предефинирани haptic patterns за различни действия
  static buttonPress() {
    this.trigger(HapticType.IMPACT_LIGHT);
  }

  static buttonLongPress() {
    this.trigger(HapticType.IMPACT_MEDIUM);
  }

  static cardTap() {
    this.trigger(HapticType.SELECTION);
  }

  static swipeAction() {
    this.trigger(HapticType.IMPACT_MEDIUM);
  }

  static success() {
    this.trigger(HapticType.SUCCESS);
  }

  static error() {
    this.trigger(HapticType.ERROR);
  }

  static warning() {
    this.trigger(HapticType.WARNING);
  }

  static selection() {
    this.trigger(HapticType.SELECTION);
  }

  static notification() {
    this.trigger(HapticType.IMPACT_HEAVY);
  }

  static refresh() {
    this.trigger(HapticType.IMPACT_LIGHT);
  }

  static toggle() {
    this.trigger(HapticType.SELECTION);
  }

  static scroll() {
    this.trigger(HapticType.SELECTION);
  }

  // Комплексни haptic patterns
  static transactionAdded() {
    setTimeout(() => this.trigger(HapticType.SUCCESS), 0);
  }

  static budgetExceeded() {
    setTimeout(() => this.trigger(HapticType.WARNING), 0);
    setTimeout(() => this.trigger(HapticType.WARNING), 200);
  }

  static achievementUnlocked() {
    setTimeout(() => this.trigger(HapticType.SUCCESS), 0);
    setTimeout(() => this.trigger(HapticType.IMPACT_MEDIUM), 100);
    setTimeout(() => this.trigger(HapticType.SUCCESS), 200);
  }

  static levelUp() {
    setTimeout(() => this.trigger(HapticType.IMPACT_HEAVY), 0);
    setTimeout(() => this.trigger(HapticType.SUCCESS), 150);
    setTimeout(() => this.trigger(HapticType.IMPACT_MEDIUM), 300);
  }

  static scanSuccess() {
    this.trigger(HapticType.SUCCESS);
  }

  static scanError() {
    this.trigger(HapticType.ERROR);
  }

  // Contextual haptic feedback
  static contextual(context: string, action: string) {
    const pattern = this.getContextualPattern(context, action);
    if (pattern) {
      this.trigger(pattern);
    }
  }

  private static getContextualPattern(context: string, action: string): HapticType | null {
    const patterns: Record<string, Record<string, HapticType>> = {
      transaction: {
        add: HapticType.SUCCESS,
        edit: HapticType.IMPACT_MEDIUM,
        delete: HapticType.ERROR,
        select: HapticType.SELECTION,
      },
      budget: {
        create: HapticType.SUCCESS,
        exceed: HapticType.WARNING,
        complete: HapticType.SUCCESS,
        edit: HapticType.IMPACT_MEDIUM,
      },
      navigation: {
        tab: HapticType.SELECTION,
        back: HapticType.IMPACT_LIGHT,
        modal: HapticType.IMPACT_MEDIUM,
      },
      gamification: {
        achievement: HapticType.SUCCESS,
        levelUp: HapticType.IMPACT_HEAVY,
        mission: HapticType.IMPACT_MEDIUM,
        reward: HapticType.SUCCESS,
      },
      ui: {
        button: HapticType.IMPACT_LIGHT,
        toggle: HapticType.SELECTION,
        slider: HapticType.SELECTION,
        picker: HapticType.SELECTION,
      },
    };

    return patterns[context]?.[action] || null;
  }
}

// Hook за haptic feedback
export const useHaptic = () => {
  return {
    trigger: HapticUtils.trigger,
    buttonPress: HapticUtils.buttonPress,
    cardTap: HapticUtils.cardTap,
    success: HapticUtils.success,
    error: HapticUtils.error,
    warning: HapticUtils.warning,
    selection: HapticUtils.selection,
    contextual: HapticUtils.contextual,
  };
}; 