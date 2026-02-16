export type NotificationType =
  | 'NEW_POST_FROM_FOLLOWING'
  | 'NEW_FOLLOWER'
  | 'FUNDING_50'
  | 'FUNDING_100'
  | 'NEW_DONATION'
  | 'REQUEST_VERIFIED'
  | 'REQUEST_REJECTED'
  | 'ORG_VERIFIED'
  | 'ORG_REJECTED';

export interface Notification {
  id: string;
  userId: string; // Recipient of the notification
  type: NotificationType;
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
  deepLink?: string; // e.g., 'profile/123' or 'post/456'
  // Additional context
  relatedUserId?: string;
  relatedUserName?: string;
  relatedPostId?: string;
  relatedRequestId?: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  deepLink?: string;
  relatedUserId?: string;
  relatedUserName?: string;
  relatedPostId?: string;
  relatedRequestId?: string;
}
