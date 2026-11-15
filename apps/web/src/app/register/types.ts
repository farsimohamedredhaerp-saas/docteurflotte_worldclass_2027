import { ActivityPack } from '@docteurflotte/contracts';

export interface RegisterFormData {
  companyName: string;
  wilayaCode: number;
  taxNif: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  activityPack: ActivityPack;
}

export interface UseRegisterFormReturn {
  formData: RegisterFormData;
  setField: (field: keyof RegisterFormData, value: string | number) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  isLoading: boolean;
  error: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

