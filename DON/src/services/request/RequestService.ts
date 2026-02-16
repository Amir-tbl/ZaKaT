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
  increment,
} from 'firebase/firestore';
import {db, auth} from '../../lib/firebase';
import {ZakatRequest, Beneficiary, CreateRequestInput, RequestStatus} from './types';
import {profileService, isOrganizationProfile, isIndividualProfile} from '../profile';
import {uploadFiles} from '../storage/uploadFiles';

const COLLECTION_NAME = 'requests';

// Convert Firestore doc to ZakatRequest
function docToRequest(docId: string, data: any): ZakatRequest {
  return {
    id: docId,
    authorUserId: data.authorUserId || data.authorUid || 'unknown',
    authorDisplayName: data.authorDisplayName || 'Anonyme',
    title: data.title || '',
    category: data.category,
    description: data.description || '',
    goalAmount: data.goalAmount || 0,
    currency: data.currency || 'EUR',
    country: data.country || 'France',
    city: data.city || '',
    status: data.status || 'pending',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt || Date.now(),
    reviewedAt: data.reviewedAt instanceof Timestamp ? data.reviewedAt.toMillis() : data.reviewedAt,
    reviewedBy: data.reviewedBy,
    reviewNote: data.reviewNote,
    files: data.files || [],
    beneficiary: data.beneficiary || {
      firstName: 'Inconnu',
      lastName: '',
      country: 'France',
      showContactPublicly: false,
    },
    attestation: data.attestation,
    themes: data.themes || [],
    primaryTheme: data.primaryTheme,
    organizationId: data.organizationId,
    organizationName: data.organizationName,
    type: data.type || 'individual',
    urgent: data.urgent || false,
    impactText: data.impactText,
    details: data.details,
    postType: data.postType || 'individual_request',
    donTarget: data.donTarget || 'request',
    receivedAmountCents: data.receivedAmountCents || 0,
    donorCount: data.donorCount || 0,
  };
}

class RequestService {
  async getAll(): Promise<ZakatRequest[]> {
    try {
      // Only get verified requests (public) to comply with security rules
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'verified'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToRequest(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting requests:', error);
      return [];
    }
  }

  async getById(id: string): Promise<ZakatRequest | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return docToRequest(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('Error getting request:', error);
      return null;
    }
  }

  async getByUserId(userId: string): Promise<ZakatRequest[]> {
    try {
      // Use authorUid (Firebase Auth UID) to match security rules
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const q = query(
        collection(db, COLLECTION_NAME),
        where('authorUid', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToRequest(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting user requests:', error);
      return [];
    }
  }

  async getByStatus(status: RequestStatus): Promise<ZakatRequest[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToRequest(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting requests by status:', error);
      return [];
    }
  }

  async getMyRequests(): Promise<ZakatRequest[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const q = query(
        collection(db, COLLECTION_NAME),
        where('authorUid', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToRequest(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting my requests:', error);
      return [];
    }
  }

  async getByOrganizationId(organizationId: string): Promise<ZakatRequest[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToRequest(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting org requests:', error);
      return [];
    }
  }

  async getVerified(): Promise<ZakatRequest[]> {
    return this.getByStatus('verified');
  }

  async getByUserIds(userIds: string[]): Promise<ZakatRequest[]> {
    if (userIds.length === 0) return [];

    try {
      // Firestore 'in' query supports max 30 values, so we need to batch
      const allRequests: ZakatRequest[] = [];
      const batchSize = 30;

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const q = query(
          collection(db, COLLECTION_NAME),
          where('authorUid', 'in', batch),
          where('status', '==', 'verified')
        );
        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map(doc => docToRequest(doc.id, doc.data()));
        allRequests.push(...requests);
      }

      return allRequests;
    } catch (error) {
      console.error('Error getting requests by user IDs:', error);
      return [];
    }
  }

  async updateStatus(
    id: string,
    status: RequestStatus,
    reviewedBy?: string,
    reviewNote?: string,
  ): Promise<ZakatRequest | null> {
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
      console.error('Error updating request status:', error);
      return null;
    }
  }

  async create(input: CreateRequestInput): Promise<ZakatRequest> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create a request');
    }

    const profile = await profileService.getProfile();

    // Build author display name based on profile type
    let authorDisplayName = 'Anonyme';
    if (profile) {
      if (isIndividualProfile(profile)) {
        authorDisplayName = `${profile.firstName} ${profile.lastName.charAt(0)}.`.trim() || 'Anonyme';
      } else if (isOrganizationProfile(profile)) {
        authorDisplayName = profile.organizationName || profile.legalRepName || 'Association';
      }
    }

    // Deduce type from profile accountType
    const isOrg = profile && isOrganizationProfile(profile);
    const requestType = isOrg ? 'organization' : (input.type || 'individual');

    // Auto-verify if organization is verified
    const isOrgVerified = isOrg && profile.orgStatus === 'verified';
    const initialStatus: RequestStatus = isOrgVerified ? 'verified' : 'pending';

    // Attach organization info if profile is organization
    const organizationId = isOrg ? profile.id : input.organizationId;
    const organizationName = isOrg ? profile.organizationName : undefined;

    // Determine postType and donTarget
    let postType = input.postType;
    let donTarget = input.donTarget;

    if (!postType) {
      postType = isOrg ? 'org_campaign' : 'individual_request';
    }

    if (!donTarget) {
      donTarget = postType === 'individual_request' ? 'request' : 'organization';
    }

    // Determine primary theme
    const themes = input.themes || [];
    const primaryTheme = themes.length > 0 ? themes[0] : undefined;

    // Build request data, replacing undefined with null (Firestore doesn't accept undefined)
    const requestData: Record<string, any> = {
      authorUid: currentUser.uid,
      authorUserId: profile?.id || currentUser.uid,
      authorDisplayName,
      title: input.title || '',
      description: input.description || '',
      goalAmount: input.goalAmount || 0,
      currency: 'EUR',
      country: input.country || 'France',
      city: input.city || '',
      status: initialStatus,
      createdAt: serverTimestamp(),
      files: input.files || [],
      beneficiary: input.beneficiary || {
        firstName: 'Inconnu',
        lastName: '',
        country: 'France',
        showContactPublicly: false,
      },
      themes: themes || [],
      type: requestType,
      urgent: input.urgent || false,
      postType,
      donTarget,
      receivedAmountCents: 0,
      donorCount: 0,
    };

    // Add optional fields only if they have values (avoid undefined)
    if (input.category) requestData.category = input.category;
    if (input.attestation) requestData.attestation = input.attestation;
    if (primaryTheme) requestData.primaryTheme = primaryTheme;
    if (organizationId) requestData.organizationId = organizationId;
    if (organizationName) requestData.organizationName = organizationName;
    if (input.impactText) requestData.impactText = input.impactText;
    if (input.details) requestData.details = input.details;

    // Upload files to Firebase Storage and replace local URIs with download URLs
    if (input.files && input.files.length > 0) {
      const tempId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      requestData.files = await uploadFiles(`media/requests/${tempId}`, input.files);
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), requestData);

    return docToRequest(docRef.id, {
      ...requestData,
      createdAt: Date.now(),
    });
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  }

  async addDonation(requestId: string, amountCents: number): Promise<ZakatRequest | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, requestId);
      await updateDoc(docRef, {
        receivedAmountCents: increment(amountCents),
        donorCount: increment(1),
      });
      return this.getById(requestId);
    } catch (error) {
      console.error('Error adding donation to request:', error);
      return null;
    }
  }
}

export const requestService = new RequestService();
