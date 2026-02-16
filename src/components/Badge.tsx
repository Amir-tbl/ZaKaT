import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, borderRadius, spacing} from '../theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, {bg: string; text: string}> = {
  success: {bg: colors.success + '20', text: colors.success},
  warning: {bg: colors.warning + '20', text: colors.warning},
  error: {bg: colors.error + '20', text: colors.error},
  info: {bg: colors.accent + '20', text: colors.accent},
};

export function Badge({text, variant = 'info'}: BadgeProps) {
  const colorScheme = variantColors[variant];

  return (
    <View style={[styles.badge, {backgroundColor: colorScheme.bg}]}>
      <Text style={[styles.text, {color: colorScheme.text}]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
