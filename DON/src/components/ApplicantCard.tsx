import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {Card} from './Card';
import {ProgressBar} from './ProgressBar';
import {PrimaryButton} from './PrimaryButton';
import {Applicant} from '../domain/models';
import {formatCentsToEuros} from '../utils';
import {colors, spacing, typography} from '../theme';

interface ApplicantCardProps {
  applicant: Applicant;
  onDonate: (applicant: Applicant) => void;
}

export function ApplicantCard({applicant, onDonate}: ApplicantCardProps) {
  const progress = applicant.collectedCents / applicant.goalCents;
  const progressPercent = Math.min(progress * 100, 100).toFixed(0);
  const isCompleted = applicant.collectedCents >= applicant.goalCents;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, isCompleted && styles.avatarCompleted]}>
          <MaterialCommunityIcons
            name={isCompleted ? 'check' : 'account'}
            size={24}
            color={isCompleted ? colors.success : colors.primary}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{applicant.fullName}</Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color={colors.mutedText} />
            <Text style={styles.city}>{applicant.city}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.story} numberOfLines={3}>
        {applicant.shortStory}
      </Text>

      <View style={styles.progressSection}>
        <View style={styles.amountsRow}>
          <Text style={[styles.collected, isCompleted && styles.collectedDone]}>
            {formatCentsToEuros(applicant.collectedCents)}
          </Text>
          <Text style={styles.goal}>
            sur {formatCentsToEuros(applicant.goalCents)}
          </Text>
        </View>
        <ProgressBar
          progress={progress}
          color={isCompleted ? colors.success : colors.primary}
        />
        <Text style={styles.progressText}>{progressPercent}% atteint</Text>
      </View>

      {isCompleted ? (
        <View style={styles.completedBanner}>
          <MaterialCommunityIcons name="check-circle" size={22} color={colors.success} />
          <Text style={styles.completedText}>Terminé !</Text>
        </View>
      ) : (
        <PrimaryButton
          title="Attribuer des fonds"
          onPress={() => onDonate(applicant)}
          size="medium"
          variant="secondary"
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    ...typography.h3,
    fontSize: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  city: {
    ...typography.caption,
    marginLeft: 4,
  },
  story: {
    ...typography.bodySmall,
    color: colors.mutedText,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  collected: {
    ...typography.h3,
    color: colors.primary,
  },
  goal: {
    ...typography.bodySmall,
    color: colors.mutedText,
    marginLeft: spacing.xs,
  },
  progressText: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  avatarCompleted: {
    backgroundColor: colors.success + '15',
  },
  collectedDone: {
    color: colors.success,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '15',
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  completedText: {
    ...typography.h3,
    color: colors.success,
    marginLeft: spacing.sm,
  },
});
