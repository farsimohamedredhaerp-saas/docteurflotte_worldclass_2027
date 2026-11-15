export interface LoginFormData {
  email: string;
  password: string;
  tenantSlug: string;
  rememberMe: boolean;
}

export interface UseLoginFormReturn {
  formData: LoginFormData;
  setField: (field: keyof LoginFormData, value: string | boolean) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  isLoading: boolean;
  error: string | null;
  isOfflineError: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleQuickFillAdmin: () => void;
  handleEnterDemoMode: () => void;
}

