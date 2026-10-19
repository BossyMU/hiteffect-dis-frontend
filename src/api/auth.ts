import type { AppNotification, User } from '@/types'
import { request } from './client'

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
  me: () => request<User>('/me'),
  updateProfile: (input: ProfileInput) => request<User>('/me', { method: 'PATCH', body: input }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/me/password', { method: 'POST', body: { currentPassword, newPassword } }),
  notifications: () => request<AppNotification[]>('/me/notifications'),
  markNotificationsRead: () => request<void>('/me/notifications/read', { method: 'POST' }),
}
