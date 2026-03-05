import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius} from '../theme';

export function LegalScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mentions légales</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.lastUpdated}>Dernière mise à jour : 1er mars 2026</Text>

        {/* 1. Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.bodyText}>
            Bienvenue sur Zakat, une application de gestion de dons solidaires destinée à faciliter la collecte et la distribution équitable de la Zakat au sein de la communauté. La présente politique de confidentialité a pour objectif de vous informer de manière claire et transparente sur la façon dont nous collectons, traitons, stockons et protégeons vos données personnelles lorsque vous utilisez notre application mobile et nos services associés.
          </Text>
          <Text style={styles.bodyText}>
            En utilisant l'application Zakat, vous acceptez les pratiques décrites dans cette politique de confidentialité. Si vous n'acceptez pas les termes de cette politique, nous vous invitons à ne pas utiliser nos services.
          </Text>
          <Text style={styles.bodyText}>
            Cette politique s'applique à l'ensemble des utilisateurs de l'application, qu'ils soient donateurs, bénéficiaires (demandeurs) ou administrateurs.
          </Text>
        </View>

        {/* 2. Donnees collectees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Données collectées</Text>
          <Text style={styles.bodyText}>
            Dans le cadre du fonctionnement de l'application Zakat, nous sommes amenés à collecter différents types de données personnelles. La nature des données collectées dépend de votre utilisation de l'application et de votre rôle (donateur, demandeur ou administrateur).
          </Text>

          <Text style={styles.subTitle}>2.1 Données d'identification</Text>
          <Text style={styles.bulletItem}>Nom et prénom</Text>
          <Text style={styles.bulletItem}>Adresse e-mail</Text>
          <Text style={styles.bulletItem}>Numéro de téléphone (le cas échéant)</Text>
          <Text style={styles.bulletItem}>Ville ou localité de résidence</Text>

          <Text style={styles.subTitle}>2.2 Données relatives aux dons</Text>
          <Text style={styles.bulletItem}>Montants des dons effectués</Text>
          <Text style={styles.bulletItem}>Historique des transactions</Text>
          <Text style={styles.bulletItem}>Date et heure de chaque don</Text>
          <Text style={styles.bulletItem}>Méthode de paiement utilisée</Text>

          <Text style={styles.subTitle}>2.3 Données relatives aux demandes</Text>
          <Text style={styles.bulletItem}>Informations fournies dans les dossiers de demande</Text>
          <Text style={styles.bulletItem}>Situation personnelle et familiale déclarée</Text>
          <Text style={styles.bulletItem}>Documents justificatifs transmis</Text>
          <Text style={styles.bulletItem}>Statut de validation du dossier</Text>

          <Text style={styles.subTitle}>2.4 Données techniques</Text>
          <Text style={styles.bulletItem}>Type d'appareil et système d'exploitation</Text>
          <Text style={styles.bulletItem}>Version de l'application utilisée</Text>
          <Text style={styles.bulletItem}>Identifiants techniques anonymisés</Text>
          <Text style={styles.bulletItem}>Journaux d'erreurs et de performance</Text>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, {flex: 1.2}]}>Type</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1.3}]}>Finalité</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Conservation</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1.2}]}>Identité (nom, email)</Text>
              <Text style={[styles.tableCell, {flex: 1.3}]}>Gestion du compte</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Durée du compte + 1 an</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1.2}]}>Transactions</Text>
              <Text style={[styles.tableCell, {flex: 1.3}]}>Suivi et transparence</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>5 ans</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1.2}]}>Dossiers demande</Text>
              <Text style={[styles.tableCell, {flex: 1.3}]}>Évaluation et distribution</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Traitement + 2 ans</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1.2}]}>Données techniques</Text>
              <Text style={[styles.tableCell, {flex: 1.3}]}>Amélioration de l'app</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>12 mois</Text>
            </View>
          </View>
        </View>

        {/* 3. Utilisation des donnees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Utilisation des données</Text>
          <Text style={styles.bodyText}>
            Les données personnelles que nous collectons sont utilisées exclusivement dans le cadre du fonctionnement de l'application Zakat et pour les finalités suivantes :
          </Text>
          <Text style={styles.bulletItem}>Gestion des dons : enregistrement, suivi et traçabilité de chaque don effectué via la trésorerie de l'application.</Text>
          <Text style={styles.bulletItem}>Traitement des demandes : réception, évaluation et validation des dossiers de demandeurs par les administrateurs habilités.</Text>
          <Text style={styles.bulletItem}>Distribution équitable : répartition des fonds collectés entre les bénéficiaires validés selon des critères transparents et justes.</Text>
          <Text style={styles.bulletItem}>Transparence : mise à disposition de statistiques et de rapports permettant aux donateurs de suivre l'utilisation de leurs contributions.</Text>
          <Text style={styles.bulletItem}>Communication : envoi de notifications liées à l'activité de votre compte.</Text>
          <Text style={styles.bulletItem}>Amélioration du service : analyse anonymisée des données d'utilisation pour améliorer l'expérience utilisateur.</Text>
          <Text style={styles.bulletItem}>Obligations légales : respect des obligations comptables et fiscales en vigueur.</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Nous ne vendons jamais vos données personnelles à des tiers. Vos informations sont utilisées uniquement pour le bon fonctionnement du service Zakat.
            </Text>
          </View>
        </View>

        {/* 4. Frais de service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Frais de service</Text>
          <Text style={styles.bodyText}>
            Afin d'assurer le bon fonctionnement, la maintenance et le développement continu de la plateforme Zakat, des frais de service sont appliqués sur chaque don effectué via l'application.
          </Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              Pour chaque don effectué par un utilisateur, l'application Zakat prélève une commission de 2 % du montant du don.
            </Text>
          </View>
          <Text style={styles.bodyText}>
            Cette commission est automatiquement calculée et déduite au moment de la transaction. Le montant restant, soit 98 % du don initial, est intégralement reversé au fonds destiné aux bénéficiaires.
          </Text>

          <Text style={styles.subTitle}>Exemple concret</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Don</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Commission (2 %)</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Reversé</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>50 EUR</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>1 EUR</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>49 EUR</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>100 EUR</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>2 EUR</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>98 EUR</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>500 EUR</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>10 EUR</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>490 EUR</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>1 000 EUR</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>20 EUR</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>980 EUR</Text>
            </View>
          </View>

          <Text style={styles.subTitle}>À quoi servent ces frais ?</Text>
          <Text style={styles.bulletItem}>Hébergement et infrastructure : maintenance des serveurs, bases de données et services cloud.</Text>
          <Text style={styles.bulletItem}>Développement et amélioration : mises à jour, nouvelles fonctionnalités et corrections de sécurité.</Text>
          <Text style={styles.bulletItem}>Frais de transaction : couverture des coûts liés aux prestataires de paiement tiers.</Text>
          <Text style={styles.bulletItem}>Support utilisateur : assistance technique et accompagnement des utilisateurs.</Text>
          <Text style={styles.bulletItem}>Sécurité : mesures de protection des données et prévention contre la fraude.</Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Le montant de la commission de 2 % est clairement indiqué au donateur avant la validation de chaque don. Aucun frais caché n'est appliqué.
            </Text>
          </View>
        </View>

        {/* 5. Stockage et securite */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Stockage et sécurité des données</Text>
          <Text style={styles.bodyText}>
            La sécurité de vos données est une priorité absolue pour Zakat. Nous mettons en œuvre des mesures techniques et organisationnelles rigoureuses pour protéger vos informations personnelles.
          </Text>

          <Text style={styles.subTitle}>5.1 Stockage</Text>
          <Text style={styles.bodyText}>
            Vos données sont stockées de manière sécurisée via Firebase (Google Cloud). Les paiements sont traités par Stripe, qui dispose de la certification PCI DSS niveau 1.
          </Text>

          <Text style={styles.subTitle}>5.2 Mesures de sécurité</Text>
          <Text style={styles.bulletItem}>Chiffrement des données lors du stockage et de la transmission.</Text>
          <Text style={styles.bulletItem}>Authentification sécurisée via Firebase Auth.</Text>
          <Text style={styles.bulletItem}>Contrôle d'accès : seuls les administrateurs autorisés ont accès aux dossiers des demandeurs.</Text>
          <Text style={styles.bulletItem}>Sauvegardes régulières pour prévenir toute perte accidentelle.</Text>
          <Text style={styles.bulletItem}>Mises à jour de sécurité régulières.</Text>

          <Text style={styles.subTitle}>5.3 Durée de conservation</Text>
          <Text style={styles.bodyText}>
            Vos données personnelles sont conservées aussi longtemps que nécessaire pour les finalités pour lesquelles elles ont été collectées, dans le respect des obligations légales. À l'issue de ces périodes, vos données sont supprimées ou anonymisées de manière irréversible.
          </Text>
        </View>

        {/* 6. Partage des donnees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Partage des données</Text>
          <Text style={styles.bodyText}>
            Zakat s'engage à ne pas vendre, louer ou échanger vos données personnelles avec des tiers à des fins commerciales. Certaines données peuvent être partagées dans les cas suivants :
          </Text>
          <Text style={styles.bulletItem}>Administrateurs de la plateforme : accès aux dossiers des demandeurs pour évaluation et validation.</Text>
          <Text style={styles.bulletItem}>Prestataires de paiement : informations nécessaires au traitement des transactions (Stripe).</Text>
          <Text style={styles.bulletItem}>Obligations légales : communication de données si la loi l'exige.</Text>
          <Text style={styles.bulletItem}>Protection des droits : en cas de nécessité pour protéger les droits et la sécurité de Zakat et de ses utilisateurs.</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Les données des donateurs restent confidentielles vis-à-vis des bénéficiaires, et inversement. L'anonymat est garanti dans le processus de distribution.
            </Text>
          </View>
        </View>

        {/* 7. Vos droits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Vos droits</Text>
          <Text style={styles.bodyText}>
            Conformément au RGPD et à la réglementation en vigueur, vous disposez des droits suivants :
          </Text>
          <Text style={styles.bulletItem}>Droit d'accès : demander une copie de vos données personnelles.</Text>
          <Text style={styles.bulletItem}>Droit de rectification : corriger des données inexactes ou incomplètes.</Text>
          <Text style={styles.bulletItem}>Droit de suppression : demander l'effacement de vos données, sous réserve des obligations légales.</Text>
          <Text style={styles.bulletItem}>Droit à la portabilité : recevoir vos données dans un format lisible par machine.</Text>
          <Text style={styles.bulletItem}>Droit d'opposition : vous opposer au traitement de vos données pour motifs légitimes.</Text>
          <Text style={styles.bulletItem}>Droit à la limitation : limiter le traitement dans certaines circonstances.</Text>
          <Text style={styles.bodyText}>
            Pour exercer l'un de ces droits, contactez-nous à l'adresse indiquée ci-dessous. Nous nous engageons à répondre dans un délai maximum de 30 jours.
          </Text>
        </View>

        {/* 8. Cookies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Cookies et technologies similaires</Text>
          <Text style={styles.bodyText}>
            L'application mobile Zakat n'utilise pas de cookies au sens traditionnel du terme. Cependant, notre site web peut utiliser :
          </Text>
          <Text style={styles.bulletItem}>Cookies essentiels : nécessaires au fonctionnement du site (authentification, préférences).</Text>
          <Text style={styles.bulletItem}>Cookies analytiques : comprendre comment les visiteurs interagissent avec notre site, de façon anonyme.</Text>
          <Text style={styles.bodyText}>
            Aucun cookie publicitaire ou de pistage n'est utilisé.
          </Text>
        </View>

        {/* 9. Protection des mineurs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Protection des mineurs</Text>
          <Text style={styles.bodyText}>
            L'application Zakat n'est pas destinée aux personnes de moins de 18 ans. Nous ne collectons pas sciemment de données personnelles auprès de mineurs. Si nous apprenons que des données d'un mineur ont été collectées sans le consentement parental requis, nous prendrons les mesures nécessaires pour supprimer ces informations dans les meilleurs délais.
          </Text>
        </View>

        {/* 10. Modifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Modifications de la politique</Text>
          <Text style={styles.bodyText}>
            Zakat se réserve le droit de modifier la présente politique de confidentialité à tout moment. Toute modification substantielle sera portée à votre connaissance par le biais d'une notification dans l'application ou par e-mail.
          </Text>
          <Text style={styles.bodyText}>
            Nous vous encourageons à consulter régulièrement cette page pour prendre connaissance des éventuelles mises à jour. La poursuite de l'utilisation de l'application après la publication de modifications vaut acceptation de la politique mise à jour.
          </Text>
        </View>

        {/* 11. Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact</Text>
          <Text style={styles.bodyText}>
            Pour toute question relative à la présente politique de confidentialité, pour exercer vos droits ou pour toute réclamation concernant le traitement de vos données personnelles, vous pouvez nous contacter :
          </Text>
          <Text style={styles.bulletItem}>Par e-mail : contact@zakat-app.com</Text>
          <Text style={styles.bulletItem}>Via l'application : section "Support" accessible depuis le menu principal</Text>
          <Text style={styles.bodyText}>
            Nous nous engageons à traiter chaque demande avec le plus grand soin et à vous apporter une réponse dans un délai maximum de 30 jours ouvrés.
          </Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              Votre confiance est essentielle. N'hésitez pas à nous contacter si vous avez la moindre question sur la manière dont vos données sont protégées.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>2026 Zakat. Tous droits réservés.</Text>
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
  bulletItem: {
    ...typography.bodySmall,
    color: colors.mutedText,
    lineHeight: 22,
    paddingLeft: spacing.lg,
    marginBottom: spacing.xs,
  },
  // Boxes
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
  // Table
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
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    color: colors.mutedText,
  },
});
