import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {Video, ResizeMode, AVPlaybackStatus} from 'expo-av';
import {colors, spacing} from '../theme';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

interface MediaItem {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  duration?: number;
}

interface Props {
  route: {
    params: {
      media: MediaItem[];
      initialIndex?: number;
    };
  };
  navigation: any;
}

export function MediaViewerScreen({route, navigation}: Props) {
  const insets = useSafeAreaInsets();
  const {media, initialIndex = 0} = route.params;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const renderItem = ({item, index}: {item: MediaItem; index: number}) => {
    if (item.type === 'photo') {
      return <ImageViewer uri={item.uri} />;
    }
    return <VideoViewer uri={item.uri} isActive={currentIndex === index} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Media viewer */}
      <FlatList
        ref={flatListRef}
        data={media}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Header overlay */}
      <View style={[styles.header, {paddingTop: insets.top + spacing.sm}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        {media.length > 1 && (
          <Text style={styles.counter}>
            {currentIndex + 1} / {media.length}
          </Text>
        )}
        <View style={{width: 44}} />
      </View>

      {/* Pagination dots */}
      {media.length > 1 && (
        <View style={[styles.pagination, {paddingBottom: insets.bottom + spacing.md}]}>
          {media.map((_, idx) => (
            <View
              key={idx}
              style={[styles.dot, currentIndex === idx && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// Image viewer with zoom capability
function ImageViewer({uri}: {uri: string}) {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.mediaContainer}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      <Image
        source={{uri}}
        style={styles.fullImage}
        resizeMode="contain"
        onLoadEnd={() => setLoading(false)}
      />
    </View>
  );
}

// Video viewer with controls
function VideoViewer({uri, isActive}: {uri: string; isActive: boolean}) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  React.useEffect(() => {
    if (!isActive && videoRef.current) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, [isActive]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      if (status.durationMillis) {
        setDuration(status.durationMillis);
        setProgress(status.positionMillis / status.durationMillis);
      }
    }
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const toggleMute = async () => {
    if (videoRef.current) {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.mediaContainer}>
      <Video
        ref={videoRef}
        source={{uri}}
        style={styles.fullVideo}
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        useNativeControls={false}
      />

      {/* Play/Pause overlay */}
      <TouchableOpacity
        style={styles.videoOverlay}
        activeOpacity={1}
        onPress={togglePlayPause}>
        {!isPlaying && (
          <View style={styles.playButtonLarge}>
            <MaterialCommunityIcons name="play" size={60} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Bottom controls */}
      <View style={styles.videoControls}>
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, {width: `${progress * 100}%`}]} />
        </View>

        <View style={styles.controlsRow}>
          {/* Time */}
          <Text style={styles.timeText}>
            {formatTime(progress * duration)} / {formatTime(duration)}
          </Text>

          {/* Mute button */}
          <TouchableOpacity onPress={toggleMute} style={styles.controlBtn}>
            <MaterialCommunityIcons
              name={isMuted ? 'volume-off' : 'volume-high'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pagination: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  videoControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#fff',
    fontSize: 13,
  },
  controlBtn: {
    padding: spacing.sm,
  },
});
