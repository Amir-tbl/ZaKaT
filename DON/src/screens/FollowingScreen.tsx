import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {EmptyState} from '../components';
import {followService, Follow, FollowingType} from '../services/follow';
import {organizationService, Organization} from '../services/organization';
import {doc, getDoc} from 'firebase/firestore';
import {db} from '../lib/firebase';

interface FollowingWithInfo extends Follow {
  displayName: string;
  initials: string;
  subtitle?: string;
  city?: string;
  country?: string;
  organization?: Organization;
}

export function FollowingScreen() {
  const navigation = useNavigation<any>();
  const [following, setFollowing] = useState<FollowingWithInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFollowing = useCallback(async () => {
    const myFollowing = await followService.getMyFollowing();

    // Enrich with organization or user info
    const enriched: FollowingWithInfo[] = await Promise.all(
      myFollowing.map(async f => {
        if (f.followingType === 'organization') {
          const org = await organizationService.getById(f.followingId);
          if (org) {
            return {
              ...f,
              displayName: org.name,
              initials: org.name.charAt(0).toUpperCase(),
              subtitle: org.country,
              organization: org,
            };
          }
        }

        // For users, fetch real name from Firestore
        if (f.followingType === 'user') {
          let displayName = 'Utilisateur';
          let initials = 'U';
          let city: string | undefined;
          let country: string | undefined;

          try {
            const userDoc = await getDoc(doc(db, 'users', f.followingId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.displayName) {
                displayName = userData.displayName;
              } else if (userData.firstName || userData.lastName) {
                displayName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
              } else if (userData.organizationName) {
                displayName = userData.organizationName;
              }
              initials = displayName.charAt(0).toUpperCase();
              city = userData.city;
              country = userData.country;
            }
          } catch (error) {
            console.warn('Could not fetch user profile:', error);
          }

          return {
            ...f,
            displayName,
            initials,
            subtitle: city ? `${city}${country ? `, ${country}` : ''}` : 'Utilisateur',
            city,
            country,
          };
        }

        // Fallback
        return {
          ...f,
          displayName: `ID: ${f.followingId.slice(-6)}`,
          initials: 'O',
          subtitle: 'Organisation',
        };
      }),
    );

    setFollowing(enriched);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFollowing();
    }, [loadFollowing]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadFollowing();
    setRefreshing(false);
  }

  async function handleUnfollow(item: FollowingWithInfo) {
    Alert.alert(
      'Se desabonner',
      `Voulez-vous vraiment vous desabonner de ${item.displayName} ?`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Se desabonner',
          style: 'destructive',
          onPress: async () => {
            await followService.unfollow(item.followingType, item.followingId);
            setFollowing(prev => prev.filter(f => f.id !== item.id));
          },
        },
      ],
    );
  }

  function handlePress(item: FollowingWithInfo) {
    if (item.followingType === 'organization' && item.organization) {
      navigation.navigate('Requests', {
        screen: 'OrganizationProfile',
        params: {organizationId: item.followingId},
      });
    } else if (item.followingType === 'user') {
      // Navigate to user profile
      navigation.navigate('UserProfile', {userId: item.followingId});
    }
  }

  function renderFollowing({item}: {item: FollowingWithInfo}) {
    const isOrg = item.followingType === 'organization';

    return (
      <TouchableOpacity
        style={styles.followingCard}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}>
        <View style={[styles.avatar, isOrg && styles.orgAvatar]}>
          <Text style={styles.avatarText}>{item.initials}</Text>
        </View>
        <View style={styles.followingInfo}>
          <Text style={styles.followingName}>{item.displayName}</Text>
          {item.city && (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={12} color={colors.mutedText} />
              <Text style={styles.followingSubtitle}>
                {item.city}{item.country ? `, ${item.country}` : ''}
              </Text>
            </View>
          )}
          {!item.city && item.subtitle && (
            <Text style={styles.followingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.unfollowBtn}
          onPress={() => handleUnfollow(item)}>
          <Text style={styles.unfollowBtnText}>Abonne</Text>
        </TouchableOpacity>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} style={styles.chevron} />
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Abonnements</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abonnements</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.countBanner}>
        <Text style={styles.countText}>
          {following.length} abonnement{following.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={following}
        keyExtractor={item => item.id}
        renderItem={renderFollowing}
        contentContainerStyle={[
          styles.listContent,
          following.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="account-multiple-outline"
            title="Aucun abonnement"
            message="Les comptes que vous suivez apparaitront ici"
          />
        }
      />
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
  headerSpacer: {
    width: 44,
  },
  countBanner: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countText: {
    ...typography.bodySmall,
    color: colors.mutedText,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  emptyList: {
    flex: 1,
  },
  followingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgAvatar: {
    backgroundColor: colors.accent,
  },
  avatarText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  followingInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  followingName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  followingSubtitle: {
    ...typography.caption,
    color: colors.mutedText,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  unfollowBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.border,
    borderRadius: borderRadius.md,
  },
  unfollowBtnText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
});
