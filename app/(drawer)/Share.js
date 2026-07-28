import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { radius } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Share as RNShare, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const APP_SHARE_URL = process.env.EXPO_PUBLIC_APP_SHARE_URL || 'https://aiagent01.s3bglobal.com/ai-astrology-app';
const SHARE_MESSAGE = `Try AI Astrology App — get insights and reports!\n${APP_SHARE_URL}`;

export default function Share() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [copied, setCopied] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const shareApp = async () => {
    setLastError(null);
    setCopied(false);
    try {
      const result = await RNShare.share(
        Platform.select({
          ios: { message: SHARE_MESSAGE, url: APP_SHARE_URL },
          android: { message: SHARE_MESSAGE },
          default: { message: SHARE_MESSAGE },
        })
      );
      setLastResult(result?.action || 'shared');
    } catch (e) {
      setLastError(e?.message || 'Failed to open share sheet');
    }
  };

  useEffect(() => {
    shareApp();
  }, []);

  const copyLink = async () => {
    setLastError(null);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window?.navigator?.clipboard) {
        await window.navigator.clipboard.writeText(APP_SHARE_URL);
        setCopied(true);
      } else {
        setLastError('Copy link is available on web');
      }
    } catch (e) {
      setLastError(e?.message || 'Failed to copy link');
    }
  };

  const handleBack = () => router.push('/home');

  return (
    <GradientScreen>
      <ScreenHeader title="Share App" onBack={handleBack} />

      <View style={styles.content}>
        <View style={styles.iconRing}>
          <Text style={styles.iconEmoji}>🔮</Text>
        </View>
        <Text style={styles.title}>Share Our App</Text>
        <Text style={styles.desc}>Invite friends to try AI Astrology.</Text>

        {!!lastError && (
          <View style={styles.errorBox}><Text style={styles.errorText}>{String(lastError)}</Text></View>
        )}
        {!!copied && (
          <View style={styles.successBox}><Text style={styles.successText}>Link copied to clipboard</Text></View>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={shareApp} activeOpacity={0.9}>
          <LinearGradient colors={colors.goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryInner}>
            <Text style={styles.primaryText}>Share App</Text>
          </LinearGradient>
        </TouchableOpacity>
        {Platform.OS === 'web' && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={copyLink}>
            <Text style={styles.secondaryText}>Copy Link</Text>
          </TouchableOpacity>
        )}

        <View style={styles.linkBox}>
          <Text style={styles.linkLabel}>Share link</Text>
          <Text selectable style={styles.linkText}>{APP_SHARE_URL}</Text>
        </View>
      </View>
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  content: { padding: 24, alignItems: 'center', marginTop: 20 },
  iconRing: {
    width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.goldRing, backgroundColor: 'rgba(228,173,13,0.06)', marginBottom: 20,
  },
  iconEmoji: { fontSize: 38 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6, textAlign: 'center' },
  desc: { color: colors.textMuted, textAlign: 'center', marginBottom: 24, fontSize: 14.5 },
  primaryBtn: { borderRadius: radius.md, overflow: 'hidden', width: '100%', maxWidth: 320 },
  primaryInner: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.onGold, fontWeight: '800', fontSize: 15 },
  secondaryBtn: { borderColor: colors.ctrlBorder, borderWidth: 1, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 18, marginTop: 12 },
  secondaryText: { color: colors.text, fontWeight: '700' },
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.10)', borderColor: 'rgba(255,107,107,0.4)',
    borderWidth: 1, borderRadius: radius.md, padding: 12, marginBottom: 14, width: '100%',
  },
  errorText: { color: '#FF9B8A', textAlign: 'center' },
  successBox: {
    backgroundColor: 'rgba(59,209,111,0.10)', borderColor: 'rgba(59,209,111,0.4)',
    borderWidth: 1, borderRadius: radius.md, padding: 12, marginBottom: 14, width: '100%',
  },
  successText: { color: '#7BE6A8', textAlign: 'center' },
  linkBox: { marginTop: 24, alignItems: 'center' },
  linkLabel: { color: colors.textMuted, marginBottom: 6 },
  linkText: { color: colors.goldText, textAlign: 'center' },
});
