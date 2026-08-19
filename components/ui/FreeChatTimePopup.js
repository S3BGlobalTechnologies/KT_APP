import React, { useEffect, useMemo, useRef,useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';

export default function FreeChatTimePopup({
  remainingTime,
  isLoading,
  error,
  onClose,
  restoreFreeChat, // true | false
  canUnlockFreeChat, // new prop: true if info.freeChatAvailable is true and not unlocked yet
  onUnlock, // callback for unlock button
}) 
{
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  /* ========= ENTRY ANIMATION ========= */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* ========= LOCKED SHAKE ========= */
  useEffect(() => {
    if (restoreFreeChat === false) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [restoreFreeChat]);

  /* ========= AUTO CLOSE (UNLOCKED) ========= */

  
const parseTimeToSeconds = (time) => {
  if (typeof time === 'number') return time;

  if (typeof time === 'string') {
    const t = time.trim().toLowerCase();

    // ✅ Case 1: "4m 31s"
    const mMatch = t.match(/(\d+)\s*m/);
    const sMatch = t.match(/(\d+)\s*s/);

    if (mMatch || sMatch) {
      const minutes = mMatch ? parseInt(mMatch[1], 10) : 0;
      const seconds = sMatch ? parseInt(sMatch[1], 10) : 0;
      return minutes * 60 + seconds;
    }

    // ✅ Case 2: "MM:SS" or "HH:MM:SS"
    const parts = t.split(':').map(Number);
    if (parts.every((n) => !isNaN(n))) {
      if (parts.length === 3) {
        const [h, m, s] = parts;
        return h * 3600 + m * 60 + s;
      }
      if (parts.length === 2) {
        const [m, s] = parts;
        return m * 60 + s;
      }
    }
  }

  return 0;
};
const formatSeconds = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
const [secondsLeft, setSecondsLeft] = useState(parseTimeToSeconds(remainingTime));
useEffect(() => {
  setSecondsLeft(parseTimeToSeconds(remainingTime));
}, [remainingTime]);

useEffect(() => {
  if (restoreFreeChat) return;
  if (secondsLeft <= 0) return;

  const timer = setInterval(() => {
    setSecondsLeft((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [secondsLeft, restoreFreeChat]);


  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.popupBox,
          {
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateX: shakeAnim },
            ],
          },
        ]}
      >
        {/* Close (X) button for locked state */}
      
          
        {/* ========= TITLE ========= */}
        {/* ========= ICON ========= */}
        {/* ICON for unlocked or locked */}
        
          <View style={styles.iconCircle}>
            <View style={styles.giftIconBg}>
              <Text style={styles.giftIcon}>🎁</Text>
            </View>
            <View style={styles.starBadge}><Text style={styles.starText}>★</Text></View>
          </View>
       

        {/* ========= TITLE ========= */}
        <Text style={[
          styles.title,
        
        ]}>
        
             {t('unlockedRewardTitle')}
          
        </Text>

        {/* ========= CONTENT ========= */}

    
          <View>
            <Text style={styles.rewardSubtitle}>
              {t('freeChatRewardSubtitle')}
            </Text>
            {/* <TouchableOpacity style={styles.rewardBtn} onPress={onClose}>
              <Text style={styles.rewardBtnText}>Start Free Chat Now</Text>
            </TouchableOpacity> */}
           
              <View>
                <Text style={styles.successText}>
                  {t('youCanUnlockFreeChat')}
                </Text>
                <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.primarySolid,alignItems: 'center', justifyContent: 'center' }]} onPress={onClose} >
                  <Text style={styles.closeBtnText} numberOfLines={1} adjustsFontSizeToFit>
                    {t('unlockFreeChat')}
                  </Text>
                </TouchableOpacity>
              </View>
          
          </View>
       
    
        
        
        
      </Animated.View>
    </View>
  );
}

/* ================= STYLES ================= */

const makeStyles = (colors, isDark) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  popupBox: {
    width: 320,
    maxWidth: '90%',
    backgroundColor: colors.elevated,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    elevation: 12,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.surfaceBorder,
  },
  closeIconBtn: {
            position: 'absolute',
            top: 10,
            right: 12,
            zIndex: 10,
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
          },
          closeIconText: {
            fontSize: 26,
            color: '#888',
            fontWeight: 'bold',
            lineHeight: 28,
          },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.text,
    textAlign: 'center',
  },
  rewardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  rewardSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 18,
    marginTop: 2,
    lineHeight: 22,
  },
  rewardBtn: {
    backgroundColor: 'linear-gradient(90deg, #16D47B 0%, #0CA6F7 100%)',
    //backgroundColor: 'linear-gradient(90deg, #16D47B 0%, #0CA6F7 100%)',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    marginBottom: 2,
    shadowColor: '#16D47B',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: -8,
  },
  giftIconBg: {
    backgroundColor: '#FFB800',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    position: 'relative',
    zIndex: 2,
  },
  giftIcon: {
    fontSize: 34,
    marginTop: 2,
  },
  starBadge: {
    position: 'absolute',
    top: 2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFB800',
    zIndex: 3,
  },
  starText: {
    color: '#FFB800',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: -1,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'center',
    marginBottom: 6,
  },
  lockIconBg: {
          backgroundColor: '#E5E7EB',
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 0,
          position: 'relative',
          zIndex: 2,
        },
        lockIcon: {
          fontSize: 34,
          marginTop: 2,
        },
        blockedTitle: {
          fontSize: 22,
          fontWeight: 'bold',
          color: '#DC2626',
          marginTop: 12,
          marginBottom: 8,
          textAlign: 'center',
        },
        blockedSubtitle: {
          fontSize: 15,
          color: '#888',
          textAlign: 'center',
          marginBottom: 18,
          marginTop: 2,
          lineHeight: 22,
        },
        blockedBtn: {
          backgroundColor: '#E5E7EB',
          borderRadius: 10,
          paddingVertical: 14,
          paddingHorizontal: 18,
          alignItems: 'center',
          width: '100%',
          marginTop: 8,
          marginBottom: 2,
          shadowColor: '#DC2626',
          shadowOpacity: 0.10,
          shadowRadius: 8,
          elevation: 1,
        },
        blockedBtnText: {
          color: '#DC2626',
          fontWeight: 'bold',
          fontSize: 17,
          textAlign: 'center',
          letterSpacing: 0.2,},
  subText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  lockedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 4,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    marginTop: 4,
  },
  closeBtn: {
    marginTop: 22,
    backgroundColor: '#073A8C',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    width: '100%',
  },
  closeBtnText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
