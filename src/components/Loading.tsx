import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {colors, spacing, typography} from '../theme';

interface LoadingProps {
  message?: string;
}

export function Loading({message = 'Chargement...'}: LoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  text: {
    ...typography.body,
    color: colors.mutedText,
    marginTop: spacing.md,
  },
});
