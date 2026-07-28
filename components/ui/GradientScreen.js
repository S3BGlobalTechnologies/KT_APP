import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

/**
 * Full-screen themed gradient background wrapper.
 * Use as the root of every screen so backgrounds are identical app-wide.
 *
 *   <GradientScreen>
 *     <ScreenHeader title="..." />
 *     ...
 *   </GradientScreen>
 */
export default function GradientScreen({ children, style }) {
  const { colors } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      <LinearGradient
        colors={colors.bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {children}
    </View>
  );
}
