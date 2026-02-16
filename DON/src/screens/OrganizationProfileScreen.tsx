import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {Organization} from '../services/organization';
import {organizationService} from '../services/organization';
import {ZakatRequest, POST_TYPE_LABELS} from '../services/request';
import {requestService} from '../services/request';
import {followService} from '../services/follow';
import {getThemeById} from '../services/themes';
import {EmptyState, ReportModal} from '../components';

type RouteParams = {
  OrganizationProfile: {
    organizationId: string;
  };
};

export function OrganizationProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'OrganizationProfile'>>();
  const {organizationId} = route.params;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [requests, setRequests] = useState<ZakatRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);

  const loadData = useCallback(async () => {
    const [org, reqs, following, followers] = await Promise.all([
      organizationService.getById(organizationId),
      requestService.getByOrganizationId(organizationId),
      followService.isFollowing('organization', organizationId),
      followService.getFollowersCount('organization', organizationId),
    ]);
    setOrganization(org);
    // Only show verified requests
    setRequests(reqs.filter(r => r.status === 'verified'));
    setIsFollowing(following);
    setFollowersCount(followers);
  }, [organizationId]);

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

  function openDetail(id: string) {
    navigation.navigate('RequestDetail', {requestId: id});
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function handleDonate() {
    if (organization) {
      navigation.navigate('Donate', {
        type: 'organization',
        organizationId: organization.id,
        organizationName: organization.name,
      });
    }
  }

  async function handleFollowToggle() {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollow('organization', organizationId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await followService.follow('organization', organizationId);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (e) {
      console.error('Follow toggle error:', e);
    } finally {
      setFollowLoading(false);
    }
  }

  if (!organization) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={typography.h2}>Chargement...</Text>
          <View style={{width: 40}} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={typography.h2} numberOfLines={1}>{organization.name}</Text>
        <TouchableOpacity onPress={() => setShowReportModal(true)} style={styles.reportBtn}>
          <MaterialCommunityIcons name="flag-outline" size={22} color={colors.mutedText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }>
        {/* Organization Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {organization.logoUrl ? (
              <Image source={{uri: organization.logoUrl}} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{organization.name.charAt(0)}</Text>
              </View>
            )}
          </View>

          <Text style={styles.orgName}>{organization.name}</Text>

          {/* Verified badge */}
          {organization.verified && (
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={16} color={colors.primary} />
              <Text style={styles.verifiedText}>Partenaire verifie</Text>
            </View>
          )}

          {/* Partnership level badge */}
          {organization.partnershipLevel === 'officiel' && (
            <View style={styles.officielBadge}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#fff" />
              <Text style={styles.officielText}>Partenaire Officiel</Text>
            </View>
          )}

          {/* Location */}
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color={colors.mutedText} />
            <Text style={styles.locationText}>{organization.country}</Text>
          </View>

          {/* Description */}
          {organization.description && (
            <Text style={styles.description}>{organization.description}</Text>
          )}

          {/* Themes */}
          {organization.themes.length > 0 && (
            <View style={styles.themesRow}>
              {organization.themes.map(tid => {
                const t = getThemeById(tid);
                return t ? (
                  <View key={tid} style={[styles.themeTag, {backgroundColor: t.color + '15'}]}>
                    <Text style={[styles.themeTagText, {color: t.color}]}>{t.label}</Text>
                  </View>
                ) : (
                  <View key={tid} style={[styles.themeTag, {backgroundColor: colors.primary + '15'}]}>
                    <Text style={[styles.themeTagText, {color: colors.primary}]}>{tid}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Website */}
          {organization.website && (
            <View style={styles.websiteRow}>
              <MaterialCommunityIcons name="web" size={16} color={colors.accent} />
              <Text style={styles.websiteText}>{organization.website}</Text>
            </View>
          )}

          {/* Follow button */}
          <TouchableOpacity
            style={[
              styles.followBtn,
              isFollowing && styles.followBtnActive,
            ]}
            onPress={handleFollowToggle}
            disabled={followLoading}>
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? colors.primary : '#fff'} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={isFollowing ? 'account-check' : 'account-plus'}
                  size={18}
                  color={isFollowing ? colors.primary : '#fff'}
                />
                <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                  {isFollowing ? 'Abonne' : "S'abonner"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.walletStats}>
            <View style={styles.walletStatItem}>
              <Text style={styles.walletStatValue}>{followersCount}</Text>
              <Text style={styles.walletStatLabel}>
                Abonne{followersCount > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.walletStatDivider} />
            <View style={styles.walletStatItem}>
              <Text style={styles.walletStatValue}>
                {formatAmount((organization.walletBalanceCents || 0) / 100)}
              </Text>
              <Text style={styles.walletStatLabel}>Collecte</Text>
            </View>
            <View style={styles.walletStatDivider} />
            <View style={styles.walletStatItem}>
              <Text style={styles.walletStatValue}>{organization.donorCount || 0}</Text>
              <Text style={styles.walletStatLabel}>
                Donateur{(organization.donorCount || 0) > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Donate button */}
          <TouchableOpacity style={styles.donateBtn} onPress={handleDonate}>
            <MaterialCommunityIcons name="hand-heart" size={20} color="#fff" />
            <Text style={styles.donateBtnText}>Donner a cette association</Text>
          </TouchableOpacity>
        </View>

        {/* Requests section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Publications ({requests.length})
          </Text>

          {requests.length === 0 ? (
            <EmptyState
              icon="file-document-outline"
              title="Aucune publication"
              message="Cette association n'a pas encore de demandes publiees."
            />
          ) : (
            requests.map(item => {
              const firstPhoto = item.files.find(f => f.type === 'photo');
              const postType = item.postType || 'org_campaign';
              const isOrgUpdate = postType === 'org_update';
              const postTypeBadgeConfig = {
                org_update: {icon: 'newspaper-variant-outline', color: colors.accent, label: 'Publication'},
                org_campaign: {icon: 'bullhorn', color: colors.success, label: 'Campagne'},
              };
              const badgeConfig = postTypeBadgeConfig[postType as keyof typeof postTypeBadgeConfig] || postTypeBadgeConfig.org_campaign;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.requestCard}
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
                      <View style={[styles.postTypeBadge, {backgroundColor: badgeConfig.color + '15'}]}>
                        <MaterialCommunityIcons name={badgeConfig.icon as any} size={12} color={badgeConfig.color} />
                        <Text style={[styles.postTypeBadgeText, {color: badgeConfig.color}]}>{badgeConfig.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.cardFooterRow}>
                      <View style={styles.cardLocationRow}>
                        <MaterialCommunityIcons name="map-marker" size={14} color={colors.mutedText} />
                        <Text style={typography.caption}>{item.city}, {item.country}</Text>
                      </View>
                      {!isOrgUpdate && item.goalAmount > 0 && (
                        <Text style={styles.cardAmount}>{formatAmount(item.goalAmount)}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{height: spacing.xxl}} />
      </ScrollView>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="user"
        reportedUserId={organization.adminUserId}
        reportedUserName={organization.name}
      />
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
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Profile card
  profileCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  orgName: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  verifiedText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  officielBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  officielText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.mutedText,
  },
  description: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  themesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  themeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  themeTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  websiteText: {
    ...typography.bodySmall,
    color: colors.accent,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    minWidth: 140,
    minHeight: 40,
  },
  followBtnActive: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followBtnTextActive: {
    color: colors.primary,
  },
  walletStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.lg,
    marginVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  walletStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  walletStatValue: {
    ...typography.h2,
    color: colors.primary,
  },
  walletStatLabel: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
  walletStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  donateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    width: '100%',
  },
  donateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Section
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },

  // Request cards
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardImage: {
    width: '100%',
    height: 140,
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
    padding: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  categoryBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
