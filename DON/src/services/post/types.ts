// Post = publication without donation (Instagram/LinkedIn style)

export interface PostFile {
  id: string;
  uri: string;
  name: string;
  type: 'photo' | 'video' | 'pdf';
  mimeType: string;
  size?: number;
  duration?: number; // Video duration in seconds
  thumbnailUri?: string; // Video thumbnail
}

export interface PostLocation {
  country: string;
  city?: string;
  address?: string; // Zone or precise address
}

export type PostStatus = 'pending' | 'verified' | 'rejected';

export interface Post {
  id: string;
  authorUserId: string;
  authorDisplayName: string;
  authorType: 'individual' | 'organization';
  organizationId?: string; // If author is organization
  organizationName?: string;
  description: string;
  themes: string[]; // Required, min 1
  primaryTheme?: string;
  location?: PostLocation;
  files: PostFile[];
  status: PostStatus;
  createdAt: number;
  // Engagement (for future use)
  viewCount?: number;
  likeCount?: number;
}

export interface CreatePostInput {
  description: string;
  themes: string[];
  primaryTheme?: string;
  location?: PostLocation;
  files: PostFile[];
}
