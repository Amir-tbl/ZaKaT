import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius} from '../theme';

export function CGUScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CGU</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.lastUpdated}>Derni\u00e8re mise \u00e0 jour : 9 mars 2026</Text>

        {/* Preambule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pr\u00e9ambule</Text>
          <Text style={styles.bodyText}>
            Les pr\u00e9sentes Conditions G\u00e9n\u00e9rales d'Utilisation (ci-apr\u00e8s "CGU") ont pour objet de d\u00e9finir les modalit\u00e9s et conditions d'utilisation de l'application mobile ZaKaT (ci-apr\u00e8s "l'Application") et des services associ\u00e9s, \u00e9dit\u00e9s par la soci\u00e9t\u00e9 FOODTRUCKVIEWS, dont le si\u00e8ge social est situ\u00e9 au 25 Quai du Pr\u00e9sident Paul Doumer, 92400 Courbevoie, France (ci-apr\u00e8s "l'\u00c9diteur").
          </Text>
          <Text style={styles.bodyText}>
            L'utilisation de l'Application implique l'acceptation pleine et enti\u00e8re des pr\u00e9sentes CGU. Si vous n'acceptez pas ces conditions, vous \u00eates invit\u00e9(e) \u00e0 ne pas utiliser l'Application.
          </Text>
        </View>

        {/* 1. Definitions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 1 \u2014 D\u00e9finitions</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>"Application"</Text> : l'application mobile ZaKaT, disponible sur iOS et Android.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>"Utilisateur"</Text> : toute personne physique qui acc\u00e8de \u00e0 l'Application et utilise ses services.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>"Donateur"</Text> : Utilisateur qui effectue un don via l'Application.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>"Demandeur"</Text> : Utilisateur qui soumet une demande d'aide via l'Application.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>"B\u00e9n\u00e9ficiaire"</Text> : Demandeur dont le dossier a \u00e9t\u00e9 valid\u00e9 et qui re\u00e7oit une aide financi\u00e8re.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>"Administrateur"</Text> : personne habilit\u00e9e par l'\u00c9diteur \u00e0 g\u00e9rer les dossiers et la distribution des fonds.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>"Tr\u00e9sorerie"</Text> : fonds collect\u00e9s via l'Application, destin\u00e9s \u00e0 \u00eatre distribu\u00e9s aux b\u00e9n\u00e9ficiaires.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} <Text style={styles.bold}>"Services"</Text> : l'ensemble des fonctionnalit\u00e9s propos\u00e9es par l'Application.</Text>
        </View>

        {/* 2. Objet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 2 \u2014 Objet</Text>
          <Text style={styles.bodyText}>
            L'Application ZaKaT est une plateforme de gestion de dons solidaires qui permet :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Aux donateurs d'effectuer des dons destin\u00e9s \u00e0 la Zakat ou \u00e0 d'autres causes solidaires.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Aux demandeurs de soumettre des dossiers de demande d'aide.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Aux administrateurs de g\u00e9rer la validation des dossiers et la distribution \u00e9quitable des fonds.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} \u00c0 l'ensemble des utilisateurs de b\u00e9n\u00e9ficier d'une transparence totale sur l'utilisation des fonds.</Text>
        </View>

        {/* 3. Acces et inscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 3 \u2014 Acc\u00e8s et inscription</Text>
          <Text style={styles.subTitle}>3.1 Conditions d'acc\u00e8s</Text>
          <Text style={styles.bodyText}>
            L'Application est accessible gratuitement \u00e0 tout utilisateur disposant d'un appareil mobile compatible (iOS ou Android) et d'une connexion internet. L'acc\u00e8s aux fonctionnalit\u00e9s principales n\u00e9cessite la cr\u00e9ation d'un compte utilisateur.
          </Text>
          <Text style={styles.subTitle}>3.2 Conditions d'\u00e2ge</Text>
          <Text style={styles.bodyText}>
            L'utilisation de l'Application est r\u00e9serv\u00e9e aux personnes physiques majeures (\u00e2g\u00e9es d'au moins 18 ans) et juridiquement capables. En cr\u00e9ant un compte, vous d\u00e9clarez et garantissez avoir au moins 18 ans.
          </Text>
          <Text style={styles.subTitle}>3.3 Cr\u00e9ation de compte</Text>
          <Text style={styles.bodyText}>
            L'inscription requiert la fourniture d'informations v\u00e9ridiques, exactes et \u00e0 jour. L'Utilisateur s'engage \u00e0 mettre \u00e0 jour ces informations en cas de modification. Chaque Utilisateur ne peut d\u00e9tenir qu'un seul compte.
          </Text>
          <Text style={styles.bodyText}>
            L'Utilisateur est responsable de la confidentialit\u00e9 de ses identifiants de connexion et de toute activit\u00e9 r\u00e9alis\u00e9e depuis son compte. En cas d'utilisation frauduleuse, l'Utilisateur doit en informer imm\u00e9diatement l'\u00c9diteur.
          </Text>
        </View>

        {/* 4. Utilisation du service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 4 \u2014 Utilisation du service</Text>
          <Text style={styles.subTitle}>4.1 Obligations de l'Utilisateur</Text>
          <Text style={styles.bodyText}>L'Utilisateur s'engage \u00e0 :</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Utiliser l'Application conform\u00e9ment \u00e0 sa destination et aux pr\u00e9sentes CGU.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Fournir des informations v\u00e9ridiques et exactes.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Ne pas utiliser l'Application \u00e0 des fins frauduleuses ou illicites.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Respecter les droits des autres utilisateurs.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Ne pas tenter de contourner les mesures de s\u00e9curit\u00e9 de l'Application.</Text>

          <Text style={styles.subTitle}>4.2 Comportements interdits</Text>
          <Text style={styles.bodyText}>Sont strictement interdits :</Text>
          <Text style={styles.bulletItem}>{'\u2022'} La cr\u00e9ation de faux profils ou l'usurpation d'identit\u00e9.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} La soumission de demandes d'aide frauduleuses ou trompeuses.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} L'utilisation de l'Application pour le blanchiment d'argent ou le financement d'activit\u00e9s illicites.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} La diffusion de contenus haineux, diffamatoires, discriminatoires ou contraires \u00e0 l'ordre public.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Toute tentative de piratage, d'extraction de donn\u00e9es ou d'ing\u00e9nierie inverse.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} L'utilisation de robots, scripts ou outils automatis\u00e9s pour interagir avec l'Application.</Text>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Tout manquement \u00e0 ces obligations peut entra\u00eener la suspension ou la suppression imm\u00e9diate du compte, sans pr\u00e9avis ni indemnit\u00e9, et sans pr\u00e9judice de toute action en justice.
            </Text>
          </View>
        </View>

        {/* 5. Dons et transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 5 \u2014 Dons et transactions financi\u00e8res</Text>
          <Text style={styles.subTitle}>5.1 Nature des dons</Text>
          <Text style={styles.bodyText}>
            Les dons effectu\u00e9s via l'Application sont des lib\u00e9ralit\u00e9s volontaires et d\u00e9finitives. Sauf disposition l\u00e9gale contraire, les dons ne sont pas remboursables une fois la transaction valid\u00e9e.
          </Text>
          <Text style={styles.subTitle}>5.2 Commission de service</Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              Une commission de 2 % est pr\u00e9lev\u00e9e sur chaque don pour couvrir les frais de fonctionnement de la plateforme. Le montant de cette commission est clairement affich\u00e9 avant la validation du don.
            </Text>
          </View>
          <Text style={styles.subTitle}>5.3 Traitement des paiements</Text>
          <Text style={styles.bodyText}>
            Les paiements sont trait\u00e9s par Stripe, prestataire de paiement certifi\u00e9 PCI DSS niveau 1. FOODTRUCKVIEWS ne stocke aucune donn\u00e9e bancaire. L'Utilisateur accepte les conditions d'utilisation de Stripe lors de toute transaction.
          </Text>
          <Text style={styles.subTitle}>5.4 Droit de r\u00e9tractation</Text>
          <Text style={styles.bodyText}>
            Conform\u00e9ment \u00e0 l'article L.221-28 du Code de la consommation, le droit de r\u00e9tractation ne s'applique pas aux dons et lib\u00e9ralit\u00e9s, qui constituent des prestations pleinement ex\u00e9cut\u00e9es d\u00e8s la confirmation de la transaction. En effectuant un don, l'Utilisateur accepte que la prestation soit ex\u00e9cut\u00e9e imm\u00e9diatement et renonce express\u00e9ment \u00e0 son droit de r\u00e9tractation.
          </Text>
          <Text style={styles.subTitle}>5.5 Distribution des fonds</Text>
          <Text style={styles.bodyText}>
            Les fonds collect\u00e9s (d\u00e9duction faite de la commission) sont distribu\u00e9s aux b\u00e9n\u00e9ficiaires dont les dossiers ont \u00e9t\u00e9 valid\u00e9s par les administrateurs. La distribution est effectu\u00e9e selon des crit\u00e8res transparents et \u00e9quitables d\u00e9finis par l'\u00c9diteur.
          </Text>
        </View>

        {/* 6. Demandes d'aide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 6 \u2014 Demandes d'aide</Text>
          <Text style={styles.bodyText}>
            Les demandeurs peuvent soumettre des dossiers de demande d'aide via l'Application. Les dossiers sont examin\u00e9s par les administrateurs habilit\u00e9s. L'\u00c9diteur se r\u00e9serve le droit de refuser toute demande sans avoir \u00e0 justifier sa d\u00e9cision.
          </Text>
          <Text style={styles.bodyText}>
            Le demandeur garantit l'exactitude et la sinc\u00e9rit\u00e9 des informations fournies dans son dossier. Toute fausse d\u00e9claration pourra entra\u00eener le rejet de la demande, la suspension du compte et des poursuites judiciaires.
          </Text>
        </View>

        {/* 7. Propriete intellectuelle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 7 \u2014 Propri\u00e9t\u00e9 intellectuelle</Text>
          <Text style={styles.bodyText}>
            L'ensemble des \u00e9l\u00e9ments de l'Application (textes, graphismes, logos, ic\u00f4nes, images, logiciels, base de donn\u00e9es) est prot\u00e9g\u00e9 par le droit de la propri\u00e9t\u00e9 intellectuelle et reste la propri\u00e9t\u00e9 exclusive de FOODTRUCKVIEWS.
          </Text>
          <Text style={styles.bodyText}>
            L'Utilisateur b\u00e9n\u00e9ficie d'un droit d'usage limit\u00e9, non exclusif et non transf\u00e9rable de l'Application, pour un usage personnel et non commercial. Toute reproduction, repr\u00e9sentation ou exploitation non autoris\u00e9e est interdite.
          </Text>
        </View>

        {/* 8. Contenus utilisateurs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 8 \u2014 Contenus des utilisateurs</Text>
          <Text style={styles.bodyText}>
            L'Utilisateur conserve la propri\u00e9t\u00e9 des contenus qu'il publie sur l'Application (textes, images, documents). En publiant du contenu, l'Utilisateur accorde \u00e0 l'\u00c9diteur une licence non exclusive, gratuite et mondiale pour utiliser, reproduire et afficher ce contenu dans le cadre du fonctionnement de l'Application.
          </Text>
          <Text style={styles.bodyText}>
            L'Utilisateur garantit qu'il d\u00e9tient les droits n\u00e9cessaires sur les contenus publi\u00e9s et que ceux-ci ne portent pas atteinte aux droits de tiers.
          </Text>
        </View>

        {/* 9. Responsabilite */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 9 \u2014 Responsabilit\u00e9</Text>
          <Text style={styles.subTitle}>9.1 Responsabilit\u00e9 de l'\u00c9diteur</Text>
          <Text style={styles.bodyText}>
            L'\u00c9diteur s'efforce d'assurer la disponibilit\u00e9 de l'Application mais ne garantit pas un fonctionnement ininterrompu ou exempt d'erreurs. L'\u00c9diteur ne saurait \u00eatre tenu responsable :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Des interruptions temporaires pour maintenance ou mise \u00e0 jour.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Des dommages li\u00e9s \u00e0 l'utilisation ou \u00e0 l'impossibilit\u00e9 d'utiliser l'Application.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} De l'exactitude des informations fournies par les utilisateurs.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Des agissements frauduleux d'utilisateurs.</Text>
          <Text style={styles.subTitle}>9.2 R\u00f4le d'interm\u00e9diaire</Text>
          <Text style={styles.bodyText}>
            L'\u00c9diteur agit en qualit\u00e9 d'interm\u00e9diaire technique entre les donateurs et les b\u00e9n\u00e9ficiaires. Il ne saurait \u00eatre tenu responsable de l'utilisation des fonds par les b\u00e9n\u00e9ficiaires apr\u00e8s distribution.
          </Text>
        </View>

        {/* 10. Disponibilite */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 10 \u2014 Disponibilit\u00e9 du service</Text>
          <Text style={styles.bodyText}>
            L'\u00c9diteur fait ses meilleurs efforts pour maintenir l'Application accessible 24h/24 et 7j/7. Toutefois, l'acc\u00e8s peut \u00eatre interrompu, notamment pour des raisons de maintenance, de mise \u00e0 jour ou en cas de force majeure (au sens de l'article 1218 du Code civil).
          </Text>
          <Text style={styles.bodyText}>
            L'\u00c9diteur se r\u00e9serve le droit de modifier, suspendre ou interrompre tout ou partie des Services \u00e0 tout moment, avec ou sans pr\u00e9avis.
          </Text>
        </View>

        {/* 11. Suspension et resiliation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 11 \u2014 Suspension et r\u00e9siliation</Text>
          <Text style={styles.subTitle}>11.1 Par l'Utilisateur</Text>
          <Text style={styles.bodyText}>
            L'Utilisateur peut \u00e0 tout moment supprimer son compte depuis les param\u00e8tres de l'Application. La suppression entra\u00eene l'effacement des donn\u00e9es personnelles, sous r\u00e9serve des obligations l\u00e9gales de conservation.
          </Text>
          <Text style={styles.subTitle}>11.2 Par l'\u00c9diteur</Text>
          <Text style={styles.bodyText}>
            L'\u00c9diteur se r\u00e9serve le droit de suspendre ou r\u00e9silier le compte d'un Utilisateur en cas de :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Violation des pr\u00e9sentes CGU.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Comportement frauduleux ou abusif.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Fourniture d'informations fausses ou trompeuses.</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Atteinte aux droits de tiers ou \u00e0 l'ordre public.</Text>
          <Text style={styles.bodyText}>
            La suspension ou r\u00e9siliation sera notifi\u00e9e \u00e0 l'Utilisateur par tout moyen. En cas de r\u00e9siliation pour faute, aucune indemnit\u00e9 n'est due \u00e0 l'Utilisateur.
          </Text>
        </View>

        {/* 12. Donnees personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 12 \u2014 Donn\u00e9es personnelles</Text>
          <Text style={styles.bodyText}>
            Le traitement des donn\u00e9es personnelles des Utilisateurs est d\u00e9crit dans la Politique de confidentialit\u00e9 de l'Application, accessible depuis le menu "Mentions l\u00e9gales". Cette politique fait partie int\u00e9grante des pr\u00e9sentes CGU.
          </Text>
        </View>

        {/* 13. Modification des CGU */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 13 \u2014 Modification des CGU</Text>
          <Text style={styles.bodyText}>
            L'\u00c9diteur se r\u00e9serve le droit de modifier les pr\u00e9sentes CGU \u00e0 tout moment. Les modifications seront notifi\u00e9es aux Utilisateurs par notification dans l'Application au moins 30 jours avant leur entr\u00e9e en vigueur.
          </Text>
          <Text style={styles.bodyText}>
            La poursuite de l'utilisation de l'Application apr\u00e8s l'entr\u00e9e en vigueur des CGU modifi\u00e9es vaut acceptation des nouvelles conditions. Si l'Utilisateur n'accepte pas les modifications, il peut supprimer son compte avant la date d'entr\u00e9e en vigueur.
          </Text>
        </View>

        {/* 14. Droit applicable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 14 \u2014 Droit applicable et litiges</Text>
          <Text style={styles.subTitle}>14.1 Droit applicable</Text>
          <Text style={styles.bodyText}>
            Les pr\u00e9sentes CGU sont soumises au droit fran\u00e7ais.
          </Text>
          <Text style={styles.subTitle}>14.2 M\u00e9diation</Text>
          <Text style={styles.bodyText}>
            Conform\u00e9ment aux articles L.611-1 et suivants du Code de la consommation, en cas de litige, l'Utilisateur consommateur peut recourir gratuitement \u00e0 un m\u00e9diateur de la consommation en vue de la r\u00e9solution amiable du litige :
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
            L'Utilisateur peut \u00e9galement recourir \u00e0 la plateforme de R\u00e8glement en Ligne des Litiges (RLL) de la Commission europ\u00e9enne : https://ec.europa.eu/consumers/odr.
          </Text>
          <Text style={styles.subTitle}>14.3 Juridiction comp\u00e9tente</Text>
          <Text style={styles.bodyText}>
            \u00c0 d\u00e9faut de r\u00e9solution amiable, tout litige relatif \u00e0 l'interpr\u00e9tation ou l'ex\u00e9cution des pr\u00e9sentes CGU sera soumis aux tribunaux comp\u00e9tents du ressort du si\u00e8ge social de l'\u00c9diteur, sauf disposition l\u00e9gale imp\u00e9rative contraire.
          </Text>
        </View>

        {/* 15. Dispositions diverses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 15 \u2014 Dispositions diverses</Text>
          <Text style={styles.subTitle}>15.1 Divisibilit\u00e9</Text>
          <Text style={styles.bodyText}>
            Si l'une quelconque des stipulations des pr\u00e9sentes CGU est d\u00e9clar\u00e9e nulle ou inapplicable, les autres stipulations demeureront en vigueur.
          </Text>
          <Text style={styles.subTitle}>15.2 Non-renonciation</Text>
          <Text style={styles.bodyText}>
            Le fait pour l'\u00c9diteur de ne pas se pr\u00e9valoir d'un manquement de l'Utilisateur \u00e0 l'une quelconque des dispositions des pr\u00e9sentes CGU ne saurait s'interpr\u00e9ter comme une renonciation \u00e0 la disposition en cause.
          </Text>
          <Text style={styles.subTitle}>15.3 Int\u00e9gralit\u00e9</Text>
          <Text style={styles.bodyText}>
            Les pr\u00e9sentes CGU, compl\u00e9t\u00e9es par la Politique de confidentialit\u00e9 et la Politique de cookies, constituent l'int\u00e9gralit\u00e9 de l'accord entre l'Utilisateur et l'\u00c9diteur relatif \u00e0 l'utilisation de l'Application.
          </Text>
        </View>

        {/* 16. Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 16 \u2014 Contact</Text>
          <Text style={styles.bodyText}>
            Pour toute question relative aux pr\u00e9sentes CGU :
          </Text>
          <Text style={styles.bulletItem}>{'\u2022'} Par e-mail : contact@zakat-app.com</Text>
          <Text style={styles.bulletItem}>{'\u2022'} Par courrier : FOODTRUCKVIEWS \u2014 25 Quai du Pr\u00e9sident Paul Doumer, 92400 Courbevoie</Text>
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
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    color: colors.mutedText,
  },
});
