import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { CreateReportInput, Report } from './types';

const COLLECTION_NAME = 'reports';

class ReportService {
  async create(input: CreateReportInput): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Vous devez etre connecte pour signaler');
    }

    // Get reporter name
    let reporterName = 'Utilisateur';
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        reporterName = data.displayName ||
          `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
          'Utilisateur';
      }
    } catch (e) {
      console.warn('Could not get reporter name:', e);
    }

    const reportData = {
      reporterUserId: currentUser.uid,
      reporterName,
      reportedContentId: input.reportedContentId || null,
      reportedContentType: input.reportedContentType,
      reportedUserId: input.reportedUserId || null,
      reportedUserName: input.reportedUserName || null,
      reason: input.reason,
      message: input.message || null,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), reportData);
    return docRef.id;
  }
}

export const reportService = new ReportService();
