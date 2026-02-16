export type ReportContentType = 'post' | 'request' | 'user';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'scam'
  | 'fake'
  | 'other';

export interface Report {
  id: string;
  reporterUserId: string;
  reporterName?: string;
  reportedUserId?: string;
  reportedUserName?: string;
  reportedContentId?: string;
  reportedContentType: ReportContentType;
  reason: ReportReason;
  message?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: number;
  reviewedAt?: number;
  reviewNote?: string;
}

export interface CreateReportInput {
  reportedContentId?: string;
  reportedContentType: ReportContentType;
  reportedUserId?: string;
  reportedUserName?: string;
  reason: ReportReason;
  message?: string;
}

export const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'spam', label: 'Spam', description: 'Contenu non sollicite ou repetitif' },
  { value: 'harassment', label: 'Harcelement', description: 'Comportement abusif ou intimidant' },
  { value: 'inappropriate', label: 'Contenu inapproprie', description: 'Contenu offensant ou choquant' },
  { value: 'scam', label: 'Arnaque', description: 'Tentative de fraude ou escroquerie' },
  { value: 'fake', label: 'Faux profil', description: 'Usurpation d\'identite ou faux compte' },
  { value: 'other', label: 'Autre', description: 'Autre raison (precisez)' },
];
