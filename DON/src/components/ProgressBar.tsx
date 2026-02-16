import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {colors, borderRadius} from '../theme';

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  color = colors.primary,
  backgroundColor = colors.border,
  height = 8,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.container, {backgroundColor, height}, style]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: `${clampedProgress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
