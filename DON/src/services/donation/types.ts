export type DonationType = 'treasury' | 'request' | 'organization';

export interface Donation {
  id: string;
  donorUserId: string;
  donorName?: string;
  type: DonationType;
  requestId?: string; // Only for type === 'request'
  organizationId?: string; // Only for type === 'organization'
  amountCents: number;
  currency: string;
  message?: string;
  createdAt: number;
}

export interface CreateDonationInput {
  type: DonationType;
  requestId?: string;
  organizationId?: string;
  amountCents: number;
  message?: string;
}

export interface TreasuryStats {
  totalAmountCents: number;
  donationCount: number;
}
