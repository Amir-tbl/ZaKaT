import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
import {PostFile} from '../services/post';
import {postService} from '../services/post';
import {profileService, UserProfile, isOrganizationProfile} from '../services/profile';
import {THEMES} from '../services/themes';

const MAX_FILES = 10;

interface Props {
  navigation: any;
}

export function CreatePostScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();

  // Post fields
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('France');
  const [city, setCity] = useState('');
  const [files, setFiles] = useState<PostFile[]>([]);
  const [loading, setLoading] = useState(false);

  // Theme fields
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  // Profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const primaryTheme = selectedThemes.length > 0 ? selectedThemes[0] : undefined;

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
      Alert.alert('Limite', `Maximum ${MAX_FILES} fichiers autorises.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_FILES - totalFiles,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newFiles: PostFile[] = result.assets.map(asset => ({
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

  async function pickVideos() {
    if (totalFiles >= MAX_FILES) {
      Alert.alert('Limite', `Maximum ${MAX_FILES} fichiers autorises.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_FILES - totalFiles,
      quality: 0.8,
      videoMaxDuration: 60, // 60 seconds max
    });

    if (!result.canceled && result.assets) {
      const newFiles: PostFile[] = result.assets.map(asset => ({
        id: 'file_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        uri: asset.uri,
        name: asset.fileName || `video_${Date.now()}.mp4`,
        type: 'video' as const,
        mimeType: asset.mimeType || 'video/mp4',
        ...(asset.fileSize != null ? {size: asset.fileSize} : {}),
        ...(asset.duration ? {duration: Math.round(asset.duration / 1000)} : {}),
      }));
      setFiles(prev => [...prev, ...newFiles].slice(0, MAX_FILES));
    }
  }

  async function pickDocument() {
    if (totalFiles >= MAX_FILES) {
      Alert.alert('Limite', `Maximum ${MAX_FILES} fichiers autorises.`);
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      multiple: true,
    });

    if (!result.canceled && result.assets) {
      const newFiles: PostFile[] = result.assets.map(asset => ({
        id: 'file_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        uri: asset.uri,
        name: asset.name || 'document',
        type: 'pdf' as const,
        mimeType: asset.mimeType || 'application/pdf',
        ...(asset.size != null ? {size: asset.size} : {}),
      }));
      setFiles(prev => [...prev, ...newFiles].slice(0, MAX_FILES));
    }
  }

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  function validate(): string | null {
    if (!description.trim()) return 'La description est requise.';
    if (selectedThemes.length === 0) return 'Selectionnez au moins un theme.';
    if (files.length === 0) return 'Ajoutez au moins une photo ou un document.';
    return null;
  }

  async function handleSubmit() {
    const error = validate();
    if (error) {
      Alert.alert('Erreur', error);
      return;
    }

    if (!userProfile) {
      Alert.alert('Erreur', 'Vous devez etre connecte pour publier.');
      return;
    }

    setLoading(true);
    try {
      await postService.create({
        description: description.trim(),
        themes: selectedThemes,
        location: (city.trim() || country.trim()) ? {
          ...(city.trim() ? {city: city.trim()} : {}),
          country: country.trim() || 'France',
        } : undefined,
        files,
      });

      Alert.alert('Publication creee', 'Votre publication a ete enregistree et sera visible apres validation.', [
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
          <Text style={typography.h2}>Nouvelle publication</Text>
          <View style={{width: 40}} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Info notice */}
          <View style={styles.infoNotice}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
            <Text style={styles.infoNoticeText}>
              Les publications sont des actualites ou partages d'impact. Elles n'ont pas de bouton "Faire un don".
            </Text>
          </View>

          {/* Profile badge */}
          {userProfile && (
            <View style={styles.profileBadge}>
              <View style={styles.profileAvatar}>
                {isOrganizationProfile(userProfile) ? (
                  <MaterialCommunityIcons name="domain" size={20} color={colors.surface} />
                ) : (
                  <Text style={styles.profileAvatarText}>
                    {userProfile.firstName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {isOrganizationProfile(userProfile)
                    ? userProfile.organizationName
                    : `${userProfile.firstName} ${userProfile.lastName}`}
                </Text>
                <Text style={styles.profileType}>
                  {isOrganizationProfile(userProfile) ? 'Association' : 'Particulier'}
                </Text>
              </View>
            </View>
          )}

          {/* Description */}
          <Text style={styles.sectionHeader}>Contenu</Text>
          <Input
            label="Description *"
            placeholder="Partagez une actualite, un impact realise, une nouvelle..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            style={styles.textArea}
            textAlignVertical="top"
          />

          {/* Themes */}
          <Text style={styles.label}>Themes * (selectionnez au moins 1)</Text>
          <Text style={[typography.caption, {marginBottom: spacing.sm, color: colors.mutedText}]}>
            Le premier theme selectionne sera le theme principal.
          </Text>
          <View style={styles.themeRow}>
            {THEMES.map(theme => {
              const active = selectedThemes.includes(theme.id);
              const isPrimary = primaryTheme === theme.id;
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeChip,
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
                  <Text style={[styles.themeChipText, active && {color: '#fff'}]}>
                    {theme.label}
                  </Text>
                  {isPrimary && (
                    <MaterialCommunityIcons name="star" size={12} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Location */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionHeader}>Localisation (optionnel)</Text>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Pays"
                placeholder="France"
                value={country}
                onChangeText={setCountry}
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Ville"
                placeholder="Paris"
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          {/* Files */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionHeader}>Medias et documents</Text>
          <Text style={[typography.caption, {marginBottom: spacing.sm}]}>
            {totalFiles}/{MAX_FILES} fichiers (videos: 60s max)
          </Text>

          <View style={styles.fileButtons}>
            <TouchableOpacity style={styles.fileBtn} onPress={pickPhotos}>
              <MaterialCommunityIcons name="camera" size={22} color={colors.primary} />
              <Text style={styles.fileBtnText}>Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fileBtn} onPress={pickVideos}>
              <MaterialCommunityIcons name="video" size={22} color={colors.accent} />
              <Text style={styles.fileBtnText}>Videos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fileBtn} onPress={pickDocument}>
              <MaterialCommunityIcons name="file-pdf-box" size={22} color={colors.error} />
              <Text style={styles.fileBtnText}>PDF</Text>
            </TouchableOpacity>
          </View>

          {/* File list */}
          {files.map(file => (
            <View key={file.id} style={styles.fileItem}>
              {file.type === 'photo' ? (
                <Image source={{uri: file.uri}} style={styles.fileThumbnail} />
              ) : file.type === 'video' ? (
                <View style={styles.videoThumbnailContainer}>
                  <Image source={{uri: file.uri}} style={styles.fileThumbnail} />
                  <View style={styles.videoPlayOverlay}>
                    <MaterialCommunityIcons name="play-circle" size={24} color="#fff" />
                  </View>
                </View>
              ) : (
                <View style={styles.fileIconBox}>
                  <MaterialCommunityIcons name="file-pdf-box" size={28} color={colors.error} />
                </View>
              )}
              <View style={styles.fileInfo}>
                <Text style={typography.bodySmall} numberOfLines={1}>
                  {file.name}
                </Text>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: spacing.sm}}>
                  {file.size ? (
                    <Text style={typography.caption}>{formatSize(file.size)}</Text>
                  ) : null}
                  {file.type === 'video' && file.duration ? (
                    <Text style={typography.caption}>{file.duration}s</Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity onPress={() => removeFile(file.id)} style={styles.fileRemove}>
                <MaterialCommunityIcons name="close-circle" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Submit */}
          <View style={styles.sectionDivider} />
          <PrimaryButton
            title="Publier"
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
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoNoticeText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.primary,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  profileInfo: {
    marginLeft: spacing.md,
  },
  profileName: {
    ...typography.body,
    fontWeight: '600',
  },
  profileType: {
    ...typography.caption,
    color: colors.mutedText,
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
  textArea: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  themeChip: {
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
  themeChipText: {
    ...typography.bodySmall,
    fontWeight: '500',
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
  videoThumbnailContainer: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
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
  submitBtn: {
    width: '100%',
  },
});
