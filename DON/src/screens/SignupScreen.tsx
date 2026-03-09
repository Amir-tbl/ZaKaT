import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {useAuth, AuthError} from '../providers';
import {useGoogleAuth} from '../hooks/useGoogleAuth';
import {
  profileService,
  UserTitle,
  AccountType,
  SocialNetworks,
  CreateIndividualProfileInput,
  CreateOrganizationProfileInput,
} from '../services/profile';
import {THEMES} from '../services/themes';
import {CountryPicker} from '../components';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import type {AuthStackParamList} from '../navigation/AuthNavigator';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

type TitleOption = {
  value: UserTitle;
  label: string;
};

const TITLE_OPTIONS: TitleOption[] = [
  {value: 'Mr.', label: 'Mr.'},
  {value: 'Mme.', label: 'Mme.'},
  {value: 'non_specifie', label: 'Neutre'},
];

export function SignupScreen() {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const {signUp, refreshProfile} = useAuth();
  const {signInWithGoogle, isLoading: googleLoading, error: googleError, isConfigured: googleConfigured} = useGoogleAuth();

  // Step management
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  // Auth fields (shared)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Individual fields
  const [title, setTitle] = useState<UserTitle>('non_specifie');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [indPhone, setIndPhone] = useState('');
  const [indCity, setIndCity] = useState('');
  const [indCountry, setIndCountry] = useState('France');

  // Organization fields - Required
  const [orgName, setOrgName] = useState('');
  const [orgCountry, setOrgCountry] = useState('France');
  const [orgCity, setOrgCity] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [legalRepName, setLegalRepName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');

  // Organization fields - Administrative
  const [siret, setSiret] = useState('');
  const [rna, setRna] = useState('');
  const [registrationPending, setRegistrationPending] = useState(false);

  // Organization fields - Optional
  const [foundedYear, setFoundedYear] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [operatingCountries, setOperatingCountries] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show Google error if any
  useEffect(() => {
    if (googleError) {
      setError(googleError);
    }
  }, [googleError]);

  async function pickLogo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  }

  function toggleTheme(themeId: string) {
    setSelectedThemes(prev =>
      prev.includes(themeId)
        ? prev.filter(t => t !== themeId)
        : [...prev, themeId]
    );
  }

  const handleSignup = async () => {
    setError(null);

    if (!accountType) {
      setError('Veuillez choisir un type de compte');
      return;
    }

    // Common auth validation
    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return;
    }
    if (!password) {
      setError('Veuillez entrer un mot de passe');
      return;
    }
    // Password strength validation
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Le mot de passe doit contenir au moins une majuscule');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Le mot de passe doit contenir au moins un chiffre');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (accountType === 'individual') {
      // Individual validation
      if (!firstName.trim()) {
        setError('Veuillez entrer votre prénom');
        return;
      }
      if (!lastName.trim()) {
        setError('Veuillez entrer votre nom');
        return;
      }
    } else {
      // Organization validation - Required
      if (!orgName.trim()) {
        setError('Veuillez entrer le nom de l\'association');
        return;
      }
      if (!orgCountry.trim()) {
        setError('Veuillez entrer le pays');
        return;
      }
      if (!orgCity.trim()) {
        setError('Veuillez entrer la ville');
        return;
      }
      if (!orgDescription.trim()) {
        setError('Veuillez entrer une description');
        return;
      }
      if (!legalRepName.trim()) {
        setError('Veuillez entrer le nom du représentant légal');
        return;
      }
      if (!orgEmail.trim()) {
        setError('Veuillez entrer l\'email officiel');
        return;
      }
      if (!orgPhone.trim()) {
        setError('Veuillez entrer le téléphone');
        return;
      }

      // Administrative validation
      const hasSiret = siret.trim().length > 0;
      const hasRna = rna.trim().length > 0;
      if (!hasSiret && !hasRna && !registrationPending) {
        setError('Veuillez renseigner le SIRET, le RNA, ou cocher "En cours d\'enregistrement"');
        return;
      }
      if (hasSiret && !/^\d{14}$/.test(siret.trim())) {
        setError('Le SIRET doit contenir exactement 14 chiffres');
        return;
      }

      // Founded year validation
      if (foundedYear.trim()) {
        const year = parseInt(foundedYear, 10);
        if (isNaN(year) || year < 1800 || year > new Date().getFullYear()) {
          setError('Année de création invalide');
          return;
        }
      }

      // Operating countries validation (minimum 1 required)
      if (operatingCountries.length === 0) {
        setError('Veuillez sélectionner au moins 1 pays d\'intervention');
        return;
      }
    }

    setIsLoading(true);
    try {
      // 1. Create the account
      await signUp(email.trim(), password);

      // 2. Create the profile
      if (accountType === 'individual') {
        const input: CreateIndividualProfileInput = {
          accountType: 'individual',
          email: email.trim(),
          title,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: indPhone.trim(),
          city: indCity.trim(),
          country: indCountry.trim() || 'France',
        };
        await profileService.createProfile(input);
        await refreshProfile();
      } else {
        const socialNetworks: SocialNetworks = {};
        if (instagram.trim()) socialNetworks.instagram = instagram.trim();
        if (facebook.trim()) socialNetworks.facebook = facebook.trim();
        if (linkedin.trim()) socialNetworks.linkedin = linkedin.trim();
        if (twitter.trim()) socialNetworks.twitter = twitter.trim();

        const input: CreateOrganizationProfileInput = {
          accountType: 'organization',
          email: orgEmail.trim(),
          organizationName: orgName.trim(),
          country: orgCountry.trim(),
          city: orgCity.trim(),
          orgDescription: orgDescription.trim(),
          legalRepName: legalRepName.trim(),
          phone: orgPhone.trim(),
          siret: siret.trim() || undefined,
          rna: rna.trim() || undefined,
          registrationPending,
          foundedYear: foundedYear.trim() ? parseInt(foundedYear, 10) : undefined,
          website: website.trim() || undefined,
          socialNetworks: Object.keys(socialNetworks).length > 0 ? socialNetworks : undefined,
          logoUri: logoUri || undefined,
          operatingCountries: operatingCountries.length > 0 ? operatingCountries : undefined,
          themes: selectedThemes.length > 0 ? selectedThemes : undefined,
        };
        await profileService.createProfile(input);
        await refreshProfile();
      }

      // Navigation handled by RootNavigator
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
    if (!googleConfigured) {
      Alert.alert('Configuration requise', 'Veuillez configurer les identifiants Google dans le fichier .env');
      return;
    }
    setError(null);
    await signInWithGoogle();
  };

  // Step 1: Choose account type
  if (!accountType) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="account-plus" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Choisissez votre type de compte</Text>
          </View>

          <View style={styles.accountTypeContainer}>
            <TouchableOpacity
              style={styles.accountTypeCard}
              activeOpacity={0.7}
              onPress={() => setAccountType('individual')}>
              <View style={[styles.accountTypeIcon, {backgroundColor: colors.primary + '15'}]}>
                <MaterialCommunityIcons name="account" size={40} color={colors.primary} />
              </View>
              <Text style={styles.accountTypeTitle}>Particulier</Text>
              <Text style={styles.accountTypeDesc}>
                Créer des demandes d'aide à titre personnel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accountTypeCard}
              activeOpacity={0.7}
              onPress={() => setAccountType('organization')}>
              <View style={[styles.accountTypeIcon, {backgroundColor: colors.accent + '15'}]}>
                <MaterialCommunityIcons name="domain" size={40} color={colors.accent} />
              </View>
              <Text style={styles.accountTypeTitle}>Association</Text>
              <Text style={styles.accountTypeDesc}>
                Publier des demandes au nom de votre organisation
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 2: Registration form
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Header with back button */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setAccountType(null)} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <MaterialCommunityIcons
                name={accountType === 'individual' ? 'account' : 'domain'}
                size={24}
                color={colors.primary}
              />
              <Text style={styles.headerTitle}>
                {accountType === 'individual' ? 'Compte Particulier' : 'Compte Association'}
              </Text>
            </View>
            <View style={{width: 40}} />
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* INDIVIDUAL FORM */}
          {accountType === 'individual' && (
            <>
              <Text style={styles.sectionTitle}>Informations personnelles</Text>

              {/* Title selector */}
              <View style={styles.inputContainer}>
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

              {/* First name / Last name row */}
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.flex1, {marginRight: spacing.sm}]}>
                  <Text style={styles.label}>Prénom *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.inputInner}
                      placeholder="Jean"
                      placeholderTextColor={colors.mutedText}
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={[styles.inputContainer, styles.flex1]}>
                  <Text style={styles.label}>Nom *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.inputInner}
                      placeholder="Dupont"
                      placeholderTextColor={colors.mutedText}
                      value={lastName}
                      onChangeText={setLastName}
                      autoCorrect={false}
                    />
                  </View>
                </View>
              </View>

              {/* Phone */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Téléphone</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="phone-outline" size={20} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="+33 6 12 34 56 78"
                    placeholderTextColor={colors.mutedText}
                    value={indPhone}
                    onChangeText={setIndPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* City + Country */}
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.flex1, {marginRight: spacing.sm}]}>
                  <Text style={styles.label}>Ville</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.inputInner}
                      placeholder="Paris"
                      placeholderTextColor={colors.mutedText}
                      value={indCity}
                      onChangeText={setIndCity}
                    />
                  </View>
                </View>
                <View style={[styles.inputContainer, styles.flex1]}>
                  <Text style={styles.label}>Pays</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.inputInner}
                      placeholder="France"
                      placeholderTextColor={colors.mutedText}
                      value={indCountry}
                      onChangeText={setIndCountry}
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          {/* ORGANIZATION FORM */}
          {accountType === 'organization' && (
            <>
              {/* REQUIRED SECTION */}
              <Text style={styles.sectionTitle}>Informations obligatoires</Text>

              {/* Logo */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Logo (optionnel)</Text>
                <TouchableOpacity style={styles.logoUpload} onPress={pickLogo}>
                  {logoUri ? (
                    <Image source={{uri: logoUri}} style={styles.logoPreview} />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <MaterialCommunityIcons name="camera-plus" size={32} color={colors.mutedText} />
                      <Text style={styles.logoPlaceholderText}>Ajouter un logo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Organization name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nom officiel de l'association *</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="office-building" size={20} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="Association Solidaire"
                    placeholderTextColor={colors.mutedText}
                    value={orgName}
                    onChangeText={setOrgName}
                  />
                </View>
              </View>

              {/* Country + City */}
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.flex1, {marginRight: spacing.sm}]}>
                  <Text style={styles.label}>Pays *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.inputInner}
                      placeholder="France"
                      placeholderTextColor={colors.mutedText}
                      value={orgCountry}
                      onChangeText={setOrgCountry}
                    />
                  </View>
                </View>
                <View style={[styles.inputContainer, styles.flex1]}>
                  <Text style={styles.label}>Ville *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.inputInner}
                      placeholder="Paris"
                      placeholderTextColor={colors.mutedText}
                      value={orgCity}
                      onChangeText={setOrgCity}
                    />
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description courte *</Text>
                <View style={[styles.inputWrapper, {alignItems: 'flex-start', paddingVertical: spacing.sm}]}>
                  <MaterialCommunityIcons name="text" size={20} color={colors.mutedText} style={{marginTop: 2}} />
                  <TextInput
                    style={[styles.input, {minHeight: 80, textAlignVertical: 'top'}]}
                    placeholder="Décrivez votre association en quelques phrases..."
                    placeholderTextColor={colors.mutedText}
                    value={orgDescription}
                    onChangeText={setOrgDescription}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Legal rep name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nom du représentant légal *</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="account-tie" size={20} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="Jean Dupont"
                    placeholderTextColor={colors.mutedText}
                    value={legalRepName}
                    onChangeText={setLegalRepName}
                  />
                </View>
              </View>

              {/* Official email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email officiel *</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="email-outline" size={20} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="contact@association.org"
                    placeholderTextColor={colors.mutedText}
                    value={orgEmail}
                    onChangeText={setOrgEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Phone */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Téléphone *</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="phone-outline" size={20} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="+33 1 23 45 67 89"
                    placeholderTextColor={colors.mutedText}
                    value={orgPhone}
                    onChangeText={setOrgPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* ADMINISTRATIVE SECTION */}
              <Text style={[styles.sectionTitle, {marginTop: spacing.lg}]}>Informations administratives</Text>
              <Text style={styles.sectionHint}>
                Renseignez le SIRET ou RNA, ou cochez "En cours d'enregistrement"
              </Text>

              {/* SIRET */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>SIRET</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="identifier" size={20} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="14 chiffres"
                    placeholderTextColor={colors.mutedText}
                    value={siret}
                    onChangeText={setSiret}
                    keyboardType="numeric"
                    maxLength={14}
                  />
                </View>
              </View>

              {/* RNA */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>RNA (Numéro RNA)</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={20} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="W123456789"
                    placeholderTextColor={colors.mutedText}
                    value={rna}
                    onChangeText={setRna}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Registration pending checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRegistrationPending(!registrationPending)}
                activeOpacity={0.7}>
                <MaterialCommunityIcons
                  name={registrationPending ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={registrationPending ? colors.primary : colors.mutedText}
                />
                <Text style={styles.checkboxText}>En cours d'enregistrement</Text>
              </TouchableOpacity>

              {/* OPTIONAL SECTION */}
              <Text style={[styles.sectionTitle, {marginTop: spacing.lg}]}>Informations optionnelles</Text>

              {/* Founded year */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Année de création</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="calendar" size={20} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="2015"
                    placeholderTextColor={colors.mutedText}
                    value={foundedYear}
                    onChangeText={setFoundedYear}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              {/* Website */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Site web</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="web" size={20} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="https://www.exemple.org"
                    placeholderTextColor={colors.mutedText}
                    value={website}
                    onChangeText={setWebsite}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Social networks */}
              <Text style={[styles.label, {marginBottom: spacing.sm}]}>Réseaux sociaux</Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="instagram" size={20} color="#E4405F" />
                  <TextInput
                    style={styles.input}
                    placeholder="@votre_compte"
                    placeholderTextColor={colors.mutedText}
                    value={instagram}
                    onChangeText={setInstagram}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="facebook" size={20} color="#1877F2" />
                  <TextInput
                    style={styles.input}
                    placeholder="facebook.com/votre_page"
                    placeholderTextColor={colors.mutedText}
                    value={facebook}
                    onChangeText={setFacebook}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="linkedin" size={20} color="#0A66C2" />
                  <TextInput
                    style={styles.input}
                    placeholder="linkedin.com/company/..."
                    placeholderTextColor={colors.mutedText}
                    value={linkedin}
                    onChangeText={setLinkedin}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="twitter" size={20} color="#1DA1F2" />
                  <TextInput
                    style={styles.input}
                    placeholder="@votre_compte (X)"
                    placeholderTextColor={colors.mutedText}
                    value={twitter}
                    onChangeText={setTwitter}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Operating countries */}
              <CountryPicker
                label="Pays d'intervention *"
                selectedCodes={operatingCountries}
                onSelectionChange={setOperatingCountries}
                placeholder="Sélectionner les pays"
                minSelection={1}
              />

              {/* Themes */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Thèmes principaux</Text>
                <View style={styles.chipsContainer}>
                  {THEMES.map(theme => {
                    const isSelected = selectedThemes.includes(theme.id);
                    return (
                      <TouchableOpacity
                        key={theme.id}
                        style={[
                          styles.chip,
                          isSelected && {backgroundColor: theme.color, borderColor: theme.color},
                        ]}
                        onPress={() => toggleTheme(theme.id)}>
                        <MaterialCommunityIcons
                          name={theme.icon as any}
                          size={14}
                          color={isSelected ? '#fff' : theme.color}
                        />
                        <Text style={[styles.chipText, isSelected && {color: '#fff'}]}>
                          {theme.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Pending notice */}
              <View style={styles.orgNotice}>
                <MaterialCommunityIcons name="information-outline" size={18} color={colors.accent} />
                <Text style={styles.orgNoticeText}>
                  Votre association sera en attente de vérification par notre équipe avant d'apparaître dans les partenaires.
                </Text>
              </View>
            </>
          )}

          {/* COMMON: Auth section */}
          <Text style={[styles.sectionTitle, {marginTop: spacing.lg}]}>Identifiants de connexion</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email de connexion *</Text>
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
              <Text style={styles.label}>Mot de passe *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.mutedText} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Motdepasse1!"
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
              <Text style={styles.passwordHint}>
                Min. 6 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmer le mot de passe *</Text>
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
                <Text style={styles.primaryButtonText}>
                  {accountType === 'individual' ? 'Créer mon compte' : 'Soumettre l\'inscription'}
                </Text>
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
            style={[styles.button, styles.googleButton, (googleLoading || isLoading) && styles.buttonDisabled]}
            onPress={handleGoogleSignup}
            disabled={googleLoading || isLoading}>
            {googleLoading ? (
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
            <Text style={styles.footerText}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Se connecter</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  accountTypeContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  accountTypeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  accountTypeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  accountTypeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  accountTypeDesc: {
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedText,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.mutedText,
    marginBottom: spacing.md,
    fontStyle: 'italic',
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
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
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
  passwordHint: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: spacing.xs,
    fontStyle: 'italic',
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
  inputInner: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
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
  logoUpload: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  logoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoPlaceholderText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.mutedText,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkboxText: {
    fontSize: 15,
    color: colors.text,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  orgNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  orgNoticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.accent,
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
  comingSoonBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: spacing.sm,
  },
  comingSoonText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '600',
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
