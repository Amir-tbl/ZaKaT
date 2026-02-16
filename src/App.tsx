import React, {useEffect, useState} from 'react';
import {StatusBar, View, Text, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StripeProvider} from '@stripe/stripe-react-native';
import {AppNavigator} from './navigation';
import {initializeDatabase} from './db';
import {Loading} from './components';
import {colors, typography, spacing} from './theme';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
        setIsReady(true);
      } catch (err) {
        console.error('Database initialization failed:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Erreur d\'initialisation de la base de données',
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
    <StripeProvider
      publishableKey="pk_test_51T0LwqBwoIr8Q1GfpZW3QPnaBP19341D1Au2KUOjpYlXqyyO9Bem81TFTd1ojngyrmQJFS3Z3m46HVzBHkOZunlD00RpmCmjGU"
      merchantIdentifier="com.donapp"
      urlScheme="donapp"
    >
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={colors.background}
          />
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </StripeProvider>
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
