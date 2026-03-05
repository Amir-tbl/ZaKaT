import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {httpsCallable} from 'firebase/functions';
import {functions} from '../lib/firebase';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import type {AuthStackParamList} from '../navigation/AuthNavigator';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'VerifyCode'>;
type RouteType = RouteProp<AuthStackParamList, 'VerifyCode'>;

const CODE_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

export function VerifyCodeScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const {email} = route.params;
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [codeExpired, setCodeExpired] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCodeExpired(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatCountdown = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(null);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
    }
  };

  const handleVerify = async () => {
    if (codeExpired) {
      setError('Le code a expiré. Veuillez en demander un nouveau.');
      return;
    }

    const code = digits.join('');
    if (code.length !== CODE_LENGTH) {
      setError('Veuillez entrer le code complet');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const verify = httpsCallable(functions, 'verifyPasswordResetCode');
      await verify({email, code});
      navigation.navigate('ResetPassword', {email, code});
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('expire')) {
        setError('Le code a expiré. Veuillez en demander un nouveau.');
        setCodeExpired(true);
      } else {
        setError('Code invalide. Veuillez vérifier et réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setIsResending(true);
    try {
      const sendCode = httpsCallable(functions, 'sendPasswordResetCode');
      await sendCode({email});
      // Reset state
      setDigits(Array(CODE_LENGTH).fill(''));
      setCountdown(COUNTDOWN_SECONDS);
      setCodeExpired(false);
      inputRefs.current[0]?.focus();
    } catch {
      setError('Erreur lors du renvoi. Veuillez réessayer.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="email-check-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Vérification</Text>
            <Text style={styles.subtitle}>
              Un code à 6 chiffres a été envoyé à{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          {/* Countdown */}
          <View style={styles.countdownContainer}>
            {!codeExpired ? (
              <View style={styles.countdownRow}>
                <MaterialCommunityIcons name="timer-outline" size={18} color={colors.primary} />
                <Text style={styles.countdownText}>
                  Code valide pendant {formatCountdown(countdown)}
                </Text>
              </View>
            ) : (
              <View style={styles.countdownRow}>
                <MaterialCommunityIcons name="timer-off-outline" size={18} color={colors.error} />
                <Text style={styles.countdownExpired}>Code expiré</Text>
              </View>
            )}
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.codeContainer}>
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null,
                  codeExpired ? styles.codeInputExpired : null,
                ]}
                value={digit}
                onChangeText={(text) => handleDigitChange(text, index)}
                onKeyPress={({nativeEvent}) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!codeExpired}
                autoFocus={index === 0}
              />
            ))}
          </View>

          {!codeExpired && (
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Vérifier</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Resend code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendLabel}>Vous n'avez pas reçu le code ?</Text>
            {codeExpired || countdown <= 0 ? (
              <TouchableOpacity onPress={handleResendCode} disabled={isResending}>
                {isResending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.resendLink}>Renvoyer le code</Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendWait}>
                Renvoyer dans {formatCountdown(countdown)}
              </Text>
            )}
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
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: colors.text,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  countdownExpired: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '15',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: spacing.xl,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  codeInputExpired: {
    opacity: 0.4,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  resendLabel: {
    fontSize: 14,
    color: colors.mutedText,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  resendWait: {
    fontSize: 14,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
});
