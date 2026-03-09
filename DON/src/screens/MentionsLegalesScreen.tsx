import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius} from '../theme';

export function MentionsLegalesScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mentions l\u00e9gales</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.lastUpdated}>Derni\u00e8re mise \u00e0 jour : 9 mars 2026</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Conform\u00e9ment aux dispositions de la Loi n\u00b0 2004-575 du 21 juin 2004 pour la confiance dans l'\u00e9conomie num\u00e9rique (LCEN), les pr\u00e9sentes mentions l\u00e9gales sont port\u00e9es \u00e0 la connaissance des utilisateurs de l'application mobile ZaKaT et du site web associ\u00e9.
          </Text>
        </View>

        {/* 1. Editeur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. \u00c9diteur de l'application et du site</Text>
          <Text style={styles.bodyText}>
            L'application mobile ZaKaT et le site web associ\u00e9 sont \u00e9dit\u00e9s par :
          </Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Raison sociale : </Text>
              <Text style={styles.detailValue}>FOODTRUCKVIEWS</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Forme juridique : </Text>
              <Text style={styles.detailValue}>[À COMPLÉTER - ex : SAS, SARL, etc.]</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Capital social : </Text>
              <Text style={styles.detailValue}>[À COMPLÉTER] euros</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Si\u00e8ge social : </Text>
              <Text style={styles.detailValue}>25 Quai du Pr\u00e9sident Paul Doumer, 92400 Courbevoie, France</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>SIRET : </Text>
              <Text style={styles.detailValue}>[À COMPLÉTER]</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>RCS : </Text>
              <Text style={styles.detailValue}>[À COMPLÉTER] RCS Nanterre</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Num\u00e9ro TVA intracommunautaire : </Text>
              <Text style={styles.detailValue}>[À COMPLÉTER]</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Directeur de la publication : </Text>
              <Text style={styles.detailValue}>[À COMPLÉTER - Nom du repr\u00e9sentant l\u00e9gal]</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact : </Text>
              <Text style={styles.detailValue}>contact@zakat-app.com</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>T\u00e9l\u00e9phone : </Text>
              <Text style={styles.detailValue}>[À COMPLÉTER]</Text>
            </Text>
          </View>
        </View>

        {/* 2. Hebergeur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. H\u00e9bergeur</Text>
          <Text style={styles.bodyText}>
            Le site web est h\u00e9berg\u00e9 par :
          </Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Raison sociale : </Text>
              <Text style={styles.detailValue}>OVHcloud</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Forme juridique : </Text>
              <Text style={styles.detailValue}>SAS</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Si\u00e8ge social : </Text>
              <Text style={styles.detailValue}>2 rue Kellermann, 59100 Roubaix, France</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>T\u00e9l\u00e9phone : </Text>
              <Text style={styles.detailValue}>1007 (depuis la France)</Text>
            </Text>
          </View>
          <Text style={styles.bodyText}>
            Les donn\u00e9es de l'application mobile sont h\u00e9berg\u00e9es sur les serveurs de Google LLC (Firebase / Google Cloud Platform), dont le si\u00e8ge social est situ\u00e9 au 1600 Amphitheatre Parkway, Mountain View, CA 94043, \u00c9tats-Unis. Le transfert de donn\u00e9es hors de l'Union europ\u00e9enne est encadr\u00e9 par des clauses contractuelles types approuv\u00e9es par la Commission europ\u00e9enne, conform\u00e9ment aux articles 46 et suivants du R\u00e8glement G\u00e9n\u00e9ral sur la Protection des Donn\u00e9es (RGPD).
          </Text>
        </View>

        {/* 3. Objet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Objet de l'application</Text>
          <Text style={styles.bodyText}>
            L'application ZaKaT est une plateforme num\u00e9rique de gestion de dons solidaires destin\u00e9e \u00e0 faciliter la collecte, la gestion et la distribution \u00e9quitable de la Zakat et d'autres formes de dons au sein de la communaut\u00e9. Elle permet aux utilisateurs d'effectuer des dons, de soumettre des demandes d'aide et de suivre la r\u00e9partition des fonds de mani\u00e8re transparente.
          </Text>
        </View>

        {/* 4. Propriete intellectuelle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Propri\u00e9t\u00e9 intellectuelle</Text>
          <Text style={styles.bodyText}>
            L'ensemble du contenu de l'application ZaKaT et du site web associ\u00e9 (textes, graphismes, images, logos, ic\u00f4nes, sons, logiciels, base de donn\u00e9es, etc.) est prot\u00e9g\u00e9 par les dispositions du Code de la propri\u00e9t\u00e9 intellectuelle et par les lois fran\u00e7aises et internationales relatives \u00e0 la propri\u00e9t\u00e9 intellectuelle.
          </Text>
          <Text style={styles.bodyText}>
            La marque ZaKaT, le logo et l'ensemble des \u00e9l\u00e9ments graphiques sont la propri\u00e9t\u00e9 exclusive de FOODTRUCKVIEWS. Toute reproduction, repr\u00e9sentation, modification, publication ou adaptation de tout ou partie des \u00e9l\u00e9ments de l'application, quel que soit le moyen ou le proc\u00e9d\u00e9 utilis\u00e9, est interdite sans l'autorisation \u00e9crite pr\u00e9alable de FOODTRUCKVIEWS.
          </Text>
          <Text style={styles.bodyText}>
            Toute exploitation non autoris\u00e9e de l'application ou de l'un quelconque des \u00e9l\u00e9ments qu'elle contient sera consid\u00e9r\u00e9e comme constitutive d'une contrefa\u00e7on et poursuivie conform\u00e9ment aux dispositions des articles L.335-2 et suivants du Code de la propri\u00e9t\u00e9 intellectuelle.
          </Text>
        </View>

        {/* 5. Responsabilite */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Limitation de responsabilit\u00e9</Text>
          <Text style={styles.bodyText}>
            FOODTRUCKVIEWS s'efforce d'assurer au mieux l'exactitude et la mise \u00e0 jour des informations diffus\u00e9es sur l'application et le site web. Toutefois, FOODTRUCKVIEWS ne peut garantir l'exactitude, la pr\u00e9cision ou l'exhaustivit\u00e9 des informations mises \u00e0 disposition.
          </Text>
          <Text style={styles.bodyText}>
            FOODTRUCKVIEWS d\u00e9cline toute responsabilit\u00e9 :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} pour toute impr\u00e9cision, inexactitude ou omission portant sur des informations disponibles sur l'application ;</Text>
          <Text style={styles.bulletItem}>{'\u2022'} pour tous dommages r\u00e9sultant d'une intrusion frauduleuse d'un tiers ayant entra\u00een\u00e9 une modification des informations mises \u00e0 disposition ;</Text>
          <Text style={styles.bulletItem}>{'\u2022'} pour tout dommage, direct ou indirect, quelles qu'en soient les causes, origines, natures ou cons\u00e9quences, provoqu\u00e9 \u00e0 raison de l'acc\u00e8s de quiconque \u00e0 l'application ou de l'impossibilit\u00e9 d'y acc\u00e9der ;</Text>
          <Text style={styles.bulletItem}>{'\u2022'} pour tout dommage r\u00e9sultant de l'utilisation des informations et contenus de l'application.</Text>
        </View>

        {/* 6. Donnees personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Donn\u00e9es personnelles</Text>
          <Text style={styles.bodyText}>
            Les traitements de donn\u00e9es personnelles r\u00e9alis\u00e9s dans le cadre de l'application ZaKaT sont d\u00e9crits dans notre Politique de confidentialit\u00e9, accessible depuis le menu "Mentions l\u00e9gales" de l'application.
          </Text>
          <Text style={styles.bodyText}>
            Conform\u00e9ment \u00e0 la Loi n\u00b0 78-17 du 6 janvier 1978 modifi\u00e9e (Loi Informatique et Libert\u00e9s) et au R\u00e8glement europ\u00e9en 2016/679 (RGPD), vous disposez de droits sur vos donn\u00e9es personnelles (acc\u00e8s, rectification, suppression, portabilit\u00e9, opposition, limitation).
          </Text>
          <Text style={styles.bodyText}>
            Pour exercer ces droits, vous pouvez nous contacter \u00e0 l'adresse : contact@zakat-app.com.
          </Text>
          <Text style={styles.bodyText}>
            Vous disposez \u00e9galement du droit d'introduire une r\u00e9clamation aupr\u00e8s de la Commission Nationale de l'Informatique et des Libert\u00e9s (CNIL) :
          </Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>CNIL : </Text>
              <Text style={styles.detailValue}>3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>T\u00e9l\u00e9phone : </Text>
              <Text style={styles.detailValue}>01 53 73 22 22</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Site web : </Text>
              <Text style={styles.detailValue}>www.cnil.fr</Text>
            </Text>
          </View>
        </View>

        {/* 7. Cookies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Cookies</Text>
          <Text style={styles.bodyText}>
            L'utilisation de cookies sur le site web et l'application est d\u00e9taill\u00e9e dans notre Politique de cookies, accessible depuis le menu "Mentions l\u00e9gales" de l'application. Conform\u00e9ment \u00e0 la recommandation de la CNIL sur les cookies et traceurs, le consentement de l'utilisateur est recueilli avant tout d\u00e9p\u00f4t de cookies non essentiels.
          </Text>
        </View>

        {/* 8. Droit applicable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Droit applicable et juridiction</Text>
          <Text style={styles.bodyText}>
            Les pr\u00e9sentes mentions l\u00e9gales sont r\u00e9gies par le droit fran\u00e7ais. En cas de litige, et apr\u00e8s \u00e9chec de toute tentative de recherche d'une solution amiable, les tribunaux fran\u00e7ais seront seuls comp\u00e9tents pour conna\u00eetre de ce litige.
          </Text>
          <Text style={styles.bodyText}>
            Conform\u00e9ment aux dispositions du Code de la consommation concernant le r\u00e8glement amiable des litiges, l'utilisateur consommateur peut recourir au service de m\u00e9diation suivant :
          </Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>M\u00e9diateur : </Text>
              <Text style={styles.detailValue}>[À COMPLÉTER - Nom du m\u00e9diateur de la consommation]</Text>
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Site web : </Text>
              <Text style={styles.detailValue}>[À COMPLÉTER]</Text>
            </Text>
          </View>
          <Text style={styles.bodyText}>
            L'utilisateur peut \u00e9galement recourir \u00e0 la plateforme europ\u00e9enne de r\u00e8glement en ligne des litiges (RLL) accessible \u00e0 l'adresse suivante : https://ec.europa.eu/consumers/odr.
          </Text>
        </View>

        {/* 9. Credits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Cr\u00e9dits</Text>
          <Text style={styles.bodyText}>
            Conception et d\u00e9veloppement : FOODTRUCKVIEWS.
          </Text>
          <Text style={styles.bodyText}>
            Ic\u00f4nes : MaterialCommunityIcons, @expo/vector-icons.
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
  infoBox: {
    backgroundColor: colors.accent + '08',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '500',
    lineHeight: 20,
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
