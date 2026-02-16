export type UserTitle = 'Mr.' | 'Mme.' | 'non_specifie';

export type AccountType = 'individual' | 'organization';

export type OrganizationStatus = 'pending' | 'verified' | 'rejected';

// Social networks for organizations
export interface SocialNetworks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string; // X
}

// Base profile fields (shared)
export interface BaseProfileFields {
  id: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  updatedAt: number;
  accountType: AccountType;
}

// Individual profile
export interface IndividualProfile extends BaseProfileFields {
  accountType: 'individual';
  title: UserTitle;
  firstName: string;
  lastName: string;
}

// Organization profile
export interface OrganizationProfile extends BaseProfileFields {
  accountType: 'organization';
  // Required fields
  organizationName: string;
  orgDescription: string;
  legalRepName: string; // Nom du representant legal
  // Administrative
  siret?: string;
  rna?: string;
  registrationPending: boolean; // "En cours d'enregistrement"
  // Optional fields
  foundedYear?: number;
  website?: string;
  socialNetworks?: SocialNetworks;
  logoUri?: string;
  operatingCountries?: string[]; // ISO country codes
  themes?: string[];
  // Status
  orgStatus: OrganizationStatus;
}

// Union type for UserProfile
export type UserProfile = IndividualProfile | OrganizationProfile;

// Helper type guards
export function isIndividualProfile(profile: UserProfile): profile is IndividualProfile {
  return profile.accountType === 'individual';
}

export function isOrganizationProfile(profile: UserProfile): profile is OrganizationProfile {
  return profile.accountType === 'organization';
}

export interface UpdateProfileInput {
  title?: UserTitle;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  country?: string;
}

// Input for creating individual profile
export interface CreateIndividualProfileInput {
  accountType: 'individual';
  email: string;
  title: UserTitle;
  firstName: string;
  lastName: string;
  phone?: string;
  city?: string;
  country?: string;
}

// Input for creating organization profile
export interface CreateOrganizationProfileInput {
  accountType: 'organization';
  email: string;
  // Required
  organizationName: string;
  country: string;
  city: string;
  orgDescription: string;
  legalRepName: string;
  phone: string;
  // Administrative
  siret?: string;
  rna?: string;
  registrationPending: boolean;
  // Optional
  foundedYear?: number;
  website?: string;
  socialNetworks?: SocialNetworks;
  logoUri?: string;
  operatingCountries?: string[]; // ISO country codes
  themes?: string[];
}

// Union type for CreateProfileInput
export type CreateProfileInput = CreateIndividualProfileInput | CreateOrganizationProfileInput;
