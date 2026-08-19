// import Constants from 'expo-constants';

// export default function getApiBase() {
//   // NOTE: For web development you can run the local proxy and set
//   // EXPO_PUBLIC_API_BASE_URL=http://localhost:3001 to avoid CORS issues (then client calls /update-profile etc.)
//   const env = process.env?.EXPO_PUBLIC_API_BASE_URL || process.env?.EXPO_PUBLIC_API_BASE_URL || process.env?.API_URL || process.env?.EXPO_PUBLIC_API_URL;

//   // During development, if no env var is present, prefer a local proxy base
//   if ((process.env?.NODE_ENV === 'development' || __DEV__) && !env) {
//     return 'http://localhost:3001';
//   }
//   const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};
//   const API_BASE = env || extra?.EXPO_PUBLIC_API_BASE_URL || extra?.EXPO_PUBLIC_API_BASE_URL || extra?.API_URL || 'http://localhost:3000';
//   return API_BASE;
// }
