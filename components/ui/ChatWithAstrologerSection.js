import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';

const ASTROLOGERS = [
  {
    name_en: 'Acharya Raghav',
    name_hi: 'आचार्य राघव',
    name_mr: 'आचार्य राघव',
    name_gu: 'આચાર્ય રાઘવ',
    name_te: 'ఆచార్య రాఘవ్',
    name_bn: 'আচার্য রাঘব',
    name_kn: 'ಆಚಾರ್ಯ ರಾಘವ್',
    image: 'AIAacharyaRaghavSharma.png',
    expKey: 'relationshipExp',
  },
  {
    name_en: 'Guru Anil',
    name_hi: 'गुरु अनिल',
    name_mr: 'गुरु अनिल',
    name_gu: 'ગુરુ અનિલ',
    name_te: 'గురు అనిల్',
    name_bn: 'গুরু অনিল',
    name_kn: 'ಗುರು ಅನಿಲ್',
    image: 'AIGuruAnilJoshi.png',
    expKey: 'careerExp',
  },
  {
    name_en: 'Astro Meera',
    name_hi: 'एस्ट्रो मीरा',
    name_mr: 'अॅस्ट्रो मीरा',
    name_gu: 'એસ્ટ્રો મીરા',
    name_te: 'ఆస్ట్రో మీరా',
    name_bn: 'অ্যাস্ট্রো মীরা',
    name_kn: 'ಆಸ್ಟ್ರೋ ಮೀರಾ',
    image: 'AIAstroMeeraDesai.png',
    expKey: 'mentalPeaceExp',
  },
  {
    name_en: 'Pandit Suresh',
    name_hi: 'पंडित सुरेश',
    name_mr: 'पंडित सुरेश',
    name_gu: 'પંડિત સુરેશ',
    name_te: 'పండిత్ సురేశ్',
    name_bn: 'পণ্ডিত সুরেশ',
    name_kn: 'ಪಂಡಿತ್ ಸುರೇಶ್',
    image: 'AIPanditSureshIyyer.jpeg',
    expKey: 'marriageExp',
  },
  {
    name_en: 'Jyotishi Kavita',
    name_hi: 'ज्योतिषी कविता',
    name_mr: 'ज्योतिषी कविता',
    name_gu: 'જ્યોતિષી કવિતા',
    name_te: 'జ్యోతిషి కవిత',
    name_bn: 'জ্যোতিষী কবিতা',
    name_kn: 'ಜ್ಯೋತಿಷಿ ಕವಿತಾ',
    image: 'AIJyotishKavitaVerma.jpeg',
    expKey: 'moneyDirectionExp',
  },
];

const ASTRO_IMAGE_MAP = {
  'AIAacharyaRaghavSharma.png': require('../../assets/images/AIAacharyaRaghavSharma.png'),
  'AIGuruAnilJoshi.png': require('../../assets/images/AIGuruAnilJoshi.png'),
  'AIAstroMeeraDesai.png': require('../../assets/images/AIAstroMeeraDesai.png'),
  'AIPanditSureshIyyer.jpeg': require('../../assets/images/AIPanditSureshIyyer.jpeg'),
  'AIJyotishKavitaVerma.jpeg': require('../../assets/images/AIJyotishKavitaVerma.jpeg'),
};

const formatExp = (exp, t) => {
  const numericMatch = String(exp || '').match(/(\d+)/);
  const years = numericMatch ? parseInt(numericMatch[1], 10) : null;

  if (years !== null && !Number.isNaN(years)) {
    return `${years} ${t('yrsExperienceSuffix')}`;
  }

  return exp ? String(exp) : t('experience');
};

export default function ChatWithAstrologerSection() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const getLocalizedAstrologerName = (astrologer) => {
    if (language === 'hi') return astrologer.name_hi || astrologer.name_en;
    if (language === 'mr') return astrologer.name_mr || astrologer.name_hi || astrologer.name_en;
    if (language === 'gu') return astrologer.name_gu || astrologer.name_hi || astrologer.name_en;
    if (language === 'te') return astrologer.name_te || astrologer.name_hi || astrologer.name_en;
    if (language === 'bn') return astrologer.name_bn || astrologer.name_hi || astrologer.name_en;
    if (language === 'kn') return astrologer.name_kn || astrologer.name_hi || astrologer.name_en;
    return astrologer.name_en;
  };

  const astrologers = useMemo(
    () =>
      ASTROLOGERS.map((astrologer) => ({
        ...astrologer,
        displayName: getLocalizedAstrologerName(astrologer),
        exp: t(astrologer.expKey),
      })),
    [language, t]
  );

  const openAstrologerChat = async (astrologer) => {
    try {
      await AsyncStorage.setItem('SELECTED_ASTROLOGER_NAME', astrologer.displayName);
      await AsyncStorage.setItem('SELECTED_ASTROLOGER_IMAGE', astrologer.image);

      router.push({
        pathname: '/chat',
        params: {
          astrologerName: astrologer.displayName,
          astrologerImage: astrologer.image,
        },
      });
    } catch {
      router.push('/chat');
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('chatWithAstrologerSection')}</Text>
      <Text style={styles.subtitle}>{t('worriedSubTap')}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {astrologers.map((astrologer) => (
          <TouchableOpacity
            key={astrologer.image}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => openAstrologerChat(astrologer)}
          >
            <View style={styles.avatarWrap}>
              <Image
                source={ASTRO_IMAGE_MAP[astrologer.image]}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {astrologer.displayName}
            </Text>
            <Text style={styles.exp}>{formatExp(astrologer.exp, t)}</Text>
            <View style={styles.ctaPill}>
              <Text style={styles.ctaText} numberOfLines={2}>{t('withastrologer')}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  section: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 18,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 14,
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 4,
    paddingHorizontal: 0,
  },
  card: {
    marginRight: 14,
    alignItems: 'center',
    flexShrink: 0,
    paddingHorizontal: 4,
    width: 96,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.avatarBg,
    borderWidth: 1.5,
    borderColor: colors.goldRing,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  name: {
    marginTop: 8,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    fontSize: 12.5,
  },
  exp: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  ctaPill: {
    marginTop: 8,
    alignSelf: 'stretch',
    backgroundColor: colors.goldSoftBg,
    borderWidth: 1,
    borderColor: colors.goldSoftBorder,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  ctaText: {
    color: colors.goldText,
    fontSize: 10.5,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'center',
  },
});
