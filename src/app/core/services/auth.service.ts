import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { User, Session, UserRole } from '../models/user.model';

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
    return this.storage.get<User[]>(USERS_KEY) ?? [];
  }

  findUserByEmailOrPhone(identifier: string): User | undefined {
    return this.getUsers().find(u => u.email === identifier || u.phone === identifier);
  }

  verifyOtp(_otp: string): boolean {
    return _otp.length === 4 && /^\d{4}$/.test(_otp);
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
    const target = users.find(u => u.role === role);
    if (target) {
      this.login(target);
      if (role === 'user') {
        this.router.navigate(['/user/dashboard']);
      } else {
        this.router.navigate(['/admin/dashboard']);
      }
    }
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
}
