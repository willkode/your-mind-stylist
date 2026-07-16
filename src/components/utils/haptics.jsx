/**
 * Haptic Feedback Utilities
 * Provides consistent haptic feedback across the app
 */

export const haptics = {
  /**
   * Light tap feedback - for simple button presses
   */
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium tap feedback - for important actions
   */
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy tap feedback - for critical actions or confirmations
   */
  heavy: () => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  },

  /**
   * Success pattern - for successful operations
   */
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error pattern - for errors or warnings
   */
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([20, 50, 20, 50, 20]);
    }
  },

  /**
   * Selection pattern - for selecting items
   */
  selection: () => {
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
  },

  /**
   * Impact pattern - for impactful UI changes
   */
  impact: () => {
    if (navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
  }
};

export default haptics;