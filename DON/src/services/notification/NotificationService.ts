import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import {db, auth} from '../../lib/firebase';
import {Notification} from './types';

const COLLECTION_NAME = 'notifications';

// Convert Firestore doc to Notification
function docToNotification(docId: string, data: any): Notification {
  return {
    id: docId,
    userId: data.userId,
    type: data.type,
    title: data.title || '',
    message: data.message || '',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt || Date.now(),
    read: data.read || false,
    deepLink: data.deepLink,
    relatedUserId: data.relatedUserId,
    relatedUserName: data.relatedUserName,
    relatedPostId: data.relatedPostId,
    relatedRequestId: data.relatedRequestId,
  };
}

class NotificationService {
  async listNotifications(userId?: string): Promise<Notification[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      // Use the auth uid to query notifications
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToNotification(doc.id, doc.data()));
    } catch (error) {
      console.error('Error listing notifications:', error);
      return [];
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {read: true});
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead(userId?: string): Promise<void> {
    try {
      const notifications = await this.listNotifications(userId);
      const unread = notifications.filter(n => !n.read);

      // Mark each unread notification as read
      await Promise.all(
        unread.map(n => this.markAsRead(n.id))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  async getUnreadCount(userId?: string): Promise<number> {
    try {
      const notifications = await this.listNotifications(userId);
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  async deleteAllForUser(userId?: string): Promise<void> {
    try {
      const notifications = await this.listNotifications(userId);
      await Promise.all(
        notifications.map(n => this.deleteNotification(n.id))
      );
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
