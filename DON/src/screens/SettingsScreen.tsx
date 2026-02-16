import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {MenuItem} from '../components/MenuItem';
import {useAuth} from '../providers';
import {profileService} from '../services/profile';
import {colors, spacing, typography} from '../theme';
import type {ProfileStackParamList} from '../navigation/ProfileNavigator';

type SettingsScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

export function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const {signOut, deleteAccount} = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Se deconnecter',
      'Voulez-vous vraiment vous deconnecter ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Deconnecter',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await signOut();
            } catch {
              Alert.alert('Erreur', 'Impossible de se deconnecter.');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irreversible. Votre compte et toutes vos donnees seront supprimes.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileService.deleteProfile();
              await deleteAccount();
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer le compte.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parametres</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Mon compte */}
        <Text style={styles.sectionTitle}>Outils</Text>
        <View style={styles.menuSection}>
          <MenuItem
            icon="calculator"
            label="Calculateur Zakat"
            subtitle="Estimer ma Zakat annuelle"
            onPress={() => navigation.navigate('Zakat')}
            iconColor={colors.accent}
          />
        </View>

        {/* Administration */}
        <Text style={styles.sectionTitle}>Administration</Text>
        <View style={styles.menuSection}>
          <MenuItem
            icon="shield-check"
            label="Moderation"
            subtitle="Gerer les demandes en attente"
            onPress={() => navigation.navigate('Admin')}
            iconColor={colors.warning}
          />
        </View>

        {/* Informations */}
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.menuSection}>
          <MenuItem
            icon="information"
            label="A propos"
            subtitle="Comment ca marche"
            onPress={() => navigation.navigate('About')}
          />
          <MenuItem
            icon="file-document"
            label="Mentions legales"
            subtitle="Confidentialite et CGU"
            onPress={() => navigation.navigate('Legal')}
          />
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.menuSection}>
          <MenuItem
            icon="logout"
            label="Se deconnecter"
            onPress={handleSignOut}
            showArrow={false}
            iconColor={colors.warning}
          />
          <MenuItem
            icon="delete"
            label="Supprimer mon compte"
            onPress={handleDeleteAccount}
            showArrow={false}
            danger
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ZaKaT v1.0.0</Text>
          <Text style={styles.footerSubtext}>Application de demonstration</Text>
        </View>

        {/* Loading overlay for logout */}
        {loggingOut && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 18,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.mutedText,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuSection: {
    marginBottom: spacing.xl,
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
    color: colors.mutedText,
    marginTop: spacing.xs,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
