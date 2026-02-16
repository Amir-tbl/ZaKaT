import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {Post, PostFile, postService} from '../services/post';
import {getThemeById} from '../services/themes';
import {auth} from '../lib/firebase';
import {isCurrentUserAdmin} from '../services/admin';
import {followService} from '../services/follow';
import {ReportModal} from '../components';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const MEDIA_HEIGHT = SCREEN_WIDTH * 0.85;

interface Props {
  route: any;
  navigation: any;
}

export function PostDetailScreen({route, navigation}: Props) {
  const insets = useSafeAreaInsets();
  const {postId, from} = route.params;
  const [post, setPost] = useState<Post | null>(null);
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

  const loadPost = useCallback(async () => {
    const data = await postService.getById(postId);
    setPost(data);

    // Check if current user can delete (is owner or admin)
    const currentUser = auth.currentUser;
    if (currentUser && data) {
      const isOwner = data.authorUserId === currentUser.uid ||
                      (data as any).authorUid === currentUser.uid;
      const isAdmin = await isCurrentUserAdmin();
      setCanDelete(isOwner || isAdmin);

      // Check follow status
      if (!isOwner) {
        const followTargetType = data.authorType === 'organization' ? 'organization' : 'user';
        const followTargetId = data.authorType === 'organization' && data.organizationId
          ? data.organizationId
          : data.authorUserId;
        const following = await followService.isFollowing(followTargetType, followTargetId);
        setIsFollowing(following);
      }
    } else {
      setCanDelete(false);
    }
  }, [postId]);

  useFocusEffect(
    useCallback(() => {
      loadPost();
    }, [loadPost])
  );

  if (!post) {
    return (
      <View style={[styles.container, styles.center, {paddingTop: insets.top}]}>
        <Text style={typography.body}>Chargement...</Text>
      </View>
    );
  }

  const photos = post.files.filter(f => f.type === 'photo');
  const videos = post.files.filter(f => f.type === 'video');
  const pdfs = post.files.filter(f => f.type === 'pdf');
  const allMedia: (PostFile & {mediaType: 'photo' | 'video' | 'pdf'})[] = [
    ...photos.map(f => ({...f, mediaType: 'photo' as const})),
    ...videos.map(f => ({...f, mediaType: 'video' as const})),
    ...pdfs.map(f => ({...f, mediaType: 'pdf' as const})),
  ];

  // Visual media only (for full screen viewer)
  const visualMedia = [...photos, ...videos].map(f => ({
    id: f.id,
    uri: f.uri,
    type: f.type as 'photo' | 'video',
    duration: f.duration,
  }));

  function openMediaViewer(itemId: string) {
    const visualIndex = visualMedia.findIndex(m => m.id === itemId);
    if (visualIndex >= 0) {
      navigation.navigate('MediaViewer', {media: visualMedia, initialIndex: visualIndex});
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function onMediaScroll(event: any) {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveMediaIndex(index);
  }

  function handleDelete() {
    Alert.alert(
      'Supprimer la publication',
      'Cette action est irreversible. Confirmer la suppression ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await postService.delete(post!.id);
            handleGoBack();
          },
        },
      ],
    );
  }

  async function handleFollowToggle() {
    if (!currentUserId || !post) return;

    const isOwner = post.authorUserId === currentUserId;
    if (isOwner) return;

    setFollowLoading(true);
    try {
      const followTargetType = post.authorType === 'organization' ? 'organization' : 'user';
      const followTargetId = post.authorType === 'organization' && post.organizationId
        ? post.organizationId
        : post.authorUserId;

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
    if (!post) return;
    if (post.authorType === 'organization' && post.organizationId) {
      navigation.navigate('OrganizationProfile', {organizationId: post.organizationId});
    } else {
      navigation.navigate('UserProfile', {userId: post.authorUserId});
    }
  }

  function renderMediaItem({item, index}: {item: PostFile & {mediaType: 'photo' | 'video' | 'pdf'}; index: number}) {
    if (item.mediaType === 'photo') {
      return (
        <TouchableOpacity activeOpacity={0.9} onPress={() => openMediaViewer(item.id)}>
          <Image
            source={{uri: item.uri}}
            style={styles.mediaImage}
            resizeMode="cover"
          />
          <View style={styles.expandHint}>
            <MaterialCommunityIcons name="arrow-expand" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      );
    }

    if (item.mediaType === 'video') {
      return (
        <TouchableOpacity activeOpacity={0.9} onPress={() => openMediaViewer(item.id)}>
          <View style={styles.videoContainer}>
            <Image
              source={{uri: item.uri}}
              style={styles.mediaImage}
              resizeMode="cover"
            />
            <View style={styles.videoControlsOverlay}>
              <View style={styles.playButtonLarge}>
                <MaterialCommunityIcons name="play" size={50} color="#fff" />
              </View>
            </View>
            <View style={styles.expandHint}>
              <MaterialCommunityIcons name="arrow-expand" size={18} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
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

  const primaryTheme = post.primaryTheme ? getThemeById(post.primaryTheme) : null;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={typography.h3} numberOfLines={1}>
          Publication
        </Text>
        <View style={styles.topBarActions}>
          {currentUserId && post.authorUserId !== currentUserId && (
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
                {post.authorDisplayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.authorNameRow}>
                <Text style={styles.posterName}>{post.authorDisplayName}</Text>
                {post.authorType === 'organization' && (
                  <MaterialCommunityIcons name="check-decagram" size={14} color={colors.primary} style={{marginLeft: 4}} />
                )}
              </View>
              {post.location && (
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={14}
                    color={colors.mutedText}
                  />
                  <Text style={typography.caption}>
                    {post.location.city}, {post.location.country}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            {currentUserId && post.authorUserId !== currentUserId && (
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
            <Text style={styles.dateText}>{formatDate(post.createdAt)}</Text>
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
          {/* Theme chip */}
          {primaryTheme && (
            <View style={[styles.categoryChip, {backgroundColor: primaryTheme.color + '15'}]}>
              <MaterialCommunityIcons name={primaryTheme.icon as any} size={14} color={primaryTheme.color} />
              <Text style={[styles.categoryChipText, {color: primaryTheme.color}]}>
                {primaryTheme.label}
              </Text>
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{post.description}</Text>

          {/* All themes */}
          {post.themes.length > 0 && (
            <View style={styles.themeTags}>
              {post.themes.map(tid => {
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

        {/* ===== AUTEUR ===== */}
        <View style={styles.personSection}>
          <Text style={styles.sectionTitle}>Publie par</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name={post.authorType === 'organization' ? 'domain' : 'account'}
              size={20}
              color={colors.primary}
            />
            <Text style={typography.body}>{post.authorDisplayName}</Text>
          </View>
          {post.organizationName && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="check-decagram" size={20} color={colors.accent} />
              <Text style={[typography.body, {color: colors.accent}]}>{post.organizationName}</Text>
            </View>
          )}
        </View>

        <View style={{height: insets.bottom + 30}} />
      </ScrollView>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="post"
        contentId={post.id}
        reportedUserId={post.authorUserId}
        reportedUserName={post.authorDisplayName}
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
  videoContainer: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: MEDIA_HEIGHT,
    backgroundColor: '#000',
  },
  videoControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 6,
  },
  expandHint: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  description: {
    ...typography.body,
    lineHeight: 24,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  themeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
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
});
