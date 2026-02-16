import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {db, auth} from '../../lib/firebase';
import {Post, CreatePostInput, PostStatus} from './types';
import {profileService, isOrganizationProfile, isIndividualProfile} from '../profile';
import {uploadFiles} from '../storage/uploadFiles';

const COLLECTION_NAME = 'posts';

// Remove undefined values recursively (Firestore rejects undefined)
function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Timestamp)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)])
    );
  }
  return obj;
}

// Convert Firestore doc to Post
function docToPost(docId: string, data: any): Post {
  return {
    id: docId,
    authorUserId: data.authorUserId || data.authorUid || 'unknown',
    authorDisplayName: data.authorDisplayName || 'Anonyme',
    authorType: data.authorType || 'individual',
    organizationId: data.organizationId,
    organizationName: data.organizationName,
    description: data.description || '',
    themes: data.themes || [],
    primaryTheme: data.primaryTheme,
    location: data.location,
    files: data.files || [],
    status: data.status || 'pending',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt || Date.now(),
    viewCount: data.viewCount || 0,
    likeCount: data.likeCount || 0,
  };
}

class PostService {
  async getAll(): Promise<Post[]> {
    try {
      // Only get verified posts (public)
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'verified'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToPost(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting posts:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Post | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return docToPost(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('Error getting post:', error);
      return null;
    }
  }

  async getByUserId(userId: string): Promise<Post[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('authorUid', '==', userId),
        where('status', '==', 'verified'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToPost(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting user posts:', error);
      return [];
    }
  }

  async getByUserIds(userIds: string[]): Promise<Post[]> {
    if (userIds.length === 0) return [];

    try {
      // Firestore 'in' query supports max 30 values, so we need to batch
      const allPosts: Post[] = [];
      const batchSize = 30;

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const q = query(
          collection(db, COLLECTION_NAME),
          where('authorUid', 'in', batch),
          where('status', '==', 'verified')
        );
        const snapshot = await getDocs(q);
        const posts = snapshot.docs.map(doc => docToPost(doc.id, doc.data()));
        allPosts.push(...posts);
      }

      return allPosts;
    } catch (error) {
      console.error('Error getting posts by user IDs:', error);
      return [];
    }
  }

  async getByOrganizationId(organizationId: string): Promise<Post[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('status', '==', 'verified'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToPost(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting org posts:', error);
      return [];
    }
  }

  async getByStatus(status: PostStatus): Promise<Post[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToPost(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting posts by status:', error);
      return [];
    }
  }

  async getMyPosts(): Promise<Post[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const q = query(
        collection(db, COLLECTION_NAME),
        where('authorUid', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToPost(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting my posts:', error);
      return [];
    }
  }

  async updateStatus(
    id: string,
    status: PostStatus,
    reviewedBy?: string,
    reviewNote?: string,
  ): Promise<Post | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewedBy || null,
        reviewNote: reviewNote || null,
      });
      return this.getById(id);
    } catch (error) {
      console.error('Error updating post status:', error);
      return null;
    }
  }

  async create(input: CreatePostInput): Promise<Post> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create a post');
    }

    const profile = await profileService.getProfile();

    // Build author info
    let authorDisplayName = 'Anonyme';
    let authorType: 'individual' | 'organization' = 'individual';
    let organizationId: string | undefined;
    let organizationName: string | undefined;

    // Check if organization is verified for auto-approval
    let isOrgVerified = false;

    if (profile) {
      if (isIndividualProfile(profile)) {
        authorDisplayName = `${profile.firstName} ${profile.lastName.charAt(0)}.`.trim() || 'Anonyme';
        authorType = 'individual';
      } else if (isOrganizationProfile(profile)) {
        authorDisplayName = profile.organizationName || profile.legalRepName || 'Association';
        authorType = 'organization';
        organizationId = profile.id;
        organizationName = profile.organizationName;
        isOrgVerified = profile.orgStatus === 'verified';
      }
    }

    // Auto-verify posts from verified organizations
    const initialStatus: PostStatus = isOrgVerified ? 'verified' : 'pending';

    // Build post data
    const postData: Record<string, any> = {
      authorUid: currentUser.uid,
      authorUserId: profile?.id || currentUser.uid,
      authorDisplayName,
      authorType,
      description: input.description,
      themes: input.themes || [],
      primaryTheme: input.themes?.length > 0 ? input.themes[0] : null,
      files: input.files || [],
      status: initialStatus,
      createdAt: serverTimestamp(),
      viewCount: 0,
      likeCount: 0,
    };

    // Add optional fields only if they have values
    if (input.location) postData.location = input.location;
    if (organizationId) postData.organizationId = organizationId;
    if (organizationName) postData.organizationName = organizationName;

    // Upload files to Firebase Storage and replace local URIs with download URLs
    if (input.files && input.files.length > 0) {
      // Use a temporary ID for the folder, then we'll have the real doc ID
      const tempId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      postData.files = await uploadFiles(`media/posts/${tempId}`, input.files);
    }

    const cleanData = removeUndefined(postData);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);

    return docToPost(docRef.id, {
      ...postData,
      createdAt: Date.now(),
    });
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
}

export const postService = new PostService();
