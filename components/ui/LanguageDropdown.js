import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { radius } from '@/lib/theme';

const LANGUAGES = [
  'English',
  'Hindi',
  'Marathi',
  'Gujarati',
  'Tamil',
  'Telugu',
  'Kannada',
  'Bengali',
  'Punjabi',
  'Malayalam',
  'Odia',
  'Assamese',
  'Urdu',
];

export default function LanguageDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={{ marginBottom: 12 }}>
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen(true)}>
        <Text style={styles.selectedText}>{value || 'Select language'}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.gold} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.modalBox}>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, value === item && styles.selectedOption]}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, value === item && styles.selectedOptionText]}>{item}</Text>
                  {value === item && <Ionicons name="checkmark" size={16} color={colors.gold} style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
              )}
              style={{ maxHeight: 320 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    justifyContent: 'space-between',
  },
  selectedText: { color: colors.text, fontWeight: '400', fontSize: 14, textTransform: 'capitalize' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: colors.elevated, borderRadius: radius.md, padding: 8, width: 280,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.sm },
  selectedOption: { backgroundColor: colors.goldSoftBg },
  optionText: { color: colors.textMuted, fontSize: 15 },
  selectedOptionText: { color: colors.goldText, fontWeight: '700' },
});
