import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { User, Session, UserRole, UserStatus } from '../models/user.model';

const SESSION_KEY = 'abs_session';
const USERS_KEY = 'abs_users';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sessionSignal = signal<Session | null>(null);

  currentSession = this.sessionSignal.asReadonly();
  isLoggedIn = computed(() => !!this.sessionSignal());
  currentRole = computed(() => this.sessionSignal()?.role ?? null);
  currentUserName = computed(() => this.sessionSignal()?.name ?? '');
  currentUserId = computed(() => this.sessionSignal()?.userId ?? '');

  constructor(private storage: StorageService, private router: Router) {
    const saved = this.storage.get<Session>(SESSION_KEY);
    if (saved) {
      this.sessionSignal.set(saved);
    }
  }

  getUsers(): User[] {
    const users = this.storage.get<User[]>(USERS_KEY) ?? [];
    // Migrate legacy users without status/emailVerified fields
    let migrated = false;
    for (const u of users) {
      if (u.status === undefined) {
        (u as any).status = 'active';
        (u as any).emailVerified = true;
        migrated = true;
      }
    }
    if (migrated) {
      this.storage.set(USERS_KEY, users);
    }
    return users;
  }

  findUserByEmailOrPhone(identifier: string): User | undefined {
    return this.getUsers().find(u => u.email === identifier || u.phone === identifier);
  }

  verifyOtp(_otp: string): boolean {
    return _otp.length === 4 && /^\d{4}$/.test(_otp);
  }

  /**
   * Returns null on success, or an error message if login is blocked.
   */
  tryLogin(user: User): string | null {
    if (user.status === 'pending_verification') {
      return 'Please verify your email before logging in.';
    }
    if (user.status === 'pending_approval') {
      return 'Your account is pending admin approval. Please wait.';
    }
    if (user.status === 'rejected') {
      return 'Your account registration has been rejected. Contact admin.';
    }
    this.login(user);
    return null;
  }

  login(user: User): void {
    const session: Session = {
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      loggedInAt: new Date().toISOString()
    };
    this.storage.set(SESSION_KEY, session);
    this.sessionSignal.set(session);
  }

  logout(): void {
    this.storage.remove(SESSION_KEY);
    this.sessionSignal.set(null);
    this.router.navigate(['/login']);
  }

  switchRole(role: UserRole): void {
    const users = this.getUsers();
    const target = users.find(u => u.role === role && u.status === 'active');
    if (target) {
      this.login(target);
      if (role === 'user') {
        this.router.navigate(['/user/dashboard']);
      } else {
        this.router.navigate(['/admin/dashboard']);
      }
    }
  }

  // --- Registration Flow ---

  register(data: { name: string; email: string; phone: string; location: string }): { success: boolean; error?: string; userId?: string } {
    const existing = this.findUserByEmailOrPhone(data.email);
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    if (data.phone) {
      const byPhone = this.findUserByEmailOrPhone(data.phone);
      if (byPhone) {
        return { success: false, error: 'An account with this phone number already exists.' };
      }
    }

    const user: User = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      location: data.location,
      role: 'user',
      password: '1234',
      status: 'pending_verification',
      emailVerified: false,
      createdAt: new Date().toISOString()
    };
    this.addUser(user);
    return { success: true, userId: user.id };
  }

  verifyEmail(userId: string): boolean {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user || user.status !== 'pending_verification') return false;
    user.emailVerified = true;
    user.status = 'pending_approval';
    this.storage.set(USERS_KEY, users);
    return true;
  }

  getPendingApprovalUsers(): User[] {
    return this.getUsers().filter(u => u.status === 'pending_approval');
  }

  getRejectedUsers(): User[] {
    return this.getUsers().filter(u => u.status === 'rejected');
  }

  approveUser(userId: string): boolean {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user || user.status !== 'pending_approval') return false;
    user.status = 'active';
    this.storage.set(USERS_KEY, users);
    return true;
  }

  rejectUser(userId: string): boolean {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    user.status = 'rejected';
    this.storage.set(USERS_KEY, users);
    return true;
  }

  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.storage.set(USERS_KEY, users);
  }

  updateUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
      this.storage.set(USERS_KEY, users);
    }
  }

  deleteUser(userId: string): void {
    const users = this.getUsers().filter(u => u.id !== userId);
    this.storage.set(USERS_KEY, users);
  }
}
