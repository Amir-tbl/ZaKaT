import AsyncStorage from '@react-native-async-storage/async-storage';

// All AsyncStorage keys used in the app
const ALL_STORAGE_KEYS = [
  // Auth
  '@auth_user',
  '@auth_credentials',
  '@auth_session',
  // Profile
  '@user_profile',
  // Content
  '@zakat_posts',
  '@zakat_requests',
  // Donations
  '@zakat_donations',
  '@zakat_treasury',
  // Social
  '@zakat_follows',
  '@zakat_notifications',
];

/**
 * Clears all app data from AsyncStorage
 * Use this to reset the app to a fresh state
 */
export async function resetAllData(): Promise<void> {
  await AsyncStorage.multiRemove(ALL_STORAGE_KEYS);
  console.log('All app data has been reset');
}

/**
 * Clears only content data (posts, requests, donations)
 * Keeps user auth and profile
 */
export async function resetContentData(): Promise<void> {
  await AsyncStorage.multiRemove([
    '@zakat_posts',
    '@zakat_requests',
    '@zakat_donations',
    '@zakat_treasury',
    '@zakat_follows',
    '@zakat_notifications',
  ]);
  console.log('Content data has been reset');
}
