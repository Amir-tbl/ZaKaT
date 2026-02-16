import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {Badge, EmptyState} from '../components';
import {ZakatRequest} from '../services/request';
import {requestService} from '../services/request';
import {getThemeById} from '../services/themes';

interface Props {
  navigation: any;
}

const STATUS_BADGE: Record<string, {text: string; variant: 'info' | 'success' | 'warning' | 'error'}> = {
  pending: {text: 'En attente', variant: 'warning'},
  verified: {text: 'Verifiee', variant: 'success'},
  rejected: {text: 'Refusee', variant: 'error'},
  closed: {text: 'Fermee', variant: 'info'},
};

export function RequestListScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<ZakatRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    const data = await requestService.getAll();
    setRequests(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
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

  function renderCard({item}: {item: ZakatRequest}) {
    const badge = STATUS_BADGE[item.status] || STATUS_BADGE.pending;
    const photoCount = item.files.filter(f => f.type === 'photo').length;
    const primaryTheme = item.primaryTheme || (item.themes.length > 0 ? item.themes[0] : null);
    const themeInfo = primaryTheme ? getThemeById(primaryTheme) : null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('RequestDetail', {requestId: item.id, from: 'requests'})}>
        <View style={styles.cardTop}>
          <View style={[styles.cardCategory, themeInfo && {backgroundColor: themeInfo.color + '15'}]}>
            {themeInfo && (
              <MaterialCommunityIcons name={themeInfo.icon as any} size={12} color={themeInfo.color} />
            )}
            <Text style={[styles.categoryLabel, themeInfo && {color: themeInfo.color}]}>
              {themeInfo?.label || 'Non classe'}
            </Text>
          </View>
          <Badge text={badge.text} variant={badge.variant} />
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={typography.caption} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardBottom}>
          <View style={styles.cardInfo}>
            <MaterialCommunityIcons
              name="map-marker"
              size={14}
              color={colors.mutedText}
            />
            <Text style={typography.caption}>
              {item.city}, {item.country}
            </Text>
          </View>
          <Text style={styles.cardAmount}>{formatAmount(item.goalAmount)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={typography.caption} numberOfLines={1}>
            Par {item.authorDisplayName} pour {item.beneficiary.firstName} {item.beneficiary.lastName} - {formatDate(item.createdAt)}
          </Text>
          {photoCount > 0 && (
            <View style={styles.photoCount}>
              <MaterialCommunityIcons name="image" size={14} color={colors.mutedText} />
              <Text style={typography.caption}>{photoCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={typography.h2}>Demandes</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateMenu')}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        contentContainerStyle={[
          styles.list,
          requests.length === 0 && styles.emptyList,
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
            icon="file-document-outline"
            title="Aucune demande"
            message="Creez votre premiere demande d'aide en appuyant sur le bouton +"
          />
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardAmount: {
    ...typography.h3,
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  photoCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
