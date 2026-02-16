import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography} from '../theme';

export function LegalScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mentions legales</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Coming Soon */}
        <View style={styles.comingSoonCard}>
          <MaterialCommunityIcons name="file-document-edit-outline" size={48} color={colors.mutedText} />
          <Text style={styles.comingSoonTitle}>Bientot disponible</Text>
          <Text style={styles.comingSoonText}>
            Les mentions legales et la politique de confidentialite seront disponibles
            dans une prochaine mise a jour.
          </Text>
        </View>

        {/* Placeholder sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conditions d'utilisation</Text>
          <Text style={styles.placeholder_text}>
            Les conditions generales d'utilisation de l'application seront detaillees ici.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Politique de confidentialite</Text>
          <Text style={styles.placeholder_text}>
            Notre politique concernant la collecte, l'utilisation et la protection de vos
            donnees personnelles sera decrite ici.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cookies</Text>
          <Text style={styles.placeholder_text}>
            Information sur l'utilisation des cookies et technologies similaires.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.placeholder_text}>
            Pour toute question concernant vos donnees ou nos conditions, contactez-nous a :
          </Text>
          <Text style={styles.contactEmail}>contact@zakat-app.com</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Derniere mise a jour : Fevrier 2025</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  comingSoonCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  comingSoonTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  comingSoonText: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  placeholder_text: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },
  contactEmail: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    color: colors.mutedText,
  },
});
