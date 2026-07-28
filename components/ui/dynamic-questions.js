import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DynamicQuestions({ onPick, style, sessionId = 'demo-session-001', userQuestion = 'suggest', language = 'English', token = 'demo-token' }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const fadeAnim = useRef(new Animated.Value(0.3)).current;
 const { t, language: appLanguage } = useLanguage();
 const { colors, isDark } = useTheme();
 const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
 console.log('appLanguage:', appLanguage);
 console.log('language:', language);

useEffect(() => {
  const animation = Animated.loop(
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 700,
        useNativeDriver: true,
      }),
    ])
  );

  animation.start();

  return () => {
    fadeAnim.stopAnimation();
  };
}, []);



  // Load the latest stored consultation title and also return it for immediate use
  const loadQuestions = async () => {
    try {
      const stored = await AsyncStorage.getItem('SELECTED_CONSULTATION_TITLE');
      if (stored) {
        setSelectedQuestion(stored);
        return stored;
      }
      return null;
    } catch (e) {
      return null; // silently ignore AsyncStorage read errors
    }
  };

  // For debugging
  // console.log('Selected Question (state):', selectedQuestion);

  // Fetch dynamic question suggestions using the most recent question value
  const DyanamicQuestion = async (overrideQuestion = null) => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      const finalUserQuestion = overrideQuestion || selectedQuestion || userQuestion || 'suggest';
      // console.log('Final userQuestion (used for suggestions):', finalUserQuestion);

      const baseUrl = process.env.EXPO_PUBLIC_API_DYNAMIC_QUESTION || '';

      const requestBody = {
        sessionId,
        action: 'sendMessage',
        chatInput: {
          userQuestion: finalUserQuestion,
          language: language ||  appLanguage || 'English',
        },
        token,
      };
      const res = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token, Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let list = [];
      if (Array.isArray(data?.questions)) {
        list = data.questions;
      } else if (data?.output) {
        try {
          const parsedOutput = JSON.parse(data.output);
          if (Array.isArray(parsedOutput)) list = parsedOutput;
        } catch (_) {}
      }
      if (!list.length) {
        list = [
          'When will I find a life partner?',
          'How stable will my married life be?',
          'Are there relationship obstacles in my chart?',
        ];
      }
      if (!cancelled) setQuestions(list);
      // Clear the stored selection after consuming it to avoid stale selections on next open
      await AsyncStorage.removeItem('SELECTED_CONSULTATION_TITLE');
      setSelectedQuestion('');
    } catch (e) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const stored = await loadQuestions();
        await DyanamicQuestion(stored);
      })();
    }, [sessionId, userQuestion, language, token])
  );

if (loading) {
  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {[1, 2, 3, 4].map((_, idx) => (
          <Animated.View
            key={idx}
            style={[
              styles.chip,
              styles.skeletonChip,
              { opacity: fadeAnim },
            ]}
          />
        ))}
      </ScrollView>
    </View>
  );
}



  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.error}>Unable to load suggestions</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {questions.map((q, idx) => (
          <TouchableOpacity key={idx} style={styles.chip} onPress={() => onPick?.(String(q))}>
            <Text style={styles.chipText}>{String(q)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  container: { paddingVertical: 8 },
  row: { paddingHorizontal: 1 },
  chip: {
    backgroundColor: colors.goldSoftBg,
    borderColor: colors.goldSoftBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginHorizontal: 4,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: -40,
    height: '100%',
    width: 40,
    backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
    borderRadius: 10,
  },

  skeletonChip: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surfaceStrong,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
    width: 120,
    height: 34,
    borderRadius: 999,
  },

  chipText: { color: colors.goldText, fontSize: 13, fontWeight: '600' },
  error: { color: '#FF9B8A' },
});
