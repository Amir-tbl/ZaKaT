// Legacy category type - kept for backwards compatibility
export type RequestCategory =
  | 'sante'
  | 'logement'
  | 'nourriture'
  | 'etudes'
  | 'urgence';

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  sante: 'Sante',
  logement: 'Logement',
  nourriture: 'Nourriture',
  etudes: 'Etudes',
  urgence: 'Urgence',
};

// ========== Theme-specific details ==========

// Infrastructure details
export type InfrastructureType = 'ecole' | 'hopital' | 'puits' | 'logement' | 'autre';
export type ProjectStatus = 'planifie' | 'en_cours' | 'urgent' | 'reconstruction';

export interface InfrastructureDetails {
  infrastructureType: InfrastructureType;
  projectLocation: string; // Required
  projectStatus?: ProjectStatus;
  devisPdfId?: string; // Reference to file ID
}

// Ecology details
export type EcologyActionType = 'plantation' | 'nettoyage' | 'protection' | 'autre';

export interface EcologyDetails {
  ecologyActionType: EcologyActionType;
  projectLocation: string; // Required
  targetQuantity?: string; // e.g., "500 arbres", "100kg dechets"
}

// Health details
export type MedicalNeedType = 'soins' | 'medicaments' | 'operation' | 'autre';

export interface HealthDetails {
  medicalNeedType: MedicalNeedType;
  deadlineDate?: string; // ISO date string
}

// Education details
export type EducationLevel = 'primaire' | 'college' | 'lycee' | 'universite';

export interface EducationDetails {
  educationLevel: EducationLevel;
  beneficiariesCount?: number;
}

// Union type for all details
export type RequestDetails =
  | { themeType: 'infrastructure'; data: InfrastructureDetails }
  | { themeType: 'environnement'; data: EcologyDetails }
  | { themeType: 'sante'; data: HealthDetails }
  | { themeType: 'education'; data: EducationDetails }
  | { themeType: 'other'; data: Record<string, any> };

// Labels for dropdowns
export const INFRASTRUCTURE_TYPE_LABELS: Record<InfrastructureType, string> = {
  ecole: 'Ecole',
  hopital: 'Hopital',
  puits: 'Puits',
  logement: 'Logement',
  autre: 'Autre',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planifie: 'Planifie',
  en_cours: 'En cours',
  urgent: 'Urgent',
  reconstruction: 'Reconstruction',
};

export const ECOLOGY_ACTION_LABELS: Record<EcologyActionType, string> = {
  plantation: 'Plantation',
  nettoyage: 'Nettoyage',
  protection: 'Protection',
  autre: 'Autre',
};

export const MEDICAL_NEED_LABELS: Record<MedicalNeedType, string> = {
  soins: 'Soins',
  medicaments: 'Medicaments',
  operation: 'Operation',
  autre: 'Autre',
};

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  primaire: 'Primaire',
  college: 'College',
  lycee: 'Lycee',
  universite: 'Universite',
};

export type RequestFileType = 'photo' | 'pdf' | 'proof';

export interface RequestFile {
  id: string;
  uri: string;
  name: string;
  type: RequestFileType;
  mimeType: string;
  size?: number;
}

export type RequestStatus = 'pending' | 'verified' | 'rejected' | 'closed';

export type RequestType = 'individual' | 'organization';

// Post type determines the nature of the publication
export type PostType = 'individual_request' | 'org_update' | 'org_campaign';

// Donation target determines where donations go
export type DonTarget = 'request' | 'organization';

export const POST_TYPE_LABELS: Record<PostType, string> = {
  individual_request: 'Demande',
  org_update: 'Publication',
  org_campaign: 'Campagne',
};

export interface Beneficiary {
  firstName: string;
  lastName: string;
  age?: number;
  country: string;
  city?: string;
  email?: string;
  phone?: string;
  showContactPublicly: boolean;
}

export interface ZakatRequest {
  id: string;
  authorUserId: string;
  authorDisplayName: string;
  title: string;
  category?: RequestCategory; // Deprecated - use themes instead
  description: string;
  goalAmount: number; // 0 for org_update posts
  currency: string;
  country: string;
  city: string;
  status: RequestStatus;
  createdAt: number;
  files: RequestFile[];
  beneficiary: Beneficiary;
  attestation: boolean;
  reviewedAt?: number;
  reviewedBy?: string;
  reviewNote?: string;
  themes: string[]; // Required, min 1
  primaryTheme?: string; // First selected theme, used for badge display
  organizationId?: string;
  organizationName?: string;
  type: RequestType;
  urgent: boolean;
  impactText?: string;
  // Theme-specific details
  details?: RequestDetails;
  // Post type differentiation
  postType: PostType;
  donTarget: DonTarget;
  // Donation tracking
  receivedAmountCents: number;
  donorCount: number;
  // Notification flags (to avoid duplicate notifications)
  notified50?: boolean;
  notified100?: boolean;
}

export interface CreateRequestInput {
  title: string;
  category?: RequestCategory; // Deprecated
  description: string;
  goalAmount: number; // 0 for org_update
  country: string;
  city: string;
  files: RequestFile[];
  beneficiary: Beneficiary;
  attestation: boolean;
  themes: string[]; // Required, min 1
  organizationId?: string;
  type?: RequestType;
  urgent?: boolean;
  impactText?: string;
  // Theme-specific details
  details?: RequestDetails;
  // Post type
  postType?: PostType;
  donTarget?: DonTarget;
}
