import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function Snackbar({ message, type = 'info', onClose, duration = 3500 }) {
  const translateY = React.useRef(new Animated.Value(120)).current;

  useEffect(() => {
    // Slide in
    Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }).start();

    let id;
    if (duration > 0) {
      id = setTimeout(() => handleClose(), duration);
    }
    return () => clearTimeout(id);
    
  }, []);

  const handleClose = () => {
    Animated.timing(translateY, { toValue: 80, duration: 180, useNativeDriver: true }).start(() => {
      onClose?.();
    });
  };

  const scheme = useColorScheme();
  const palette = Colors?.[scheme] || Colors?.light || { tint: '#073A8C', backgroundColor: '#fff' };

  const bg = type === 'error'
    ? '#EF4444'
    : type === 'success'
    ? '#10B981'
    : '#1C3766'; // info → brand navy
  const iconName = type === 'error' ? 'alert-circle' : type === 'success' ? 'checkmark-circle' : 'information-circle';

  if (!message) return null;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateY }] }]} pointerEvents="box-none">
      <View style={[styles.container, { backgroundColor: bg }]} accessibilityRole="alert">
        <Ionicons name={iconName} size={20} color="#fff" style={styles.icon} />
        <Text style={styles.text}>{message}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityRole="button">
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: Platform.OS === 'ios' ? 34 : 20,
    zIndex: 1000,
    elevation: 1000,
  },
  container: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  icon: { marginRight: 10 },
  text: { color: '#fff', flex: 1, fontWeight: '600' },
  closeBtn: { marginLeft: 8, padding: 6 },
  closeText: { color: '#fff', fontSize: 14 },
});
