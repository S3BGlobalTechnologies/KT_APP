import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';

const LANGUAGE_OPTIONS = [
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'hi', short: 'HI', label: 'हिंदी' },
  { code: 'mr', short: 'MR', label: 'मराठी' },
  { code: 'gu', short: 'GU', label: 'ગુજરાતી' },
  { code: 'te', short: 'TE', label: 'తెలుగు' },
  { code: 'bn', short: 'BN', label: 'বাংলা' },
  { code: 'kn', short: 'KN', label: 'ಕನ್ನಡ' },
];

export default function HomeLanguageDropdown({ style }) {
  const { language, setLanguage } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    return (
      LANGUAGE_OPTIONS.find((o) => o.code === language) ||
      LANGUAGE_OPTIONS.find((o) => o.code === 'en')
    );
  }, [language]);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.button, style]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.buttonText}>
          {selected?.short || 'EN'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.text} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.title}>Select language</Text>
            <FlatList
              data={LANGUAGE_OPTIONS}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const active = item.code === language;
                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.row, active && styles.rowActive]}
                    onPress={() => {
                      setLanguage(item.code);
                      setOpen(false);
                    }}
                  >
                    <View style={styles.rowLeft}>
                      <Text style={[styles.short, active && styles.shortActive]}>
                        {item.short}
                      </Text>
                      <Text style={[styles.label, active && styles.labelActive]}>
                        {item.label}
                      </Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark" size={18} color={colors.gold} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              style={{ maxHeight: 360 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.ctrlBorder,
    backgroundColor: colors.ctrlBg,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  sheet: {
    backgroundColor: colors.elevated,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  rowActive: {
    backgroundColor: colors.goldSoftBg,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  short: {
    width: 34,
    height: 28,
    borderRadius: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: colors.surfaceStrong,
    color: colors.text,
    fontWeight: '800',
    fontSize: 12,
    overflow: 'hidden',
  },
  shortActive: {
    backgroundColor: colors.goldSoftBg,
    color: colors.goldText,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.goldText,
  },
  sep: {
    height: 1,
    backgroundColor: colors.hairline,
    marginHorizontal: 8,
  },
});

