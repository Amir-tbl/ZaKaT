import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography} from '../theme';

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message?: string;
}

export function EmptyState({
  icon = 'inbox-outline',
  title,
  message,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={64} color={colors.border} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
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
  title: {
    ...typography.h3,
    color: colors.mutedText,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.mutedText,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
