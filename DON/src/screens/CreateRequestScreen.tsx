import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {Input, PrimaryButton} from '../components';
import {
  RequestFileType,
  RequestFile,
  CreateRequestInput,
  RequestType,
  PostType,
  DonTarget,
  RequestDetails,
  InfrastructureType,
  ProjectStatus,
  EcologyActionType,
  MedicalNeedType,
  EducationLevel,
  INFRASTRUCTURE_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  ECOLOGY_ACTION_LABELS,
  MEDICAL_NEED_LABELS,
  EDUCATION_LEVEL_LABELS,
} from '../services/request';
import {requestService} from '../services/request';
import {profileService, UserProfile, isOrganizationProfile} from '../services/profile';
import {THEMES} from '../services/themes';

const MAX_FILES = 10;

// Themes classification for beneficiary section visibility
// Collective themes: no individual beneficiary needed
const COLLECTIVE_THEMES = ['infrastructure', 'solidarite', 'urgences', 'education', 'environnement'];
// Person-oriented themes: beneficiary section shown (but optional)
const PERSON_ORIENTED_THEMES = ['sante'];

/**
 * Determines if the beneficiary section should be displayed
 * Rules:
 * - If ONLY collective themes are selected → hide beneficiary
 * - If at least one person-oriented theme is selected → show beneficiary (optional)
 */
function shouldShowBeneficiary(themes: string[]): boolean {
  if (themes.length === 0) return false;
  // Show beneficiary if at least one person-oriented theme is selected
  return themes.some(t => PERSON_ORIENTED_THEMES.includes(t));
}

interface Props {
  navigation: any;
}

export function CreateRequestScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();

  // Request fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [country, setCountry] = useState('France');
  const [city, setCity] = useState('');
  const [files, setFiles] = useState<RequestFile[]>([]);
  const [attestation, setAttestation] = useState(false);
  const [loading, setLoading] = useState(false);

  // Beneficiary fields
  const [benFirstName, setBenFirstName] = useState('');
  const [benLastName, setBenLastName] = useState('');
  const [benAge, setBenAge] = useState('');
  const [benCountry, setBenCountry] = useState('France');
  const [benCity, setBenCity] = useState('');
  const [benShowContact, setBenShowContact] = useState(false);
  const [benEmail, setBenEmail] = useState('');
  const [benPhone, setBenPhone] = useState('');

  // Theme fields (now required, min 1)
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [urgent, setUrgent] = useState(false);
  const [impactText, setImpactText] = useState('');

  // Profile-based type (deduced from account)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Post type for organizations
  const [postType, setPostType] = useState<'org_update' | 'org_campaign'>('org_campaign');

  // Theme-specific details
  // Infrastructure
  const [infrastructureType, setInfrastructureType] = useState<InfrastructureType | null>(null);
  const [projectLocation, setProjectLocation] = useState('');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null);

  // Ecology
  const [ecologyActionType, setEcologyActionType] = useState<EcologyActionType | null>(null);
  const [targetQuantity, setTargetQuantity] = useState('');

  // Health
  const [medicalNeedType, setMedicalNeedType] = useState<MedicalNeedType | null>(null);
  const [deadlineDate, setDeadlineDate] = useState('');

  // Education
  const [educationLevel, setEducationLevel] = useState<EducationLevel | null>(null);
  const [beneficiariesCount, setBeneficiariesCount] = useState('');

  // Computed: primary theme is first selected
  const primaryTheme = selectedThemes.length > 0 ? selectedThemes[0] : null;

  // Computed: should show beneficiary section
  const showBeneficiarySection = shouldShowBeneficiary(selectedThemes);

  useEffect(() => {
    async function loadData() {
      const profile = await profileService.getProfile();
      if (profile) {
        setUserProfile(profile);
        if (profile.city) setCity(profile.city);
        if (profile.country) setCountry(profile.country);
      }
    }
    loadData();
  }, []);

  const totalFiles = files.length;

  async function pickPhotos() {
    if (totalFiles >= MAX_FILES) {
      Alert.alert('Limite', `Maximum ${MAX_FILES} fichiers autorisés.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_FILES - totalFiles,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newFiles: RequestFile[] = result.assets.map(asset => ({
        id: 'file_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: 'photo' as const,
        mimeType: asset.mimeType || 'image/jpeg',
        ...(asset.fileSize != null ? {size: asset.fileSize} : {}),
      }));
      setFiles(prev => [...prev, ...newFiles].slice(0, MAX_FILES));
    }
  }

  async function pickDocument() {
    if (totalFiles >= MAX_FILES) {
      Alert.alert('Limite', `Maximum ${MAX_FILES} fichiers autorisés.`);
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      multiple: true,
    });

    if (!result.canceled && result.assets) {
      const newFiles: RequestFile[] = result.assets.map(asset => ({
        id: 'file_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        uri: asset.uri,
        name: asset.name || 'document',
        type: asset.mimeType?.includes('pdf') ? 'pdf' as RequestFileType : 'proof' as RequestFileType,
        mimeType: asset.mimeType || 'application/octet-stream',
        ...(asset.size != null ? {size: asset.size} : {}),
      }));
      setFiles(prev => [...prev, ...newFiles].slice(0, MAX_FILES));
    }
  }

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  function validate(): string | null {
    const isOrg = userProfile && isOrganizationProfile(userProfile);
    const isOrgUpdate = isOrg && postType === 'org_update';

    if (!title.trim()) return 'Le titre est requis.';
    if (!description.trim()) return 'La description est requise.';
    // Themes required (min 1)
    if (selectedThemes.length === 0) return 'Sélectionnez au moins un thème.';
    // Amount not required for org_update (impact posts)
    if (!isOrgUpdate && (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0))
      return 'Montant invalide.';
    if (!country.trim()) return 'Le pays est requis.';
    if (!city.trim()) return 'La ville est requise.';

    // Theme-specific validation
    if (primaryTheme === 'infrastructure') {
      if (!infrastructureType) return 'Sélectionnez le type d\'infrastructure.';
      if (!projectLocation.trim()) return 'La localisation du projet est requise pour les infrastructures.';
    }
    if (primaryTheme === 'environnement') {
      if (!ecologyActionType) return 'Sélectionnez le type d\'action écologique.';
      if (!projectLocation.trim()) return 'La localisation du projet est requise pour les actions écologiques.';
    }
    if (primaryTheme === 'sante') {
      if (!medicalNeedType) return 'Sélectionnez le type de besoin médical.';
    }
    if (primaryTheme === 'education') {
      if (!educationLevel) return 'Sélectionnez le niveau d\'éducation.';
    }

    // Beneficiary validation only if section is shown
    // Note: beneficiary fields are now optional even when shown
    // No required fields for beneficiary anymore

    const proofFiles = files.filter(f => f.type === 'pdf' || f.type === 'proof');
    if (proofFiles.length === 0 && files.length === 0)
      return 'Ajoutez au moins un justificatif ou une photo.';
    if (!attestation) return "Vous devez attester l'exactitude des informations.";
    return null;
  }

  async function handleSubmit() {
    const error = validate();
    if (error) {
      Alert.alert('Erreur', error);
      return;
    }

    setLoading(true);
    try {
      // Deduce request type from user profile
      const isOrg = userProfile && isOrganizationProfile(userProfile);
      const requestType: RequestType = isOrg ? 'organization' : 'individual';

      // Determine post type and donation target
      let finalPostType: PostType;
      let finalDonTarget: DonTarget;

      if (isOrg) {
        finalPostType = postType; // org_update or org_campaign
        finalDonTarget = 'organization'; // Always to organization wallet
      } else {
        finalPostType = 'individual_request';
        finalDonTarget = 'request'; // To the specific request
      }

      const isOrgUpdate = finalPostType === 'org_update';

      // Build theme-specific details
      let details: RequestDetails | undefined;
      if (primaryTheme === 'infrastructure' && infrastructureType) {
        details = {
          themeType: 'infrastructure',
          data: {
            infrastructureType,
            projectLocation: projectLocation.trim(),
            projectStatus: projectStatus || undefined,
          },
        };
      } else if (primaryTheme === 'environnement' && ecologyActionType) {
        details = {
          themeType: 'environnement',
          data: {
            ecologyActionType,
            projectLocation: projectLocation.trim(),
            ...(targetQuantity.trim() ? {targetQuantity: targetQuantity.trim()} : {}),
          },
        };
      } else if (primaryTheme === 'sante' && medicalNeedType) {
        details = {
          themeType: 'sante',
          data: {
            medicalNeedType,
            ...(deadlineDate.trim() ? {deadlineDate: deadlineDate.trim()} : {}),
          },
        };
      } else if (primaryTheme === 'education' && educationLevel) {
        details = {
          themeType: 'education',
          data: {
            educationLevel,
            ...(beneficiariesCount.trim() ? {beneficiariesCount: Number(beneficiariesCount)} : {}),
          },
        };
      }

      // Build beneficiary object only if section is shown and has data
      const hasBeneficiaryData = showBeneficiarySection && (benFirstName.trim() || benLastName.trim());
      const beneficiary = hasBeneficiaryData
        ? {
            firstName: benFirstName.trim() || 'Non spécifié',
            lastName: benLastName.trim() || 'Non spécifié',
            ...(benAge.trim() ? {age: Number(benAge)} : {}),
            country: benCountry.trim() || country.trim(), // Fallback to request country
            ...(benCity.trim() ? {city: benCity.trim()} : {}),
            ...(benShowContact && benEmail.trim() ? {email: benEmail.trim()} : {}),
            ...(benShowContact && benPhone.trim() ? {phone: benPhone.trim()} : {}),
            showContactPublicly: benShowContact,
          }
        : {
            // Default beneficiary for collective themes (project-based)
            firstName: 'Collectif',
            lastName: 'Projet',
            country: country.trim(),
            showContactPublicly: false,
          };

      const input: CreateRequestInput = {
        title: title.trim(),
        description: description.trim(),
        goalAmount: isOrgUpdate ? 0 : Number(amount), // No goal for impact posts
        country: country.trim(),
        city: city.trim(),
        files,
        beneficiary,
        attestation: true,
        themes: selectedThemes,
        type: requestType,
        urgent: isOrgUpdate ? false : urgent, // No urgency for impact posts
        impactText: impactText.trim() || undefined,
        details,
        postType: finalPostType,
        donTarget: finalDonTarget,
      };

      await requestService.create(input);

      const successMsg = isOrgUpdate
        ? 'Votre publication a été enregistrée.'
        : isOrg
        ? 'Votre campagne a été enregistrée.'
        : 'Votre demande a été enregistrée.';

      Alert.alert('Publication créée', successMsg, [
        {text: 'OK', onPress: () => navigation.replace('CreateMenu')},
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  function formatSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, {paddingTop: insets.top}]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.replace('CreateMenu')} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={typography.h2}>Nouvelle demande</Text>
          <View style={{width: 40}} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ===== SECTION: Demande ===== */}
          <Text style={styles.sectionHeader}>Demande</Text>

          {/* Titre */}
          <Input
            label="Titre de la demande *"
            placeholder="Ex: Aide pour frais médicaux"
            value={title}
            onChangeText={setTitle}
          />

          {/* Themes (required, min 1) */}
          <Text style={styles.label}>Thèmes * (sélectionnez au moins 1)</Text>
          <Text style={[typography.caption, {marginBottom: spacing.sm, color: colors.mutedText}]}>
            Le premier thème sélectionné sera le thème principal.
          </Text>
          <View style={styles.categoryRow}>
            {THEMES.map(theme => {
              const active = selectedThemes.includes(theme.id);
              const isPrimary = primaryTheme === theme.id;
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.categoryChip,
                    active && {backgroundColor: theme.color, borderColor: theme.color},
                  ]}
                  onPress={() =>
                    setSelectedThemes(prev =>
                      prev.includes(theme.id)
                        ? prev.filter(t => t !== theme.id)
                        : [...prev, theme.id],
                    )
                  }>
                  <MaterialCommunityIcons
                    name={theme.icon as any}
                    size={16}
                    color={active ? '#fff' : theme.color}
                  />
                  <Text style={[styles.categoryChipText, active && {color: '#fff'}]}>
                    {theme.label}
                  </Text>
                  {isPrimary && (
                    <MaterialCommunityIcons name="star" size={12} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <Input
            label="Description *"
            placeholder="Décrivez la situation et les besoins..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            style={styles.textArea}
            textAlignVertical="top"
          />

          {/* Montant - hidden for org_update */}
          {!(userProfile && isOrganizationProfile(userProfile) && postType === 'org_update') && (
            <Input
              label="Montant demandé (EUR) *"
              placeholder="500"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          )}

          {/* Pays + Ville de la demande */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Pays *"
                placeholder="France"
                value={country}
                onChangeText={setCountry}
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Ville *"
                placeholder="Paris"
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          {/* ===== SECTION: Details du projet (dynamique selon theme) ===== */}
          {primaryTheme && ['infrastructure', 'environnement', 'sante', 'education'].includes(primaryTheme) && (
            <>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionHeader}>Détails du projet</Text>
              <Text style={[typography.caption, {marginBottom: spacing.md, color: colors.mutedText}]}>
                Champs spécifiques au thème "{THEMES.find(t => t.id === primaryTheme)?.label}".
              </Text>

              {/* Infrastructure fields */}
              {primaryTheme === 'infrastructure' && (
                <>
                  <Text style={styles.label}>Type d'infrastructure *</Text>
                  <View style={styles.categoryRow}>
                    {(Object.keys(INFRASTRUCTURE_TYPE_LABELS) as InfrastructureType[]).map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.categoryChip,
                          infrastructureType === type && styles.categoryChipActive,
                        ]}
                        onPress={() => setInfrastructureType(type)}>
                        <Text
                          style={[
                            styles.categoryChipText,
                            infrastructureType === type && styles.categoryChipTextActive,
                          ]}>
                          {INFRASTRUCTURE_TYPE_LABELS[type]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Input
                    label="Localisation du projet *"
                    placeholder="Adresse ou lieu précis"
                    value={projectLocation}
                    onChangeText={setProjectLocation}
                  />

                  <Text style={styles.label}>Statut du projet (optionnel)</Text>
                  <View style={styles.categoryRow}>
                    {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map(status => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.categoryChip,
                          projectStatus === status && styles.categoryChipActive,
                        ]}
                        onPress={() => setProjectStatus(projectStatus === status ? null : status)}>
                        <Text
                          style={[
                            styles.categoryChipText,
                            projectStatus === status && styles.categoryChipTextActive,
                          ]}>
                          {PROJECT_STATUS_LABELS[status]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.tipBox}>
                    <MaterialCommunityIcons name="lightbulb-outline" size={18} color={colors.accent} />
                    <Text style={styles.tipText}>
                      Un devis PDF est recommandé pour les projets de construction.
                    </Text>
                  </View>
                </>
              )}

              {/* Ecology fields */}
              {primaryTheme === 'environnement' && (
                <>
                  <Text style={styles.label}>Type d'action *</Text>
                  <View style={styles.categoryRow}>
                    {(Object.keys(ECOLOGY_ACTION_LABELS) as EcologyActionType[]).map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.categoryChip,
                          ecologyActionType === type && styles.categoryChipActive,
                        ]}
                        onPress={() => setEcologyActionType(type)}>
                        <Text
                          style={[
                            styles.categoryChipText,
                            ecologyActionType === type && styles.categoryChipTextActive,
                          ]}>
                          {ECOLOGY_ACTION_LABELS[type]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Input
                    label="Localisation du projet *"
                    placeholder="Adresse ou lieu précis"
                    value={projectLocation}
                    onChangeText={setProjectLocation}
                  />

                  <Input
                    label="Quantité cible (optionnel)"
                    placeholder="Ex: 500 arbres, 100kg déchets"
                    value={targetQuantity}
                    onChangeText={setTargetQuantity}
                  />
                </>
              )}

              {/* Health fields */}
              {primaryTheme === 'sante' && (
                <>
                  <Text style={styles.label}>Type de besoin médical *</Text>
                  <View style={styles.categoryRow}>
                    {(Object.keys(MEDICAL_NEED_LABELS) as MedicalNeedType[]).map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.categoryChip,
                          medicalNeedType === type && styles.categoryChipActive,
                        ]}
                        onPress={() => setMedicalNeedType(type)}>
                        <Text
                          style={[
                            styles.categoryChipText,
                            medicalNeedType === type && styles.categoryChipTextActive,
                          ]}>
                          {MEDICAL_NEED_LABELS[type]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Input
                    label="Date limite (optionnel)"
                    placeholder="Ex: 15/03/2025"
                    value={deadlineDate}
                    onChangeText={setDeadlineDate}
                  />
                </>
              )}

              {/* Education fields */}
              {primaryTheme === 'education' && (
                <>
                  <Text style={styles.label}>Niveau d'éducation *</Text>
                  <View style={styles.categoryRow}>
                    {(Object.keys(EDUCATION_LEVEL_LABELS) as EducationLevel[]).map(level => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.categoryChip,
                          educationLevel === level && styles.categoryChipActive,
                        ]}
                        onPress={() => setEducationLevel(level)}>
                        <Text
                          style={[
                            styles.categoryChipText,
                            educationLevel === level && styles.categoryChipTextActive,
                          ]}>
                          {EDUCATION_LEVEL_LABELS[level]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Input
                    label="Nombre de bénéficiaires (optionnel)"
                    placeholder="Ex: 25"
                    value={beneficiariesCount}
                    onChangeText={setBeneficiariesCount}
                    keyboardType="numeric"
                  />
                </>
              )}
            </>
          )}

          {/* ===== SECTION: Options de la demande ===== */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionHeader}>Options</Text>

          {/* Notice and post type selector for organization account */}
          {userProfile && isOrganizationProfile(userProfile) && (
            <>
              <View style={styles.orgAccountNotice}>
                <MaterialCommunityIcons name="domain" size={18} color={colors.accent} />
                <Text style={styles.orgAccountNoticeText}>
                  Publication au nom de {userProfile.organizationName || 'votre association'}.
                </Text>
              </View>

              {/* Post type selector */}
              <Text style={styles.label}>Type de publication *</Text>
              <View style={styles.postTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.postTypeCard,
                    postType === 'org_campaign' && styles.postTypeCardActive,
                  ]}
                  onPress={() => setPostType('org_campaign')}>
                  <MaterialCommunityIcons
                    name="bullhorn"
                    size={28}
                    color={postType === 'org_campaign' ? colors.surface : colors.success}
                  />
                  <Text
                    style={[
                      styles.postTypeTitle,
                      postType === 'org_campaign' && styles.postTypeTitleActive,
                    ]}>
                    Campagne
                  </Text>
                  <Text
                    style={[
                      styles.postTypeDesc,
                      postType === 'org_campaign' && styles.postTypeDescActive,
                    ]}>
                    Collecte de fonds avec objectif
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.postTypeCard,
                    postType === 'org_update' && styles.postTypeCardActiveAlt,
                  ]}
                  onPress={() => setPostType('org_update')}>
                  <MaterialCommunityIcons
                    name="newspaper-variant-outline"
                    size={28}
                    color={postType === 'org_update' ? colors.surface : colors.accent}
                  />
                  <Text
                    style={[
                      styles.postTypeTitle,
                      postType === 'org_update' && styles.postTypeTitleActive,
                    ]}>
                    Publication
                  </Text>
                  <Text
                    style={[
                      styles.postTypeDesc,
                      postType === 'org_update' && styles.postTypeDescActive,
                    ]}>
                    Actualité ou impact (sans don)
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Urgent - hidden for org_update */}
          {!(userProfile && isOrganizationProfile(userProfile) && postType === 'org_update') && (
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={typography.bodySmall}>Demande urgente</Text>
                <Text style={typography.caption}>
                  Signalée comme prioritaire aux donateurs
                </Text>
              </View>
              <Switch
                value={urgent}
                onValueChange={setUrgent}
                trackColor={{false: colors.border, true: colors.warning + '80'}}
                thumbColor={urgent ? colors.warning : '#f4f3f4'}
              />
            </View>
          )}

          {/* Impact */}
          <Input
            label="Impact attendu (optionnel)"
            placeholder="Ex: Permettra de nourrir 50 familles pendant 1 mois"
            value={impactText}
            onChangeText={setImpactText}
            multiline
            numberOfLines={3}
            style={styles.textArea}
            textAlignVertical="top"
          />

          {/* ===== SECTION: Personne concernee (conditionnelle) ===== */}
          {showBeneficiarySection && (
            <>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionHeader}>Personne concernée (bénéficiaire)</Text>
              <Text style={[typography.caption, {marginBottom: spacing.md}]}>
                La personne qui recevra l'aide. Ces informations sont optionnelles.
              </Text>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Prénom"
                    placeholder="Prénom"
                    value={benFirstName}
                    onChangeText={setBenFirstName}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label="Nom"
                    placeholder="Nom"
                    value={benLastName}
                    onChangeText={setBenLastName}
                  />
                </View>
              </View>

              <Input
                label="Âge"
                placeholder="25"
                value={benAge}
                onChangeText={setBenAge}
                keyboardType="numeric"
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Pays"
                    placeholder="France"
                    value={benCountry}
                    onChangeText={setBenCountry}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label="Ville"
                    placeholder="Paris"
                    value={benCity}
                    onChangeText={setBenCity}
                  />
                </View>
              </View>

              {/* Toggle contact beneficiaire */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={typography.bodySmall}>
                    Afficher les contacts du bénéficiaire sur la demande
                  </Text>
                  <Text style={typography.caption}>Par défaut: non visible</Text>
                </View>
                <Switch
                  value={benShowContact}
                  onValueChange={setBenShowContact}
                  trackColor={{false: colors.border, true: colors.primary + '80'}}
                  thumbColor={benShowContact ? colors.primary : '#f4f3f4'}
                />
              </View>

              {benShowContact && (
                <>
                  <Input
                    label="Email du bénéficiaire"
                    placeholder="email@exemple.com"
                    value={benEmail}
                    onChangeText={setBenEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Input
                    label="Téléphone du bénéficiaire"
                    placeholder="+33 6 12 34 56 78"
                    value={benPhone}
                    onChangeText={setBenPhone}
                    keyboardType="phone-pad"
                  />
                </>
              )}
            </>
          )}

          {/* Info notice for collective themes (no beneficiary) */}
          {selectedThemes.length > 0 && !showBeneficiarySection && (
            <>
              <View style={styles.sectionDivider} />
              <View style={styles.collectiveNotice}>
                <MaterialCommunityIcons name="account-group" size={20} color={colors.accent} />
                <Text style={styles.collectiveNoticeText}>
                  Projet collectif : pas de bénéficiaire individuel requis pour les thèmes sélectionnés.
                </Text>
              </View>
            </>
          )}

          {/* ===== SECTION: Fichiers ===== */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionHeader}>Fichiers et justificatifs</Text>
          <Text style={[typography.caption, {marginBottom: spacing.sm}]}>
            {totalFiles}/{MAX_FILES} fichiers - Photos, PDF, justificatifs
          </Text>

          <View style={styles.fileButtons}>
            <TouchableOpacity style={styles.fileBtn} onPress={pickPhotos}>
              <MaterialCommunityIcons name="camera" size={22} color={colors.primary} />
              <Text style={styles.fileBtnText}>Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fileBtn} onPress={pickDocument}>
              <MaterialCommunityIcons name="file-document" size={22} color={colors.primary} />
              <Text style={styles.fileBtnText}>Document</Text>
            </TouchableOpacity>
          </View>

          {/* File list */}
          {files.map(file => (
            <View key={file.id} style={styles.fileItem}>
              {file.type === 'photo' ? (
                <Image source={{uri: file.uri}} style={styles.fileThumbnail} />
              ) : (
                <View style={styles.fileIconBox}>
                  <MaterialCommunityIcons name="file-pdf-box" size={28} color={colors.error} />
                </View>
              )}
              <View style={styles.fileInfo}>
                <Text style={typography.bodySmall} numberOfLines={1}>
                  {file.name}
                </Text>
                {file.size ? (
                  <Text style={typography.caption}>{formatSize(file.size)}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => removeFile(file.id)} style={styles.fileRemove}>
                <MaterialCommunityIcons name="close-circle" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          {/* ===== Attestation + Submit ===== */}
          <View style={styles.sectionDivider} />

          {/* Attestation */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAttestation(!attestation)}
            activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={attestation ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={attestation ? colors.primary : colors.mutedText}
            />
            <Text style={styles.checkboxText}>
              J'atteste que les informations fournies sont exactes *
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <PrimaryButton
            title="Soumettre la demande"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            size="large"
            style={styles.submitBtn}
          />

          <View style={{height: insets.bottom + 20}} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  scroll: {
    padding: spacing.lg,
  },
  sectionHeader: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.surface,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  fileButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  fileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primary + '08',
  },
  fileBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.primary,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  fileThumbnail: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  fileRemove: {
    padding: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
  },
  checkboxText: {
    ...typography.bodySmall,
    flex: 1,
  },
  submitBtn: {
    width: '100%',
  },
  orgAccountNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  orgAccountNoticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.accent,
  },
  postTypeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  postTypeCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  postTypeCardActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  postTypeCardActiveAlt: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  postTypeTitle: {
    ...typography.body,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  postTypeTitleActive: {
    color: colors.surface,
  },
  postTypeDesc: {
    ...typography.caption,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  postTypeDescActive: {
    color: colors.surface + 'CC',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tipText: {
    flex: 1,
    ...typography.caption,
    color: colors.accent,
  },
  collectiveNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accent + '12',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  collectiveNoticeText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.accent,
  },
});
