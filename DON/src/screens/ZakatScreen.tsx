import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography} from '../theme';

const ZAKAT_RATE = 0.025; // 2.5%

const EXAMPLES = [
  {amount: 10000, label: '10 000 EUR'},
  {amount: 50000, label: '50 000 EUR'},
];

function formatNumber(num: number): string {
  return num.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatInteger(num: number): string {
  return num.toLocaleString('fr-FR');
}

export function ZakatScreen() {
  const navigation = useNavigation();
  const [amountText, setAmountText] = useState('');
  const [splitMonthly, setSplitMonthly] = useState(false);

  const amount = useMemo(() => {
    const cleaned = amountText.replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
  }, [amountText]);

  const zakatAmount = useMemo(() => {
    return amount * ZAKAT_RATE;
  }, [amount]);

  const monthlyAmount = useMemo(() => {
    return zakatAmount / 12;
  }, [zakatAmount]);

  const handleAmountChange = (text: string) => {
    // Permettre uniquement les chiffres
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmountText(cleaned);
  };

  const handleExamplePress = (exampleAmount: number) => {
    setAmountText(exampleAmount.toString());
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calculateur Zakat</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="information" size={24} color={colors.primary} />
              <Text style={styles.infoTitle}>Comment ca marche ?</Text>
            </View>
            <Text style={styles.infoText}>
              Contribuez a hauteur de{' '}
              <Text style={styles.bold}>2,5% de vos revenus</Text> pour soutenir
              les projets et les personnes dans le besoin via l'application.
            </Text>
            <Text style={styles.infoText}>
              Cet outil vous aide a <Text style={styles.bold}>estimer votre contribution</Text> et
              a la repartir mensuellement si vous le souhaitez.
            </Text>
          </View>

          {/* Calculator */}
          <View style={styles.calculatorCard}>
            <Text style={styles.sectionTitle}>Calculer ma Zakat</Text>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Montant total (epargne/actifs)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={amountText}
                  onChangeText={handleAmountChange}
                  placeholder="0"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="numeric"
                />
                <Text style={styles.currency}>EUR</Text>
              </View>
            </View>

            {/* Examples */}
            <View style={styles.examplesRow}>
              <Text style={styles.examplesLabel}>Exemples :</Text>
              {EXAMPLES.map((example) => (
                <TouchableOpacity
                  key={example.amount}
                  style={styles.exampleButton}
                  onPress={() => handleExamplePress(example.amount)}>
                  <Text style={styles.exampleButtonText}>{example.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Monthly Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <MaterialCommunityIcons name="calendar-month" size={20} color={colors.mutedText} />
                <Text style={styles.toggleLabel}>Repartir par mois</Text>
              </View>
              <Switch
                value={splitMonthly}
                onValueChange={setSplitMonthly}
                trackColor={{false: colors.border, true: colors.primary + '60'}}
                thumbColor={splitMonthly ? colors.primary : colors.mutedText}
              />
            </View>
          </View>

          {/* Results */}
          {amount > 0 && (
            <View style={styles.resultsCard}>
              <Text style={styles.resultsTitle}>Resultat</Text>

              <View style={styles.resultRow}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultLabel}>Montant saisi</Text>
                  <Text style={styles.resultSubtext}>Base de calcul</Text>
                </View>
                <Text style={styles.resultValue}>{formatInteger(amount)} EUR</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.resultRow}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultLabel}>Zakat (2,5%)</Text>
                  <Text style={styles.resultSubtext}>Montant annuel</Text>
                </View>
                <Text style={[styles.resultValue, styles.primaryValue]}>
                  {formatNumber(zakatAmount)} EUR
                </Text>
              </View>

              {splitMonthly && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.resultRow}>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultLabel}>Par mois</Text>
                      <Text style={styles.resultSubtext}>Reparti sur 12 mois</Text>
                    </View>
                    <Text style={[styles.resultValue, styles.accentValue]}>
                      {formatNumber(monthlyAmount)} EUR
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Examples Results */}
          <View style={styles.examplesCard}>
            <Text style={styles.examplesTitle}>Exemples de calcul</Text>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleLabel}>10 000 EUR</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={colors.mutedText} />
              <Text style={styles.exampleResult}>250,00 EUR</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleLabel}>50 000 EUR</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={colors.mutedText} />
              <Text style={styles.exampleResult}>1 250,00 EUR</Text>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.mutedText} />
            <Text style={styles.disclaimerText}>
              Ce calcul est fourni a titre indicatif. Le montant et la frequence
              de votre contribution restent entierement a votre choix.
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  bold: {
    fontWeight: '700',
  },
  calculatorCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.mutedText,
  },
  examplesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  examplesLabel: {
    ...typography.caption,
    color: colors.mutedText,
    marginRight: spacing.sm,
  },
  exampleButton: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  exampleButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  resultsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  resultsTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
    color: colors.primary,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  resultInfo: {
    flex: 1,
  },
  resultLabel: {
    ...typography.body,
    fontWeight: '500',
  },
  resultSubtext: {
    ...typography.caption,
    color: colors.mutedText,
  },
  resultValue: {
    ...typography.h3,
    fontSize: 18,
  },
  primaryValue: {
    color: colors.primary,
  },
  accentValue: {
    color: colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  examplesCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  examplesTitle: {
    ...typography.label,
    color: colors.mutedText,
    marginBottom: spacing.md,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  exampleLabel: {
    ...typography.body,
    width: 100,
  },
  exampleResult: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.mutedText,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
});
