import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {profileService} from '../services/profile';
import {isOrganizationProfile} from '../services/profile';
import type {RequestStackParamList} from '../navigation/RequestNavigator';

type NavigationProp = NativeStackNavigationProp<RequestStackParamList, 'CreateMenu'>;
type RouteProps = RouteProp<RequestStackParamList, 'CreateMenu'>;

export function CreateMenuScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {mode} = route.params || {};
  const [isOrganization, setIsOrganization] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await profileService.get();
        if (profile && isOrganizationProfile(profile)) {
          setIsOrganization(true);
        }
      } catch {
        // If profile can't be loaded, assume individual
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Auto-redirect based on mode parameter
  useEffect(() => {
    if (!loading && !hasRedirected && mode) {
      setHasRedirected(true);
      if (mode === 'publication') {
        navigation.replace('CreatePost');
      } else if (mode === 'request' && !isOrganization) {
        navigation.replace('CreateRequest');
      }
      // If mode is 'request' but user is organization, stay on menu and show message
    }
  }, [loading, mode, hasRedirected, isOrganization, navigation]);

  function handleCreatePost() {
    navigation.replace('CreatePost');
  }

  function handleCreateRequest() {
    if (!isOrganization) {
      navigation.replace('CreateRequest');
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={typography.body}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{width: 44}} />
        <Text style={styles.headerTitle}>Creer</Text>
        <View style={{width: 44}} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Que souhaitez-vous creer ?</Text>

        {/* Option A: Create Post */}
        <TouchableOpacity
          style={styles.optionCard}
          activeOpacity={0.7}
          onPress={handleCreatePost}>
          <View style={[styles.optionIcon, {backgroundColor: colors.accent + '15'}]}>
            <MaterialCommunityIcons
              name="newspaper-variant-outline"
              size={32}
              color={colors.accent}
            />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Creer une publication</Text>
            <Text style={styles.optionDescription}>
              Partagez une actualite, un temoignage ou l'impact de vos actions
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.mutedText}
          />
        </TouchableOpacity>

        {/* Option B: Create Request */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            isOrganization && styles.optionCardDisabled,
          ]}
          activeOpacity={isOrganization ? 1 : 0.7}
          onPress={handleCreateRequest}>
          <View
            style={[
              styles.optionIcon,
              {backgroundColor: colors.primary + '15'},
              isOrganization && styles.optionIconDisabled,
            ]}>
            <MaterialCommunityIcons
              name="hand-heart"
              size={32}
              color={isOrganization ? colors.mutedText : colors.primary}
            />
          </View>
          <View style={styles.optionTextContainer}>
            <Text
              style={[
                styles.optionTitle,
                isOrganization && styles.optionTitleDisabled,
              ]}>
              Creer une demande de don
            </Text>
            {isOrganization ? (
              <Text style={styles.optionDisabledMessage}>
                Les associations recoivent les dons via leur profil
              </Text>
            ) : (
              <Text style={styles.optionDescription}>
                Lancez un appel aux dons pour une cause specifique
              </Text>
            )}
          </View>
          {!isOrganization && (
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.mutedText}
            />
          )}
          {isOrganization && (
            <MaterialCommunityIcons
              name="lock"
              size={20}
              color={colors.mutedText}
            />
          )}
        </TouchableOpacity>

        {/* Info for organizations */}
        {isOrganization && (
          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="information"
              size={20}
              color={colors.accent}
            />
            <Text style={styles.infoText}>
              En tant qu'association, les donateurs peuvent vous soutenir directement via votre page de profil. Utilisez les publications pour partager vos actualites et l'impact de vos actions.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  optionCardDisabled: {
    opacity: 0.7,
    backgroundColor: colors.background,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconDisabled: {
    backgroundColor: colors.border + '50',
  },
  optionTextContainer: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  optionTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  optionTitleDisabled: {
    color: colors.mutedText,
  },
  optionDescription: {
    ...typography.caption,
    color: colors.mutedText,
    lineHeight: 18,
  },
  optionDisabledMessage: {
    ...typography.caption,
    color: colors.warning,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accent + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.accent,
    lineHeight: 20,
  },
});
