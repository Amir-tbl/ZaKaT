import React, {useState, useCallback, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {Badge} from '../components';
import {useAuth} from '../providers';
import {profileService, UserProfile, isIndividualProfile, isOrganizationProfile} from '../services/profile';
import {Post, postService} from '../services/post';
import {ZakatRequest, requestService} from '../services/request';
import {followService} from '../services/follow';
import {notificationService} from '../services/notification';
import {getThemeById} from '../services/themes';
import {isCurrentUserAdmin} from '../services/admin';
import type {ProfileStackParamList} from '../navigation/ProfileNavigator';

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;
type TabType = 'publications' | 'demandes';

// Stats component
interface ProfileStatsProps {
  postsCount: number;
  requestsCount: number;
  followersCount: number;
  followingCount: number;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
}

const ProfileStats = memo(function ProfileStats({
  postsCount,
  requestsCount,
  followersCount,
  followingCount,
  onPressFollowers,
  onPressFollowing,
}: ProfileStatsProps) {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{postsCount}</Text>
        <Text style={styles.statLabel}>Publications</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{requestsCount}</Text>
        <Text style={styles.statLabel}>Demandes</Text>
      </View>
      <View style={styles.statDivider} />
      <TouchableOpacity style={styles.statItem} onPress={onPressFollowers} activeOpacity={0.7}>
        <Text style={styles.statValue}>{followersCount}</Text>
        <Text style={styles.statLabel}>Abonnes</Text>
      </TouchableOpacity>
      <View style={styles.statDivider} />
      <TouchableOpacity style={styles.statItem} onPress={onPressFollowing} activeOpacity={0.7}>
        <Text style={styles.statValue}>{followingCount}</Text>
        <Text style={styles.statLabel}>Abonnements</Text>
      </TouchableOpacity>
    </View>
  );
});

// Post mini card component
interface PostMiniCardProps {
  post: Post;
  onPress?: () => void;
}

const PostMiniCard = memo(function PostMiniCard({post, onPress}: PostMiniCardProps) {
  const firstPhoto = post.files.find(f => f.type === 'photo');
  const firstVideo = post.files.find(f => f.type === 'video');
  const thumbnailUri = firstPhoto?.uri || firstVideo?.thumbnailUri || firstVideo?.uri;
  const primaryTheme = post.primaryTheme ? getThemeById(post.primaryTheme) : null;
  const isVideo = !firstPhoto && !!firstVideo;

  return (
    <TouchableOpacity style={styles.postMiniCard} onPress={onPress} activeOpacity={0.7}>
      {thumbnailUri ? (
        <View style={{flex: 1}}>
          <Image source={{uri: thumbnailUri}} style={styles.postMiniImage} resizeMode="cover" />
          {isVideo && (
            <View style={styles.videoMiniIndicator}>
              <MaterialCommunityIcons name="play" size={16} color="#fff" />
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.postMiniImage, styles.postMiniPlaceholder]}>
          {primaryTheme ? (
            <MaterialCommunityIcons name={primaryTheme.icon as any} size={32} color={primaryTheme.color} />
          ) : (
            <MaterialCommunityIcons name="image" size={32} color={colors.mutedText} />
          )}
        </View>
      )}
      {post.files.length > 1 && (
        <View style={styles.multipleIndicator}>
          <MaterialCommunityIcons name="image-multiple" size={14} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
});

// Request card component
interface RequestCardProps {
  request: ZakatRequest;
  onPress: () => void;
}

const STATUS_BADGE: Record<string, {text: string; variant: 'info' | 'success' | 'warning' | 'error'}> = {
  pending: {text: 'En attente', variant: 'warning'},
  verified: {text: 'Verifiee', variant: 'success'},
  rejected: {text: 'Refusee', variant: 'error'},
  closed: {text: 'Fermee', variant: 'info'},
};

const RequestCard = memo(function RequestCard({request, onPress}: RequestCardProps) {
  const badge = STATUS_BADGE[request.status] || STATUS_BADGE.pending;
  const primaryTheme = request.primaryTheme ? getThemeById(request.primaryTheme) : null;
  const firstPhoto = request.files.find(f => f.type === 'photo');

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <TouchableOpacity style={styles.requestCard} onPress={onPress} activeOpacity={0.7}>
      {firstPhoto && (
        <Image source={{uri: firstPhoto.uri}} style={styles.requestCardImage} resizeMode="cover" />
      )}
      <View style={styles.requestCardBody}>
        <View style={styles.requestCardHeader}>
          {primaryTheme && (
            <View style={[styles.themeChip, {backgroundColor: primaryTheme.color + '15'}]}>
              <MaterialCommunityIcons name={primaryTheme.icon as any} size={12} color={primaryTheme.color} />
              <Text style={[styles.themeChipText, {color: primaryTheme.color}]}>{primaryTheme.label}</Text>
            </View>
          )}
          <Badge text={badge.text} variant={badge.variant} />
        </View>
        <Text style={styles.requestCardTitle} numberOfLines={2}>{request.title}</Text>
        <View style={styles.requestCardFooter}>
          <View style={styles.requestCardLocation}>
            <MaterialCommunityIcons name="map-marker" size={12} color={colors.mutedText} />
            <Text style={styles.requestCardLocationText}>{request.city}</Text>
          </View>
          {request.goalAmount > 0 && (
            <Text style={styles.requestCardAmount}>{formatAmount(request.goalAmount)}</Text>
          )}
        </View>
        {request.goalAmount > 0 && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {width: `${Math.min(100, ((request.receivedAmountCents || 0) / 100 / request.goalAmount) * 100)}%`},
              ]}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const {user: authUser} = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [requests, setRequests] = useState<ZakatRequest[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('publications');

  const loadData = useCallback(async () => {
    try {
      const p = await profileService.getOrCreateProfile(authUser?.email || '');
      setProfile(p);

      // Check admin status
      const adminStatus = await isCurrentUserAdmin();
      setIsAdmin(adminStatus);

      if (p) {
        // Load posts, requests, follow counts, and notifications
        const [userPosts, userRequests, followers, following, unreadNotifs] = await Promise.all([
          postService.getByUserId(p.id),
          requestService.getByUserId(p.id),
          followService.getFollowersCount(
            isOrganizationProfile(p) ? 'organization' : 'user',
            p.id
          ),
          followService.getFollowingCount(),
          notificationService.getUnreadCount(p.id),
        ]);

        // Sort by date desc
        setPosts(userPosts.sort((a, b) => b.createdAt - a.createdAt));
        setRequests(userRequests.sort((a, b) => b.createdAt - a.createdAt));
        setFollowersCount(followers);
        setFollowingCount(following);
        setUnreadNotifCount(unreadNotifs);
      }
    } catch (error) {
      console.warn('Erreur chargement profil:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.email]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const getDisplayName = () => {
    if (!profile) return 'Utilisateur';
    if (isIndividualProfile(profile)) {
      if (profile.firstName || profile.lastName) {
        return `${profile.firstName} ${profile.lastName}`.trim();
      }
    } else if (isOrganizationProfile(profile)) {
      return profile.organizationName || 'Association';
    }
    return 'Utilisateur';
  };

  const getLocation = () => {
    if (!profile) return null;
    const parts = [profile.city, profile.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const isOrg = profile && isOrganizationProfile(profile);

  function openRequestDetail(requestId: string) {
    // Navigate within Profile stack to keep context
    navigation.navigate('RequestDetail', {requestId, from: 'profile'});
  }

  function openPostDetail(postId: string) {
    // Navigate within Profile stack to keep context
    navigation.navigate('PostDetail', {postId, from: 'profile'});
  }

  function openCreatePublication() {
    navigation.getParent()?.navigate('Requests', {
      screen: 'CreateMenu',
      params: {mode: 'publication'},
    });
  }

  function openCreateRequest() {
    navigation.getParent()?.navigate('Requests', {
      screen: 'CreateMenu',
      params: {mode: 'request'},
    });
  }

  function renderHeader() {
    return (
      <View style={styles.headerContainer}>
        {/* Top bar with notifications and settings */}
        <View style={styles.topBar}>
          <Text style={styles.username}>{getDisplayName()}</Text>
          <View style={styles.topBarActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Notifications')}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={colors.text} />
              {unreadNotifCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Settings')}>
              <MaterialCommunityIcons name="cog" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile info */}
        <View style={styles.profileInfo}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons
                name={isOrg ? 'domain' : 'account'}
                size={40}
                color={colors.surface}
              />
            </View>
          </View>

          {/* Stats */}
          <ProfileStats
            postsCount={posts.length}
            requestsCount={requests.length}
            followersCount={followersCount}
            followingCount={followingCount}
            onPressFollowers={() => navigation.navigate('Followers')}
            onPressFollowing={() => navigation.navigate('Following')}
          />
        </View>

        {/* Name and location */}
        <View style={styles.nameSection}>
          <Text style={styles.displayName}>{getDisplayName()}</Text>
          {isOrg && (
            <View style={styles.orgBadge}>
              <MaterialCommunityIcons name="check-decagram" size={14} color={colors.primary} />
              <Text style={styles.orgBadgeText}>Association</Text>
            </View>
          )}
          {getLocation() && (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color={colors.mutedText} />
              <Text style={styles.locationText}>{getLocation()}</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.editProfileBtnText}>Modifier le profil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('DonationHistory')}>
            <MaterialCommunityIcons name="history" size={18} color={colors.text} />
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Admin')}>
              <MaterialCommunityIcons name="shield-check" size={18} color={colors.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Zakat')}>
            <MaterialCommunityIcons name="calculator" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'publications' && styles.tabActive]}
            onPress={() => setActiveTab('publications')}>
            <MaterialCommunityIcons
              name="grid"
              size={24}
              color={activeTab === 'publications' ? colors.primary : colors.mutedText}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'demandes' && styles.tabActive]}
            onPress={() => setActiveTab('demandes')}>
            <MaterialCommunityIcons
              name="hand-heart"
              size={24}
              color={activeTab === 'demandes' ? colors.primary : colors.mutedText}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderPostsGrid() {
    if (posts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="camera-plus" size={48} color={colors.border} />
          <Text style={styles.emptyStateTitle}>Aucune publication</Text>
          <Text style={styles.emptyStateText}>
            Partagez votre premiere publication
          </Text>
          <TouchableOpacity style={styles.emptyStateBtn} onPress={openCreatePublication}>
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.emptyStateBtnText}>Partager ma premiere publication</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.postsGrid}>
        {posts.map(post => (
          <PostMiniCard key={post.id} post={post} onPress={() => openPostDetail(post.id)} />
        ))}
      </View>
    );
  }

  function renderRequestsList() {
    if (requests.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.border} />
          <Text style={styles.emptyStateTitle}>Aucune demande</Text>
          <Text style={styles.emptyStateText}>
            {isOrg
              ? 'Les associations recoivent les dons via leur profil'
              : 'Creez votre premiere demande d\'aide'}
          </Text>
          {!isOrg && (
            <TouchableOpacity style={styles.emptyStateBtn} onPress={openCreateRequest}>
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={styles.emptyStateBtnText}>Ouvrir une cagnotte</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.requestsList}>
        {requests.map(request => (
          <RequestCard
            key={request.id}
            request={request}
            onPress={() => openRequestDetail(request.id)}
          />
        ))}
      </View>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={[]}
        keyExtractor={() => 'content'}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {activeTab === 'publications' ? renderPostsGrid() : renderRequestsList()}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  headerContainer: {
    backgroundColor: colors.surface,
  },
  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  username: {
    ...typography.h2,
    fontSize: 20,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  // Profile info row
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  avatarContainer: {
    marginRight: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stats
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    fontSize: 18,
  },
  statLabel: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  // Name section
  nameSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  displayName: {
    ...typography.body,
    fontWeight: '600',
  },
  orgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  orgBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  locationText: {
    ...typography.caption,
    color: colors.mutedText,
  },
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  editProfileBtn: {
    flex: 1,
    backgroundColor: colors.border,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  editProfileBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
  },
  secondaryBtn: {
    width: 40,
    height: 36,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tabs
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  // Posts grid
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  postMiniCard: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 1,
  },
  postMiniImage: {
    flex: 1,
    backgroundColor: colors.border,
  },
  postMiniPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoMiniIndicator: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multipleIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 2,
  },
  // Requests list
  requestsList: {
    padding: spacing.md,
  },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  requestCardImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.border,
  },
  requestCardBody: {
    padding: spacing.md,
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  themeChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  requestCardTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  requestCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  requestCardLocationText: {
    ...typography.caption,
    color: colors.mutedText,
  },
  requestCardAmount: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyStateTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    color: colors.text,
  },
  emptyStateText: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  emptyStateBtnText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
  },
});
