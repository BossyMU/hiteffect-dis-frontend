import type { AppNotification, User } from '@/types'
import { request, requestFile } from './client'

export interface RegisterInput {
  email: string
  password: string
  shopName: string
  contactName: string
  phone: string
  address: string
}

export type ProfileInput = Partial<
  Pick<
    User,
    'shopName' | 'contactName' | 'phone' | 'address' | 'legalName' | 'taxId' | 'branchCode' | 'taxAddress'
  >
>

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (input: RegisterInput) => request<User>('/auth/register', { method: 'POST', body: input }),
  /** E-mails a one-time link to set a new password. The same answer whether or not the e-mail has an account. */
  forgotPassword: (email: string) =>
    request<{ ok: true; minutes: number }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  /** Is the e-mailed link still good, and for which account. */
  checkPasswordReset: (token: string) =>
    request<{ email: string }>('/auth/reset-password/check', { method: 'POST', body: { token } }),
  resetPassword: (token: string, password: string) =>
    request<{ email: string }>('/auth/reset-password', { method: 'POST', body: { token, password } }),
  me: () => request<User>('/me'),
  /** A receipt's PDF: the shop's own, or any for staff. */
  receiptPdf: (id: string) => requestFile(`/me/receipts/${id}/pdf`),
  updateProfile: (input: ProfileInput) => request<User>('/me', { method: 'PATCH', body: input }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/me/password', { method: 'POST', body: { currentPassword, newPassword } }),
  notifications: () => request<AppNotification[]>('/me/notifications'),
  markNotificationsRead: () => request<void>('/me/notifications/read', { method: 'POST' }),
}
