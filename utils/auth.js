import AsyncStorage from '@react-native-async-storage/async-storage';

export const verifyToken = async () => {
  try {
    const token = await AsyncStorage.getItem('AUTH_TOKEN');
    if (!token) {
      return { valid: false, reason: 'no-token' };
    }

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/verify-token`,
      {
        method: 'POST',
        headers: {
          token: token,
        },
      }
    );

    const data = await res.json();

    // ✅ backend is source of truth
    if (data?.valid === false) {
      return {
        valid: false,
        reason: data.message || 'token-expired',
      };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, reason: 'network-error' };
  }
};
