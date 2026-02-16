import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {formatCentsToEuros} from '../utils';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';

interface TotalBannerProps {
  totalCents: number;
  onDonate: () => void;
}

export function TotalBanner({totalCents, onDonate}: TotalBannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="treasure-chest" size={32} color={colors.surface} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Tresor des dons</Text>
          <Text style={styles.amount}>{formatCentsToEuros(totalCents)}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.donateButton}
        onPress={onDonate}
        activeOpacity={0.8}>
        <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
        <Text style={styles.donateText}>Faire un don au tresor</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  label: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  amount: {
    ...typography.h1,
    color: colors.surface,
    fontSize: 32,
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  donateText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
