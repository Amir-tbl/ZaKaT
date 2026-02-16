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
import {Organization, OrganizationStatus, CreateOrganizationInput} from './types';

const COLLECTION_NAME = 'organizations';

// Convert Firestore doc to Organization
function docToOrganization(docId: string, data: any): Organization {
  const status = data.status || (data.verified ? 'verified' : 'pending');
  return {
    id: docId,
    name: data.name || '',
    logoUrl: data.logoUrl,
    description: data.description || '',
    country: data.country || 'France',
    themes: data.themes || [],
    verified: status === 'verified',
    status,
    ownerUid: data.ownerUid,
    website: data.website,
    partnershipLevel: data.partnershipLevel || 'none',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt || Date.now(),
    reviewedAt: data.reviewedAt instanceof Timestamp ? data.reviewedAt.toMillis() : data.reviewedAt,
    reviewedBy: data.reviewedBy,
    reviewNote: data.reviewNote,
    walletBalanceCents: data.walletBalanceCents || 0,
    donorCount: data.donorCount || 0,
  };
}

class OrganizationService {
  async getAll(): Promise<Organization[]> {
    try {
      // Only get verified organizations (public)
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'verified'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToOrganization(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting organizations:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Organization | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return docToOrganization(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('Error getting organization:', error);
      return null;
    }
  }

  async getByStatus(status: OrganizationStatus): Promise<Organization[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToOrganization(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting organizations by status:', error);
      return [];
    }
  }

  async getVerified(): Promise<Organization[]> {
    return this.getByStatus('verified');
  }

  async getMyOrganizations(): Promise<Organization[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const q = query(
        collection(db, COLLECTION_NAME),
        where('ownerUid', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToOrganization(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting my organizations:', error);
      return [];
    }
  }

  async updateStatus(
    id: string,
    status: OrganizationStatus,
    reviewedBy?: string,
    reviewNote?: string,
  ): Promise<Organization | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        status,
        verified: status === 'verified',
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewedBy || null,
        reviewNote: reviewNote || null,
      });
      return this.getById(id);
    } catch (error) {
      console.error('Error updating organization status:', error);
      return null;
    }
  }

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create an organization');
    }

    const orgData: Record<string, any> = {
      ownerUid: currentUser.uid,
      name: input.name,
      description: input.description || '',
      country: input.country || 'France',
      themes: input.themes || [],
      status: 'pending' as OrganizationStatus,
      verified: false,
      partnershipLevel: input.partnershipLevel || 'none',
      createdAt: serverTimestamp(),
      walletBalanceCents: 0,
      donorCount: 0,
    };

    // Add optional fields
    if (input.logoUrl) orgData.logoUrl = input.logoUrl;
    if (input.website) orgData.website = input.website;

    const docRef = await addDoc(collection(db, COLLECTION_NAME), orgData);

    return docToOrganization(docRef.id, {
      ...orgData,
      createdAt: Date.now(),
    });
  }

  async addDonation(organizationId: string, amountCents: number): Promise<Organization | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, organizationId);
      await updateDoc(docRef, {
        walletBalanceCents: increment(amountCents),
        donorCount: increment(1),
      });
      return this.getById(organizationId);
    } catch (error) {
      console.error('Error adding donation to organization:', error);
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting organization:', error);
      throw error;
    }
  }
}

export const organizationService = new OrganizationService();
