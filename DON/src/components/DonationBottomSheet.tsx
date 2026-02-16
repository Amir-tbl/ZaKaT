import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {PrimaryButton} from './PrimaryButton';
import {MoneyInput} from './MoneyInput';
import {Applicant} from '../domain/models';
import {eurosToCents} from '../utils';
import {colors, spacing, typography, borderRadius} from '../theme';

type SheetMode = 'treasury' | 'distribute';

interface DonationBottomSheetProps {
  visible: boolean;
  applicant: Applicant | null;
  onClose: () => void;
  onConfirm: (amountCents: number, applicantId: number | null) => Promise<void>;
  mode: SheetMode;
}

const QUICK_AMOUNTS = [1, 5, 10, 20];

export function DonationBottomSheet({
  visible,
  applicant,
  onClose,
  onConfirm,
  mode,
}: DonationBottomSheetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const isTreasury = mode === 'treasury';

  const handleQuickAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const getFinalAmount = (): number => {
    if (selectedAmount !== null) {
      return selectedAmount;
    }
    const parsed = parseInt(customAmount, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleConfirm = async () => {
    const amount = getFinalAmount();
    if (amount < 1) {
      Alert.alert('Montant invalide', 'Le montant minimum est de 1 EUR.');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(eurosToCents(amount), applicant?.id ?? null);
      handleClose();
      if (isTreasury) {
        Alert.alert('Merci !', `Votre don de ${amount} EUR a ete ajoute au tresor.`);
      } else {
        Alert.alert(
          'Distribution effectuee',
          `${amount} EUR ont ete attribues a ${applicant?.fullName}.`,
        );
      }
    } catch {
      // Error already handled by caller
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    onClose();
  };

  const finalAmount = getFinalAmount();
  const isValid = finalAmount >= 1;

  const handleOverlayPress = () => {
    Keyboard.dismiss();
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.sheet, {paddingBottom: Math.max(spacing.xxl + 10, insets.bottom + spacing.xl)}]}>
                <View style={styles.handle} />

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}>
                  <View style={styles.header}>
                    <View
                      style={[
                        styles.iconContainer,
                        !isTreasury && styles.iconDistribute,
                      ]}>
                      <MaterialCommunityIcons
                        name={isTreasury ? 'treasure-chest' : 'hand-heart'}
                        size={28}
                        color={isTreasury ? colors.primary : colors.accent}
                      />
                    </View>
                    <Text style={styles.title}>
                      {isTreasury ? 'Donner au tresor' : 'Attribuer des fonds'}
                    </Text>
                    {applicant && (
                      <Text style={styles.subtitle}>pour {applicant.fullName}</Text>
                    )}
                  </View>

                  <Text style={styles.sectionLabel}>Montant rapide</Text>
                  <View style={styles.quickAmounts}>
                    {QUICK_AMOUNTS.map(amount => (
                      <TouchableOpacity
                        key={amount}
                        style={[
                          styles.quickButton,
                          selectedAmount === amount && styles.quickButtonSelected,
                        ]}
                        onPress={() => handleQuickAmount(amount)}>
                        <Text
                          style={[
                            styles.quickButtonText,
                            selectedAmount === amount &&
                              styles.quickButtonTextSelected,
                          ]}>
                          {amount} EUR
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Ou montant libre</Text>
                  <MoneyInput
                    value={customAmount}
                    onChangeText={handleCustomAmountChange}
                    placeholder="Entrez un montant"
                  />

                  <PrimaryButton
                    title={
                      isValid
                        ? isTreasury
                          ? `Donner ${finalAmount} EUR`
                          : `Attribuer ${finalAmount} EUR`
                        : 'Choisir un montant'
                    }
                    onPress={handleConfirm}
                    disabled={!isValid}
                    loading={isLoading}
                    size="large"
                    variant={isTreasury ? 'primary' : 'secondary'}
                    style={styles.confirmButton}
                  />
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconDistribute: {
    backgroundColor: colors.accent + '15',
  },
  title: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.mutedText,
    marginBottom: spacing.sm,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  quickButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  quickButtonTextSelected: {
    color: colors.surface,
  },
  confirmButton: {
    marginTop: spacing.lg,
  },
});
