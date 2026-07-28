import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { logMetaEvent } from '@/utils/metaEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';



const ANDROID_CHAT_PRODUCT_ID = 'kundli_29';
const IOS_CHAT_PRODUCT_ID = 'com.kundlitime.kundliapp.5minchat';

export default function PaymentPage({
  amount,
  fullName,
  userId,
  sessionId,
  phone,
  requestedTimeInMinutes,
  onPaymentSuccess,
  onPaymentFail,
  email,
  onRequestClose,
}) {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [couponCode, setCouponCode] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [applySuccess, setApplySuccess] = useState(null);
  const [payableAmount, setPayableAmount] = useState(amount);
  const [couponInfo, setCouponInfo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [handledSuccess, setHandledSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    console.log('✅ PaymentPage rendered');
  }, []);

  useEffect(() => {
    if (!isProcessing || !BackHandler?.addEventListener) return;
    const onBack = () => true;
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => {
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      }
    };
  }, [isProcessing]);

  useEffect(() => {
    if (!isProcessing || !navigation) return;
    const unsubBeforeRemove = navigation.addListener?.('beforeRemove', (e) => {
      e.preventDefault();
    });
    navigation.setOptions?.({ gestureEnabled: false });
    return () => {
      if (typeof unsubBeforeRemove === 'function') {
        unsubBeforeRemove();
      }
      navigation.setOptions?.({ gestureEnabled: true });
    };
  }, [isProcessing, navigation]);

  useEffect(() => {
    if (!isProcessing) {
      return;
    }

    let mounted = true;
    let intervalId;
    const checkStatus = async () => {
      try {
        const status = await AsyncStorage.getItem('paymentStatus');
        if (mounted && status === 'SUCCESS' && !handledSuccess) {
          setHandledSuccess(true);
          setIsProcessing(false);
          await AsyncStorage.removeItem('paymentStatus');
          if (typeof onPaymentSuccess === 'function') {
            onPaymentSuccess();
          }
        } else if (mounted && (status === 'CANCELLED' || status === 'FAILED')) {
          setIsProcessing(false);
          await AsyncStorage.removeItem('paymentStatus');
          if (typeof onPaymentFail === 'function') {
            onPaymentFail();
          }
        }
      } catch (_) {
      }
    };
    intervalId = setInterval(checkStatus, 1000);
    checkStatus();
    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [handledSuccess, isProcessing, onPaymentFail, onPaymentSuccess]);

  
  const applyCoupon = async () => {
    if (applyLoading) return;
    const code = (couponCode || '').trim();
    if (!code) {
      setApplyError('Enter a valid coupon code');
      setApplySuccess(null);
      return;
    }
    setApplyLoading(true);
    setApplyError(null);
    setApplySuccess(null);
    try {
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      if (!token) {
        throw new Error('Authentication required');
      }
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/kundlikonnect/apply-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token,
        },
        body: JSON.stringify({ code }),
      });
      const json = await res.json().catch(() => ({}));
      const item = Array.isArray(json) ? (json[0] || {}) : (json || {});
      const rawValid = item?.valid;
      const isValid = rawValid === true || rawValid === 'true';
      const isInvalid = rawValid === false || rawValid === 'false';
      if (isInvalid) {
        const reason = item.reason || '';
        const mapped =
          reason === 'COUPON_NOT_FOUND'
            ? 'Coupon is not valid'
            : reason === 'COUPON_EXPIRED'
            ? 'Coupon has expired'
            : reason === 'COUPON_ALREADY_USED'
            ? 'Coupon already used'
            : item.message || 'Coupon is not valid';
        setApplyError(mapped);
        setApplySuccess(null);
        setCouponInfo(null);
        setDiscountAmount(0);
        return;
      }
      if (!isValid) {
        const msg = item?.message || 'Failed to apply coupon';
        throw new Error(msg);
      }
      setApplySuccess(item?.message || 'Coupon applied successfully');
      setCouponInfo(item || null);
      const base = Number(amount) || 0;
      let nextAmount = base;
      if (item?.discountType === 'PERCENTAGE' && typeof item?.discountValue === 'number') {
        const pct = Math.max(0, Math.min(100, item.discountValue));
        nextAmount = Math.round(base - (base * pct) / 100);
      } else if (item?.discountType === 'FLAT' && typeof item?.discountValue === 'number') {
        nextAmount = Math.max(0, Math.round(base - item.discountValue));
      } else {
        const maybeAmounts = [
          item?.finalAmount,
          item?.data?.finalAmount,
          item?.discountedAmount,
          item?.data?.discountedAmount,
          item?.amount,
          item?.data?.amount,
        ];
        const found = maybeAmounts.find((v) => typeof v === 'number' && !Number.isNaN(v));
        if (typeof found === 'number') {
          nextAmount = found;
        }
      }
      if (typeof nextAmount === 'number' && nextAmount > 0) {
        setPayableAmount(nextAmount);
      }
      {
        const providedDiscounts = [
          item?.discountAmount,
          item?.data?.discountAmount,
          item?.discount,
          item?.data?.discount,
        ];
        const direct = providedDiscounts.find((v) => typeof v === 'number' && !Number.isNaN(v));
        const computed = Math.max(0, base - (typeof nextAmount === 'number' ? nextAmount : base));
        setDiscountAmount(typeof direct === 'number' ? direct : computed);
      }
    } catch (e) {
      setApplyError(e?.message || 'Something went wrong');
    } finally {
      setApplyLoading(false);
    }
  };

const handlePayment = async () => {
  logMetaEvent("fb_mobile_payment_unlock_click");

  try {
    if (Platform.OS === 'web') {
      throw new Error('In-app purchase is not supported on web');
    }

    const { fetchProducts, requestPurchase } = require('react-native-iap');
    const productId =
      Platform.OS === "ios" ? IOS_CHAT_PRODUCT_ID : ANDROID_CHAT_PRODUCT_ID;

    console.log("PAYMENT_PRODUCT_DEBUG:", {
      platform: Platform.OS,
      productId,
    });

    setHandledSuccess(false);
    setLoading(true);
    setIsProcessing(true);
    await AsyncStorage.removeItem("paymentStatus");

    await AsyncStorage.setItem(
      "ORDER_DATA",
      JSON.stringify({
        amount: payableAmount,
        fullName,
        productId,
        userId,
        phone,
        sessionId,
        requestedTimeInMinutes,
        couponInfo,
      })
    );

    console.log("ORDER DATA STORED");
    console.log("BUYING PRODUCT:", productId);

    const fetchedProducts = await fetchProducts({
      skus: [productId],
      type: "in-app",
    });

    console.log("FETCHED PRODUCTS:", fetchedProducts);

    if (!fetchedProducts?.length) {
      throw new Error(`SKU not found in StoreKit: ${productId}`);
    }

await requestPurchase({
  request: {
    ios: {
      sku: IOS_CHAT_PRODUCT_ID,
    },
    android: {
      skus: [ANDROID_CHAT_PRODUCT_ID],
    },
  },
  type: "in-app",
});
  } catch (e) {
    console.log("Purchase Error:", e.message);
    setIsProcessing(false);
    await AsyncStorage.removeItem("ORDER_DATA");
    await AsyncStorage.removeItem("paymentStatus");
    if (typeof onPaymentFail === "function") {
      onPaymentFail();
    }
  } finally {
    setLoading(false);
  }
};
 // Redesigned PaymentPage UI
// ✅ Keeps all existing payment logic, payment processing modal,
// requestPurchase flow, callbacks, and functionality intact.
// ✅ Only the UI/Design section and styles are modernized.
// Replace ONLY the return(...) section and styles object with this.

return (
  <ScrollView
    contentContainerStyle={styles.container}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
  >
    {/* ===== Processing Modal ===== */}
    <Modal
      visible={isProcessing}
      transparent
      onRequestClose={() => {}}
      animationType="fade"
    >
      <View style={styles.processingOverlay}>
        <View style={styles.processingBox}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.processingTitle}>{t('paymentProcessingTitle')}</Text>
          <Text style={styles.processingSubtitle}>
            {t('paymentProcessingSubtitle')}
          </Text>
        </View>
      </View>
    </Modal>

    {/* ===== Top Header ===== */}
    <View style={styles.topRow}>
      <TouchableOpacity
        onPress={isProcessing ? undefined : onRequestClose}
        disabled={isProcessing}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>

      {/* <View style={styles.securityBadge}>
        <Ionicons name="shield-checkmark-outline" size={18} color="#4F46E5" />
      </View> */}
    </View>

    {/* ===== Hero Section ===== */}
    <View style={styles.heroSection}>
      <View >
        <Image
          source={require('../../assets/images/lock2.png')}
          style={styles.lockImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.heroTitle}>{t('paymentHeroTitle')}</Text>

      <Text style={styles.heroSubtitle}>
        {t('paymentHeroSubtitle')}
      </Text>
    </View>

    {/* ===== Insight Card ===== */}
    <View style={styles.insightCard}>
      <View style={styles.insightLeft}>
        <View style={styles.starIconWrap}>
          <Ionicons name="sparkles" size={15} color={colors.gold} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.insightTitle}>
            {t('paymentInsightTitle')}
          </Text>
          <Text style={styles.insightSubtitle}>
            {t('paymentInsightSubtitle')}
          </Text>
        </View>
      </View>

      {/* <Ionicons name="chevron-forward" size={22} color="#7C3AED" /> */}
    </View>

    {/* ===== Dots ===== */}
    <View style={styles.dotRow}>
      {/* <View style={[styles.dot, styles.activeDot]} />
      <View style={styles.dot} />
      <View style={styles.dot} />
      <View style={styles.dot} /> */}
    </View>

    {/* ===== Payment Card ===== */}
    <View style={styles.paymentCard}>
      <Text style={styles.paymentTitle}>{t('paymentSecureTitle')}</Text>

      <View style={styles.safeRow}>
        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
        <Text style={styles.safeText}>{t('paymentSafeSecure')}</Text>
      </View>

      <Text style={styles.price}>₹{payableAmount}</Text>

      <Text style={styles.priceSubtext}>
        {t('paymentOneTimeOnly')}
      </Text>

      {/* ===== Pay Button ===== */}
      <TouchableOpacity
        style={styles.payButton}
        onPress={handlePayment}
        disabled={loading || isProcessing}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <Text style={styles.payButtonText}>{t('paymentPayNow')}</Text>
           
          </>
        )}
      </TouchableOpacity>

      {/* ===== Features ===== */}
      <View style={styles.featuresRow}>
        <View style={styles.featureItem}>
          <View style={styles.featureIconPurple}>
            <Ionicons name="lock-closed" size={14} color={colors.gold} />
          </View>
          <Text style={styles.featureText}>{t('paymentFeatureSecure')}</Text>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIconPurple}>
            <Ionicons name="shield-checkmark" size={14} color={colors.gold} />
          </View>
          <Text style={styles.featureText}>{t('paymentFeaturePrivate')}</Text>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIconGreen}>
            <Ionicons name="checkmark" size={14} color={colors.success} />
          </View>
          <Text style={styles.featureText}>{t('paymentFeatureOneTime')}</Text>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIconYellow}>
            <Ionicons name="flash" size={14} color={colors.warning} />
          </View>
          <Text style={styles.featureText}>{t('paymentFeatureInstant')}</Text>
        </View>
      </View>
    </View>

    {/* ===== Trust Card ===== */}
    {/* <View style={styles.trustCard}>
      <Text style={styles.trustText}>Trusted by 1L+ users</Text>

      <View style={styles.ratingWrap}>
        <Ionicons name="star" size={18} color="#FBBF24" />
        <Text style={styles.ratingText}>4.8</Text>
      </View>
    </View> */}

    {/* ===== Footer ===== */}
    {/* <Text style={styles.footerText}>
      By continuing, you agree to our
      <Text style={styles.footerLink}> Terms</Text>
      {' & '}
      <Text style={styles.footerLink}>Privacy Policy</Text>
    </Text> */}
  </ScrollView>
);
}


const makeStyles = (colors, isDark) => StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    flexGrow: 1,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },

  securityBadge: {
    
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroSection: {
    alignItems: 'center',
    
  },

  lockCircle: {
    // width: 120,
    // height: 120,
    borderRadius: 60,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 10,
  },
  lockImage: {
    width: 80,
    height: 80,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },

  heroSubtitle: {
    marginTop: 10,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  insightCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },

  insightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  starIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 21,
    backgroundColor: colors.goldSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  insightTitle: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 15,
  },

  insightSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
  },

  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 22,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: '#8B5CF6',
    width: 20,
  },

  // paymentCard: 
  // },

  paymentTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },

  safeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  safeText: {
    marginLeft: 5,
    color: colors.success,
    fontWeight: '600',
    fontSize: 12,
  },

  price: {
    textAlign: 'center',
    fontSize: 44,
    fontWeight: '800',
    color: colors.goldText,
    marginTop: 16,
  },

  priceSubtext: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 6,
    fontSize: 13,
  },

  payButton: {
    backgroundColor: colors.primarySolid,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 10,
  },

  payButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimary,
  },

  payButtonSubtext: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },

  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },

  featureItem: {
    alignItems: 'center',
    flex: 1,
  },

  featureIconPurple: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.goldSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  featureIconGreen: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(46,125,50,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  featureIconYellow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245,158,11,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  featureText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },

  trustCard: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  trustText: {
    fontWeight: '700',
    color: '#111827',
  },

  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingText: {
    marginLeft: 5,
    fontWeight: '800',
    color: '#111827',
  },

  footerText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },

  footerLink: {
    color: '#8B5CF6',
    fontWeight: '700',
  },

  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  processingBox: {
    width: '84%',
    backgroundColor: colors.elevated,
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.surfaceBorder,
  },

  processingTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },

  processingSubtitle: {
    marginTop: 8,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
}   )
