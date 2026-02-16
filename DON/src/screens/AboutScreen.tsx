import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography} from '../theme';

interface SectionProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  children: React.ReactNode;
}

function Section({icon, title, children}: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export function AboutScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>A propos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Logo / Header */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="hand-heart" size={48} color={colors.primary} />
          </View>
          <Text style={styles.appName}>ZaKaT</Text>
          <Text style={styles.appTagline}>L'entraide simplifiee</Text>
        </View>

        {/* Mission */}
        <Section icon="target" title="Notre mission">
          <Text style={styles.paragraph}>
            ZaKaT a pour mission de faciliter l'entraide et la solidarite au sein de notre
            communaute. Nous croyons que chacun peut contribuer, meme modestement, a ameliorer
            la vie des autres.
          </Text>
        </Section>

        {/* How it works - Treasury */}
        <Section icon="treasure-chest" title="Le Tresor commun">
          <Text style={styles.paragraph}>
            Le <Text style={styles.bold}>Tresor</Text> est une cagnotte collective alimentee
            par les dons de la communaute. Ces fonds sont ensuite redistribues aux personnes
            dans le besoin.
          </Text>
          <View style={styles.bulletPoint}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.bulletText}>
              Donnez le montant de votre choix au Tresor
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.bulletText}>
              Les fonds sont geres de maniere transparente
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.bulletText}>
              Redistribution equitable selon les besoins valides
            </Text>
          </View>
        </Section>

        {/* How it works - Direct */}
        <Section icon="account-heart" title="Aide directe">
          <Text style={styles.paragraph}>
            Vous pouvez egalement aider directement une personne en consultant les demandes
            validees et en contribuant a leur objectif de collecte.
          </Text>
          <View style={styles.bulletPoint}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.bulletText}>
              Consultez les profils des demandeurs
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.bulletText}>
              Toutes les demandes sont verifiees avant publication
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.bulletText}>
              Suivez l'avancement de la collecte en temps reel
            </Text>
          </View>
        </Section>

        {/* Zakat */}
        <Section icon="calculator" title="Calculateur Zakat">
          <Text style={styles.paragraph}>
            Notre calculateur vous aide a estimer votre Zakat annuelle (2,5% de votre epargne).
            C'est un outil indicatif pour vous accompagner dans votre devoir religieux.
          </Text>
        </Section>

        {/* Values */}
        <Section icon="shield-check" title="Nos valeurs">
          <View style={styles.valueRow}>
            <View style={styles.valueItem}>
              <MaterialCommunityIcons name="eye" size={24} color={colors.primary} />
              <Text style={styles.valueTitle}>Transparence</Text>
              <Text style={styles.valueText}>Suivi clair des dons</Text>
            </View>
            <View style={styles.valueItem}>
              <MaterialCommunityIcons name="lock" size={24} color={colors.primary} />
              <Text style={styles.valueTitle}>Securite</Text>
              <Text style={styles.valueText}>Donnees protegees</Text>
            </View>
            <View style={styles.valueItem}>
              <MaterialCommunityIcons name="heart" size={24} color={colors.primary} />
              <Text style={styles.valueTitle}>Solidarite</Text>
              <Text style={styles.valueText}>Entraide mutuelle</Text>
            </View>
          </View>
        </Section>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ZaKaT v1.0.0</Text>
          <Text style={styles.footerSubtext}>Fait avec coeur pour la communaute</Text>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  appTagline: {
    ...typography.body,
    color: colors.mutedText,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    flex: 1,
  },
  sectionContent: {},
  paragraph: {
    ...typography.body,
    lineHeight: 24,
    color: colors.text,
    marginBottom: spacing.md,
  },
  bold: {
    fontWeight: '700',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bulletText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 22,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  valueTitle: {
    ...typography.label,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  valueText: {
    ...typography.caption,
    color: colors.mutedText,
    textAlign: 'center',
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
});
