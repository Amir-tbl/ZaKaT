import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {useAuth} from '../providers';
import {profileService} from '../services/profile';
import {requestService, ZakatRequest} from '../services/request';
import {doc, getDoc, updateDoc} from 'firebase/firestore';
import {db} from '../lib/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

interface Props {
  navigation: any;
}

export function WithdrawScreen({navigation}: Props) {
  const {user: authUser} = useAuth();

  const [requests, setRequests] = useState<ZakatRequest[]>([]);
  const [totalCollectedCents, setTotalCollectedCents] = useState(0);
  const [withdrawnCents, setWithdrawnCents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeAccountReady, setStripeAccountReady] = useState(false);
  const [stripePending, setStripePending] = useState(false);

  const availableCents = totalCollectedCents - withdrawnCents;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load user's requests
      const profile = await profileService.getProfile();
      if (!profile) return;

      const userRequests = await requestService.getByUserId(profile.id);
      setRequests(userRequests);

      // Calculate total collected across all requests
      const total = userRequests.reduce(
        (sum, req) => sum + (req.receivedAmountCents || 0),
        0,
      );
      setTotalCollectedCents(total);

      // Load withdrawal data from Firestore
      const withdrawalRef = doc(db, 'withdrawals', profile.id);
      const withdrawalDoc = await getDoc(withdrawalRef);
      let savedAccountId: string | null = null;
      if (withdrawalDoc.exists()) {
        const data = withdrawalDoc.data();
        setWithdrawnCents(data.totalWithdrawnCents || 0);
        savedAccountId = data.stripeConnectedAccountId || null;
        setStripeAccountId(savedAccountId);
      }

      // Check Stripe account status if we have one
      if (savedAccountId) {
        await checkStripeAccount(savedAccountId);
      }
    } catch (error) {
      console.warn('Erreur chargement données retrait:', error);
    } finally {
      setLoading(false);
    }
  }, [authUser?.email]);

  // Reload data when screen gets focus (coming back from browser)
  useFocusEffect(
    useCallback(() => {
      loadData();

      // Also reload when app comes back to foreground (from Stripe browser)
      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          loadData();
        }
      });

      return () => subscription.remove();
    }, [loadData])
  );

  async function checkStripeAccount(accountId: string) {
    try {
      const response = await fetch(`${API_URL}/api/check-account-status`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({connectedAccountId: accountId}),
      });

      if (response.ok) {
        const data = await response.json();
        setStripeAccountReady(data.isActive);
        // Onboarding done but capability not yet active
        setStripePending(data.detailsSubmitted && !data.isActive);
      }
    } catch (error) {
      console.warn('Erreur vérification compte Stripe:', error);
    }
  }

  async function handleSetupStripeAccount() {
    try {
      setWithdrawing(true);
      const profile = await profileService.getProfile();
      if (!profile) {
        Alert.alert('Erreur', 'Profil non trouvé');
        return;
      }

      let accountId = stripeAccountId;

      if (!accountId) {
        // Create new connected account
        const response = await fetch(`${API_URL}/api/create-connected-account`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            email: profile.email,
            userId: profile.id,
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || 'Erreur serveur');
        }

        const data = await response.json();
        accountId = data.accountId;
        setStripeAccountId(accountId);

        // Save account ID to Firestore
        const {setDoc} = await import('firebase/firestore');
        const withdrawalRef = doc(db, 'withdrawals', profile.id);
        await setDoc(withdrawalRef, {
          stripeConnectedAccountId: accountId,
          totalWithdrawnCents: 0,
          createdAt: new Date(),
        }, {merge: true});

        // Open onboarding URL
        if (data.accountLinkUrl) {
          await Linking.openURL(data.accountLinkUrl);
        }
      } else {
        // Re-open onboarding for existing account
        const response = await fetch(`${API_URL}/api/create-account-link`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({connectedAccountId: accountId}),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.accountLinkUrl) {
            await Linking.openURL(data.accountLinkUrl);
          }
        }
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Une erreur est survenue');
    } finally {
      setWithdrawing(false);
    }
  }

  async function handleWithdraw() {
    if (availableCents <= 0) {
      Alert.alert('Aucun fonds', 'Vous n\'avez pas de fonds disponibles à retirer.');
      return;
    }

    if (!stripeAccountId || !stripeAccountReady) {
      Alert.alert(
        'Compte non configuré',
        'Veuillez d\'abord configurer votre compte bancaire via Stripe.',
      );
      return;
    }

    Alert.alert(
      'Confirmer le retrait',
      `Voulez-vous retirer ${formatAmount(availableCents / 100)} sur votre compte bancaire ?`,
      [
        {text: 'Annuler', style: 'cancel'},
        {text: 'Confirmer', onPress: executeWithdraw},
      ],
    );
  }

  async function executeWithdraw() {
    try {
      setWithdrawing(true);
      const profile = await profileService.getProfile();
      if (!profile) return;

      const response = await fetch(`${API_URL}/api/create-payout`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          amountCents: availableCents,
          connectedAccountId: stripeAccountId,
          userId: profile.id,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        if (errBody.needsOnboarding) {
          Alert.alert(
            'Vérification requise',
            'Votre compte Stripe nécessite une vérification supplémentaire.',
            [{text: 'Configurer', onPress: handleSetupStripeAccount}],
          );
          return;
        }
        throw new Error(errBody.error || 'Erreur serveur');
      }

      // Update withdrawn amount in Firestore
      const withdrawalRef = doc(db, 'withdrawals', profile.id);
      await updateDoc(withdrawalRef, {
        totalWithdrawnCents: withdrawnCents + availableCents,
        lastWithdrawalAt: new Date(),
      });

      setWithdrawnCents(prev => prev + availableCents);

      Alert.alert(
        'Retrait effectué',
        `${formatAmount(availableCents / 100)} ont été transférés sur votre compte bancaire. Le virement peut prendre 2 à 5 jours ouvrables.`,
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Une erreur est survenue lors du retrait');
    } finally {
      setWithdrawing(false);
    }
  }

  function formatAmount(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={typography.h3}>Retirer mes gains</Text>
          <View style={{width: 40}} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
        <Text style={typography.h3}>Retirer mes gains</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Total collected card */}
        <View style={styles.totalCard}>
          <View style={styles.totalIconContainer}>
            <MaterialCommunityIcons name="wallet" size={48} color={colors.primary} />
          </View>
          <Text style={styles.totalLabel}>Récolte totale</Text>
          <Text style={styles.totalAmount}>{formatAmount(totalCollectedCents / 100)}</Text>

          <View style={styles.totalBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Déjà retiré</Text>
              <Text style={styles.breakdownValue}>{formatAmount(withdrawnCents / 100)}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, {fontWeight: '600'}]}>Disponible</Text>
              <Text style={[styles.breakdownValue, {color: colors.primary, fontWeight: '700'}]}>
                {formatAmount(availableCents / 100)}
              </Text>
            </View>
          </View>
        </View>

        {/* Requests breakdown */}
        {requests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Détail par demande</Text>
            {requests.map(request => (
              <View key={request.id} style={styles.requestRow}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestTitle} numberOfLines={1}>
                    {request.title}
                  </Text>
                  <Text style={styles.requestMeta}>
                    {request.donorCount} donateur{request.donorCount > 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.requestAmount}>
                  {formatAmount((request.receivedAmountCents || 0) / 100)}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Stripe account setup */}
        {!stripeAccountId ? (
          /* Case 1: No account at all */
          <View style={styles.setupCard}>
            <MaterialCommunityIcons name="bank" size={32} color={colors.warning} />
            <Text style={styles.setupTitle}>Configurer votre compte bancaire</Text>
            <Text style={styles.setupText}>
              Pour recevoir vos fonds, vous devez d'abord configurer votre compte bancaire
              via Stripe. Cette étape est sécurisée et ne prend que quelques minutes.
            </Text>
            <TouchableOpacity
              style={styles.setupBtn}
              onPress={handleSetupStripeAccount}
              disabled={withdrawing}>
              {withdrawing ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <MaterialCommunityIcons name="bank-plus" size={20} color={colors.surface} />
                  <Text style={styles.setupBtnText}>Configurer mon compte</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : stripePending ? (
          /* Case 2: Account created, onboarding done, but transfers capability not yet active */
          <View style={styles.pendingCard}>
            <MaterialCommunityIcons name="clock-outline" size={32} color={colors.accent} />
            <Text style={styles.setupTitle}>Vérification en cours</Text>
            <Text style={styles.setupText}>
              Votre compte a été configuré. Stripe est en train de vérifier vos informations.
              Cette étape peut prendre quelques minutes. Actualisez la page pour vérifier.
            </Text>
            <TouchableOpacity
              style={[styles.setupBtn, {backgroundColor: colors.accent}]}
              onPress={loadData}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <MaterialCommunityIcons name="refresh" size={20} color={colors.surface} />
                  <Text style={styles.setupBtnText}>Actualiser</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.setupBtn, {backgroundColor: colors.warning, marginTop: spacing.sm}]}
              onPress={handleSetupStripeAccount}
              disabled={withdrawing}>
              {withdrawing ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <MaterialCommunityIcons name="bank-plus" size={20} color={colors.surface} />
                  <Text style={styles.setupBtnText}>Compléter la vérification</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : !stripeAccountReady ? (
          /* Case 3: Account exists but onboarding not completed */
          <View style={styles.setupCard}>
            <MaterialCommunityIcons name="bank" size={32} color={colors.warning} />
            <Text style={styles.setupTitle}>Compléter la configuration</Text>
            <Text style={styles.setupText}>
              Votre compte bancaire n'est pas encore complètement configuré.
              Veuillez compléter toutes les étapes de vérification.
            </Text>
            <TouchableOpacity
              style={styles.setupBtn}
              onPress={handleSetupStripeAccount}
              disabled={withdrawing}>
              {withdrawing ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <MaterialCommunityIcons name="bank-plus" size={20} color={colors.surface} />
                  <Text style={styles.setupBtnText}>Compléter la vérification</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Account ready indicator */}
            <View style={styles.accountReady}>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
              <Text style={styles.accountReadyText}>Compte bancaire configuré</Text>
            </View>

            {/* Withdraw button */}
            <TouchableOpacity
              style={[
                styles.withdrawBtn,
                (availableCents <= 0 || withdrawing) && styles.withdrawBtnDisabled,
              ]}
              onPress={handleWithdraw}
              disabled={availableCents <= 0 || withdrawing}>
              {withdrawing ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <MaterialCommunityIcons name="bank-transfer-out" size={22} color={colors.surface} />
                  <Text style={styles.withdrawBtnText}>
                    Retirer {formatAmount(availableCents / 100)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Info notice */}
        <View style={styles.notice}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.mutedText} />
          <Text style={styles.noticeText}>
            Les virements sont traités par Stripe et peuvent prendre 2 à 5 jours ouvrables.
          </Text>
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Total card
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  totalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  totalBreakdown: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  breakdownLabel: {
    ...typography.body,
    color: colors.mutedText,
  },
  breakdownValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // Section
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },

  // Request rows
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  requestInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  requestTitle: {
    ...typography.body,
    fontWeight: '500',
  },
  requestMeta: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
  requestAmount: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },

  // Setup card
  setupCard: {
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  pendingCard: {
    backgroundColor: colors.accent + '08',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '25',
  },
  setupTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  setupText: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  setupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    width: '100%',
  },
  setupBtnText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },

  // Account ready
  accountReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  accountReadyText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '500',
  },

  // Withdraw button
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  withdrawBtnDisabled: {
    opacity: 0.5,
  },
  withdrawBtnText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },

  // Notice
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
  },
  noticeText: {
    ...typography.caption,
    color: colors.mutedText,
    flex: 1,
    lineHeight: 18,
  },
});
