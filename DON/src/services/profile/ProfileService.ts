import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {db, auth} from '../../lib/firebase';
import {
  UserProfile,
  IndividualProfile,
  OrganizationProfile,
  UpdateProfileInput,
  CreateProfileInput,
  CreateIndividualProfileInput,
  CreateOrganizationProfileInput,
} from './types';

const COLLECTION_NAME = 'users';
const CACHE_KEY = '@user_profile';

// Convert Firestore doc to UserProfile
function docToProfile(docId: string, data: any): UserProfile {
  const base = {
    id: docId,
    email: data.email || '',
    phone: data.phone || '',
    city: data.city || '',
    country: data.country || 'France',
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt || Date.now(),
    accountType: data.accountType || 'individual',
  };

  if (data.accountType === 'organization') {
    return {
      ...base,
      accountType: 'organization',
      organizationName: data.organizationName || '',
      orgDescription: data.orgDescription || '',
      legalRepName: data.legalRepName || '',
      siret: data.siret,
      rna: data.rna,
      registrationPending: data.registrationPending || false,
      foundedYear: data.foundedYear,
      website: data.website,
      socialNetworks: data.socialNetworks,
      logoUri: data.logoUri,
      operatingCountries: data.operatingCountries,
      themes: data.themes,
      orgStatus: data.orgStatus || 'pending',
    } as OrganizationProfile;
  }

  return {
    ...base,
    accountType: 'individual',
    title: data.title || 'non_specifie',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
  } as IndividualProfile;
}

class ProfileService {
  // Get profile from Firestore (with local cache fallback)
  async getProfile(): Promise<UserProfile | null> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      // Try local cache if not authenticated yet
      return this.getFromCache();
    }

    try {
      // Fetch from Firestore
      const docRef = doc(db, COLLECTION_NAME, currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profile = docToProfile(docSnap.id, docSnap.data());
        // Update local cache
        await this.saveToCache(profile);
        return profile;
      }

      // No profile in Firestore, check cache
      return this.getFromCache();
    } catch (error) {
      console.error('Error getting profile from Firestore:', error);
      // Fallback to cache on error
      return this.getFromCache();
    }
  }

  // Get profile by user ID (for viewing other profiles)
  async getProfileById(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return docToProfile(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('Error getting profile by ID:', error);
      return null;
    }
  }

  // Create profile in Firestore
  async createProfile(input: CreateProfileInput): Promise<UserProfile> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create a profile');
    }

    const profileData: Record<string, any> = {
      email: input.email,
      accountType: input.accountType,
      updatedAt: serverTimestamp(),
    };

    if (input.accountType === 'individual') {
      const indInput = input as CreateIndividualProfileInput;
      profileData.title = indInput.title;
      profileData.firstName = indInput.firstName;
      profileData.lastName = indInput.lastName;
      profileData.phone = indInput.phone || '';
      profileData.city = indInput.city || '';
      profileData.country = indInput.country || 'France';
    } else {
      const orgInput = input as CreateOrganizationProfileInput;
      profileData.organizationName = orgInput.organizationName;
      profileData.orgDescription = orgInput.orgDescription;
      profileData.legalRepName = orgInput.legalRepName;
      profileData.phone = orgInput.phone || '';
      profileData.city = orgInput.city || '';
      profileData.country = orgInput.country || 'France';
      profileData.registrationPending = orgInput.registrationPending || false;
      profileData.orgStatus = 'pending';

      // Optional fields
      if (orgInput.siret) profileData.siret = orgInput.siret;
      if (orgInput.rna) profileData.rna = orgInput.rna;
      if (orgInput.foundedYear) profileData.foundedYear = orgInput.foundedYear;
      if (orgInput.website) profileData.website = orgInput.website;
      if (orgInput.socialNetworks) profileData.socialNetworks = orgInput.socialNetworks;
      if (orgInput.logoUri) profileData.logoUri = orgInput.logoUri;
      if (orgInput.operatingCountries) profileData.operatingCountries = orgInput.operatingCountries;
      if (orgInput.themes) profileData.themes = orgInput.themes;
    }

    // Use Firebase Auth UID as document ID
    const docRef = doc(db, COLLECTION_NAME, currentUser.uid);
    await setDoc(docRef, profileData);

    const profile = docToProfile(currentUser.uid, {
      ...profileData,
      updatedAt: Date.now(),
    });

    await this.saveToCache(profile);
    return profile;
  }

  // Create simple profile (for new users)
  async createProfileSimple(email: string): Promise<UserProfile> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create a profile');
    }

    const profileData = {
      email,
      accountType: 'individual',
      title: 'non_specifie',
      firstName: '',
      lastName: '',
      phone: '',
      city: '',
      country: 'France',
      updatedAt: serverTimestamp(),
    };

    const docRef = doc(db, COLLECTION_NAME, currentUser.uid);
    await setDoc(docRef, profileData);

    const profile: IndividualProfile = {
      id: currentUser.uid,
      accountType: 'individual',
      email,
      title: 'non_specifie',
      firstName: '',
      lastName: '',
      phone: '',
      city: '',
      country: 'France',
      updatedAt: Date.now(),
    };

    await this.saveToCache(profile);
    return profile;
  }

  // Update profile in Firestore
  async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to update profile');
    }

    const current = await this.getProfile();
    if (!current) {
      throw new Error('Profil non trouve');
    }

    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    // Only add fields that are defined
    if (input.title !== undefined) updateData.title = input.title;
    if (input.firstName !== undefined) updateData.firstName = input.firstName;
    if (input.lastName !== undefined) updateData.lastName = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.country !== undefined) updateData.country = input.country;

    const docRef = doc(db, COLLECTION_NAME, currentUser.uid);
    await updateDoc(docRef, updateData);

    const updated: UserProfile = {
      ...current,
      ...input,
      updatedAt: Date.now(),
    } as UserProfile;

    await this.saveToCache(updated);
    return updated;
  }

  // Get or create profile
  async getOrCreateProfile(email: string): Promise<UserProfile> {
    const existing = await this.getProfile();
    if (existing) {
      return existing;
    }
    return this.createProfileSimple(email);
  }

  // Delete profile
  async deleteProfile(): Promise<void> {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const docRef = doc(db, COLLECTION_NAME, currentUser.uid);
        await deleteDoc(docRef);
      } catch (error) {
        console.error('Error deleting profile from Firestore:', error);
      }
    }
    await this.clearCache();
  }

  // Search users by name, city, or organization name
  async searchUsers(searchQuery: string): Promise<UserProfile[]> {
    if (!searchQuery.trim()) return [];

    try {
      const q = searchQuery.toLowerCase().trim();
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));

      const results: UserProfile[] = [];
      const currentUserId = auth.currentUser?.uid;

      snapshot.docs.forEach(docSnap => {
        // Don't include current user in search results
        if (docSnap.id === currentUserId) return;

        const data = docSnap.data();
        const profile = docToProfile(docSnap.id, data);

        // Search in various fields
        const firstName = (data.firstName || '').toLowerCase();
        const lastName = (data.lastName || '').toLowerCase();
        const organizationName = (data.organizationName || '').toLowerCase();
        const city = (data.city || '').toLowerCase();
        const country = (data.country || '').toLowerCase();

        if (
          firstName.includes(q) ||
          lastName.includes(q) ||
          organizationName.includes(q) ||
          city.includes(q) ||
          country.includes(q) ||
          `${firstName} ${lastName}`.includes(q)
        ) {
          results.push(profile);
        }
      });

      return results.slice(0, 20); // Limit to 20 results
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get all verified organizations
  async getVerifiedOrganizations(): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('accountType', '==', 'organization'),
        where('orgStatus', '==', 'verified')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => docToProfile(docSnap.id, docSnap.data()));
    } catch (error) {
      console.error('Error getting verified organizations:', error);
      return [];
    }
  }

  // ========== CACHE HELPERS ==========

  private async getFromCache(): Promise<UserProfile | null> {
    try {
      const json = await AsyncStorage.getItem(CACHE_KEY);
      if (!json) return null;
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private async saveToCache(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving profile to cache:', error);
    }
  }

  async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(CACHE_KEY);
  }
}

export const profileService = new ProfileService();
