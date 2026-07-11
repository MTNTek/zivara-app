export enum UserRole {
  Professional = 'professional',
  Employer = 'employer',
  Admin = 'admin',
}

export interface BaseUser {
  id: string;
  email: string;
  role: UserRole;
  languagePreference: 'en' | 'ar';
  isVerifiedEmail: boolean;
  isActive: boolean;
  suspendedAt: string | null;
  suspensionReason: string | null;
  createdAt: string;
  updatedAt: string;
}
