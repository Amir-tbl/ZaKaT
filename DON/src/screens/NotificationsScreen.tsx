import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {EmptyState} from '../components';
import {Notification, notificationService} from '../services/notification';

const NOTIFICATION_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  NEW_POST_FROM_FOLLOWING: 'newspaper-variant-outline',
  NEW_FOLLOWER: 'account-plus',
  FUNDING_50: 'progress-check',
  FUNDING_100: 'trophy',
  NEW_DONATION: 'hand-heart',
  REQUEST_VERIFIED: 'check-circle',
  REQUEST_REJECTED: 'close-circle',
  ORG_VERIFIED: 'domain',
  ORG_REJECTED: 'domain',
  // Cloud Function notification types (lowercase)
  donation_received: 'cash-multiple',
  request_verified: 'check-circle',
  request_rejected: 'close-circle',
  post_verified: 'check-circle',
  post_rejected: 'close-circle',
  organization_verified: 'domain',
  organization_rejected: 'domain',
  new_follower: 'account-plus',
};

const NOTIFICATION_COLORS: Record<string, string> = {
  NEW_POST_FROM_FOLLOWING: colors.accent,
  NEW_FOLLOWER: colors.primary,
  FUNDING_50: colors.warning,
  FUNDING_100: colors.success,
  NEW_DONATION: colors.primary,
  REQUEST_VERIFIED: colors.success,
  REQUEST_REJECTED: colors.error,
  ORG_VERIFIED: colors.success,
  ORG_REJECTED: colors.error,
  // Cloud Function notification types (lowercase)
  donation_received: colors.success,
  request_verified: colors.success,
  request_rejected: colors.error,
  post_verified: colors.success,
  post_rejected: colors.error,
  organization_verified: colors.success,
  organization_rejected: colors.error,
  new_follower: colors.primary,
};

export function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    const data = await notificationService.listNotifications();
    setNotifications(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }

  async function handleMarkAllAsRead() {
    await notificationService.markAllAsRead();
    await loadNotifications();
  }

  async function handleNotificationPress(notification: Notification) {
    // Mark as read
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? {...n, read: true} : n)),
      );
    }

    // Navigate based on notification type and data
    const notifData = notification as any;

    // Handle action based on notification type
    if (notification.type === 'new_follower' && notifData.followerUid) {
      navigation.navigate('UserProfile', {userId: notifData.followerUid});
      return;
    }

    if (notification.type === 'donation_received') {
      if (notifData.targetType === 'request' && notifData.targetId) {
        navigation.navigate('RequestDetail', {requestId: notifData.targetId, from: 'notifications'});
      } else if (notifData.targetType === 'organization' && notifData.targetId) {
        navigation.navigate('OrganizationProfile', {organizationId: notifData.targetId});
      }
      return;
    }

    // Handle deepLink for other notifications
    if (notification.deepLink) {
      const [type, id] = notification.deepLink.split('/');
      if (type === 'profile' && id) {
        navigation.navigate('OrganizationProfile', {organizationId: id});
      } else if (type === 'request' && id) {
        navigation.navigate('RequestDetail', {requestId: id, from: 'notifications'});
      }
    }
  }

  function handleActionPress(notification: Notification) {
    const notifData = notification as any;

    if (notifData.actionType === 'view_profile' && notifData.followerUid) {
      navigation.navigate('UserProfile', {userId: notifData.followerUid});
    } else if (notifData.actionType === 'view_request' && notifData.targetId) {
      navigation.navigate('RequestDetail', {requestId: notifData.targetId, from: 'notifications'});
    } else if (notifData.actionType === 'view_organization' && notifData.targetId) {
      navigation.navigate('OrganizationProfile', {organizationId: notifData.targetId});
    }
  }

  function formatDate(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "A l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;

    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }

  function renderNotification({item}: {item: Notification}) {
    const iconName = NOTIFICATION_ICONS[item.type] || 'bell';
    const iconColor = NOTIFICATION_COLORS[item.type] || colors.primary;
    const notifData = item as any;
    const hasAction = notifData.actionLabel && notifData.actionType;

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}>
        <View style={[styles.iconContainer, {backgroundColor: iconColor + '15'}]}>
          <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, !item.read && styles.unreadText]}>
            {item.title}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={3}>
            {notifData.message || item.message}
          </Text>
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
            {hasAction && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleActionPress(item)}>
                <Text style={styles.actionButtonText}>{notifData.actionLabel}</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={typography.body}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllBtn}>
            <MaterialCommunityIcons name="check-all" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderNotification}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="bell-outline"
            title="Aucune notification"
            message="Vos notifications apparaitront ici"
          />
        }
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
  markAllBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBanner: {
    backgroundColor: colors.primary + '10',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  unreadBannerText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  emptyList: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  unreadCard: {
    backgroundColor: colors.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  notificationTitle: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 2,
  },
  unreadText: {
    fontWeight: '700',
  },
  notificationMessage: {
    ...typography.bodySmall,
    color: colors.mutedText,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    ...typography.caption,
    color: colors.mutedText,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.sm,
  },
  actionButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    marginTop: 4,
  },
});
