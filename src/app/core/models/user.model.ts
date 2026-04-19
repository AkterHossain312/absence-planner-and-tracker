export type UserRole = 'superadmin' | 'admin' | 'user';
export type UserStatus = 'pending_verification' | 'pending_approval' | 'active' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: UserRole;
  password: string;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
}

export interface Session {
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  loggedInAt: string;
}
