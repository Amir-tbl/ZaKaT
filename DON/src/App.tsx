import React, {useEffect, useState} from 'react';
import {StatusBar, View, Text, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StripeProvider} from '@stripe/stripe-react-native';
import {RootNavigator} from './navigation';
import {AuthProvider} from './providers';
import {initializeDatabase} from './db';
import {Loading} from './components';
import {colors, typography, spacing} from './theme';
import {resetAllData} from './utils/resetData';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Reset done - data cleared on 2026-02-05
        // To reset again, uncomment: await resetAllData();

        await initializeDatabase();
        setIsReady(true);
      } catch (err) {
        console.error('Database initialization failed:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Erreur d\'initialisation de la base de donnees',
        );
      }
    };

    init();
  }, []);

  if (error) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <Loading message="Initialisation..." />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={colors.background}
            />
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.error,
    marginBottom: spacing.md,
  },
  errorMessage: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: 'center',
  },
});
