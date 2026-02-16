import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useForm, Controller} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  Card,
  Input,
  MoneyInput,
  PrimaryButton,
  Badge,
  EmptyState,
} from '../components';
import {useApplicantStore, useUserStore} from '../store';
import {eurosToCents} from '../utils';
import {colors, spacing, typography, borderRadius} from '../theme';

const applicantSchema = z.object({
  fullName: z.string().min(1, 'Le nom est requis'),
  city: z.string().min(1, 'La ville est requise'),
  shortStory: z
    .string()
    .min(10, 'L\'histoire doit contenir au moins 10 caractères'),
  goalEuros: z
    .string()
    .refine(val => parseInt(val, 10) >= 50, 'L\'objectif minimum est de 50 €'),
});

type ApplicantFormData = z.infer<typeof applicantSchema>;

export function ApplicantScreen() {
  const {
    applicants,
    pendingApplicants,
    isLoading,
    loadApplicants,
    loadPending,
    createApplicant,
    validateApplicant,
  } = useApplicantStore();
  const {isAdminMode, toggleAdminMode} = useUserStore();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<ApplicantFormData>({
    resolver: zodResolver(applicantSchema),
    defaultValues: {
      fullName: '',
      city: '',
      shortStory: '',
      goalEuros: '',
    },
  });

  useEffect(() => {
    loadApplicants();
    loadPending();
  }, [loadApplicants, loadPending]);

  const onSubmit = async (data: ApplicantFormData) => {
    setSubmitting(true);
    try {
      await createApplicant({
        fullName: data.fullName,
        city: data.city,
        shortStory: data.shortStory,
        goalCents: eurosToCents(parseInt(data.goalEuros, 10)),
      });
      reset();
      Alert.alert(
        'Demande envoyée',
        'Votre dossier a été soumis et est en attente de validation.',
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de soumettre la demande.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (id: number) => {
    try {
      await validateApplicant(id);
      Alert.alert('Validé', 'La demande a été validée avec succès.');
    } catch {
      Alert.alert('Erreur', 'Impossible de valider la demande.');
    }
  };

  const myRequests = applicants.filter(a => !a.validated);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Créer un dossier</Text>
          <Card style={styles.formCard}>
            <Controller
              control={control}
              name="fullName"
              render={({field: {onChange, onBlur, value}}) => (
                <Input
                  label="Nom complet"
                  placeholder="Jean Dupont"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fullName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="city"
              render={({field: {onChange, onBlur, value}}) => (
                <Input
                  label="Ville"
                  placeholder="Paris"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.city?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="shortStory"
              render={({field: {onChange, onBlur, value}}) => (
                <Input
                  label="Votre situation (courte description)"
                  placeholder="Décrivez brièvement votre situation et vos besoins..."
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                  error={errors.shortStory?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="goalEuros"
              render={({field: {onChange, value}}) => (
                <MoneyInput
                  label="Objectif de collecte"
                  value={value}
                  onChangeText={onChange}
                  placeholder="500"
                  error={errors.goalEuros?.message}
                />
              )}
            />

            <PrimaryButton
              title="Soumettre ma demande"
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              size="large"
              style={styles.submitButton}
            />
          </Card>

          <View style={styles.adminSection}>
            <View style={styles.adminHeader}>
              <Text style={styles.sectionTitle}>Mes demandes</Text>
              <View style={styles.adminToggle}>
                <Text style={styles.adminLabel}>Mode admin</Text>
                <Switch
                  value={isAdminMode}
                  onValueChange={toggleAdminMode}
                  trackColor={{
                    false: colors.border,
                    true: colors.primary + '60',
                  }}
                  thumbColor={isAdminMode ? colors.primary : colors.mutedText}
                />
              </View>
            </View>

            {myRequests.length === 0 ? (
              <EmptyState
                icon="file-document-outline"
                title="Aucune demande"
                message="Vous n'avez pas encore soumis de demande."
              />
            ) : (
              myRequests.map(applicant => (
                <Card key={applicant.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <Text style={styles.requestName}>{applicant.fullName}</Text>
                    <Badge
                      text={applicant.validated ? 'Validé' : 'En attente'}
                      variant={applicant.validated ? 'success' : 'warning'}
                    />
                  </View>
                  <Text style={styles.requestCity}>{applicant.city}</Text>
                  <Text style={styles.requestStory} numberOfLines={2}>
                    {applicant.shortStory}
                  </Text>
                  {isAdminMode && !applicant.validated && (
                    <PrimaryButton
                      title="Valider"
                      onPress={() => handleValidate(applicant.id)}
                      size="small"
                      style={styles.validateButton}
                    />
                  )}
                </Card>
              ))
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  formCard: {
    marginBottom: spacing.xl,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.md,
  },
  adminSection: {
    flex: 1,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  adminToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminLabel: {
    ...typography.bodySmall,
    color: colors.mutedText,
    marginRight: spacing.sm,
  },
  requestCard: {
    marginBottom: spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requestName: {
    ...typography.h3,
    fontSize: 16,
    flex: 1,
    marginRight: spacing.sm,
  },
  requestCity: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  requestStory: {
    ...typography.bodySmall,
    color: colors.mutedText,
  },
  validateButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
});
