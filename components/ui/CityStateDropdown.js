import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { searchCities } from '@/lib/indian-cities';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CityStateDropdown({ city, state, onChange, onCityFocus, onOpen, onClose }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [search, setSearch] = useState(city || '');
  const [selectedCity, setSelectedCity] = useState(city || '');
  const [selectedState, setSelectedState] = useState(state || '');
  const [showDropdown, setShowDropdown] = useState(false);
 const cities = search
  ? searchCities(search).map((c) => ({
      city: c.name || c.city,
      state: c.state || c.admin_name,
    }))


  : [];
useEffect(() => {
  if (city) {
    setSearch(city);
    setSelectedCity(city);
  }
  if (state) {
    setSelectedState(state);
  }
}, [city, state]);


  return (
    <View style={{ position: 'relative', marginBottom: 12 }}>
      <View style={styles.dropdownInputRow}>
        <Ionicons name="search" size={16} color={colors.textSubtle} style={{ marginRight: 4 }} />
        <TextInput
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            if (!showDropdown) {
              setShowDropdown(true);
              onOpen && onOpen();
            } else {
              setShowDropdown(true);
            }
          }}
          placeholderTextColor={colors.textSubtle}
          placeholder={t('typeCityName')}
          style={styles.inputBar}
          onFocus={() => { setShowDropdown(true); onCityFocus && onCityFocus(); onOpen && onOpen(); }}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
      {showDropdown && cities.length > 0 && (
        <View style={styles.dropdownList}>
         <FlatList
  data={cities}
  keyExtractor={(item, index) => `${item.city}-${item.state}-${index}`}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => {
        setSelectedCity(item.city);
        setSelectedState(item.state);
        setSearch(item.city);
        setShowDropdown(false);
        onChange({
          city: item.city,
          state: item.state,
          country: 'India',
        });
        onClose && onClose();
      }}
    >
      <Text style={styles.optionText}>
        {item.city}, {item.state}
      </Text>
    </TouchableOpacity>
  )}
  scrollEnabled={false}   // ✅ IMPORTANT
  style={{ maxHeight: 180 }}
/>


        </View>
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  dropdownInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  inputBar: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  dropdownList: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    maxHeight: 180,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
  },
});
