import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {doc, getDoc} from 'firebase/firestore';
import {db, auth} from '../lib/firebase';
import {followService} from '../services/follow';
import {Post, postService} from '../services/post';
import {ZakatRequest, requestService} from '../services/request';
import {getThemeById} from '../services/themes';
import {ReportModal} from '../components';

interface Props {
  route: any;
}

interface UserData {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  accountType: 'individual' | 'organization';
}

type TabType = 'publications' | 'demandes';

export function UserProfileScreen({route}: Props) {
  const navigation = useNavigation<any>();
  const {userId} = route.params;
  const [user, setUser] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [requests, setRequests] = useState<ZakatRequest[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('publications');
  const [showReportModal, setShowReportModal] = useState(false);

  const currentUserId = auth.currentUser?.uid;
  const isOwnProfile = currentUserId === userId;

  const loadData = useCallback(async () => {
    try {
      // Load user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUser({
          id: userDoc.id,
          displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Utilisateur',
          firstName: data.firstName,
          lastName: data.lastName,
          city: data.city,
          country: data.country,
          accountType: data.accountType || 'individual',
        });
      }

      // Load posts and requests in parallel
      const [userPosts, userRequests, count] = await Promise.all([
        postService.getByUserId(userId),
        requestService.getByUserIds([userId]),
        followService.getFollowersCount('user', userId),
      ]);

      setPosts(userPosts.filter(p => p.status === 'verified').sort((a, b) => b.createdAt - a.createdAt));
      setRequests(userRequests.filter(r => r.status === 'verified').sort((a, b) => b.createdAt - a.createdAt));
      setFollowersCount(count);

      // Check if current user is following
      if (currentUserId && currentUserId !== userId) {
        const following = await followService.isFollowing('user', userId);
        setIsFollowing(following);
      }
    } catch (error) {
      console.warn('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleFollowToggle() {
    if (!currentUserId || isOwnProfile) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollow('user', userId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await followService.follow('user', userId);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.warn('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  }

  function openPostDetail(postId: string) {
    navigation.navigate('PostDetail', {postId, from: 'userProfile'});
  }

  function openRequestDetail(requestId: string) {
    navigation.navigate('RequestDetail', {requestId, from: 'userProfile'});
  }

  function getLocation() {
    if (!user) return null;
    const parts = [user.city, user.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={typography.body}>Utilisateur introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{posts.length}</Text>
            <Text style={styles.statLabel}>Publications</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{requests.length}</Text>
            <Text style={styles.statLabel}>Demandes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{followersCount}</Text>
            <Text style={styles.statLabel}>Abonnes</Text>
          </View>
        </View>
      </View>

      <View style={styles.nameSection}>
        <Text style={styles.displayName}>{user.displayName}</Text>
        {getLocation() && (
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color={colors.mutedText} />
            <Text style={styles.locationText}>{getLocation()}</Text>
          </View>
        )}
      </View>

      {!isOwnProfile && currentUserId && (
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={handleFollowToggle}
          disabled={followLoading}>
          {followLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? colors.text : '#fff'} />
          ) : (
            <>
              <MaterialCommunityIcons
                name={isFollowing ? 'account-check' : 'account-plus'}
                size={18}
                color={isFollowing ? colors.text : '#fff'}
              />
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? 'Abonne' : "S'abonner"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'publications' && styles.tabActive]}
          onPress={() => setActiveTab('publications')}>
          <MaterialCommunityIcons
            name="grid"
            size={22}
            color={activeTab === 'publications' ? colors.primary : colors.mutedText}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'demandes' && styles.tabActive]}
          onPress={() => setActiveTab('demandes')}>
          <MaterialCommunityIcons
            name="hand-heart"
            size={22}
            color={activeTab === 'demandes' ? colors.primary : colors.mutedText}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPostItem = ({item}: {item: Post}) => {
    const firstPhoto = item.files.find(f => f.type === 'photo');
    const firstVideo = item.files.find(f => f.type === 'video');
    const thumbnailUri = firstPhoto?.uri || firstVideo?.thumbnailUri || firstVideo?.uri;
    const isVideo = !firstPhoto && !!firstVideo;
    const primaryTheme = item.primaryTheme ? getThemeById(item.primaryTheme) : null;
    return (
      <TouchableOpacity style={styles.postMiniCard} onPress={() => openPostDetail(item.id)}>
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
        {item.files.length > 1 && (
          <View style={styles.multipleIndicator}>
            <MaterialCommunityIcons name="image-multiple" size={14} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderRequestItem = ({item}: {item: ZakatRequest}) => {
    const primaryTheme = item.primaryTheme ? getThemeById(item.primaryTheme) : null;
    const firstPhoto = item.files.find(f => f.type === 'photo');

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => openRequestDetail(item.id)}
        activeOpacity={0.7}>
        {firstPhoto && (
          <Image source={{uri: firstPhoto.uri}} style={styles.requestCardImage} resizeMode="cover" />
        )}
        <View style={styles.requestCardBody}>
          {primaryTheme && (
            <View style={[styles.themeChip, {backgroundColor: primaryTheme.color + '15'}]}>
              <MaterialCommunityIcons name={primaryTheme.icon as any} size={12} color={primaryTheme.color} />
              <Text style={[styles.themeChipText, {color: primaryTheme.color}]}>{primaryTheme.label}</Text>
            </View>
          )}
          <Text style={styles.requestCardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.requestCardFooter}>
            <View style={styles.requestCardLocation}>
              <MaterialCommunityIcons name="map-marker" size={12} color={colors.mutedText} />
              <Text style={styles.requestCardLocationText}>{item.city}</Text>
            </View>
            {item.goalAmount > 0 && (
              <Text style={styles.requestCardAmount}>{formatAmount(item.goalAmount)}</Text>
            )}
          </View>
          {item.goalAmount > 0 && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {width: `${Math.min(100, ((item.receivedAmountCents || 0) / 100 / item.goalAmount) * 100)}%`},
                ]}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.displayName}</Text>
        {!isOwnProfile && currentUserId ? (
          <TouchableOpacity onPress={() => setShowReportModal(true)} style={styles.reportBtn}>
            <MaterialCommunityIcons name="flag-outline" size={22} color={colors.mutedText} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {activeTab === 'publications' ? (
        <FlatList
          key="posts-grid"
          data={posts}
          keyExtractor={item => item.id}
          numColumns={3}
          ListHeaderComponent={renderHeader}
          renderItem={renderPostItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="camera-off" size={48} color={colors.border} />
              <Text style={styles.emptyStateText}>Aucune publication</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          key="requests-list"
          data={requests}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          renderItem={renderRequestItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="hand-heart-outline" size={48} color={colors.border} />
              <Text style={styles.emptyStateText}>Aucune demande</Text>
            </View>
          }
          contentContainerStyle={styles.requestsListContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Report Modal */}
      {user && (
        <ReportModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          contentType="user"
          reportedUserId={user.id}
          reportedUserName={user.displayName}
        />
      )}
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
  reportBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  requestsListContent: {
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: spacing.lg,
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
  },
  nameSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  displayName: {
    ...typography.body,
    fontWeight: '600',
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
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  followingBtn: {
    backgroundColor: colors.border,
  },
  followBtnText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  followingBtnText: {
    color: colors.text,
  },
  tabsContainer: {
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
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyStateText: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: spacing.md,
  },
  // Request card styles
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  requestCardImage: {
    width: '100%',
    height: 140,
    backgroundColor: colors.border,
  },
  requestCardBody: {
    padding: spacing.md,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
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
});
