import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors, spacing, typography, borderRadius, shadows} from '../theme';
import {EmptyState} from '../components';
import {PostCard} from '../components/PostCard';
import {ZakatRequest, requestService} from '../services/request';
import {Post, postService} from '../services/post';
import {Organization, organizationService} from '../services/organization';
import {profileService, UserProfile, isOrganizationProfile, isIndividualProfile} from '../services/profile';
import {getThemeById, THEMES} from '../services/themes';

interface Props {
  navigation: any;
}

export function SearchScreen({navigation}: Props) {
  const inputRef = useRef<TextInput>(null);
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState<ZakatRequest[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadData();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (search.trim().length >= 2) {
        setSearchLoading(true);
        const results = await profileService.searchUsers(search);
        setUsers(results);
        setSearchLoading(false);
      } else {
        setUsers([]);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  async function loadData() {
    const [reqs, allPosts, orgs] = await Promise.all([
      requestService.getByStatus('verified'),
      postService.getAll(),
      organizationService.getVerified(),
    ]);
    setRequests(reqs);
    setPosts(allPosts);
    setOrganizations(orgs);
    setLoading(false);
  }

  const q = search.toLowerCase().trim();
  const isSearching = q.length > 0;

  const filteredRequests = isSearching
    ? requests.filter(r => {
        const ben = r.beneficiary;
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.country.toLowerCase().includes(q) ||
          ben.firstName.toLowerCase().includes(q) ||
          ben.lastName.toLowerCase().includes(q) ||
          (ben.city && ben.city.toLowerCase().includes(q)) ||
          ben.country.toLowerCase().includes(q) ||
          (r.organizationName && r.organizationName.toLowerCase().includes(q)) ||
          r.themes.some(t => t.toLowerCase().includes(q))
        );
      })
    : [];

  const filteredPosts = isSearching
    ? posts.filter(p =>
        p.description.toLowerCase().includes(q) ||
        p.authorDisplayName.toLowerCase().includes(q) ||
        (p.location?.city && p.location.city.toLowerCase().includes(q)) ||
        (p.location?.country && p.location.country.toLowerCase().includes(q)) ||
        p.themes.some(t => t.toLowerCase().includes(q)),
      )
    : [];

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function getDisplayName(profile: UserProfile): string {
    if (isOrganizationProfile(profile)) {
      return profile.organizationName || 'Association';
    } else if (isIndividualProfile(profile)) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Utilisateur';
    }
    return 'Utilisateur';
  }

  function openDetail(id: string) {
    navigation.navigate('RequestDetail', {requestId: id, from: 'explorer'});
  }

  function openPostDetail(postId: string) {
    navigation.navigate('PostDetail', {postId, from: 'explorer'});
  }

  function openUserProfile(userId: string) {
    navigation.navigate('UserProfile', {userId});
  }

  function openOrganization(orgId: string) {
    navigation.navigate('OrganizationProfile', {organizationId: orgId});
  }

  function handleAuthorPress(userId: string, type: 'user' | 'organization') {
    if (type === 'organization') {
      navigation.navigate('OrganizationProfile', {organizationId: userId});
    } else {
      navigation.navigate('UserProfile', {userId});
    }
  }

  function handlePdfPress(uri: string, name: string) {
    navigation.navigate('PdfViewer', {uri, title: name});
  }

  function handleMediaPress(media: Array<{id: string; uri: string; type: 'photo' | 'video'; duration?: number}>, initialIndex: number) {
    navigation.navigate('MediaViewer', {media, initialIndex});
  }

  const totalResults = users.length + filteredRequests.length + filteredPosts.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.mutedText} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={colors.mutedText}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !isSearching ? (
        /* Empty state - suggestions */
        <ScrollView contentContainerStyle={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyPrompt}>
            <MaterialCommunityIcons name="magnify" size={48} color={colors.border} />
            <Text style={styles.emptyPromptTitle}>Rechercher sur ZaKaT</Text>
            <Text style={styles.emptyPromptText}>
              Trouvez des profils, demandes, associations et publications
            </Text>
          </View>

          {/* Quick theme shortcuts */}
          <Text style={styles.suggestionsTitle}>Explorer par thème</Text>
          <View style={styles.themesGrid}>
            {THEMES.map(theme => (
              <TouchableOpacity
                key={theme.id}
                style={styles.themeChip}
                onPress={() => setSearch(theme.label)}>
                <MaterialCommunityIcons name={theme.icon as any} size={18} color={theme.color} />
                <Text style={[styles.themeChipText, {color: theme.color}]}>{theme.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Top organizations */}
          {organizations.length > 0 && (
            <>
              <Text style={styles.suggestionsTitle}>Associations</Text>
              {organizations.slice(0, 5).map(org => (
                <TouchableOpacity
                  key={org.id}
                  style={styles.suggestionItem}
                  onPress={() => openOrganization(org.id)}>
                  <View style={styles.suggestionAvatar}>
                    <Text style={styles.suggestionAvatarText}>{org.name.charAt(0)}</Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.suggestionName}>{org.name}</Text>
                    <Text style={styles.suggestionSub}>{org.country}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      ) : (
        /* Search results */
        <ScrollView contentContainerStyle={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          {searchLoading && (
            <ActivityIndicator size="small" color={colors.primary} style={{marginVertical: spacing.sm}} />
          )}

          {/* Profiles */}
          {users.length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>
                Profils ({users.length})
              </Text>
              {users.slice(0, 5).map(profile => (
                <TouchableOpacity
                  key={profile.id}
                  style={styles.userCard}
                  onPress={() => openUserProfile(profile.id)}>
                  <View style={[styles.userAvatar, isOrganizationProfile(profile) && styles.userAvatarOrg]}>
                    <Text style={styles.userAvatarText}>{getDisplayName(profile).charAt(0)}</Text>
                  </View>
                  <View style={{flex: 1, marginLeft: spacing.md}}>
                    <Text style={styles.userName}>{getDisplayName(profile)}</Text>
                    <Text style={styles.userType}>
                      {isOrganizationProfile(profile) ? 'Association' : 'Particulier'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Requests */}
          {filteredRequests.length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>
                Demandes ({filteredRequests.length})
              </Text>
              {filteredRequests.slice(0, 10).map(item => {
                const firstPhoto = item.files.find(f => f.type === 'photo');
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.requestCard}
                    onPress={() => openDetail(item.id)}>
                    {firstPhoto && (
                      <Image source={{uri: firstPhoto.uri}} style={styles.requestThumb} />
                    )}
                    <View style={{flex: 1}}>
                      <Text style={styles.requestTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.requestSub} numberOfLines={1}>
                        {item.city}, {item.country}
                      </Text>
                      {item.goalAmount > 0 && (
                        <Text style={styles.requestAmount}>{formatAmount(item.goalAmount)}</Text>
                      )}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedText} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Posts */}
          {filteredPosts.length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>
                Publications ({filteredPosts.length})
              </Text>
              {filteredPosts.slice(0, 5).map(item => (
                <PostCard
                  key={item.id}
                  post={item}
                  onPress={openPostDetail}
                  onAuthorPress={handleAuthorPress}
                  onPdfPress={handlePdfPress}
                  onMediaPress={handleMediaPress}
                />
              ))}
            </View>
          )}

          {/* No results */}
          {!searchLoading && totalResults === 0 && q.length >= 2 && (
            <EmptyState
              icon="magnify"
              title="Aucun résultat"
              message={`Aucun résultat pour "${search}"`}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty / suggestions
  suggestionsContainer: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  emptyPrompt: {
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyPromptTitle: {
    ...typography.h3,
    color: colors.text,
  },
  emptyPromptText: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: 'center',
  },
  suggestionsTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeChipText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  suggestionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  suggestionName: {
    ...typography.body,
    fontWeight: '600',
  },
  suggestionSub: {
    ...typography.caption,
    color: colors.mutedText,
  },
  // Results
  resultsContainer: {
    paddingBottom: 40,
  },
  resultSection: {
    marginBottom: spacing.md,
  },
  resultSectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarOrg: {
    backgroundColor: colors.accent,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  userName: {
    ...typography.body,
    fontWeight: '600',
  },
  userType: {
    ...typography.caption,
    color: colors.mutedText,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  requestThumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
  },
  requestTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  requestSub: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
  requestAmount: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});
