import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {useAuth} from '../providers';
import {AppNavigator} from './AppNavigator';
import {AuthNavigator} from './AuthNavigator';
import {OnboardingScreen} from '../screens/OnboardingScreen';
import {colors} from '../theme';

export function RootNavigator() {
  const {user, isLoading, hasProfile, isProfileLoading} = useAuth();

  if (isLoading || (user && isProfileLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator />;
  }

  if (hasProfile === false) {
    return <OnboardingScreen />;
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
