import React, {useState} from 'react';
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
import {useNavigation, useRoute, RouteProp, CommonActions} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {httpsCallable} from 'firebase/functions';
import {functions} from '../lib/firebase';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import type {AuthStackParamList} from '../navigation/AuthNavigator';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type RouteType = RouteProp<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const {email, code} = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setError(null);

    if (!newPassword) {
      setError('Veuillez entrer un nouveau mot de passe');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    try {
      const confirm = httpsCallable(functions, 'confirmPasswordReset');
      await confirm({email, code, newPassword});
      setSuccess(true);
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('expire')) {
        setError('Le code a expire. Veuillez recommencer.');
      } else {
        setError('Une erreur est survenue. Veuillez reessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Login'}],
      })
    );
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Mot de passe modifie !</Text>
          <Text style={styles.successSubtitle}>
            Votre mot de passe a ete reinitialise avec succes.
            Vous pouvez maintenant vous connecter.
          </Text>
          <TouchableOpacity style={styles.button} onPress={goToLogin}>
            <Text style={styles.buttonText}>Retour a la connexion</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
              <MaterialCommunityIcons name="lock-check" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Nouveau mot de passe</Text>
            <Text style={styles.subtitle}>
              Choisissez un nouveau mot de passe pour votre compte
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.mutedText} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 caracteres"
                  placeholderTextColor={colors.mutedText}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoFocus
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

            <View style={styles.rules}>
              <View style={styles.ruleRow}>
                <MaterialCommunityIcons
                  name={newPassword.length >= 6 ? 'check-circle' : 'circle-outline'}
                  size={16}
                  color={newPassword.length >= 6 ? colors.success : colors.mutedText}
                />
                <Text style={[
                  styles.ruleText,
                  newPassword.length >= 6 && styles.ruleTextValid,
                ]}>Au moins 6 caracteres</Text>
              </View>
              <View style={styles.ruleRow}>
                <MaterialCommunityIcons
                  name={newPassword && newPassword === confirmPassword ? 'check-circle' : 'circle-outline'}
                  size={16}
                  color={newPassword && newPassword === confirmPassword ? colors.success : colors.mutedText}
                />
                <Text style={[
                  styles.ruleText,
                  !!(newPassword && newPassword === confirmPassword) && styles.ruleTextValid,
                ]}>Les mots de passe correspondent</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Valider</Text>
              )}
            </TouchableOpacity>
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
    marginTop: spacing.md,
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
  rules: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ruleText: {
    fontSize: 13,
    color: colors.mutedText,
    marginLeft: spacing.sm,
  },
  ruleTextValid: {
    color: colors.success,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
});
