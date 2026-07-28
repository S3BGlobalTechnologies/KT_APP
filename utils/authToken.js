import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('AUTH_TOKEN');
    return token;
  } catch (e) {
    console.log("Error reading token", e);
    return null;
  }
};

export const clearAuthToken = async () => {
  try {
    await AsyncStorage.removeItem('AUTH_TOKEN');
  } catch (e) {
    console.log("Error clearing token", e);
  }
};