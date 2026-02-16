export type OrganizationStatus = 'pending' | 'verified' | 'rejected';

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  description: string;
  country: string;
  themes: string[];
  verified: boolean; // Kept for backward compatibility
  status: OrganizationStatus;
  ownerUid?: string; // Firebase Auth UID of owner
  website?: string;
  partnershipLevel: 'officiel' | 'partenaire' | 'none';
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  reviewNote?: string;
  // Wallet for organization donations
  walletBalanceCents: number;
  donorCount: number;
}

export interface CreateOrganizationInput {
  name: string;
  logoUrl?: string;
  description: string;
  country: string;
  themes: string[];
  website?: string;
  partnershipLevel?: 'officiel' | 'partenaire' | 'none';
}
