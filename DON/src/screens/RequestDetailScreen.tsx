import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {Badge, ReportModal} from '../components';
import {ZakatRequest, RequestFile} from '../services/request';
import {requestService} from '../services/request';
import {getThemeById} from '../services/themes';
import {auth} from '../lib/firebase';
import {isCurrentUserAdmin} from '../services/admin';
import {followService} from '../services/follow';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const MEDIA_HEIGHT = SCREEN_WIDTH * 0.85;

interface Props {
  route: any;
  navigation: any;
}

export function RequestDetailScreen({route, navigation}: Props) {
  const insets = useSafeAreaInsets();
  const {requestId, from} = route.params;
  const [request, setRequest] = useState<ZakatRequest | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [canDelete, setCanDelete] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  // Handle back navigation based on source
  function handleGoBack() {
    // Since we now navigate within each tab's own stack, goBack works correctly
    navigation.goBack();
  }

  // Reload request data when screen gains focus (e.g., after donation)
  const loadRequest = useCallback(async () => {
    const data = await requestService.getById(requestId);
    setRequest(data);

    // Check if current user can delete (is owner or admin)
    const currentUser = auth.currentUser;
    if (currentUser && data) {
      const isOwner = data.authorUserId === currentUser.uid ||
                      (data as any).authorUid === currentUser.uid;
      const isAdmin = await isCurrentUserAdmin();
      setCanDelete(isOwner || isAdmin);

      // Check follow status
      if (!isOwner) {
        const followTargetType = data.type === 'organization' ? 'organization' : 'user';
        const followTargetId = data.type === 'organization' && data.organizationId
          ? data.organizationId
          : data.authorUserId;
        const following = await followService.isFollowing(followTargetType, followTargetId);
        setIsFollowing(following);
      }
    } else {
      setCanDelete(false);
    }
  }, [requestId]);

  useFocusEffect(
    useCallback(() => {
      loadRequest();
    }, [loadRequest])
  );

  if (!request) {
    return (
      <View style={[styles.container, styles.center, {paddingTop: insets.top}]}>
        <Text style={typography.body}>Chargement...</Text>
      </View>
    );
  }

  const ben = request.beneficiary;
  const photos = request.files.filter(f => f.type === 'photo');
  const pdfs = request.files.filter(f => f.type === 'pdf' || f.type === 'proof');

  // Author type logic - determines donation flow
  const isOrgAuthor = request.type === 'organization' || !!request.organizationId;

  // Donation logic:
  // - Individual requests: donate to the request
  // - Organization requests: ALWAYS donate to the organization (never to the request)
  const showDonateButton = request.status === 'verified' && request.goalAmount > 0;
  const showDonationProgress = request.goalAmount > 0;
  const donateToOrganization = isOrgAuthor && request.organizationId;
  const allMedia: (RequestFile & {mediaType: 'photo' | 'pdf'})[] = [
    ...photos.map(f => ({...f, mediaType: 'photo' as const})),
    ...pdfs.map(f => ({...f, mediaType: 'pdf' as const})),
  ];

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function onMediaScroll(event: any) {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveMediaIndex(index);
  }

  function handleDelete() {
    Alert.alert(
      'Supprimer la demande',
      'Cette action est irréversible. Confirmer la suppression ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await requestService.delete(request!.id);
            navigation.goBack();
          },
        },
      ],
    );
  }

  async function handleFollowToggle() {
    if (!currentUserId || !request) return;

    const isOwner = request.authorUserId === currentUserId;
    if (isOwner) return;

    setFollowLoading(true);
    try {
      const followTargetType = request.type === 'organization' ? 'organization' : 'user';
      const followTargetId = request.type === 'organization' && request.organizationId
        ? request.organizationId
        : request.authorUserId;

      if (isFollowing) {
        await followService.unfollow(followTargetType, followTargetId);
        setIsFollowing(false);
      } else {
        await followService.follow(followTargetType, followTargetId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.warn('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  }

  function navigateToAuthorProfile() {
    if (!request) return;
    if (request.type === 'organization' && request.organizationId) {
      navigation.navigate('OrganizationProfile', {organizationId: request.organizationId});
    } else {
      navigation.navigate('UserProfile', {userId: request.authorUserId});
    }
  }

  function renderMediaItem({item}: {item: RequestFile & {mediaType: 'photo' | 'pdf'}}) {
    if (item.mediaType === 'photo') {
      return (
        <Image
          source={{uri: item.uri}}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      );
    }

    // PDF card
    return (
      <View style={styles.pdfCard}>
        <View style={styles.pdfIconContainer}>
          <MaterialCommunityIcons name="file-pdf-box" size={64} color={colors.error} />
        </View>
        <Text style={styles.pdfName} numberOfLines={2}>
          {item.name}
        </Text>
        <TouchableOpacity
          style={styles.pdfViewBtn}
          onPress={() =>
            navigation.navigate('PdfViewer', {uri: item.uri, title: item.name})
          }>
          <MaterialCommunityIcons name="eye" size={20} color={colors.surface} />
          <Text style={styles.pdfViewBtnText}>Voir le document</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const benFullName = `${ben.firstName} ${ben.lastName}`;
  const benLocation = [ben.city, ben.country].filter(Boolean).join(', ');

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={typography.h3} numberOfLines={1}>
          Détail
        </Text>
        <View style={styles.topBarActions}>
          {currentUserId && request.authorUserId !== currentUserId && (
            <TouchableOpacity onPress={() => setShowReportModal(true)} style={styles.actionBtn}>
              <MaterialCommunityIcons name="flag-outline" size={22} color={colors.mutedText} />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
              <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ===== HEADER (Instagram-style) - AUTEUR ===== */}
        <View style={styles.postHeader}>
          <TouchableOpacity style={styles.authorSection} onPress={navigateToAuthorProfile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {request.authorDisplayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.authorNameRow}>
                <Text style={styles.posterName}>{request.authorDisplayName}</Text>
                {request.type === 'organization' && (
                  <MaterialCommunityIcons name="check-decagram" size={14} color={colors.primary} style={{marginLeft: 4}} />
                )}
              </View>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={14}
                  color={colors.mutedText}
                />
                <Text style={typography.caption}>
                  {request.city}, {request.country}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            {currentUserId && request.authorUserId !== currentUserId && (
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={handleFollowToggle}
                disabled={followLoading}>
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? colors.primary : '#fff'} />
                ) : (
                  <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                    {isFollowing ? 'Suivi' : 'Suivre'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            <Text style={styles.dateText}>{formatDate(request.createdAt)}</Text>
          </View>
        </View>

        {/* ===== MEDIA CAROUSEL ===== */}
        {allMedia.length > 0 && (
          <View>
            <FlatList
              data={allMedia}
              keyExtractor={item => item.id}
              renderItem={renderMediaItem}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onMediaScroll}
              snapToInterval={SCREEN_WIDTH}
              decelerationRate="fast"
            />
            {/* Pagination dots */}
            {allMedia.length > 1 && (
              <View style={styles.pagination}>
                {allMedia.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      activeMediaIndex === idx && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ===== CONTENT ===== */}
        <View style={styles.content}>
          {/* Amount + Status row */}
          <View style={styles.amountRow}>
            <Text style={styles.amountText}>{formatAmount(request.goalAmount)}</Text>
            <Badge
              text={
                request.status === 'pending'
                  ? 'En attente'
                  : request.status === 'verified'
                  ? 'Vérifiée'
                  : request.status === 'rejected'
                  ? 'Refusée'
                  : 'Fermée'
              }
              variant={
                request.status === 'pending'
                  ? 'warning'
                  : request.status === 'verified'
                  ? 'success'
                  : request.status === 'rejected'
                  ? 'error'
                  : 'info'
              }
            />
          </View>

          {/* Theme chip */}
          {(() => {
            const primaryTheme = request.primaryTheme || (request.themes.length > 0 ? request.themes[0] : null);
            const themeInfo = primaryTheme ? getThemeById(primaryTheme) : null;
            return themeInfo ? (
              <View style={[styles.categoryChip, {backgroundColor: themeInfo.color + '15'}]}>
                <MaterialCommunityIcons name={themeInfo.icon as any} size={14} color={themeInfo.color} />
                <Text style={[styles.categoryChipText, {color: themeInfo.color}]}>
                  {themeInfo.label}
                </Text>
              </View>
            ) : null;
          })()}

          {/* Title */}
          <Text style={styles.title}>{request.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{request.description}</Text>

          {/* Progress bar - only for requests and campaigns */}
          {showDonationProgress && (
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={typography.bodySmall}>Collecte</Text>
                <Text style={typography.caption}>
                  {formatAmount((request.receivedAmountCents || 0) / 100)} / {formatAmount(request.goalAmount)}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        100,
                        ((request.receivedAmountCents || 0) / 100 / request.goalAmount) * 100,
                      )}%`,
                    },
                  ]}
                />
              </View>
              {(request.donorCount || 0) > 0 && (
                <Text style={styles.donorCountText}>
                  {request.donorCount} donateur{(request.donorCount || 0) > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          )}

          {/* Badge for organization-authored requests */}
          {isOrgAuthor && (
            <View style={styles.orgAuthorBadge}>
              <MaterialCommunityIcons
                name="domain"
                size={16}
                color={colors.accent}
              />
              <Text style={styles.orgAuthorBadgeText}>
                Publié par une association
              </Text>
            </View>
          )}

          {/* Donate button */}
          {showDonateButton && (
            <>
              <TouchableOpacity
                style={styles.donateBtn}
                onPress={() => {
                  if (donateToOrganization) {
                    // For organization requests, donations ALWAYS go to the organization
                    navigation.navigate('Donate', {
                      type: 'organization',
                      organizationId: request.organizationId,
                      organizationName: request.organizationName,
                    });
                  } else {
                    // For individual requests, donations go to the request
                    navigation.navigate('Donate', {type: 'request', requestId: request.id});
                  }
                }}>
                <MaterialCommunityIcons name="hand-heart" size={22} color={colors.surface} />
                <Text style={styles.donateBtnText}>
                  {donateToOrganization ? `Soutenir ${request.organizationName || 'l\'association'}` : 'Faire un don'}
                </Text>
              </TouchableOpacity>
              {/* Explanatory text for organization donations */}
              {donateToOrganization && (
                <Text style={styles.orgDonateHint}>
                  Les dons soutiennent directement l'association
                </Text>
              )}
            </>
          )}

          {/* Proof check */}
          {pdfs.length > 0 && (
            <View style={styles.proofBadge}>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={colors.success}
              />
              <Text style={styles.proofText}>Justificatif reçu</Text>
            </View>
          )}
        </View>

        {/* ===== AUTEUR ===== */}
        <View style={styles.personSection}>
          <Text style={styles.sectionTitle}>Publié par</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-edit" size={20} color={colors.primary} />
            <Text style={typography.body}>{request.authorDisplayName}</Text>
          </View>
        </View>

        {/* ===== BENEFICIAIRE ===== */}
        {/* Only show beneficiary section for person-oriented requests (not collective projects) */}
        {benFullName !== 'Collectif Projet' && (
          <View style={styles.personSection}>
            <Text style={styles.sectionTitle}>Personne concernée</Text>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
              <Text style={typography.body}>{benFullName}</Text>
            </View>

            {benLocation ? (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
                <Text style={typography.body}>{benLocation}</Text>
              </View>
            ) : null}

            {ben.age != null && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
                <Text style={typography.body}>{ben.age} ans</Text>
              </View>
            )}

            {ben.showContactPublicly && (
              <>
                {ben.email ? (
                  <TouchableOpacity
                    style={styles.infoRow}
                    onPress={() => Linking.openURL(`mailto:${ben.email}`)}>
                    <MaterialCommunityIcons name="email" size={20} color={colors.primary} />
                    <Text style={[typography.body, {color: colors.accent}]}>
                      {ben.email}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {ben.phone ? (
                  <TouchableOpacity
                    style={styles.infoRow}
                    onPress={() => Linking.openURL(`tel:${ben.phone}`)}>
                    <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
                    <Text style={[typography.body, {color: colors.accent}]}>
                      {ben.phone}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}

            {!ben.showContactPublicly && (
              <View style={styles.contactHidden}>
                <MaterialCommunityIcons name="lock" size={16} color={colors.mutedText} />
                <Text style={typography.caption}>
                  Contacts non visibles (choix de l'auteur)
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{height: insets.bottom + 30}} />
      </ScrollView>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="request"
        contentId={request.id}
        reportedUserId={request.authorUserId}
        reportedUserName={request.authorDisplayName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
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
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  actionBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header (Instagram-style) - AUTEUR
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  posterName: {
    ...typography.body,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  followBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
  },
  followingBtn: {
    backgroundColor: colors.border,
  },
  followBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  followingBtnText: {
    color: colors.text,
  },
  dateText: {
    ...typography.caption,
    color: colors.mutedText,
  },

  // Media carousel
  mediaImage: {
    width: SCREEN_WIDTH,
    height: MEDIA_HEIGHT,
    backgroundColor: colors.border,
  },
  pdfCard: {
    width: SCREEN_WIDTH,
    height: MEDIA_HEIGHT,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  pdfIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pdfName: {
    ...typography.body,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  pdfViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  pdfViewBtnText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 15,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  // Content
  content: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    lineHeight: 24,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  donorCountText: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: spacing.xs,
  },
  donateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  donateBtnText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  orgAuthorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    backgroundColor: colors.accent + '15',
  },
  orgAuthorBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  orgDonateHint: {
    ...typography.caption,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  proofText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
  },

  // Person sections
  personSection: {
    margin: spacing.lg,
    marginBottom: 0,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  contactHidden: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
});
