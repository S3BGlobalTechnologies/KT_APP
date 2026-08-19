import React, { useMemo } from 'react';
import { Image, Text, View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

/* ✅ Astrologer data (inside component file) */
const ASTROLOGERS = [
  { name: 'Acharya Raghav ', image: 'AIAacharyaRaghavSharma.png' },
  { name: 'Guru Anil ', image: 'AIGuruAnilJoshi.png' },
  { name: 'Astro Meera ', image: 'AIAstroMeeraDesai.png' },
  { name: 'Pandit Suresh ', image: 'AIPanditSureshIyyer.jpeg' },
  { name: 'Jyotish Kavita ', image: 'AIJyotishKavitaVerma.jpeg' },
];

/* ✅ Image map */
const ASTRO_IMAGE_MAP = {
  'AIAacharyaRaghavSharma.png': require('../../assets/images/AIAacharyaRaghavSharma.png'),
    'AIGuruAnilJoshi.png': require('../../assets/images/AIGuruAnilJoshi.png'),
    'AIAstroMeeraDesai.png': require('../../assets/images/AIAstroMeeraDesai.png'),
    'AIPanditSureshIyyer.jpeg': require('../../assets/images/AIPanditSureshIyyer.jpeg'),
    'AIJyotishKavitaVerma.jpeg': require('../../assets/images/AIJyotishKavitaVerma.jpeg'),
  default: require('../../assets/images/applogo.png'),
};

export default function AstroSessionHeader({ sessionId }) {
  const { colors } = useTheme();
  const astrologer = useMemo(() => {
    if (sessionId == null) return null;

    // 🔁 number-wise assignment (round-robin)
    const index =
      Number(sessionId) % ASTROLOGERS.length;

    return ASTROLOGERS[index];
  }, [sessionId]);

  if (!astrologer) return null;

  const imgSrc =
    ASTRO_IMAGE_MAP[astrologer.image] ||
    ASTRO_IMAGE_MAP.default;

  return (
    <View style={{ display: 'flex',flexDirection: 'row', marginLeft: 6}}>
      <Image
        source={imgSrc}
        style={{ width: 36, height: 36, borderRadius: 18 }}
      />
      <Text style={{ fontWeight: '600', fontSize: 16, color: colors.text, marginTop: 4,marginLeft:4 }}>
        {astrologer.name}
      </Text>
    </View>
  );
}
