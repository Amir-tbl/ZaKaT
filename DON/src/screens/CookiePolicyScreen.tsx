import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius} from '../theme';

export function CookiePolicyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politique de cookies</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.lastUpdated}>Derni\u00e8re mise \u00e0 jour : 9 mars 2026</Text>

        {/* 1. Qu'est-ce qu'un cookie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Qu'est-ce qu'un cookie ?</Text>
          <Text style={styles.bodyText}>
            Un cookie est un petit fichier texte d\u00e9pos\u00e9 sur votre terminal (ordinateur, smartphone, tablette) lors de la consultation d'un site web. Il permet au site de m\u00e9moriser des informations relatives \u00e0 votre navigation (pr\u00e9f\u00e9rences de langue, identifiant de session, etc.) afin de faciliter vos prochaines visites.
          </Text>
          <Text style={styles.bodyText}>
            La pr\u00e9sente politique de cookies est conforme aux recommandations de la Commission Nationale de l'Informatique et des Libert\u00e9s (CNIL) relatives aux cookies et aux traceurs, adopt\u00e9es le 17 septembre 2020.
          </Text>
        </View>

        {/* 2. Application mobile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Cookies dans l'application mobile</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              L'application mobile ZaKaT n'utilise pas de cookies au sens traditionnel du terme. Les donn\u00e9es de session et de pr\u00e9f\u00e9rences sont stock\u00e9es localement sur votre appareil via des m\u00e9canismes natifs s\u00e9curis\u00e9s (AsyncStorage, SQLite).
            </Text>
          </View>
          <Text style={styles.bodyText}>
            L'application utilise toutefois des technologies similaires pour :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>Authentification :</Text> jetons de session Firebase Auth pour maintenir votre connexion.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>Pr\u00e9f\u00e9rences locales :</Text> stockage de vos param\u00e8tres (th\u00e8me, langue) sur votre appareil.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>Cache de donn\u00e9es :</Text> mise en cache temporaire pour am\u00e9liorer les performances.</Text>
          <Text style={styles.bodyText}>
            Ces donn\u00e9es restent sur votre appareil et ne sont pas partag\u00e9es avec des tiers \u00e0 des fins publicitaires.
          </Text>
        </View>

        {/* 3. Cookies du site web */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Cookies utilis\u00e9s sur le site web</Text>
          <Text style={styles.bodyText}>
            Le site web ZaKaT utilise diff\u00e9rentes cat\u00e9gories de cookies :
          </Text>

          <Text style={styles.subTitle}>3.1 Cookies strictement n\u00e9cessaires</Text>
          <Text style={styles.bodyText}>
            Ces cookies sont indispensables au fonctionnement du site. Ils ne n\u00e9cessitent pas votre consentement pr\u00e9alable (article 82 de la Loi Informatique et Libert\u00e9s).
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Nom</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1.5}]}>Finalit\u00e9</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.7}]}>Dur\u00e9e</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>session_id</Text>
              <Text style={[styles.tableCell, {flex: 1.5}]}>Maintien de la session utilisateur</Text>
              <Text style={[styles.tableCell, {flex: 0.7}]}>Session</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>csrf_token</Text>
              <Text style={[styles.tableCell, {flex: 1.5}]}>Protection contre les attaques CSRF</Text>
              <Text style={[styles.tableCell, {flex: 0.7}]}>Session</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>cookie_consent</Text>
              <Text style={[styles.tableCell, {flex: 1.5}]}>M\u00e9morisation de vos choix cookies</Text>
              <Text style={[styles.tableCell, {flex: 0.7}]}>6 mois</Text>
            </View>
          </View>

          <Text style={styles.subTitle}>3.2 Cookies de mesure d'audience (analytiques)</Text>
          <Text style={styles.bodyText}>
            Ces cookies permettent de mesurer la fr\u00e9quentation du site et d'analyser son utilisation de mani\u00e8re anonymis\u00e9e. Ils n\u00e9cessitent votre consentement pr\u00e9alable.
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Nom</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1.5}]}>Finalit\u00e9</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.7}]}>Dur\u00e9e</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>_ga</Text>
              <Text style={[styles.tableCell, {flex: 1.5}]}>Distinction des visiteurs (Google Analytics)</Text>
              <Text style={[styles.tableCell, {flex: 0.7}]}>13 mois</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>_gid</Text>
              <Text style={[styles.tableCell, {flex: 1.5}]}>Distinction des visiteurs (Google Analytics)</Text>
              <Text style={[styles.tableCell, {flex: 0.7}]}>24 heures</Text>
            </View>
          </View>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Aucun cookie publicitaire, de ciblage ou de pistage n'est utilis\u00e9 sur le site web ZaKaT.
            </Text>
          </View>
        </View>

        {/* 4. Consentement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Votre consentement</Text>
          <Text style={styles.bodyText}>
            Conform\u00e9ment aux recommandations de la CNIL :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Lors de votre premi\u00e8re visite sur le site web, un bandeau d'information vous propose d'accepter ou de refuser les cookies non essentiels.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Aucun cookie non essentiel n'est d\u00e9pos\u00e9 avant l'obtention de votre consentement explicite.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Vous pouvez modifier vos choix \u00e0 tout moment via le lien "G\u00e9rer les cookies" disponible en pied de page du site.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Le refus des cookies non essentiels n'emp\u00eache pas l'acc\u00e8s au site et \u00e0 ses fonctionnalit\u00e9s principales.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Votre consentement est conserv\u00e9 pendant une dur\u00e9e maximale de 6 mois, conform\u00e9ment aux recommandations de la CNIL.</Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              Refuser ou accepter les cookies est une action aussi simple l'une que l'autre, conform\u00e9ment aux exigences de la CNIL.
            </Text>
          </View>
        </View>

        {/* 5. Gestion des cookies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Comment g\u00e9rer vos cookies</Text>
          <Text style={styles.bodyText}>
            Vous pouvez configurer votre navigateur pour refuser ou supprimer les cookies. Voici les liens vers les instructions des principaux navigateurs :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>Google Chrome :</Text> Param\u00e8tres {'>'} Confidentialit\u00e9 et s\u00e9curit\u00e9 {'>'} Cookies</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>Mozilla Firefox :</Text> Options {'>'} Vie priv\u00e9e et s\u00e9curit\u00e9 {'>'} Cookies</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>Safari :</Text> Pr\u00e9f\u00e9rences {'>'} Confidentialit\u00e9 {'>'} Cookies</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>Microsoft Edge :</Text> Param\u00e8tres {'>'} Cookies et autorisations</Text>
          <Text style={styles.bodyText}>
            La suppression des cookies peut entra\u00eener des difficult\u00e9s de navigation sur le site (perte de session, pr\u00e9f\u00e9rences non sauvegard\u00e9es).
          </Text>
        </View>

        {/* 6. Cookies tiers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Cookies tiers</Text>
          <Text style={styles.bodyText}>
            Le site web peut int\u00e9grer des contenus ou services fournis par des tiers, susceptibles de d\u00e9poser des cookies :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>Google (Firebase / Analytics) :</Text> authentification et mesure d'audience.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>Stripe :</Text> traitement s\u00e9curis\u00e9 des paiements.</Text>
          <Text style={styles.bodyText}>
            Ces cookies sont soumis aux politiques de confidentialit\u00e9 respectives de ces tiers. Nous vous invitons \u00e0 consulter leurs politiques pour plus d'informations.
          </Text>
        </View>

        {/* 7. Duree de conservation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Dur\u00e9e de conservation</Text>
          <Text style={styles.bodyText}>
            Conform\u00e9ment aux recommandations de la CNIL, les cookies ont une dur\u00e9e de vie maximale de 13 mois apr\u00e8s leur d\u00e9p\u00f4t. Au-del\u00e0 de ce d\u00e9lai, les donn\u00e9es collect\u00e9es par les cookies sont supprim\u00e9es ou anonymis\u00e9es. Votre consentement est renouvel\u00e9 tous les 6 mois.
          </Text>
        </View>

        {/* 8. Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Contact</Text>
          <Text style={styles.bodyText}>
            Pour toute question relative \u00e0 l'utilisation des cookies :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Par e-mail : contact@zakat-app.com</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Par courrier : FOODTRUCKVIEWS \u2014 25 Quai du Pr\u00e9sident Paul Doumer, 92400 Courbevoie</Text>
          <Text style={styles.bodyText}>
            Vous pouvez \u00e9galement consulter le site de la CNIL pour en savoir plus sur vos droits : www.cnil.fr.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>\u00a9 2026 FOODTRUCKVIEWS. Tous droits r\u00e9serv\u00e9s.</Text>
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
  headerPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  lastUpdated: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: colors.primary + '10',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  subTitle: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  bodyText: {
    ...typography.bodySmall,
    color: colors.mutedText,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
  bulletItem: {
    ...typography.bodySmall,
    color: colors.mutedText,
    lineHeight: 22,
    paddingLeft: spacing.lg,
    marginBottom: spacing.xs,
  },
  highlightBox: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  highlightText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: colors.accent + '08',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '500',
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  warningText: {
    ...typography.bodySmall,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 20,
  },
  table: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tableHeaderCell: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tableCell: {
    ...typography.caption,
    color: colors.mutedText,
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
