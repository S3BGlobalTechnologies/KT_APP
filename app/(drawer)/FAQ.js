import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { radius, spacing } from '@/lib/theme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Faqs() {
  const [openIndex, setOpenIndex] = useState(null);
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const FAQS = [
    { question: t('faq_q1'), answer: t('faq_a1') },
    { question: t('faq_q2'), answer: t('faq_a2') },
    { question: t('faq_q3'), answer: t('faq_a3') },
    { question: t('faq_q4'), answer: t('faq_a4') },
    { question: t('faq_q5'), answer: t('faq_a5') },
    { question: t('faq_q6'), answer: t('faq_a6') },
  ];

  const toggleFAQ = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <GradientScreen>
      <ScreenHeader title={t('faqTitle')} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {FAQS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <View key={index} style={[styles.card, isOpen && styles.cardOpen]}>
              <TouchableOpacity
                style={styles.questionRow}
                onPress={() => toggleFAQ(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.question}>{item.question}</Text>
                <Ionicons
                  name={isOpen ? 'remove-circle-outline' : 'add-circle-outline'}
                  size={24}
                  color={colors.gold}
                />
              </TouchableOpacity>

              {isOpen && <Text style={styles.answer}>{item.answer}</Text>}
            </View>
          );
        })}
      </ScrollView>
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  content: { padding: spacing.gutter, paddingTop: 6 },
  card: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  cardOpen: { borderColor: colors.goldSoftBorder, backgroundColor: colors.surfaceStrong },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  question: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    lineHeight: 21,
  },
  answer: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: 12,
  },
});
