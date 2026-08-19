import { useLanguage } from '@/lib/i18n';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LanguageToggle({ style }) {
  const { language, setLanguage } = useLanguage();

  const switchLanguage = (lang) => {
    if (lang !== language) {
      setLanguage(lang);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={() => switchLanguage('mr')}
        activeOpacity={0.8}
        style={[
          styles.button,
          language === 'mr' ? styles.activeButton : styles.inactiveButton,
        ]}
      >
        <Text
          style={[
            styles.text,
            language === 'mr' ? styles.activeText : styles.inactiveText,
          ]}
        >
          MR
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => switchLanguage('gu')}
        activeOpacity={0.8}
        style={[
          styles.button,
          language === 'gu' ? styles.activeButton : styles.inactiveButton,
        ]}
      >
        <Text
          style={[
            styles.text,
            language === 'gu' ? styles.activeText : styles.inactiveText,
          ]}
        >
          GU
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => switchLanguage('te')}
        activeOpacity={0.8}
        style={[
          styles.button,
          language === 'te' ? styles.activeButton : styles.inactiveButton,
        ]}
      >
        <Text
          style={[
            styles.text,
            language === 'te' ? styles.activeText : styles.inactiveText,
          ]}
        >
          TE
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => switchLanguage('bn')}
        activeOpacity={0.8}
        style={[
          styles.button,
          language === 'bn' ? styles.activeButton : styles.inactiveButton,
        ]}
      >
        <Text
          style={[
            styles.text,
            language === 'bn' ? styles.activeText : styles.inactiveText,
          ]}
        >
          BN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => switchLanguage('kn')}
        activeOpacity={0.8}
        style={[
          styles.button,
          language === 'kn' ? styles.activeButton : styles.inactiveButton,
        ]}
      >
        <Text
          style={[
            styles.text,
            language === 'kn' ? styles.activeText : styles.inactiveText,
          ]}
        >
          KN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => switchLanguage('en')}
        activeOpacity={0.8}
        style={[
          styles.button,
          language === 'en' ? styles.activeButton : styles.inactiveButton,
        ]}
      >
        <Text
          style={[
            styles.text,
            language === 'en' ? styles.activeText : styles.inactiveText,
          ]}
        >
          EN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => switchLanguage('hi')}
        activeOpacity={0.8}
        style={[
          styles.button,
          language === 'hi' ? styles.activeButton : styles.inactiveButton,
        ]}
      >
        <Text
          style={[
            styles.text,
            language === 'hi' ? styles.activeText : styles.inactiveText,
          ]}
        >
          HI
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  activeButton: {
    backgroundColor: '#e4ad0d',
    borderColor: '#e4ad0d',
  },
  inactiveButton: {
    backgroundColor: 'transparent',
    borderColor: '#D1D5DB',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#073A8C',
  },
  inactiveText: {
    color: '#fff',
  },
});
