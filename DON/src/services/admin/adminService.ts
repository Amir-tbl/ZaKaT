import {doc, getDoc} from 'firebase/firestore';
import {db, auth} from '../../lib/firebase';

/**
 * Check if the current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  try {
    const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if a specific user is an admin
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
