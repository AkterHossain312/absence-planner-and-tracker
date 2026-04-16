export type UserRole = 'superadmin' | 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: UserRole;
  password: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  loggedInAt: string;
}
