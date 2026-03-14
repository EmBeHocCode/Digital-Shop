export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface ContactFormValues {
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

export interface TicketFormValues {
  subject: string;
  category: string;
  message: string;
}

export interface CheckoutFormValues {
  fullName: string;
  email: string;
  phone: string;
  paymentMethod: "VNPAY" | "MOMO" | "ZALOPAY" | "CRYPTO";
  note?: string;
}

export interface AccountSettingsFormValues {
  fullName: string;
  phone: string;
}

export interface PasswordChangeFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
