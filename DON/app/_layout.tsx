import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeDatabase } from '../src/db/init';
import { colors } from '../src/theme/colors';
import { AuthProvider, useAuth } from '../src/providers';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

// Composant interne pour le route guard
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading, hasProfile, isProfileLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || isProfileLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!user) {
      // Pas connecte -> redirect vers login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (hasProfile === false) {
      // Connecte mais pas de profil -> redirect vers onboarding
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/complete-profile');
      }
    } else if (hasProfile === true) {
      // Connecte avec profil -> redirect vers tabs
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, hasProfile, isProfileLoading, segments]);

  if (isLoading || (user && isProfileLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initializeDatabase();
      } catch (e) {
        console.warn('Erreur initialisation DB:', e);
      } finally {
        setIsDbReady(true);
      }
    }
    prepare();
  }, []);

  if (!isDbReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
