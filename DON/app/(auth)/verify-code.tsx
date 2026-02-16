import React, { useState, useRef } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../src/lib/firebase';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

const CODE_LENGTH = 6;

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleDigitChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(null);

    // Auto-focus next input
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
    const code = digits.join('');
    if (code.length !== CODE_LENGTH) {
      setError('Veuillez entrer le code complet');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const verify = httpsCallable(functions, 'verifyPasswordResetCode');
      await verify({ email, code });
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email, code },
      });
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('expire')) {
        setError('Le code a expire. Veuillez en demander un nouveau.');
      } else {
        setError('Code invalide. Veuillez verifier et reessayer.');
      }
    } finally {
      setIsLoading(false);
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

          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="email-check-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Verification</Text>
            <Text style={styles.subtitle}>
              Un code a 6 chiffres a ete envoye a{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Code inputs */}
          <View style={styles.codeContainer}>
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null,
                ]}
                value={digit}
                onChangeText={(text) => handleDigitChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>Verifier</Text>
            )}
          </TouchableOpacity>
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
    marginBottom: spacing.xl,
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
});
