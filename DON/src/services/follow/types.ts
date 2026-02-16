export type FollowingType = 'user' | 'organization';

export interface Follow {
  id: string;
  followerUserId: string; // Who is following (profile ID)
  followerUid?: string; // Firebase Auth UID
  followerName?: string; // Display name of follower
  followingType: FollowingType;
  followingId: string; // User or organization being followed
  createdAt: number;
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
}
