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
import {Donation, donationService} from '../services/donation';

const DONATION_TYPE_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  treasury: 'treasure-chest',
  request: 'hand-heart',
  organization: 'domain',
};

const DONATION_TYPE_COLORS: Record<string, string> = {
  treasury: colors.primary,
  request: colors.success,
  organization: colors.accent,
};

const DONATION_TYPE_LABELS: Record<string, string> = {
  treasury: 'Tresor ZaKaT',
  request: 'Demande',
  organization: 'Association',
};

export function DonationHistoryScreen() {
  const navigation = useNavigation<any>();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalDonated, setTotalDonated] = useState(0);

  const loadDonations = useCallback(async () => {
    const data = await donationService.getMyDonations();
    setDonations(data);

    // Calculate total donated
    const total = data.reduce((sum, d) => sum + d.amountCents, 0);
    setTotalDonated(total);

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDonations();
    }, [loadDonations]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadDonations();
    setRefreshing(false);
  }

  function formatAmount(amountCents: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amountCents / 100);
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function handleDonationPress(donation: Donation) {
    if (donation.type === 'request' && donation.requestId) {
      navigation.navigate('Requests', {
        screen: 'RequestDetail',
        params: {requestId: donation.requestId, from: 'history'},
      });
    } else if (donation.type === 'organization' && donation.organizationId) {
      navigation.navigate('Requests', {
        screen: 'OrganizationProfile',
        params: {organizationId: donation.organizationId},
      });
    }
  }

  function renderDonation({item}: {item: Donation}) {
    const iconName = DONATION_TYPE_ICONS[item.type] || 'hand-heart';
    const iconColor = DONATION_TYPE_COLORS[item.type] || colors.primary;
    const typeLabel = DONATION_TYPE_LABELS[item.type] || 'Don';

    return (
      <TouchableOpacity
        style={styles.donationCard}
        activeOpacity={0.7}
        onPress={() => handleDonationPress(item)}>
        <View style={[styles.iconContainer, {backgroundColor: iconColor + '15'}]}>
          <MaterialCommunityIcons name={iconName} size={28} color={iconColor} />
        </View>

        <View style={styles.donationContent}>
          <View style={styles.donationHeader}>
            <Text style={styles.donationType}>{typeLabel}</Text>
            <Text style={[styles.donationAmount, {color: iconColor}]}>
              {formatAmount(item.amountCents)}
            </Text>
          </View>

          {item.message && (
            <Text style={styles.donationMessage} numberOfLines={2}>
              "{item.message}"
            </Text>
          )}

          <View style={styles.donationFooter}>
            <Text style={styles.donationDate}>
              {formatDate(item.createdAt)} a {formatTime(item.createdAt)}
            </Text>
            {(item.type === 'request' || item.type === 'organization') && (
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.mutedText} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes dons</Text>
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
        <Text style={styles.headerTitle}>Mes dons</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats Banner */}
      {donations.length > 0 && (
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatAmount(totalDonated)}</Text>
            <Text style={styles.statLabel}>Total donne</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{donations.length}</Text>
            <Text style={styles.statLabel}>Don{donations.length > 1 ? 's' : ''}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={donations}
        keyExtractor={item => item.id}
        renderItem={renderDonation}
        contentContainerStyle={[
          styles.listContent,
          donations.length === 0 && styles.emptyList,
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
            icon="hand-heart-outline"
            title="Aucun don"
            message="Vous n'avez pas encore fait de don. Soutenez une cause qui vous tient a coeur !"
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
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.primary + '30',
    marginHorizontal: spacing.lg,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyList: {
    flex: 1,
  },
  donationCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  donationType: {
    ...typography.body,
    fontWeight: '600',
  },
  donationAmount: {
    ...typography.h3,
    fontWeight: '700',
  },
  donationMessage: {
    ...typography.bodySmall,
    color: colors.mutedText,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  donationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donationDate: {
    ...typography.caption,
    color: colors.mutedText,
  },
});
