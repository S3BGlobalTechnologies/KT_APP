import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

function WheelColumn({ data, selected, onSelect, width = 80 }) {
  const flatListRef = useRef(null);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  useEffect(() => {
    if (data.length > 0 && selected >= 0 && selected < data.length) {
      // Use a slight delay to ensure the list is ready
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: selected,
          animated: true,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selected, data.length]);

  return (
    <View style={{ width, height: 120, overflow: 'hidden' }}>
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={item => item.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 40, alignItems: 'center' }}
        getItemLayout={(_, i) => ({ length: 40, offset: 40 * i, index: i })}
        initialScrollIndex={selected >= 0 && selected < data.length ? selected : 0}
        renderItem={({ item, index }) => (
          <TouchableOpacity 
            onPress={() => onSelect(index)} 
            style={[styles.wheelItem, selected === index && styles.selectedItem]}
            activeOpacity={0.7}
          >
            <Text style={[styles.wheelText, selected === index && styles.selectedText]}>{item}</Text>
          </TouchableOpacity>
        )}
        snapToInterval={40}
        snapToAlignment="center"
        decelerationRate="fast"
        // For standard FlatList, these help with touch responsiveness
        removeClippedSubviews={false}
      />
    </View>
  );
}

export default function WheelPickerModal({ visible, onClose, onOk, mode = 'date', initial }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  // Date mode: day, month, year
  // Time mode: hour, minute, ampm
  const now = new Date();
  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 100 }, (_, i) => String(now.getFullYear() - i));
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const ampm = ['AM', 'PM'];

  // State
  const [d, setD] = useState(0);
  const [m, setM] = useState(0);
  const [y, setY] = useState(0);
  const [h, setH] = useState(0);
  const [min, setMin] = useState(0);
  const [ap, setAp] = useState(0);

  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth(); // 0-based
  const currentDay = now.getDate();

  const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

  const selectedYear = Number(years[y] || currentYear);
  const selectedMonthIndex = m;
  const maxMonthDays = getDaysInMonth(selectedYear, selectedMonthIndex);
  const fullDays = Array.from({ length: maxMonthDays }, (_, i) => String(i + 1).padStart(2, '0'));
  const daysAllowed =
    selectedYear === currentYear && selectedMonthIndex === currentMonthIndex
      ? fullDays.slice(0, currentDay)
      : fullDays;

  // Initialize and Reset state when modal opens or initial changes
  useEffect(() => {
    if (visible) {
      if (mode === 'date') {
        const initialYear = initial?.year ? years.indexOf(initial.year) : 0;
        const initialMonth = initial?.month ? allMonths.indexOf(initial.month) : 0;
        
        setY(initialYear >= 0 ? initialYear : 0);
        setM(initialMonth >= 0 ? initialMonth : 0);
        
        if (initial?.day) {
          const idx = daysAllowed.indexOf(initial.day);
          setD(idx >= 0 ? idx : 0);
        } else {
          setD(0);
        }
      } else {
        const initialHour = initial?.hour ? hours.indexOf(initial.hour) : 0;
        const initialMinute = initial?.minute ? minutes.indexOf(initial.minute) : 0;
        const initialAmPm = initial?.ampm ? ampm.indexOf(initial.ampm) : 0;

        setH(initialHour >= 0 ? initialHour : 0);
        setMin(initialMinute >= 0 ? initialMinute : 0);
        setAp(initialAmPm >= 0 ? initialAmPm : 0);
      }
    }
  }, [visible, initial, mode]);

  useEffect(() => {
    if (mode === 'date') {
      // Clamp day when year or month changes to stay within allowed ranges
      if (d >= daysAllowed.length) setD(Math.max(0, daysAllowed.length - 1));
    }
  }, [y, m, daysAllowed.length]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Select {mode === 'date' ? 'Date' : 'Time'}</Text>
          <View style={styles.pickerRow}>
            {mode === 'date' ? (
              <>
                <WheelColumn data={daysAllowed} selected={d} onSelect={setD} width={60} />
                <WheelColumn data={allMonths} selected={selectedMonthIndex} onSelect={setM} width={80} />
                <WheelColumn data={years} selected={y} onSelect={setY} width={80} />
              </>
            ) : (
              <>
                <WheelColumn data={hours} selected={h} onSelect={setH} width={60} />
                <WheelColumn data={minutes} selected={min} onSelect={setMin} width={60} />
                <WheelColumn data={ampm} selected={ap} onSelect={(i) => setAp(i)} width={60} />
              </>
            )}
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.okBtn} onPress={() => {
              if (mode === 'date') {
                const outDay = daysAllowed[d] || daysAllowed[0];
                const outMonth = allMonths[selectedMonthIndex] || allMonths[0];
                const outYear = years[y] || String(currentYear);
                onOk({ day: outDay, month: outMonth, year: outYear });
              }
              else onOk({ hour: hours[h], minute: minutes[min], ampm: ampm[ap] });
            }}><Text style={styles.okText}>OK</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: colors.elevated, borderRadius: 12, padding: 18, width: width * 0.95, alignItems: 'center', height: 340, justifyContent: 'center' },
  title: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 10 },
  pickerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  wheelItem: { height: 40, justifyContent: 'center', alignItems: 'center', width: '100%' },
  wheelText: { color: colors.textMuted, fontSize: 18 },
  selectedItem: { backgroundColor: colors.surfaceStrong, borderRadius: 6 ,paddingHorizontal:10 },
  selectedText: { color: isDark ? colors.gold : colors.goldText, fontWeight: 'bold', fontSize: 20 },
  btnRow: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: colors.hairline },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center' },
  okBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: colors.surfaceStrong, borderBottomRightRadius: 12 },
  cancelText: { color: colors.text, fontWeight: '600' },
  okText: { color: isDark ? colors.gold : colors.goldText, fontWeight: '700' },
});
