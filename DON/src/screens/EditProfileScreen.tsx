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
import {useNavigation} from '@react-navigation/native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useAuth} from '../providers';
import {profileService, UserProfile, UserTitle, isIndividualProfile, isOrganizationProfile} from '../services/profile';
import {colors, spacing, typography} from '../theme';

type TitleOption = {
  value: UserTitle;
  label: string;
};

const TITLE_OPTIONS: TitleOption[] = [
  {value: 'Mr.', label: 'Mr.'},
  {value: 'Mme.', label: 'Mme.'},
  {value: 'non_specifie', label: 'Neutre'},
];

const getTitleLabel = (value: UserTitle): string => {
  const option = TITLE_OPTIONS.find(o => o.value === value);
  return option?.label || 'Non spécifié';
};

export function EditProfileScreen() {
  const navigation = useNavigation();
  const {user: authUser} = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [title, setTitle] = useState<UserTitle>('non_specifie');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const p = await profileService.getOrCreateProfile(authUser?.email || '');
      setProfile(p);
      if (isIndividualProfile(p)) {
        setTitle(p.title || 'non_specifie');
        setFirstName(p.firstName);
        setLastName(p.lastName);
      }
      setPhone(p.phone);
      setCity(p.city);
      setCountry(p.country);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePhone = (value: string): boolean => {
    if (!value) return true; // Optionnel
    return value.length >= 8 && value.length <= 15;
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Erreur', 'Le prénom est obligatoire');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Erreur', 'Le numéro de téléphone doit contenir entre 8 et 15 caractères');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await profileService.updateProfile({
        title,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        country: country.trim(),
      });
      setProfile(updated);
      setIsEditMode(false);
      Alert.alert('Succès', 'Profil enregistré avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (profile) {
      if (isIndividualProfile(profile)) {
        setTitle(profile.title || 'non_specifie');
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
      }
      setPhone(profile.phone);
      setCity(profile.city);
      setCountry(profile.country);
    }
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Mode lecture (read-only)
  if (!isEditMode) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Informations du profil</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={50} color={colors.primary} />
            </View>
          </View>

          {/* Info cards */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              {/* Individual profile fields */}
              {profile && isIndividualProfile(profile) && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Civilité</Text>
                    <Text style={styles.infoValue}>{getTitleLabel(profile.title || 'non_specifie')}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Prénom</Text>
                    <Text style={styles.infoValue}>{profile.firstName || '-'}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nom</Text>
                    <Text style={styles.infoValue}>{profile.lastName || '-'}</Text>
                  </View>
                </>
              )}

              {/* Organization profile fields */}
              {profile && isOrganizationProfile(profile) && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Association</Text>
                    <Text style={styles.infoValue}>{profile.organizationName || '-'}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Représentant légal</Text>
                    <Text style={styles.infoValue}>{profile.legalRepName || '-'}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Statut</Text>
                    <View style={[
                      styles.statusBadge,
                      profile.orgStatus === 'verified' && styles.statusVerified,
                      profile.orgStatus === 'rejected' && styles.statusRejected,
                    ]}>
                      <Text style={[
                        styles.statusText,
                        profile.orgStatus === 'verified' && styles.statusTextVerified,
                        profile.orgStatus === 'rejected' && styles.statusTextRejected,
                      ]}>
                        {profile.orgStatus === 'pending' ? 'En attente' :
                         profile.orgStatus === 'verified' ? 'Vérifiée' : 'Non vérifiée'}
                      </Text>
                    </View>
                  </View>

                  {profile.siret && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>SIRET</Text>
                      <Text style={styles.infoValue}>{profile.siret}</Text>
                    </View>
                  )}

                  {profile.rna && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>RNA</Text>
                      <Text style={styles.infoValue}>{profile.rna}</Text>
                    </View>
                  )}

                  {profile.website && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Site web</Text>
                      <Text style={styles.infoValue}>{profile.website}</Text>
                    </View>
                  )}
                </>
              )}

              {/* Common fields */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <View style={styles.infoValueWithIcon}>
                  <Text style={styles.infoValue}>{authUser?.email || '-'}</Text>
                  <MaterialCommunityIcons name="lock" size={14} color={colors.mutedText} />
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{profile?.phone || '-'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ville</Text>
                <Text style={styles.infoValue}>{profile?.city || '-'}</Text>
              </View>

              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>Pays</Text>
                <Text style={styles.infoValue}>{profile?.country || '-'}</Text>
              </View>
            </View>
          </View>

          {/* Modify Button - Only for individual profiles for now */}
          {profile && isIndividualProfile(profile) && (
            <TouchableOpacity
              style={styles.modifyButton}
              onPress={() => setIsEditMode(true)}>
              <MaterialCommunityIcons name="pencil" size={20} color={colors.surface} />
              <Text style={styles.modifyButtonText}>Modifier</Text>
            </TouchableOpacity>
          )}

          {/* Message for organization profiles */}
          {profile && isOrganizationProfile(profile) && (
            <View style={styles.orgNotice}>
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.accent} />
              <Text style={styles.orgNoticeText}>
                La modification du profil association sera bientôt disponible.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Mode edition
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier le profil</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={50} color={colors.primary} />
            </View>
            <Text style={styles.avatarHint}>Photo de profil (bientôt)</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Title selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Civilité</Text>
              <View style={styles.titleSelector}>
                {TITLE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.titleOption,
                      title === option.value && styles.titleOptionActive,
                    ]}
                    onPress={() => setTitle(option.value)}>
                    <Text
                      style={[
                        styles.titleOptionText,
                        title === option.value && styles.titleOptionTextActive,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Votre prénom"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Votre nom"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{authUser?.email || ''}</Text>
                <MaterialCommunityIcons name="lock" size={18} color={colors.mutedText} />
              </View>
              <Text style={styles.hint}>L'email ne peut pas être modifié</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+33 6 12 34 56 78"
                placeholderTextColor={colors.mutedText}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1, {marginRight: spacing.sm}]}>
                <Text style={styles.label}>Ville</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Paris"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Pays</Text>
                <TextInput
                  style={styles.input}
                  value={country}
                  onChangeText={setCountry}
                  placeholder="France"
                  placeholderTextColor={colors.mutedText}
                />
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarHint: {
    ...typography.caption,
    color: colors.mutedText,
  },
  // Read mode styles
  infoSection: {
    marginBottom: spacing.xl,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    ...typography.body,
    color: colors.mutedText,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  infoValueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
  },
  modifyButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  // Edit mode styles
  form: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.border + '50',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  readOnlyText: {
    fontSize: 16,
    color: colors.mutedText,
  },
  hint: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  titleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  titleOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleOptionActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  titleOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  titleOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusVerified: {
    backgroundColor: colors.success + '20',
  },
  statusRejected: {
    backgroundColor: colors.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  statusTextVerified: {
    color: colors.success,
  },
  statusTextRejected: {
    color: colors.error,
  },
  orgNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  orgNoticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.accent,
  },
});
