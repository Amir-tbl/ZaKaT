import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {EmptyState} from '../components';
import {followService, Follow} from '../services/follow';
import {doc, getDoc} from 'firebase/firestore';
import {db} from '../lib/firebase';

interface FollowerWithProfile extends Follow {
  displayName: string;
  initials: string;
  city?: string;
  country?: string;
}

export function FollowersScreen() {
  const navigation = useNavigation<any>();
  const [followers, setFollowers] = useState<FollowerWithProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFollowers = useCallback(async () => {
    const myFollowers = await followService.getMyFollowers();

    // Fetch profile info for each follower
    const followersWithProfiles: FollowerWithProfile[] = await Promise.all(
      myFollowers.map(async (f) => {
        // First try to use the followerName from the follow document
        let displayName = f.followerName || 'Utilisateur';
        let initials = displayName.charAt(0).toUpperCase();
        let city: string | undefined;
        let country: string | undefined;

        // Try to fetch additional info from user profile
        try {
          const userDoc = await getDoc(doc(db, 'users', f.followerUid || f.followerUserId));
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
          // Use followerName as fallback
          console.warn('Could not fetch follower profile:', error);
        }

        return {
          ...f,
          displayName,
          initials,
          city,
          country,
        };
      })
    );

    setFollowers(followersWithProfiles);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFollowers();
    }, [loadFollowers]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadFollowers();
    setRefreshing(false);
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function navigateToProfile(follower: FollowerWithProfile) {
    // Navigate to the follower's profile
    const userId = follower.followerUid || follower.followerUserId;
    navigation.navigate('UserProfile', {userId});
  }

  function renderFollower({item}: {item: FollowerWithProfile}) {
    return (
      <TouchableOpacity
        style={styles.followerCard}
        onPress={() => navigateToProfile(item)}
        activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.initials}</Text>
        </View>
        <View style={styles.followerInfo}>
          <Text style={styles.followerName}>{item.displayName}</Text>
          {item.city && (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={12} color={colors.mutedText} />
              <Text style={styles.followerLocation}>
                {item.city}{item.country ? `, ${item.country}` : ''}
              </Text>
            </View>
          )}
          <Text style={styles.followerDate}>
            Vous suit depuis le {formatDate(item.createdAt)}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
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
          <Text style={styles.headerTitle}>Abonnes</Text>
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
        <Text style={styles.headerTitle}>Abonnes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.countBanner}>
        <Text style={styles.countText}>
          {followers.length} abonne{followers.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={followers}
        keyExtractor={item => item.id}
        renderItem={renderFollower}
        contentContainerStyle={[
          styles.listContent,
          followers.length === 0 && styles.emptyList,
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
            icon="account-group-outline"
            title="Aucun abonne"
            message="Les personnes qui vous suivent apparaitront ici"
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
  followerCard: {
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
  avatarText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  followerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  followerName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 2,
  },
  followerLocation: {
    ...typography.caption,
    color: colors.mutedText,
  },
  followerDate: {
    ...typography.caption,
    color: colors.mutedText,
  },
});
