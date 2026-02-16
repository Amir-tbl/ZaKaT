import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {EmptyState} from '../components';
import {PostCard} from '../components/PostCard';
import {Post, postService} from '../services/post';
import {ZakatRequest, requestService} from '../services/request';
import {followService} from '../services/follow';
import {getThemeById} from '../services/themes';

type TabType = 'publications' | 'demandes';

interface FeedItem {
  id: string;
  type: 'post' | 'request';
  createdAt: number;
  data: Post | ZakatRequest;
}

export function SubscriptionsScreen() {
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [requests, setRequests] = useState<ZakatRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('publications');

  const loadData = useCallback(async () => {
    // Get IDs of followed users and organizations
    const [userIds, orgIds, count] = await Promise.all([
      followService.getFollowingUserIds(),
      followService.getFollowingOrganizationIds(),
      followService.getFollowingCount(),
    ]);

    setFollowingCount(count);

    const allIds = [...userIds, ...orgIds];

    // Get posts and requests from followed accounts
    const [allFollowedPosts, allFollowedRequests] = await Promise.all([
      postService.getByUserIds(allIds),
      requestService.getByUserIds(allIds),
    ]);

    // Filter only verified content and sort by date
    const verifiedPosts = allFollowedPosts
      .filter(p => p.status === 'verified')
      .sort((a, b) => b.createdAt - a.createdAt);

    const verifiedRequests = allFollowedRequests
      .filter(r => r.status === 'verified')
      .sort((a, b) => b.createdAt - a.createdAt);

    setPosts(verifiedPosts);
    setRequests(verifiedRequests);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function openPostDetail(postId: string) {
    navigation.navigate('PostDetail', {postId, from: 'subscriptions'});
  }

  function openRequestDetail(requestId: string) {
    navigation.navigate('RequestDetail', {requestId, from: 'subscriptions'});
  }

  function handleAuthorPress(userId: string, type: 'user' | 'organization') {
    if (type === 'organization') {
      navigation.navigate('OrganizationProfile', {organizationId: userId});
    } else {
      navigation.navigate('UserProfile', {userId});
    }
  }

  function handlePdfPress(uri: string, name: string) {
    navigation.navigate('PdfViewer', {uri, title: name});
  }

  function handleMediaPress(media: Array<{id: string; uri: string; type: 'photo' | 'video'; duration?: number}>, initialIndex: number) {
    navigation.navigate('MediaViewer', {media, initialIndex});
  }

  function goToExplore() {
    navigation.getParent()?.navigate('Home');
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function renderRequestCard(item: ZakatRequest) {
    const primaryTheme = item.primaryTheme ? getThemeById(item.primaryTheme) : null;
    const firstPhoto = item.files.find(f => f.type === 'photo');

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.requestCard}
        activeOpacity={0.7}
        onPress={() => openRequestDetail(item.id)}>
        {firstPhoto && (
          <Image source={{uri: firstPhoto.uri}} style={styles.requestCardImage} resizeMode="cover" />
        )}
        <View style={styles.requestCardBody}>
          {/* Author row */}
          <TouchableOpacity
            style={styles.requestAuthorRow}
            onPress={() => handleAuthorPress(item.authorUserId, item.type === 'organization' ? 'organization' : 'user')}>
            <View style={styles.requestAuthorAvatar}>
              <Text style={styles.requestAuthorAvatarText}>
                {item.authorDisplayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.requestAuthorName}>{item.authorDisplayName}</Text>
          </TouchableOpacity>

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
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suivis</Text>
        <View style={styles.followingBadge}>
          <MaterialCommunityIcons name="heart-multiple" size={16} color={colors.primary} />
          <Text style={styles.followingCount}>{followingCount}</Text>
        </View>
      </View>

      {/* Tabs */}
      {followingCount > 0 && (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'publications' && styles.tabActive]}
            onPress={() => setActiveTab('publications')}>
            <MaterialCommunityIcons
              name="newspaper-variant-multiple"
              size={18}
              color={activeTab === 'publications' ? colors.primary : colors.mutedText}
            />
            <Text style={[styles.tabText, activeTab === 'publications' && styles.tabTextActive]}>
              Publications ({posts.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'demandes' && styles.tabActive]}
            onPress={() => setActiveTab('demandes')}>
            <MaterialCommunityIcons
              name="hand-heart"
              size={18}
              color={activeTab === 'demandes' ? colors.primary : colors.mutedText}
            />
            <Text style={[styles.tabText, activeTab === 'demandes' && styles.tabTextActive]}>
              Demandes ({requests.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {followingCount === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="account-plus-outline"
            title="Aucun suivi"
            message="Abonnez-vous a des associations ou utilisateurs pour voir leurs contenus ici."
          />
          <TouchableOpacity style={styles.exploreBtn} onPress={goToExplore}>
            <MaterialCommunityIcons name="compass" size={20} color={colors.surface} />
            <Text style={styles.exploreBtnText}>Explorer</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 'publications' ? (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <PostCard
              post={item}
              onPress={openPostDetail}
              onAuthorPress={handleAuthorPress}
              onPdfPress={handlePdfPress}
              onMediaPress={handleMediaPress}
            />
          )}
          contentContainerStyle={[styles.listPadding, posts.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyListContent}>
              <EmptyState
                icon="newspaper-variant-outline"
                title="Aucune publication"
                message="Les comptes que vous suivez n'ont pas encore publie."
              />
            </View>
          }
        />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={({item}) => renderRequestCard(item)}
          contentContainerStyle={[styles.requestsListPadding, requests.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyListContent}>
              <EmptyState
                icon="hand-heart-outline"
                title="Aucune demande"
                message="Les comptes que vous suivez n'ont pas de demandes en cours."
              />
            </View>
          }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h1,
  },
  followingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  followingCount: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.primary,
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.mutedText,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  listPadding: {
    paddingBottom: spacing.xxl,
  },
  requestsListPadding: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: spacing.xxl,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
  exploreBtnText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.surface,
  },
  // Request card styles
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
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
  requestAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requestAuthorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  requestAuthorAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  requestAuthorName: {
    ...typography.bodySmall,
    fontWeight: '600',
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
