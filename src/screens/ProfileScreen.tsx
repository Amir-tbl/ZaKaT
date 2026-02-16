import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Switch, Alert, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Card, PrimaryButton, Loading} from '../components';
import {useUserStore, useDonationStore, useApplicantStore} from '../store';
import {resetDatabase} from '../db';
import {colors, spacing, typography, borderRadius} from '../theme';

export function ProfileScreen() {
  const {user, isLoading, loadUser, updateUser, reset: resetUserStore} = useUserStore();
  const {reset: resetDonationStore, loadTotal} = useDonationStore();
  const {reset: resetApplicantStore, loadValidated, loadPending, loadApplicants} = useApplicantStore();
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleNotificationsChange = async (value: boolean) => {
    try {
      await updateUser({notificationsEnabled: value});
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour les paramètres.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser les données',
      'Cette action va supprimer toutes les données et les remplacer par les données de démonstration. Continuer ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await resetDatabase();
              resetUserStore();
              resetDonationStore();
              resetApplicantStore();
              await loadUser();
              await loadTotal();
              await loadValidated();
              await loadPending();
              await loadApplicants();
              Alert.alert('Succès', 'Les données ont été réinitialisées.');
            } catch {
              Alert.alert('Erreur', 'Impossible de réinitialiser les données.');
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading && !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Loading message="Chargement du profil..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Icon name="account-circle" size={80} color={colors.primary} />
          </View>
          <Text style={styles.displayName}>{user?.displayName || 'Utilisateur'}</Text>
          <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Paramètres</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name="bell-outline" size={24} color={colors.text} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={user?.notificationsEnabled ?? false}
              onValueChange={handleNotificationsChange}
              trackColor={{false: colors.border, true: colors.primary + '60'}}
              thumbColor={
                user?.notificationsEnabled ? colors.primary : colors.mutedText
              }
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Zone de démonstration</Text>
        <Card style={styles.dangerCard}>
          <View style={styles.dangerInfo}>
            <Icon name="alert-circle-outline" size={24} color={colors.warning} />
            <View style={styles.dangerText}>
              <Text style={styles.dangerTitle}>Réinitialiser les données</Text>
              <Text style={styles.dangerDescription}>
                Supprime toutes les données et restaure les données de démonstration
                initiales.
              </Text>
            </View>
          </View>
          <PrimaryButton
            title="Réinitialiser"
            onPress={handleReset}
            loading={resetting}
            variant="outline"
            size="medium"
            style={styles.resetButton}
          />
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don App v1.0.0</Text>
          <Text style={styles.footerSubtext}>Application de démonstration</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  displayName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.mutedText,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  settingsCard: {
    marginBottom: spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    ...typography.body,
    marginLeft: spacing.md,
  },
  dangerCard: {
    marginBottom: spacing.xl,
  },
  dangerInfo: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  dangerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  dangerTitle: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  dangerDescription: {
    ...typography.bodySmall,
    color: colors.mutedText,
  },
  resetButton: {
    borderColor: colors.warning,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.mutedText,
  },
  footerSubtext: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
