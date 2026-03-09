import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius} from '../theme';
import type {ProfileStackParamList} from '../navigation/ProfileNavigator';

type LegalNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Legal'>;

const legalItems = [
  {
    icon: 'bank' as const,
    title: 'Mentions l\u00e9gales',
    subtitle: '\u00c9diteur, h\u00e9bergeur, propri\u00e9t\u00e9 intellectuelle',
    route: 'MentionsLegales' as const,
    color: colors.primary,
  },
  {
    icon: 'shield-lock' as const,
    title: 'Politique de confidentialit\u00e9',
    subtitle: 'RGPD, donn\u00e9es personnelles, vos droits',
    route: 'PrivacyPolicy' as const,
    color: colors.accent,
  },
  {
    icon: 'file-document-outline' as const,
    title: "Conditions g\u00e9n\u00e9rales d'utilisation",
    subtitle: 'R\u00e8gles d\u2019utilisation du service',
    route: 'CGU' as const,
    color: colors.success,
  },
  {
    icon: 'cookie' as const,
    title: 'Politique de cookies',
    subtitle: 'Cookies, traceurs et consentement',
    route: 'CookiePolicy' as const,
    color: colors.warning,
  },
];

export function LegalScreen() {
  const navigation = useNavigation<LegalNavigationProp>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
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

        <Text style={styles.description}>
          Retrouvez ici l'ensemble des documents juridiques relatifs \u00e0 l'application ZaKaT, conformes \u00e0 la l\u00e9gislation fran\u00e7aise en vigueur (LCEN, RGPD, Loi Informatique et Libert\u00e9s).
        </Text>

        {legalItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.route)}>
            <View style={[styles.iconContainer, {backgroundColor: item.color + '15'}]}>
              <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.mutedText} />
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>\u00a9 2026 FOODTRUCKVIEWS. Tous droits r\u00e9serv\u00e9s.</Text>
          <Text style={styles.footerSubtext}>Derni\u00e8re mise \u00e0 jour : 9 mars 2026</Text>
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
  description: {
    ...typography.bodySmall,
    color: colors.mutedText,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
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
  footerSubtext: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: spacing.xs,
  },
});
