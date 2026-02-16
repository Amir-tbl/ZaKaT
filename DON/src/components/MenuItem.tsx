import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography} from '../theme';

interface MenuItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  iconColor?: string;
  danger?: boolean;
}

export function MenuItem({
  icon,
  label,
  subtitle,
  onPress,
  showArrow = true,
  iconColor,
  danger = false,
}: MenuItemProps) {
  const textColor = danger ? colors.error : colors.text;
  const finalIconColor = iconColor || (danger ? colors.error : colors.primary);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[styles.iconContainer, {backgroundColor: finalIconColor + '15'}]}>
        <MaterialCommunityIcons name={icon} size={22} color={finalIconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.label, {color: textColor}]}>{label}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {showArrow && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.mutedText}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  label: {
    ...typography.body,
    fontWeight: '500',
  },
  subtitle: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
});
