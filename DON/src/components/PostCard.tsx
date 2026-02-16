import React, {memo, useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {Video, ResizeMode, AVPlaybackStatus} from 'expo-av';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {Post, PostFile} from '../services/post';
import {getThemeById} from '../services/themes';
import {followService} from '../services/follow';
import {auth} from '../lib/firebase';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface MediaItem {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  duration?: number;
}

interface PostCardProps {
  post: Post;
  onPress?: (postId: string) => void;
  onAuthorPress?: (userId: string, type: 'user' | 'organization') => void;
  onPdfPress?: (uri: string, name: string) => void;
  onMediaPress?: (media: MediaItem[], initialIndex: number) => void;
}

// Aspect ratio limits like Instagram: min 1.91:1 (landscape), max 4:5 (portrait)
const MIN_ASPECT = 9 / 16;   // portrait cap → height max = width * 1.78
const MAX_ASPECT = 1.91;     // landscape cap

const PHOTO_MIN_ASPECT = 3 / 4;  // portrait cap for photos (less tall than videos)

function InlinePhoto({uri, onPress}: {uri: string; onPress?: () => void}) {
  const [photoAspect, setPhotoAspect] = useState(1);

  useEffect(() => {
    Image.getSize(
      uri,
      (width, height) => {
        if (width > 0 && height > 0) {
          setPhotoAspect(width / height);
        }
      },
      () => {},
    );
  }, [uri]);

  const clampedAspect = Math.max(PHOTO_MIN_ASPECT, Math.min(MAX_ASPECT, photoAspect));
  const photoHeight = SCREEN_WIDTH / clampedAspect;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Image
        source={{uri}}
        style={{width: SCREEN_WIDTH, height: photoHeight, backgroundColor: colors.border}}
        resizeMode="cover"
      />
      <View style={styles.expandHint}>
        <MaterialCommunityIcons name="arrow-expand" size={18} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

function InlineVideoPlayer({uri, duration}: {uri: string; duration?: number}) {
  const videoRef = useRef<Video>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoAspect, setVideoAspect] = useState(1);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded && status.naturalSize) {
      const {width, height} = status.naturalSize;
      if (width > 0 && height > 0) {
        setVideoAspect(width / height);
      }
    }
  }, []);

  const handleTap = useCallback(() => {
    setIsPaused(prev => {
      if (prev) {
        videoRef.current?.playAsync();
      } else {
        videoRef.current?.pauseAsync();
      }
      return !prev;
    });
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Clamp aspect ratio between Instagram-like limits
  const clampedAspect = Math.max(MIN_ASPECT, Math.min(MAX_ASPECT, videoAspect));
  const videoHeight = SCREEN_WIDTH / clampedAspect;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleTap}
      style={{width: SCREEN_WIDTH, height: videoHeight, overflow: 'hidden'}}>
      <Video
        ref={videoRef}
        source={{uri}}
        style={{width: SCREEN_WIDTH, height: videoHeight}}
        resizeMode={ResizeMode.COVER}
        shouldPlay={!isPaused}
        isLooping
        isMuted={isMuted}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        useNativeControls={false}
      />
      {/* Pause icon overlay */}
      {isPaused && (
        <View style={styles.videoPauseOverlay}>
          <View style={styles.videoPauseIcon}>
            <MaterialCommunityIcons name="play" size={40} color="#fff" />
          </View>
        </View>
      )}
      {/* Mute button */}
      <TouchableOpacity
        style={styles.videoMuteBtn}
        onPress={handleMuteToggle}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <MaterialCommunityIcons
          name={isMuted ? 'volume-off' : 'volume-high'}
          size={18}
          color="#fff"
        />
      </TouchableOpacity>
      {/* Duration badge */}
      {duration && (
        <View style={styles.videoDuration}>
          <Text style={styles.videoDurationText}>
            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function PostCardComponent({post, onPress, onAuthorPress, onPdfPress, onMediaPress}: PostCardProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const currentUserId = auth.currentUser?.uid;
  const isOwnPost = currentUserId === post.authorUserId;
  const followTargetType = post.authorType === 'organization' ? 'organization' : 'user';
  const followTargetId = post.authorType === 'organization' && post.organizationId
    ? post.organizationId
    : post.authorUserId;

  useEffect(() => {
    async function checkFollowStatus() {
      if (currentUserId && !isOwnPost) {
        const following = await followService.isFollowing(followTargetType, followTargetId);
        setIsFollowing(following);
      }
    }
    checkFollowStatus();
  }, [currentUserId, followTargetType, followTargetId, isOwnPost]);

  const handleFollowToggle = useCallback(async () => {
    if (!currentUserId || isOwnPost) return;

    setFollowLoading(true);
    try {
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
  }, [currentUserId, isOwnPost, isFollowing, followTargetType, followTargetId]);

  const photos = post.files.filter(f => f.type === 'photo');
  const videos = post.files.filter(f => f.type === 'video');
  const pdfs = post.files.filter(f => f.type === 'pdf');
  const allMedia = [...photos, ...videos, ...pdfs];

  // Visual media only (for full screen viewer)
  const visualMedia: MediaItem[] = [...photos, ...videos].map(f => ({
    id: f.id,
    uri: f.uri,
    type: f.type as 'photo' | 'video',
    duration: f.duration,
  }));

  const formatDate = useCallback((timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'A l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;

    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }, []);

  const handleMediaScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveMediaIndex(index);
  }, []);

  const handleAuthorPress = useCallback(() => {
    if (onAuthorPress) {
      onAuthorPress(
        post.authorType === 'organization' && post.organizationId
          ? post.organizationId
          : post.authorUserId,
        post.authorType,
      );
    }
  }, [onAuthorPress, post]);

  const renderMediaItem = useCallback(
    ({item, index}: {item: PostFile; index: number}) => {
      if (item.type === 'photo') {
        // Find index in visual media array for the viewer
        const visualIndex = visualMedia.findIndex(m => m.id === item.id);
        return (
          <InlinePhoto
            uri={item.uri}
            onPress={() => onMediaPress?.(visualMedia, visualIndex >= 0 ? visualIndex : 0)}
          />
        );
      }

      if (item.type === 'video') {
        return (
          <InlineVideoPlayer
            uri={item.uri}
            duration={item.duration}
          />
        );
      }

      // PDF card
      return (
        <TouchableOpacity
          style={styles.pdfCard}
          onPress={() => onPdfPress?.(item.uri, item.name)}
          activeOpacity={0.8}>
          <View style={styles.pdfIconContainer}>
            <MaterialCommunityIcons name="file-pdf-box" size={48} color={colors.error} />
          </View>
          <Text style={styles.pdfName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.pdfHint}>Appuyer pour ouvrir</Text>
        </TouchableOpacity>
      );
    },
    [onPdfPress, onMediaPress, visualMedia],
  );

  const primaryTheme = post.primaryTheme || (post.themes.length > 0 ? post.themes[0] : null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={handleAuthorPress}
          activeOpacity={0.7}>
          <View style={styles.avatar}>
            {post.authorType === 'organization' ? (
              <MaterialCommunityIcons name="domain" size={20} color={colors.surface} />
            ) : (
              <Text style={styles.avatarText}>
                {post.authorDisplayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.authorRow}>
              <Text style={styles.authorName}>{post.authorDisplayName}</Text>
              {post.authorType === 'organization' && (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={14}
                  color={colors.primary}
                  style={{marginLeft: 4}}
                />
              )}
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.dateText}>{formatDate(post.createdAt)}</Text>
              {post.location && (
                <>
                  <Text style={styles.metaSeparator}>•</Text>
                  <MaterialCommunityIcons name="map-marker" size={12} color={colors.mutedText} />
                  <Text style={styles.locationText}>
                    {post.location.city || post.location.country}
                  </Text>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
        {!isOwnPost && currentUserId && (
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
      </View>

      {/* Media carousel */}
      {allMedia.length > 0 && (
        <View>
          <FlatList
            data={allMedia}
            keyExtractor={item => item.id}
            renderItem={renderMediaItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMediaScroll}
            snapToInterval={SCREEN_WIDTH}
            decelerationRate="fast"
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />
          {allMedia.length > 1 && (
            <View style={styles.pagination}>
              {allMedia.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.dot, activeMediaIndex === idx && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Content - tappable to open detail */}
      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.7}
        onPress={() => onPress?.(post.id)}>
        {/* Description */}
        <Text style={styles.description}>{post.description}</Text>

        {/* Theme chips */}
        {post.themes.length > 0 && (
          <View style={styles.themesRow}>
            {post.themes.map(themeId => {
              const theme = getThemeById(themeId);
              if (!theme) return null;
              return (
                <View
                  key={themeId}
                  style={[styles.themeChip, {backgroundColor: theme.color + '15'}]}>
                  <MaterialCommunityIcons
                    name={theme.icon as any}
                    size={12}
                    color={theme.color}
                  />
                  <Text style={[styles.themeChipText, {color: theme.color}]}>
                    {theme.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export const PostCard = memo(PostCardComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    ...typography.body,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    ...typography.caption,
    color: colors.mutedText,
  },
  metaSeparator: {
    marginHorizontal: spacing.xs,
    color: colors.mutedText,
  },
  locationText: {
    ...typography.caption,
    color: colors.mutedText,
    marginLeft: 2,
  },
  followBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
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

  // Media
  mediaImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    backgroundColor: colors.border,
  },
  videoPauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPauseIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
  videoMuteBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  videoDurationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    height: SCREEN_WIDTH * 0.75,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  pdfIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pdfName: {
    ...typography.body,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  pdfHint: {
    ...typography.caption,
    color: colors.mutedText,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
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
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
    color: colors.text,
  },
  themesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  themeChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
