import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius} from '../theme';

export function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialit\u00e9</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.lastUpdated}>Derni\u00e8re mise \u00e0 jour : 9 mars 2026</Text>

        {/* 1. Responsable du traitement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Responsable du traitement</Text>
          <Text style={styles.bodyText}>
            Le responsable du traitement des donn\u00e9es personnelles collect\u00e9es via l'application ZaKaT est :
          </Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Soci\u00e9t\u00e9 : </Text>
              <Text style={styles.detailValue}>FOODTRUCKVIEWS</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Adresse : </Text>
              <Text style={styles.detailValue}>25 Quai du Pr\u00e9sident Paul Doumer, 92400 Courbevoie, France</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact DPO : </Text>
              <Text style={styles.detailValue}>contact@zakat-app.com</Text>
            </Text>
          </View>
          <Text style={styles.bodyText}>
            Conform\u00e9ment au R\u00e8glement europ\u00e9en 2016/679 relatif \u00e0 la protection des donn\u00e9es \u00e0 caract\u00e8re personnel (RGPD) et \u00e0 la Loi n\u00b0 78-17 du 6 janvier 1978 modifi\u00e9e relative \u00e0 l'informatique, aux fichiers et aux libert\u00e9s, la pr\u00e9sente politique de confidentialit\u00e9 d\u00e9crit les conditions dans lesquelles vos donn\u00e9es personnelles sont collect\u00e9es et trait\u00e9es.
          </Text>
        </View>

        {/* 2. Donnees collectees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Donn\u00e9es collect\u00e9es</Text>
          <Text style={styles.bodyText}>
            Nous collectons diff\u00e9rents types de donn\u00e9es personnelles selon votre utilisation de l'application :
          </Text>

          <Text style={styles.subTitle}>2.1 Donn\u00e9es d'identification</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Nom et pr\u00e9nom</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Adresse e-mail</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Num\u00e9ro de t\u00e9l\u00e9phone (le cas \u00e9ch\u00e9ant)</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Ville ou localit\u00e9 de r\u00e9sidence</Text>

          <Text style={styles.subTitle}>2.2 Donn\u00e9es relatives aux dons</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Montants des dons effectu\u00e9s</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Historique des transactions</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Date et heure de chaque don</Text>
          <Text style={styles.bulletItem}>{'\u2022'} M\u00e9thode de paiement utilis\u00e9e</Text>

          <Text style={styles.subTitle}>2.3 Donn\u00e9es relatives aux demandes d'aide</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Informations fournies dans les dossiers de demande</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Situation personnelle et familiale d\u00e9clar\u00e9e</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Documents justificatifs transmis</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Statut de validation du dossier</Text>

          <Text style={styles.subTitle}>2.4 Donn\u00e9es techniques</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Type d'appareil et syst\u00e8me d'exploitation</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Version de l'application utilis\u00e9e</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Identifiants techniques anonymis\u00e9s</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Journaux d'erreurs et de performance</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Type</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Finalit\u00e9</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Conservation</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>Identit\u00e9</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Gestion du compte</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Dur\u00e9e du compte + 1 an</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>Transactions</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Suivi et transparence</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>5 ans (obligation l\u00e9gale)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>Dossiers demande</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>\u00c9valuation et distribution</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Traitement + 2 ans</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1}]}>Donn\u00e9es techniques</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Am\u00e9lioration de l'app</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>12 mois</Text>
            </View>
          </View>
        </View>

        {/* 3. Bases legales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Bases l\u00e9gales du traitement</Text>
          <Text style={styles.bodyText}>
            Conform\u00e9ment \u00e0 l'article 6 du RGPD, chaque traitement de donn\u00e9es repose sur l'une des bases l\u00e9gales suivantes :
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, {flex: 1.2}]}>Traitement</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Base l\u00e9gale (Art. 6 RGPD)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1.2}]}>Cr\u00e9ation et gestion du compte</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Ex\u00e9cution du contrat</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1.2}]}>Traitement des dons et paiements</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Ex\u00e9cution du contrat</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1.2}]}>Traitement des demandes d'aide</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Ex\u00e9cution du contrat</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1.2}]}>Notifications de service</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Int\u00e9r\u00eat l\u00e9gitime</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1.2}]}>Conservation des transactions</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Obligation l\u00e9gale</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1.2}]}>Analyse d'utilisation anonymis\u00e9e</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Int\u00e9r\u00eat l\u00e9gitime</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 1.2}]}>Cookies non essentiels</Text>
              <Text style={[styles.tableCell, {flex: 1}]}>Consentement</Text>
            </View>
          </View>
        </View>

        {/* 4. Utilisation des donnees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Utilisation des donn\u00e9es</Text>
          <Text style={styles.bodyText}>
            Vos donn\u00e9es sont utilis\u00e9es exclusivement pour les finalit\u00e9s suivantes :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Gestion des dons : enregistrement, suivi et tra\u00e7abilit\u00e9 des dons effectu\u00e9s.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Traitement des demandes : r\u00e9ception, \u00e9valuation et validation des dossiers.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Distribution \u00e9quitable : r\u00e9partition des fonds selon des crit\u00e8res transparents.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Transparence : statistiques et rapports de suivi.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Communication : notifications li\u00e9es \u00e0 l'activit\u00e9 de votre compte.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Am\u00e9lioration du service : analyse anonymis\u00e9e pour l'exp\u00e9rience utilisateur.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Obligations l\u00e9gales : respect des obligations comptables et fiscales.</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Nous ne vendons jamais vos donn\u00e9es personnelles \u00e0 des tiers. Vos informations sont utilis\u00e9es uniquement pour le bon fonctionnement du service ZaKaT.
            </Text>
          </View>
        </View>

        {/* 5. Frais de service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Frais de service</Text>
          <Text style={styles.bodyText}>
            Pour assurer le fonctionnement et le d\u00e9veloppement de la plateforme, une commission de 2 % est pr\u00e9lev\u00e9e sur chaque don. Le montant restant (98 %) est int\u00e9gralement revers\u00e9 aux b\u00e9n\u00e9ficiaires.
          </Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              Le montant de la commission est clairement indiqu\u00e9 avant la validation de chaque don. Aucun frais cach\u00e9 n'est appliqu\u00e9.
            </Text>
          </View>
          <Text style={styles.bodyText}>
            Ces frais couvrent : h\u00e9bergement, d\u00e9veloppement, frais de transaction Stripe, support utilisateur et mesures de s\u00e9curit\u00e9.
          </Text>
        </View>

        {/* 6. Destinataires et partage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Destinataires des donn\u00e9es</Text>
          <Text style={styles.bodyText}>
            Vos donn\u00e9es peuvent \u00eatre communiqu\u00e9es aux cat\u00e9gories de destinataires suivantes :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Administrateurs habilit\u00e9s : acc\u00e8s limit\u00e9 aux dossiers des demandeurs pour \u00e9valuation et validation.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Stripe (prestataire de paiement) : donn\u00e9es n\u00e9cessaires au traitement des transactions. Stripe Inc., certifi\u00e9 PCI DSS niveau 1.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Google (Firebase) : h\u00e9bergement des donn\u00e9es et authentification.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Autorit\u00e9s comp\u00e9tentes : en cas d'obligation l\u00e9gale ou judiciaire.</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Les donn\u00e9es des donateurs restent confidentielles vis-\u00e0-vis des b\u00e9n\u00e9ficiaires, et inversement. L'anonymat est garanti.
            </Text>
          </View>
        </View>

        {/* 7. Transferts internationaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Transferts de donn\u00e9es hors UE</Text>
          <Text style={styles.bodyText}>
            Certaines de vos donn\u00e9es sont trait\u00e9es par des prestataires situ\u00e9s en dehors de l'Union europ\u00e9enne, notamment :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Google LLC (Firebase) - \u00c9tats-Unis : h\u00e9bergement des donn\u00e9es, authentification, stockage de fichiers.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Stripe Inc. - \u00c9tats-Unis : traitement des paiements.</Text>
          <Text style={styles.bodyText}>
            Ces transferts sont encadr\u00e9s par des garanties appropri\u00e9es conform\u00e9ment au chapitre V du RGPD :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Clauses contractuelles types (CCT) adopt\u00e9es par la Commission europ\u00e9enne (D\u00e9cision d'ex\u00e9cution 2021/914).</Text>
          <Text style={styles.bulletItem}>{'\u2022'} EU-US Data Privacy Framework pour les entreprises certifi\u00e9es (d\u00e9cision d'ad\u00e9quation du 10 juillet 2023).</Text>
          <Text style={styles.bodyText}>
            Vous pouvez obtenir une copie des garanties mises en place en nous contactant \u00e0 contact@zakat-app.com.
          </Text>
        </View>

        {/* 8. Securite */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. S\u00e9curit\u00e9 des donn\u00e9es</Text>
          <Text style={styles.bodyText}>
            Nous mettons en \u0153uvre des mesures techniques et organisationnelles pour prot\u00e9ger vos donn\u00e9es :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Chiffrement des donn\u00e9es au repos et en transit (TLS/SSL).</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Authentification s\u00e9curis\u00e9e via Firebase Auth (incluant l'authentification multifacteur).</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Contr\u00f4le d'acc\u00e8s strict bas\u00e9 sur les r\u00f4les (RBAC).</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Sauvegardes r\u00e9guli\u00e8res et plan de reprise d'activit\u00e9.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Mises \u00e0 jour de s\u00e9curit\u00e9 r\u00e9guli\u00e8res.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} R\u00e8gles de s\u00e9curit\u00e9 Firestore limitant l'acc\u00e8s aux donn\u00e9es.</Text>
        </View>

        {/* 9. Vos droits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Vos droits</Text>
          <Text style={styles.bodyText}>
            Conform\u00e9ment au RGPD (articles 15 \u00e0 22) et \u00e0 la Loi Informatique et Libert\u00e9s, vous disposez des droits suivants :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Droit d'acc\u00e8s (art. 15) : obtenir une copie de vos donn\u00e9es personnelles.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Droit de rectification (art. 16) : corriger des donn\u00e9es inexactes ou incompl\u00e8tes.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Droit \u00e0 l'effacement (art. 17) : demander la suppression de vos donn\u00e9es.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Droit \u00e0 la limitation (art. 18) : limiter le traitement dans certaines circonstances.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Droit \u00e0 la portabilit\u00e9 (art. 20) : recevoir vos donn\u00e9es dans un format structur\u00e9 et lisible.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Droit d'opposition (art. 21) : vous opposer au traitement pour motifs l\u00e9gitimes.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Droit de retirer votre consentement \u00e0 tout moment, sans affecter la lic\u00e9it\u00e9 du traitement fond\u00e9 sur le consentement donn\u00e9 avant le retrait.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Droit de d\u00e9finir des directives relatives au sort de vos donn\u00e9es apr\u00e8s votre d\u00e9c\u00e8s (art. 85 Loi Informatique et Libert\u00e9s).</Text>
          <Text style={styles.bodyText}>
            Pour exercer vos droits, contactez-nous \u00e0 : contact@zakat-app.com. Nous r\u00e9pondrons dans un d\u00e9lai maximum de 30 jours.
          </Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Vous disposez \u00e9galement du droit d'introduire une r\u00e9clamation aupr\u00e8s de la CNIL (Commission Nationale de l'Informatique et des Libert\u00e9s) : www.cnil.fr \u2014 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
            </Text>
          </View>
        </View>

        {/* 10. Decisions automatisees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. D\u00e9cisions automatis\u00e9es</Text>
          <Text style={styles.bodyText}>
            L'application ZaKaT ne proc\u00e8de \u00e0 aucune prise de d\u00e9cision enti\u00e8rement automatis\u00e9e au sens de l'article 22 du RGPD. Toute d\u00e9cision relative \u00e0 l'attribution des fonds ou \u00e0 la validation des dossiers fait l'objet d'une intervention humaine de la part des administrateurs habilit\u00e9s.
          </Text>
        </View>

        {/* 11. Protection des mineurs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Protection des mineurs</Text>
          <Text style={styles.bodyText}>
            L'application ZaKaT est destin\u00e9e aux personnes majeures (\u00e2g\u00e9es de 18 ans ou plus). Nous ne collectons pas sciemment de donn\u00e9es personnelles aupr\u00e8s de mineurs. Si nous d\u00e9couvrons que des donn\u00e9es d'un mineur ont \u00e9t\u00e9 collect\u00e9es, nous les supprimerons dans les meilleurs d\u00e9lais.
          </Text>
          <Text style={styles.bodyText}>
            Si vous \u00eates parent ou tuteur l\u00e9gal et estimez que votre enfant nous a communiqu\u00e9 des donn\u00e9es personnelles, contactez-nous imm\u00e9diatement.
          </Text>
        </View>

        {/* 12. Modifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Modifications de la politique</Text>
          <Text style={styles.bodyText}>
            FOODTRUCKVIEWS se r\u00e9serve le droit de modifier la pr\u00e9sente politique de confidentialit\u00e9 \u00e0 tout moment. Toute modification substantielle sera port\u00e9e \u00e0 votre connaissance par notification dans l'application ou par e-mail.
          </Text>
          <Text style={styles.bodyText}>
            Nous vous invitons \u00e0 consulter r\u00e9guli\u00e8rement cette page. La poursuite de l'utilisation de l'application apr\u00e8s publication de modifications vaut acceptation de la politique mise \u00e0 jour.
          </Text>
        </View>

        {/* 13. Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Contact</Text>
          <Text style={styles.bodyText}>
            Pour toute question relative \u00e0 la protection de vos donn\u00e9es personnelles ou pour exercer vos droits :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Par e-mail : contact@zakat-app.com</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Par courrier : FOODTRUCKVIEWS \u2014 25 Quai du Pr\u00e9sident Paul Doumer, 92400 Courbevoie</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Via l'application : section "Support"</Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              Votre confiance est essentielle. N'h\u00e9sitez pas \u00e0 nous contacter pour toute question sur la protection de vos donn\u00e9es.
            </Text>
          </View>
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
  bulletItem: {
    ...typography.bodySmall,
    color: colors.mutedText,
    lineHeight: 22,
    paddingLeft: spacing.lg,
    marginBottom: spacing.xs,
  },
  detailBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  detailRow: {
    ...typography.bodySmall,
    color: colors.mutedText,
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  detailLabel: {
    fontWeight: '600',
    color: colors.text,
  },
  detailValue: {
    color: colors.mutedText,
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
