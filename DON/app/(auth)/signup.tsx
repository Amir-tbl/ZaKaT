import React, { useState } from 'react';
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
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, AuthError } from '../../src/providers';
import { useGoogleAuth } from '../../src/hooks';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const { signInWithGoogle, isLoading: isGoogleLoading, error: googleError } = useGoogleAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    setError(null);

    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return;
    }

    if (!password) {
      setError('Veuillez entrer un mot de passe');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email.trim(), password);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    await signInWithGoogle();
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

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="account-plus" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Creer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez la communaute ZaKaT</Text>
          </View>

          {/* Error */}
          {(error || googleError) && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error || googleError}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.mutedText} />
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor={colors.mutedText}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.mutedText} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 caracteres"
                  placeholderTextColor={colors.mutedText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.mutedText}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color={colors.mutedText} />
                <TextInput
                  style={styles.input}
                  placeholder="Retapez le mot de passe"
                  placeholderTextColor={colors.mutedText}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>Creer mon compte</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <TouchableOpacity
            style={[styles.button, styles.googleButton, (isGoogleLoading || isLoading) && styles.buttonDisabled]}
            onPress={handleGoogleSignup}
            disabled={isGoogleLoading || isLoading}>
            {isGoogleLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={20} color={colors.text} />
                <Text style={styles.googleButtonText}>Continuer avec Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Deja un compte ?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Se connecter</Text>
              </TouchableOpacity>
            </Link>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedText,
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
  form: {
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.mutedText,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.mutedText,
    fontSize: 14,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});
