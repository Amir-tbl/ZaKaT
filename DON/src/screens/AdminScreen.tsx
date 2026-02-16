import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {Badge, EmptyState} from '../components';
import {ZakatRequest, RequestStatus, requestService} from '../services/request';
import {Post, PostStatus, postService} from '../services/post';
import {Organization, OrganizationStatus, organizationService} from '../services/organization';
import {getThemeById} from '../services/themes';
import {initializeTreasury} from '../services/admin';

type EntityType = 'requests' | 'posts' | 'organizations';
type TabFilter = 'pending' | 'verified' | 'rejected';

const ENTITY_TABS: {key: EntityType; label: string; icon: string}[] = [
  {key: 'requests', label: 'Demandes', icon: 'hand-heart'},
  {key: 'posts', label: 'Posts', icon: 'newspaper-variant'},
  {key: 'organizations', label: 'Assos', icon: 'domain'},
];

const STATUS_TABS: {key: TabFilter; label: string}[] = [
  {key: 'pending', label: 'En attente'},
  {key: 'verified', label: 'Acceptees'},
  {key: 'rejected', label: 'Refusees'},
];

const STATUS_BADGE: Record<string, {text: string; variant: 'info' | 'success' | 'warning' | 'error'}> = {
  pending: {text: 'En attente', variant: 'warning'},
  verified: {text: 'Verifiee', variant: 'success'},
  rejected: {text: 'Refusee', variant: 'error'},
  closed: {text: 'Fermee', variant: 'info'},
};

interface Props {
  navigation: any;
}

export function AdminScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const [entityType, setEntityType] = useState<EntityType>('requests');
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');
  const [requests, setRequests] = useState<ZakatRequest[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<Record<EntityType, number>>({
    requests: 0,
    posts: 0,
    organizations: 0,
  });

  // Load pending counts for all entity types
  const loadPendingCounts = useCallback(async () => {
    const [pendingRequests, pendingPosts, pendingOrgs] = await Promise.all([
      requestService.getByStatus('pending' as RequestStatus),
      postService.getByStatus('pending' as PostStatus),
      organizationService.getByStatus('pending' as OrganizationStatus),
    ]);
    setPendingCounts({
      requests: pendingRequests.length,
      posts: pendingPosts.length,
      organizations: pendingOrgs.length,
    });
  }, []);

  const loadData = useCallback(async () => {
    if (entityType === 'requests') {
      const data = await requestService.getByStatus(activeTab as RequestStatus);
      setRequests(data);
    } else if (entityType === 'posts') {
      const data = await postService.getByStatus(activeTab as PostStatus);
      setPosts(data);
    } else if (entityType === 'organizations') {
      const data = await organizationService.getByStatus(activeTab as OrganizationStatus);
      setOrganizations(data);
    }
    // Refresh pending counts too
    loadPendingCounts();
  }, [entityType, activeTab, loadPendingCounts]);

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

  async function handleInitTreasury() {
    Alert.alert(
      'Initialiser Treasury',
      'Ceci va creer la collection treasury dans Firestore. A faire une seule fois.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Initialiser',
          onPress: async () => {
            try {
              const result = await initializeTreasury();
              Alert.alert('Succes', result.message);
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Echec de l\'initialisation');
            }
          },
        },
      ],
    );
  }

  // ========== REQUEST HANDLERS ==========
  async function handleAcceptRequest(id: string) {
    Alert.alert(
      'Accepter la demande',
      'Cette demande sera visible publiquement.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Accepter',
          onPress: async () => {
            await requestService.updateStatus(id, 'verified', 'admin');
            loadData();
          },
        },
      ],
    );
  }

  async function handleRejectRequest(id: string) {
    Alert.alert(
      'Refuser la demande',
      'Confirmer le refus ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            await requestService.updateStatus(id, 'rejected', 'admin');
            loadData();
          },
        },
      ],
    );
  }

  // ========== POST HANDLERS ==========
  async function handleAcceptPost(id: string) {
    Alert.alert(
      'Accepter le post',
      'Ce post sera visible publiquement.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Accepter',
          onPress: async () => {
            await postService.updateStatus(id, 'verified', 'admin');
            loadData();
          },
        },
      ],
    );
  }

  async function handleRejectPost(id: string) {
    Alert.alert(
      'Refuser le post',
      'Confirmer le refus ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            await postService.updateStatus(id, 'rejected', 'admin');
            loadData();
          },
        },
      ],
    );
  }

  // ========== ORGANIZATION HANDLERS ==========
  async function handleAcceptOrg(id: string) {
    Alert.alert(
      'Verifier l\'association',
      'Cette association sera visible publiquement.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Verifier',
          onPress: async () => {
            await organizationService.updateStatus(id, 'verified', 'admin');
            loadData();
          },
        },
      ],
    );
  }

  async function handleRejectOrg(id: string) {
    Alert.alert(
      'Refuser l\'association',
      'Confirmer le refus ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            await organizationService.updateStatus(id, 'rejected', 'admin');
            loadData();
          },
        },
      ],
    );
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // ========== RENDER CARDS ==========
  function renderRequestCard({item}: {item: ZakatRequest}) {
    const badge = STATUS_BADGE[item.status] || STATUS_BADGE.pending;
    const ben = item.beneficiary;
    const isPending = item.status === 'pending';
    const primaryTheme = item.primaryTheme || (item.themes.length > 0 ? item.themes[0] : null);
    const themeInfo = primaryTheme ? getThemeById(primaryTheme) : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, themeInfo && {backgroundColor: themeInfo.color + '20'}]}>
            <Text style={[styles.categoryText, themeInfo && {color: themeInfo.color}]}>
              {themeInfo?.label || 'Non classe'}
            </Text>
          </View>
          <Badge text={badge.text} variant={badge.variant} />
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={typography.caption} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardMeta}>
          <Text style={typography.caption}>{item.city}, {item.country}</Text>
          <Text style={styles.cardAmount}>{formatAmount(item.goalAmount)}</Text>
        </View>

        <View style={styles.cardPersons}>
          <Text style={typography.caption}>Auteur: {item.authorDisplayName}</Text>
          <Text style={typography.caption}>Beneficiaire: {ben.firstName} {ben.lastName}</Text>
          <Text style={typography.caption}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.reviewNote && (
          <View style={styles.reviewNote}>
            <MaterialCommunityIcons name="message-text" size={14} color={colors.mutedText} />
            <Text style={[typography.caption, {flex: 1}]}>{item.reviewNote}</Text>
          </View>
        )}

        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptRequest(item.id)}>
              <MaterialCommunityIcons name="check" size={20} color={colors.surface} />
              <Text style={styles.actionBtnText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectRequest(item.id)}>
              <MaterialCommunityIcons name="close" size={20} color={colors.surface} />
              <Text style={styles.actionBtnText}>Refuser</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  function renderPostCard({item}: {item: Post}) {
    const badge = STATUS_BADGE[item.status] || STATUS_BADGE.pending;
    const isPending = item.status === 'pending';
    const primaryTheme = item.primaryTheme || (item.themes.length > 0 ? item.themes[0] : null);
    const themeInfo = primaryTheme ? getThemeById(primaryTheme) : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, themeInfo && {backgroundColor: themeInfo.color + '20'}]}>
            <Text style={[styles.categoryText, themeInfo && {color: themeInfo.color}]}>
              {themeInfo?.label || 'Non classe'}
            </Text>
          </View>
          <Badge text={badge.text} variant={badge.variant} />
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.description.slice(0, 50)}...</Text>

        <View style={styles.cardMeta}>
          <Text style={typography.caption}>Par: {item.authorDisplayName}</Text>
          <Text style={typography.caption}>{item.files.length} fichier(s)</Text>
        </View>

        <View style={styles.cardPersons}>
          <Text style={typography.caption}>Type: {item.authorType}</Text>
          <Text style={typography.caption}>{formatDate(item.createdAt)}</Text>
        </View>

        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptPost(item.id)}>
              <MaterialCommunityIcons name="check" size={20} color={colors.surface} />
              <Text style={styles.actionBtnText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectPost(item.id)}>
              <MaterialCommunityIcons name="close" size={20} color={colors.surface} />
              <Text style={styles.actionBtnText}>Refuser</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  function renderOrgCard({item}: {item: Organization}) {
    const badge = STATUS_BADGE[item.status] || STATUS_BADGE.pending;
    const isPending = item.status === 'pending';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, {backgroundColor: colors.accent + '20'}]}>
            <Text style={[styles.categoryText, {color: colors.accent}]}>
              {item.partnershipLevel === 'officiel' ? 'Officiel' : item.partnershipLevel === 'partenaire' ? 'Partenaire' : 'Association'}
            </Text>
          </View>
          <Badge text={badge.text} variant={badge.variant} />
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
        <Text style={typography.caption} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardMeta}>
          <Text style={typography.caption}>{item.country}</Text>
          {item.website && <Text style={[typography.caption, {color: colors.accent}]}>{item.website}</Text>}
        </View>

        <View style={styles.cardPersons}>
          <Text style={typography.caption}>Themes: {item.themes.join(', ') || 'Non defini'}</Text>
          <Text style={typography.caption}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.reviewNote && (
          <View style={styles.reviewNote}>
            <MaterialCommunityIcons name="message-text" size={14} color={colors.mutedText} />
            <Text style={[typography.caption, {flex: 1}]}>{item.reviewNote}</Text>
          </View>
        )}

        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptOrg(item.id)}>
              <MaterialCommunityIcons name="check" size={20} color={colors.surface} />
              <Text style={styles.actionBtnText}>Verifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectOrg(item.id)}>
              <MaterialCommunityIcons name="close" size={20} color={colors.surface} />
              <Text style={styles.actionBtnText}>Refuser</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  const getData = () => {
    if (entityType === 'requests') return requests;
    if (entityType === 'posts') return posts;
    return organizations;
  };

  const renderItem = ({item}: {item: any}) => {
    if (entityType === 'requests') return renderRequestCard({item});
    if (entityType === 'posts') return renderPostCard({item});
    return renderOrgCard({item});
  };

  const getEmptyMessage = () => {
    const typeLabels = {requests: 'demande', posts: 'post', organizations: 'association'};
    const statusLabels = {pending: 'en attente', verified: 'acceptee', rejected: 'refusee'};
    return `Aucune ${typeLabels[entityType]} ${statusLabels[activeTab]}.`;
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={typography.h2}>Moderation</Text>
        <View style={{width: 40}} />
      </View>

      {/* Admin Actions */}
      <View style={styles.adminActions}>
        <TouchableOpacity style={styles.initTreasuryBtn} onPress={handleInitTreasury}>
          <MaterialCommunityIcons name="bank" size={18} color={colors.surface} />
          <Text style={styles.initTreasuryText}>Init Treasury</Text>
        </TouchableOpacity>
      </View>

      {/* Entity Type Tabs */}
      <View style={styles.entityTabs}>
        {ENTITY_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.entityTab, entityType === tab.key && styles.entityTabActive]}
            onPress={() => setEntityType(tab.key)}>
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={20}
              color={entityType === tab.key ? colors.surface : colors.mutedText}
            />
            <Text style={[styles.entityTabText, entityType === tab.key && styles.entityTabTextActive]}>
              {tab.label}
            </Text>
            {pendingCounts[tab.key] > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>
                  {pendingCounts[tab.key] > 99 ? '99+' : pendingCounts[tab.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Status Tabs */}
      <View style={styles.tabs}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={getData()}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, getData().length === 0 && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState icon="check-circle-outline" title="Aucun element" message={getEmptyMessage()} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminActions: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  initTreasuryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  initTreasuryText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  entityTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entityTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  entityTabActive: {
    backgroundColor: colors.accent,
  },
  entityTabText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.mutedText,
  },
  entityTabTextActive: {
    color: colors.surface,
  },
  pendingBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 2,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.mutedText,
  },
  tabTextActive: {
    color: colors.surface,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardHeader: {
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
  categoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cardAmount: {
    ...typography.h3,
    color: colors.primary,
  },
  cardPersons: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 2,
  },
  reviewNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  actionBtnText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 15,
  },
});
