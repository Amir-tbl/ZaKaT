import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {EmptyState} from '../components';
import {PostCard} from '../components/PostCard';
import {FilterModal, FilterState, DEFAULT_FILTERS} from '../components/FilterModal';
import {ZakatRequest} from '../services/request';
import {requestService} from '../services/request';
import {Organization} from '../services/organization';
import {organizationService} from '../services/organization';
import {Post, postService} from '../services/post';
import {THEMES, getThemeById} from '../services/themes';
import {notificationService} from '../services/notification';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

type TabType = 'fil' | 'demandes';

// -- Collections for curated sections --
const COLLECTIONS = [
  {id: 'urgent', label: 'Urgences du moment', icon: 'fire', color: '#EF4444', filter: (r: ZakatRequest) => r.urgent},
  {id: 'env', label: 'Environnement', icon: 'leaf', color: '#22C55E', filter: (r: ZakatRequest) => r.themes.includes('environnement')},
  {id: 'edu', label: 'Éducation mondiale', icon: 'school', color: '#3B82F6', filter: (r: ZakatRequest) => r.themes.includes('education')},
  {id: 'sante', label: 'Santé', icon: 'hospital-box', color: '#EF4444', filter: (r: ZakatRequest) => r.themes.includes('sante') || r.category === 'sante'},
];

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabType>('fil');
  const [requests, setRequests] = useState<ZakatRequest[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({...DEFAULT_FILTERS});
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const loadData = useCallback(async () => {
    const [reqs, orgs, allPosts, unreadCount] = await Promise.all([
      requestService.getByStatus('verified'),
      organizationService.getVerified(),
      postService.getAll(),
      notificationService.getUnreadCount(),
    ]);
    setRequests(reqs);
    setOrganizations(orgs);
    // Filter only verified posts
    setPosts(allPosts.filter(p => p.status === 'verified'));
    setUnreadNotifCount(unreadCount);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));


  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // Apply filters
  const filtered = useMemo(() => {
    let result = requests;

    // Theme filter
    if (filters.themes.length > 0) {
      result = result.filter(r =>
        filters.themes.some(t => r.themes.includes(t)),
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      result = result.filter(r => r.type === filters.type);
    }

    // Urgent only
    if (filters.urgentOnly) {
      result = result.filter(r => r.urgent);
    }

    // Max amount
    if (filters.maxAmount !== null) {
      result = result.filter(r => r.goalAmount <= filters.maxAmount!);
    }

    return result;
  }, [requests, filters]);

  // Filter posts (for Fil tab)
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Theme filter
    if (filters.themes.length > 0) {
      result = result.filter(p =>
        filters.themes.some(t => p.themes.includes(t)),
      );
    }

    return result;
  }, [posts, filters]);

  const isSearching = hasActiveFilters(filters);
  const activeFilterCount =
    filters.themes.length +
    (filters.type !== 'all' ? 1 : 0) +
    (filters.urgentOnly ? 1 : 0) +
    (filters.maxAmount !== null ? 1 : 0);

  function openDetail(id: string) {
    // Navigate within Home stack to keep context
    navigation.navigate('RequestDetail', {requestId: id, from: 'explorer'});
  }

  function openPostDetail(postId: string) {
    // Navigate within Home stack to keep context
    navigation.navigate('PostDetail', {postId, from: 'explorer'});
  }

  function openOrganization(orgId: string) {
    // Navigate within Home stack to keep context
    navigation.navigate('OrganizationProfile', {organizationId: orgId});
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

  function openCreateMenu() {
    // This still needs to go to Requests tab as that's where Create is
    navigation.getParent()?.navigate('Requests', {
      screen: 'CreateMenu',
    });
  }


  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // -- Render helpers --

  function renderRequestCard(item: ZakatRequest) {
    const ben = item.beneficiary;
    const firstPhoto = item.files.find(f => f.type === 'photo');
    const postType = item.postType || 'individual_request';
    const isOrgUpdate = postType === 'org_update';
    const isOrgCampaign = postType === 'org_campaign';
    const showDonationProgress = !isOrgUpdate && item.goalAmount > 0;

    // Post type badge config
    const postTypeBadgeConfig = {
      individual_request: {icon: 'account', color: colors.primary, label: 'Demande'},
      org_update: {icon: 'newspaper-variant-outline', color: colors.accent, label: 'Publication'},
      org_campaign: {icon: 'bullhorn', color: colors.success, label: 'Campagne'},
    };
    const badgeConfig = postTypeBadgeConfig[postType] || postTypeBadgeConfig.individual_request;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => openDetail(item.id)}>
        {firstPhoto && (
          <Image source={{uri: firstPhoto.uri}} style={styles.cardImage} resizeMode="cover" />
        )}
        {item.urgent && !isOrgUpdate && (
          <View style={styles.urgentBadge}>
            <MaterialCommunityIcons name="fire" size={12} color="#fff" />
            <Text style={styles.urgentText}>Urgent</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            {/* Post type badge */}
            <View style={[styles.postTypeBadge, {backgroundColor: badgeConfig.color + '15'}]}>
              <MaterialCommunityIcons name={badgeConfig.icon as any} size={12} color={badgeConfig.color} />
              <Text style={[styles.postTypeBadgeText, {color: badgeConfig.color}]}>{badgeConfig.label}</Text>
            </View>
            {item.organizationName && (
              <View style={styles.orgBadge}>
                <MaterialCommunityIcons name="domain" size={12} color={colors.accent} />
                <Text style={styles.orgBadgeText}>{item.organizationName}</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          {item.impactText && (
            <Text style={styles.impactText}>{item.impactText}</Text>
          )}

          {/* Donation progress - only for requests and campaigns */}
          {showDonationProgress && (
            <View style={styles.cardProgress}>
              <View style={styles.cardProgressRow}>
                <Text style={styles.cardProgressText}>
                  {formatAmount((item.receivedAmountCents || 0) / 100)} / {formatAmount(item.goalAmount)}
                </Text>
                {(item.donorCount || 0) > 0 && (
                  <Text style={styles.cardDonorCount}>
                    {item.donorCount} donateur{(item.donorCount || 0) > 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              <View style={styles.cardProgressBar}>
                <View
                  style={[
                    styles.cardProgressFill,
                    {
                      width: `${Math.min(
                        100,
                        ((item.receivedAmountCents || 0) / 100 / item.goalAmount) * 100,
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          <View style={styles.cardFooterRow}>
            <View style={styles.cardLocationRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color={colors.mutedText} />
              <Text style={typography.caption}>{item.city}, {item.country}</Text>
            </View>
            {!isOrgUpdate && item.goalAmount > 0 && (
              <Text style={styles.cardAmount}>{formatAmount(item.goalAmount)}</Text>
            )}
          </View>
          {item.themes.length > 0 && (
            <View style={styles.themeTags}>
              {item.themes.slice(0, 3).map(tid => {
                const t = getThemeById(tid);
                return t ? (
                  <View key={tid} style={[styles.themeTag, {backgroundColor: t.color + '15'}]}>
                    <Text style={[styles.themeTagText, {color: t.color}]}>{t.label}</Text>
                  </View>
                ) : null;
              })}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // -- Tabs rendering --
  function renderTabs() {
    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'fil' && styles.tabActive]}
          onPress={() => setActiveTab('fil')}>
          <MaterialCommunityIcons
            name="newspaper-variant-multiple"
            size={18}
            color={activeTab === 'fil' ? colors.primary : colors.mutedText}
          />
          <Text style={[styles.tabText, activeTab === 'fil' && styles.tabTextActive]}>
            Fil
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
            Demandes
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render Fil tab content (Posts)
  function renderFilContent() {
    const listContent = isSearching ? (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.searchResultsContainer}>
        <View style={styles.searchSection}>
          <Text style={styles.searchSectionTitle}>
            Publications filtrées ({filteredPosts.length})
          </Text>
          {filteredPosts.length > 0 ? (
            filteredPosts.map(item => (
              <PostCard
                key={item.id}
                post={item}
                onPress={openPostDetail}
                onAuthorPress={handleAuthorPress}
                onPdfPress={handlePdfPress}
                onMediaPress={handleMediaPress}
              />
            ))
          ) : (
            <EmptyState
              icon="filter-off"
              title="Aucun résultat"
              message="Aucune publication ne correspond aux filtres."
            />
          )}
        </View>
      </ScrollView>
    ) : (
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
        contentContainerStyle={[styles.postsListPadding, posts.length === 0 && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.filHeader}>
            <Text style={styles.filTitle}>Publications récentes</Text>
            <Text style={styles.filSubtitle}>
              Actualités et impact des associations
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="newspaper-variant-outline"
            title="Aucune publication"
            message="Les publications des associations apparaîtront ici."
          />
        }
      />
    );

    return (
      <View style={styles.tabContentContainer}>
        {listContent}
        <TouchableOpacity style={styles.fab} onPress={openCreateMenu}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // Render Demandes tab content (Requests)
  function renderDemandesContent() {
    if (isSearching) {
      return (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.searchResultsContainer}>
          <View style={styles.searchSection}>
            <Text style={styles.searchSectionTitle}>
              Demandes filtrées ({filtered.length})
            </Text>
            {filtered.length > 0 ? (
              <View style={styles.listPadding}>
                {filtered.map(item => renderRequestCard(item))}
              </View>
            ) : (
              <EmptyState
                icon="filter-off"
                title="Aucun résultat"
                message="Aucune demande ne correspond aux filtres."
              />
            )}
          </View>
        </ScrollView>
      );
    }

    // Default: Explore layout for demandes
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>

        {/* Themes horizontal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explorer par thème</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themesScroll}>
            {THEMES.map(theme => (
              <TouchableOpacity
                key={theme.id}
                style={[styles.themeCard, {backgroundColor: theme.color + '12'}]}
                onPress={() => {
                  setFilters(prev => ({...prev, themes: [theme.id]}));
                }}>
                <View style={[styles.themeIconCircle, {backgroundColor: theme.color + '25'}]}>
                  <MaterialCommunityIcons name={theme.icon as any} size={24} color={theme.color} />
                </View>
                <Text style={[styles.themeCardLabel, {color: theme.color}]}>{theme.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Organizations */}
        {organizations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Associations partenaires</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.orgScroll}>
              {organizations.map(org => (
                <TouchableOpacity
                  key={org.id}
                  style={styles.orgCard}
                  activeOpacity={0.7}
                  onPress={() => openOrganization(org.id)}>
                  <View style={styles.orgAvatarCircle}>
                    <Text style={styles.orgAvatarText}>{org.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.orgName} numberOfLines={1}>{org.name}</Text>
                  <Text style={typography.caption} numberOfLines={1}>{org.country}</Text>
                  {org.partnershipLevel === 'officiel' && (
                    <View style={styles.officielBadge}>
                      <MaterialCommunityIcons name="check-decagram" size={12} color={colors.primary} />
                      <Text style={styles.officielText}>Officiel</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Collections */}
        {COLLECTIONS.map(col => {
          const colItems = requests.filter(col.filter).slice(0, 5);
          if (colItems.length === 0) return null;
          return (
            <View key={col.id} style={styles.section}>
              <View style={styles.collectionHeader}>
                <MaterialCommunityIcons name={col.icon as any} size={20} color={col.color} />
                <Text style={[styles.sectionTitle, {marginBottom: 0, marginLeft: spacing.sm}]}>{col.label}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionScroll}>
                {colItems.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.miniCard}
                    activeOpacity={0.7}
                    onPress={() => openDetail(item.id)}>
                    {item.files.find(f => f.type === 'photo') ? (
                      <Image
                        source={{uri: item.files.find(f => f.type === 'photo')!.uri}}
                        style={styles.miniCardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.miniCardImage, {backgroundColor: col.color + '15', justifyContent: 'center', alignItems: 'center'}]}>
                        <MaterialCommunityIcons name={col.icon as any} size={32} color={col.color} />
                      </View>
                    )}
                    <View style={styles.miniCardBody}>
                      <Text style={styles.miniCardTitle} numberOfLines={2}>{item.title}</Text>
                      <View style={styles.miniCardProgress}>
                        <View
                          style={[
                            styles.miniCardProgressFill,
                            {
                              width: `${Math.min(
                                100,
                                ((item.receivedAmountCents || 0) / 100 / item.goalAmount) * 100,
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.miniCardAmount}>
                        {formatAmount((item.receivedAmountCents || 0) / 100)} / {formatAmount(item.goalAmount)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })}

        {/* All verified */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Toutes les demandes</Text>
          {requests.length === 0 ? (
            <View style={styles.emptyInline}>
              <MaterialCommunityIcons name="hand-heart-outline" size={40} color={colors.border} />
              <Text style={[typography.caption, {marginTop: spacing.sm}]}>Aucune demande vérifiée pour le moment.</Text>
            </View>
          ) : (
            requests.map(item => renderRequestCard(item))
          )}
        </View>

        <View style={{height: spacing.xxl}} />
      </ScrollView>
    );
  }

  // -- MAIN RENDER --
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      {renderTabs()}
      {activeTab === 'fil' ? renderFilContent() : renderDemandesContent()}
      <FilterModal visible={showFilters} filters={filters} onApply={setFilters} onClose={() => setShowFilters(false)} />
    </SafeAreaView>
  );

  // -- Header sub-component --
  function renderHeader() {
    return (
      <View>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Search')}
              style={styles.headerBtn}>
              <MaterialCommunityIcons name="magnify" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={styles.headerBtn}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={colors.text} />
              {unreadNotifCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.headerBtn}>
              <MaterialCommunityIcons name="tune-variant" size={24} color={colors.text} />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {activeFilterCount > 0 && (
          <TouchableOpacity
            style={styles.activeFilterBar}
            onPress={() => setFilters({...DEFAULT_FILTERS})}>
            <Text style={styles.activeFilterText}>
              {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''} actif{activeFilterCount > 1 ? 's' : ''}
            </Text>
            <MaterialCommunityIcons name="close" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

      </View>
    );
  }
}

function hasActiveFilters(f: FilterState): boolean {
  return (
    f.themes.length > 0 ||
    f.type !== 'all' ||
    f.urgentOnly ||
    f.maxAmount !== null
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    ...typography.body,
    color: colors.mutedText,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Fil content
  filHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  filSubtitle: {
    ...typography.caption,
    color: colors.mutedText,
  },
  postsListPadding: {
    paddingBottom: spacing.xxl,
  },
  tabContentContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.h1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerBtn: {
    width: 44,
    height: 44,
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
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  activeFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
  },
  activeFilterText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  // Theme cards
  themesScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  themeCard: {
    width: 100,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  themeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  themeCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Org cards
  orgScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  orgCard: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  orgAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orgAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  orgName: {
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  officielBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
  },
  officielText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },

  // Collection miniCards
  collectionScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  miniCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  miniCardImage: {
    width: '100%',
    height: 100,
    backgroundColor: colors.border,
  },
  miniCardBody: {
    padding: spacing.md,
  },
  miniCardTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  miniCardProgress: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  miniCardProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  miniCardAmount: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },

  // Request cards (full)
  listPadding: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.border,
  },
  urgentBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  urgentText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: spacing.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  postTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  postTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent + '12',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  orgBadgeText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  impactText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardAmount: {
    ...typography.h3,
    color: colors.primary,
  },
  cardProgress: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardProgressText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  cardDonorCount: {
    ...typography.caption,
    color: colors.mutedText,
  },
  cardProgressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  cardProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  themeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  themeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  themeTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyInline: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  // Search results styles
  searchResultsContainer: {
    paddingBottom: spacing.xxl,
  },
  searchSection: {
    marginBottom: spacing.lg,
  },
  searchSectionTitle: {
    ...typography.h3,
    fontSize: 14,
    color: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
