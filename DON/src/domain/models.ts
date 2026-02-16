export interface Donation {
  id: number;
  amountCents: number;
  createdAt: number;
  applicantId: number | null;
}

export interface Applicant {
  id: number;
  fullName: string;
  city: string;
  shortStory: string;
  validated: boolean;
  goalCents: number;
  collectedCents: number;
}

export interface User {
  id: number;
  displayName: string;
  email: string;
  notificationsEnabled: boolean;
}

export interface CreateDonationInput {
  amountCents: number;
  applicantId?: number | null;
}

export interface CreateApplicantInput {
  fullName: string;
  city: string;
  shortStory: string;
  goalCents: number;
}

export interface UpdateUserInput {
  displayName?: string;
  email?: string;
  notificationsEnabled?: boolean;
}
