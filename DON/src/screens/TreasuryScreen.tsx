import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useStripe} from '@stripe/stripe-react-native';
import {doc, getDoc, updateDoc, increment, setDoc} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {donationService} from '../services/donation';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

export function TreasuryScreen() {
  const {initPaymentSheet, presentPaymentSheet} = useStripe();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  function handleAmountChange(text: string) {
    setAmount(text.replace(/[^0-9]/g, ''));
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  }

  async function handleDonate() {
    const amountNum = parseInt(amount, 10);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    setLoading(true);
    try {
      const amountCents = amountNum * 100;

      const response = await fetch(`${API_URL}/api/payment-intent`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({amountCents}),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || 'Erreur serveur');
      }

      const {paymentIntentClientSecret, ephemeralKeySecret, customerId} =
        await response.json();

      const {error: initError} = await initPaymentSheet({
        paymentIntentClientSecret,
        customerEphemeralKeySecret: ephemeralKeySecret,
        customerId,
        merchantDisplayName: 'ZaKaT',
        defaultBillingDetails: {address: {country: 'FR'}},
      });

      if (initError) throw new Error(initError.message);

      const {error: paymentError} = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') return;
        throw new Error(paymentError.message);
      }

      const platformFeeCents = Math.round(amountCents * 0.02);
      const netAmountCents = amountCents - platformFeeCents;

      await donationService.createDonation({
        type: 'treasury',
        amountCents,
      });

      const treasuryRef = doc(db, 'treasury', 'global');
      const treasuryDoc = await getDoc(treasuryRef);

      if (treasuryDoc.exists()) {
        await updateDoc(treasuryRef, {
          totalAmountCents: increment(netAmountCents),
          donationCount: increment(1),
          lastDonationAt: new Date(),
        });
      } else {
        await setDoc(treasuryRef, {
          totalAmountCents: netAmountCents,
          donationCount: 1,
          lastDonationAt: new Date(),
          createdAt: new Date(),
        });
      }

      Alert.alert(
        'Don effectué !',
        `Votre don de ${formatCurrency(amountNum)} au trésor ZaKaT a bien été effectué.`,
      );
      setAmount('');
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
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Icon + Title */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="treasure-chest"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={styles.title}>Trésor ZaKaT</Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>
              Votre don général permet de financer des actions solidaires
              concrètes :
            </Text>
            <View style={styles.actionsList}>
              <ActionItem icon="medical-bag" text="Payer des frais médicaux pour les plus démunis" />
              <ActionItem icon="water" text="Installer des stands de distribution d'eau et de nourriture" />
              <ActionItem icon="blood-bag" text="Organiser des stands de don de sang" />
              <ActionItem icon="home-heart" text="Aider des familles en difficulté" />
              <ActionItem icon="school" text="Soutenir l'accès à l'éducation" />
            </View>
            <Text style={styles.descriptionFooter}>
              Les fonds sont redistribués aux causes les plus urgentes.
            </Text>
          </View>

          {/* Amount section */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Montant du don</Text>

            <View style={styles.quickAmounts}>
              {QUICK_AMOUNTS.map(val => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.quickBtn,
                    amountNum === val && styles.quickBtnActive,
                  ]}
                  onPress={() => setAmount(val.toString())}>
                  <Text
                    style={[
                      styles.quickBtnText,
                      amountNum === val && styles.quickBtnTextActive,
                    ]}>
                    {val} EUR
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="Autre montant"
                placeholderTextColor={colors.mutedText}
                keyboardType="number-pad"
                maxLength={7}
              />
              <Text style={styles.currency}>EUR</Text>
            </View>
          </View>

          {/* Donate button */}
          <TouchableOpacity
            style={[styles.donateBtn, (!amountNum || loading) && styles.donateBtnDisabled]}
            onPress={handleDonate}
            disabled={!amountNum || loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="heart" size={20} color="#fff" />
                <Text style={styles.donateBtnText}>
                  Donner{amountNum > 0 ? ` ${formatCurrency(amountNum)}` : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ActionItem({icon, text}: {icon: string; text: string}) {
  return (
    <View style={styles.actionItem}>
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={colors.primary}
      />
      <Text style={styles.actionText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary + '14',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    fontWeight: '700',
    color: colors.text,
  },
  descriptionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  descriptionText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  actionsList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionText: {
    ...typography.bodySmall,
    color: colors.mutedText,
    flex: 1,
    lineHeight: 20,
  },
  descriptionFooter: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  amountSection: {
    marginBottom: spacing.lg,
  },
  amountLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  quickBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
  },
  quickBtnTextActive: {
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  amountInput: {
    flex: 1,
    ...typography.h3,
    paddingVertical: 14,
    color: colors.text,
  },
  currency: {
    ...typography.body,
    fontWeight: '600',
    color: colors.mutedText,
  },
  donateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    gap: spacing.sm,
    ...shadows.md,
  },
  donateBtnDisabled: {
    opacity: 0.5,
  },
  donateBtnText: {
    ...typography.body,
    fontWeight: '700',
    color: '#fff',
    fontSize: 17,
  },
});
