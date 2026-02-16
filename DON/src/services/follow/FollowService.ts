import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {db, auth} from '../../lib/firebase';
import {Follow, FollowingType} from './types';
import {profileService, isIndividualProfile, isOrganizationProfile} from '../profile';

const COLLECTION_NAME = 'follows';

// Convert Firestore doc to Follow
function docToFollow(docId: string, data: any): Follow {
  return {
    id: docId,
    followerUserId: data.followerUserId || data.followerUid,
    followerUid: data.followerUid,
    followingType: data.followingType,
    followingId: data.followingId,
    followerName: data.followerName,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt || Date.now(),
  };
}

class FollowService {
  async follow(followingType: FollowingType, followingId: string): Promise<Follow | null> {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const profile = await profileService.getProfile();
    if (!profile) return null;

    // Check if already following
    const existing = await this.isFollowing(followingType, followingId);
    if (existing) return null;

    // Get follower name
    let followerName = 'Un utilisateur';
    if (isIndividualProfile(profile)) {
      followerName = `${profile.firstName} ${profile.lastName}`.trim() || 'Utilisateur';
    } else if (isOrganizationProfile(profile)) {
      followerName = profile.organizationName || 'Association';
    }

    // Create follow document in Firestore
    const followData = {
      followerUid: currentUser.uid,
      followerUserId: profile.id,
      followerName,
      followingType,
      followingId,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), followData);

    return {
      id: docRef.id,
      followerUserId: profile.id,
      followerUid: currentUser.uid,
      followerName,
      followingType,
      followingId,
      createdAt: Date.now(),
    };
  }

  async unfollow(followingType: FollowingType, followingId: string): Promise<boolean> {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    try {
      // Find the follow document
      const q = query(
        collection(db, COLLECTION_NAME),
        where('followerUid', '==', currentUser.uid),
        where('followingType', '==', followingType),
        where('followingId', '==', followingId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return false;

      // Delete the follow document
      await deleteDoc(snapshot.docs[0].ref);
      return true;
    } catch (error) {
      console.error('Error unfollowing:', error);
      return false;
    }
  }

  async isFollowing(followingType: FollowingType, followingId: string): Promise<boolean> {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('followerUid', '==', currentUser.uid),
        where('followingType', '==', followingType),
        where('followingId', '==', followingId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  async listFollowing(): Promise<Follow[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('followerUid', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToFollow(doc.id, doc.data()));
    } catch (error) {
      console.error('Error listing following:', error);
      return [];
    }
  }

  async listFollowingByType(type: FollowingType): Promise<Follow[]> {
    const following = await this.listFollowing();
    return following.filter(f => f.followingType === type);
  }

  async getFollowingIds(): Promise<string[]> {
    const following = await this.listFollowing();
    return following.map(f => f.followingId);
  }

  async getFollowingUserIds(): Promise<string[]> {
    const following = await this.listFollowingByType('user');
    return following.map(f => f.followingId);
  }

  async getFollowingOrganizationIds(): Promise<string[]> {
    const following = await this.listFollowingByType('organization');
    return following.map(f => f.followingId);
  }

  async getFollowersCount(followingType: FollowingType, followingId: string): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('followingType', '==', followingType),
        where('followingId', '==', followingId)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting followers count:', error);
      return 0;
    }
  }

  async getFollowingCount(): Promise<number> {
    const following = await this.listFollowing();
    return following.length;
  }

  // ========== FOLLOWERS (people who follow a specific user/org) ==========

  async listFollowersRaw(followingType: FollowingType, followingId: string): Promise<Follow[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('followingType', '==', followingType),
        where('followingId', '==', followingId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => docToFollow(doc.id, doc.data()));
    } catch (error) {
      console.error('Error listing followers:', error);
      return [];
    }
  }

  async getFollowerUserIds(followingType: FollowingType, followingId: string): Promise<string[]> {
    const followers = await this.listFollowersRaw(followingType, followingId);
    return followers.map(f => f.followerUserId);
  }

  // Get followers for current user
  async getMyFollowers(): Promise<Follow[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    // Get followers who follow the current user
    return this.listFollowersRaw('user', currentUser.uid);
  }

  async getMyFollowersCount(): Promise<number> {
    const followers = await this.getMyFollowers();
    return followers.length;
  }

  // Get following list for current user (returns Follow objects)
  async getMyFollowing(): Promise<Follow[]> {
    return this.listFollowing();
  }

  async getMyFollowingCount(): Promise<number> {
    return this.getFollowingCount();
  }
}

export const followService = new FollowService();
