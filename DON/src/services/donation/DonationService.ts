import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {db, auth} from '../../lib/firebase';
import {Donation, CreateDonationInput, TreasuryStats} from './types';
import {profileService, isIndividualProfile, isOrganizationProfile} from '../profile';

const DONATIONS_COLLECTION = 'donations';
const TREASURY_COLLECTION = 'treasury';
const TREASURY_DOC_ID = 'global';

// Convert Firestore doc to Donation
function docToDonation(docId: string, data: any): Donation {
  // Handle both old format (type, requestId) and new format (targetType, targetId)
  const donationType = data.targetType || data.type || 'request';
  let requestId = data.requestId;
  let organizationId = data.organizationId;

  // Map targetId to requestId/organizationId based on targetType
  if (data.targetType && data.targetId) {
    if (data.targetType === 'request') {
      requestId = data.targetId;
    } else if (data.targetType === 'organization') {
      organizationId = data.targetId;
    }
  }

  return {
    id: docId,
    donorUserId: data.donorUserId || data.donorUid || 'unknown',
    donorName: data.donorName || 'Anonyme',
    type: donationType,
    requestId,
    organizationId,
    amountCents: data.amountCents || 0,
    currency: data.currency || 'EUR',
    message: data.message,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt || Date.now(),
  };
}

class DonationService {
  // ========== DONATIONS ==========

  async getDonationsByRequestId(requestId: string): Promise<Donation[]> {
    try {
      const q = query(
        collection(db, DONATIONS_COLLECTION),
        where('requestId', '==', requestId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToDonation(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting donations by request:', error);
      return [];
    }
  }

  async getDonationsByUserId(userId: string): Promise<Donation[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const q = query(
        collection(db, DONATIONS_COLLECTION),
        where('donorUid', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToDonation(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting donations by user:', error);
      return [];
    }
  }

  async getDonationsByOrganizationId(organizationId: string): Promise<Donation[]> {
    try {
      const q = query(
        collection(db, DONATIONS_COLLECTION),
        where('organizationId', '==', organizationId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToDonation(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting donations by org:', error);
      return [];
    }
  }

  async getMyDonations(): Promise<Donation[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];
    return this.getDonationsByUserId(currentUser.uid);
  }

  async createDonation(input: CreateDonationInput): Promise<Donation> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to make a donation');
    }

    const profile = await profileService.getProfile();

    // Build donor name
    let donorName = 'Anonyme';
    if (profile) {
      if (isIndividualProfile(profile)) {
        donorName = `${profile.firstName} ${profile.lastName.charAt(0)}.`.trim() || 'Anonyme';
      } else if (isOrganizationProfile(profile)) {
        donorName = profile.organizationName || 'Association';
      }
    }

    // Determine targetId based on type
    let targetId: string | null = null;
    if (input.type === 'request' && input.requestId) {
      targetId = input.requestId;
    } else if (input.type === 'organization' && input.organizationId) {
      targetId = input.organizationId;
    }

    // Build donation data (matching Cloud Function expected format)
    const donationData: Record<string, any> = {
      donorUid: currentUser.uid,
      donorUserId: profile?.id || currentUser.uid,
      donorName,
      targetType: input.type, // 'treasury', 'request', or 'organization'
      targetId: targetId,
      amountCents: input.amountCents,
      currency: 'EUR',
      createdAt: serverTimestamp(),
    };

    // Add optional message
    if (input.message) donationData.message = input.message;

    const docRef = await addDoc(collection(db, DONATIONS_COLLECTION), donationData);

    return docToDonation(docRef.id, {
      ...donationData,
      createdAt: Date.now(),
    });
  }

  // ========== TREASURY ==========

  async getTreasuryStats(): Promise<TreasuryStats> {
    try {
      const docRef = doc(db, TREASURY_COLLECTION, TREASURY_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {totalAmountCents: 0, donationCount: 0};
      }
      const data = docSnap.data();
      return {
        totalAmountCents: data.totalAmountCents || 0,
        donationCount: data.donationCount || 0,
      };
    } catch (error) {
      console.error('Error getting treasury stats:', error);
      return {totalAmountCents: 0, donationCount: 0};
    }
  }

  // Note: Treasury updates are handled by Cloud Functions (processDonation)
  // This method is kept for backward compatibility but doesn't update Firestore
  async addToTreasury(amountCents: number): Promise<TreasuryStats> {
    // Treasury updates are done via Cloud Functions
    // Just return the current stats
    return this.getTreasuryStats();
  }

  // ========== HELPERS ==========

  formatAmountCents(amountCents: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountCents / 100);
  }
}

export const donationService = new DonationService();
