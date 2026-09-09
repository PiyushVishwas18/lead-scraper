export interface DiscoveredEmployee {
  fullName: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  seniority?: string;
  professionalUrl?: string;
  sourceUrl?: string;
  email?: string;
  confidence?: number;
  isDecisionMaker?: boolean;
  companyName?: string;
  companyWebsite?: string;
}

export interface EmployeeLead {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  seniority?: string;
  professionalUrl?: string;
  companyName: string;
  companyWebsite?: string;
  companyDomain?: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  workEmail?: string;
  phone?: string;
  emailStatus: 'NOT_CHECKED' | 'VALID' | 'INVALID' | 'UNKNOWN';
  emailVerificationConfidence?: number;
  emailVerifiedAt?: string;
  isDecisionMaker?: boolean;
  qualityScore?: number;
  source?: string;
  sourceUrl?: string;
  confidence?: number;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'REJECTED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface CompanySearchResult {
  name: string;
  website?: string;
  domain?: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  companySize?: string;
  employeeCount?: number;
  revenue?: string;
  funding?: string;
  technology?: string;
  description?: string;
  foundedYear?: number;
}

export interface SearchFilterRequest {
  query?: string;
  jobTitle?: string;
  department?: string;
  seniority?: string;
  personName?: string;
  companyName?: string;
  companyDomain?: string;
  industry?: string;
  companySize?: string;
  minEmployees?: number;
  maxEmployees?: number;
  revenue?: string;
  funding?: string;
  technology?: string;
  city?: string;
  state?: string;
  country?: string;
  emailStatus?: string;
  phoneAvailable?: boolean;
  isDecisionMaker?: boolean;
  leadStatus?: string;
  sort?: string;
  page?: number;
  size?: number;
}

export interface SavedList {
  id: string;
  name: string;
  description?: string;
  leadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UsageStats {
  totalSearched: number;
  totalDiscovered: number;
  totalSaved: number;
  totalEmailsFound: number;
  totalEmailsVerified: number;
  totalContactsRevealed: number;
  totalListsCreated: number;
  remainingCredits: number;
  totalCredits: number;
}

export interface ContactRevealResponse {
  email?: string;
  emailStatus?: string;
  phone?: string;
  source?: string;
  sourceUrl?: string;
  success: boolean;
  message: string;
  remainingCredits: number;
}
