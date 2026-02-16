import React from 'react';
import {View, TextInput, Text, StyleSheet, ViewStyle} from 'react-native';
import {colors, borderRadius, spacing, typography} from '../theme';

interface MoneyInputProps {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  placeholder?: string;
}

export function MoneyInput({
  value,
  onChangeText,
  label,
  error,
  containerStyle,
  placeholder = '0',
}: MoneyInputProps) {
  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    onChangeText(cleaned);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={colors.mutedText}
        />
        <Text style={styles.currency}>EUR</Text>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.mutedText,
    marginLeft: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
