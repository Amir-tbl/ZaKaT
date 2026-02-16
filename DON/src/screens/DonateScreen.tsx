import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useStripe} from '@stripe/stripe-react-native';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {donationService} from '../services/donation';
import {requestService, ZakatRequest} from '../services/request';
import {organizationService, Organization} from '../services/organization';
import {doc, updateDoc, increment, setDoc, getDoc} from 'firebase/firestore';
import {db} from '../lib/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];
const MAX_AMOUNT = 1000000; // 1 million EUR max

interface Props {
  route: any;
  navigation: any;
}

export function DonateScreen({route, navigation}: Props) {
  const {type, requestId, organizationId, organizationName} = route.params || {};
  const isTreasury = type === 'treasury';
  const isOrganization = type === 'organization';
  const isRequest = type === 'request';

  const {initPaymentSheet, presentPaymentSheet} = useStripe();

  const [request, setRequest] = useState<ZakatRequest | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isRequest || isOrganization);

  useEffect(() => {
    if (isRequest && requestId) {
      loadRequest();
    } else if (isOrganization && organizationId) {
      loadOrganization();
    }
  }, [requestId, organizationId, isRequest, isOrganization]);

  async function loadRequest() {
    setLoadingData(true);
    const data = await requestService.getById(requestId);
    setRequest(data);
    setLoadingData(false);
  }

  async function loadOrganization() {
    setLoadingData(true);
    const data = await organizationService.getById(organizationId);
    setOrganization(data);
    setLoadingData(false);
  }

  function formatAmount(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  }

  function handleQuickAmount(value: number) {
    setAmount(value.toString());
  }

  function handleAmountChange(text: string) {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmount(cleaned);
  }

  async function handleConfirm() {
    const amountNum = parseInt(amount, 10);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (amountNum > MAX_AMOUNT) {
      Alert.alert('Erreur', `Le montant maximum est de ${formatAmount(MAX_AMOUNT)}`);
      return;
    }

    setLoading(true);
    try {
      const amountCents = amountNum * 100;

      // 1. Ask backend to create a PaymentIntent
      const response = await fetch(`${API_URL}/api/payment-intent`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({amountCents}),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || 'Erreur serveur');
      }

      const {paymentIntentClientSecret, ephemeralKeySecret, customerId} = await response.json();

      // 2. Initialize PaymentSheet
      const {error: initError} = await initPaymentSheet({
        paymentIntentClientSecret,
        customerEphemeralKeySecret: ephemeralKeySecret,
        customerId,
        merchantDisplayName: 'ZaKaT',
        defaultBillingDetails: {address: {country: 'FR'}},
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // 3. Present PaymentSheet to user
      const {error: paymentError} = await presentPaymentSheet();

      if (paymentError) {
        // User cancelled or card declined — do NOT record anything
        if (paymentError.code === 'Canceled') {
          return; // User cancelled, nothing to do
        }
        throw new Error(paymentError.message);
      }

      // 4. Payment succeeded — record donation in Firebase
      await donationService.createDonation({
        type: isTreasury ? 'treasury' : isOrganization ? 'organization' : 'request',
        requestId: isRequest ? requestId : undefined,
        organizationId: isOrganization ? organizationId : undefined,
        amountCents,
        message: message.trim() || undefined,
      });

      // 5. Update target based on type
      if (isTreasury) {
        const treasuryRef = doc(db, 'treasury', 'global');
        const treasuryDoc = await getDoc(treasuryRef);

        if (treasuryDoc.exists()) {
          await updateDoc(treasuryRef, {
            totalAmountCents: increment(amountCents),
            donationCount: increment(1),
            lastDonationAt: new Date(),
          });
        } else {
          await setDoc(treasuryRef, {
            totalAmountCents: amountCents,
            donationCount: 1,
            lastDonationAt: new Date(),
            createdAt: new Date(),
          });
        }
      } else if (isRequest && requestId) {
        await requestService.addDonation(requestId, amountCents);
      } else if (isOrganization && organizationId) {
        await organizationService.addDonation(organizationId, amountCents);
      }

      let successMessage = '';
      if (isTreasury) {
        successMessage = `Merci ! Votre don de ${formatAmount(amountNum)} au tresor a bien ete enregistre.`;
      } else if (isOrganization) {
        successMessage = `Merci ! Votre don de ${formatAmount(amountNum)} a ${organizationName || organization?.name || 'l\'association'} a bien ete enregistre.`;
      } else {
        successMessage = `Merci ! Votre don de ${formatAmount(amountNum)} a bien ete enregistre.`;
      }

      Alert.alert('Merci !', successMessage, [{text: 'OK', onPress: () => navigation.goBack()}]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  const amountNum = parseInt(amount, 10) || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={typography.h3}>
            {isTreasury ? 'Don general' : isOrganization ? 'Soutenir l\'association' : 'Faire un don'}
          </Text>
          <View style={{width: 40}} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Treasury info */}
          {isTreasury && (
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <MaterialCommunityIcons name="treasure-chest" size={48} color={colors.primary} />
              </View>
              <Text style={styles.infoTitle}>Tresor ZaKaT</Text>
              <Text style={styles.infoText}>
                Votre don au tresor permet d'aider plusieurs personnes et projets selon l'urgence.
                Les fonds sont redistribues equitablement aux demandes les plus pressantes.
              </Text>
            </View>
          )}

          {/* Organization info */}
          {isOrganization && loadingData && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {isOrganization && organization && (
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <MaterialCommunityIcons name="domain" size={48} color={colors.accent} />
              </View>
              <Text style={styles.infoTitle}>{organization.name}</Text>
              <Text style={styles.infoText}>{organization.description}</Text>
              {(organization.donorCount || 0) > 0 && (
                <View style={styles.orgStats}>
                  <View style={styles.orgStatItem}>
                    <Text style={styles.orgStatValue}>
                      {formatAmount((organization.walletBalanceCents || 0) / 100)}
                    </Text>
                    <Text style={styles.orgStatLabel}>collectes</Text>
                  </View>
                  <View style={styles.orgStatDivider} />
                  <View style={styles.orgStatItem}>
                    <Text style={styles.orgStatValue}>{organization.donorCount}</Text>
                    <Text style={styles.orgStatLabel}>donateur{(organization.donorCount || 0) > 1 ? 's' : ''}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Request info */}
          {isRequest && loadingData && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {isRequest && request && (
            <View style={styles.requestCard}>
              <Text style={styles.requestTitle}>{request.title}</Text>
              <View style={styles.requestMeta}>
                <MaterialCommunityIcons name="account" size={16} color={colors.mutedText} />
                <Text style={styles.requestMetaText}>
                  {request.beneficiary.firstName} {request.beneficiary.lastName}
                </Text>
              </View>
              <View style={styles.requestMeta}>
                <MaterialCommunityIcons name="map-marker" size={16} color={colors.mutedText} />
                <Text style={styles.requestMetaText}>
                  {request.city}, {request.country}
                </Text>
              </View>

              {/* Progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                  <Text style={typography.bodySmall}>Objectif</Text>
                  <Text style={styles.progressGoal}>{formatAmount(request.goalAmount)}</Text>
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
                <Text style={styles.progressText}>
                  {formatAmount((request.receivedAmountCents || 0) / 100)} collectes
                  {request.donorCount > 0 && ` - ${request.donorCount} donateur${request.donorCount > 1 ? 's' : ''}`}
                </Text>
              </View>
            </View>
          )}

          {/* Amount section */}
          <Text style={styles.sectionTitle}>Montant du don</Text>

          {/* Quick amounts */}
          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map(value => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickAmountBtn,
                  amountNum === value && styles.quickAmountBtnActive,
                ]}
                onPress={() => handleQuickAmount(value)}>
                <Text
                  style={[
                    styles.quickAmountText,
                    amountNum === value && styles.quickAmountTextActive,
                  ]}>
                  {value} EUR
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom amount input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Montant personnalise</Text>
            <View style={styles.amountInputWrapper}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={colors.mutedText}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                maxLength={7}
              />
              <Text style={styles.currencyLabel}>EUR</Text>
            </View>
          </View>

          {/* Message */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Message (optionnel)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Laissez un mot d'encouragement..."
              placeholderTextColor={colors.mutedText}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* Summary */}
          {amountNum > 0 && (
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Votre don</Text>
              <Text style={styles.summaryAmount}>{formatAmount(amountNum)}</Text>
            </View>
          )}

          {/* Confirm button */}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (!amount || amountNum <= 0 || loading) && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!amount || amountNum <= 0 || loading}>
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <MaterialCommunityIcons name="hand-heart" size={22} color={colors.surface} />
                <Text style={styles.confirmBtnText}>Confirmer mon don</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Stripe test notice */}
          <View style={styles.notice}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.mutedText} />
            <Text style={styles.noticeText}>
              Paiement securise par Stripe (mode test)
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },

  // Info card (treasury)
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  infoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
  },
  orgStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orgStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  orgStatValue: {
    ...typography.h3,
    color: colors.primary,
  },
  orgStatLabel: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
  orgStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  // Request card
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  requestTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  requestMetaText: {
    ...typography.bodySmall,
    color: colors.mutedText,
  },
  progressSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressGoal: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.mutedText,
  },

  // Section
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },

  // Quick amounts
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickAmountBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  quickAmountBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickAmountText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  quickAmountTextActive: {
    color: colors.surface,
  },

  // Input
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  amountInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  currencyLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.mutedText,
  },
  messageInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Summary
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },

  // Confirm button
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },

  // Notice
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  noticeText: {
    ...typography.caption,
    color: colors.mutedText,
  },
});
