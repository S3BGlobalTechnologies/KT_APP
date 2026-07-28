import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/**
 * Subtle mount entrance: fade + rise. Reduced-motion aware (shows instantly).
 * Use to give loaded content / empty states a premium arrival, not on every
 * element (that reads as AI-generated). `delay` lets you stagger siblings.
 *
 *   <FadeInView delay={80}><Card /></FadeInView>
 */
export default function FadeInView({ children, delay = 0, distance = 14, duration = 460, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    const run = (reduce) => {
      if (!mounted) return;
      if (reduce) {
        anim.setValue(1);
        return;
      }
      Animated.timing(anim, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };
    AccessibilityInfo.isReduceMotionEnabled?.().then(run).catch(() => run(false));
    return () => { mounted = false; };
  }, [anim, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
