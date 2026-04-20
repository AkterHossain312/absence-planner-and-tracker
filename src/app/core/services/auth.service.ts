import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { User, Session, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

const TOKEN_KEY = 'abs_token';
const SESSION_KEY = 'abs_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sessionSignal = signal<Session | null>(null);
  private usersCache = signal<User[]>([]);

  currentSession = this.sessionSignal.asReadonly();
  isLoggedIn = computed(() => !!this.sessionSignal());
  currentRole = computed(() => this.sessionSignal()?.role ?? null);
  currentUserName = computed(() => this.sessionSignal()?.name ?? '');
  currentUserId = computed(() => this.sessionSignal()?.userId ?? '');

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  private decodeJwtPayload(token: string): any {
    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid JWT token');
    }

    // JWT payload is base64url-encoded, not plain base64.
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  }

  private claimValue(payload: any, keys: string[]): string {
    for (const key of keys) {
      const value = payload?.[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
        return value[0];
      }
    }
    return '';
  }

  private restoreSession(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        const payload = this.decodeJwtPayload(token);
        const userId = this.claimValue(payload, [
          'nameid',
          'sub',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
        ]);
        const role = this.claimValue(payload, [
          'role',
          'roles',
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        ]) as UserRole;
        const name = this.claimValue(payload, [
          'unique_name',
          'name',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
        ]);
        const email = this.claimValue(payload, [
          'email',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
        ]);

        const session: Session = {
          userId,
          role,
          name,
          email,
          loggedInAt: new Date().toISOString()
        };
        this.sessionSignal.set(session);
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch {
        this.clearTokens();
      }
    }
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.restoreSession();
  }

  private clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    this.sessionSignal.set(null);
  }

  // --- Login Flow (2-step) ---

  async sendLoginOtp(identifier: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/login`, { identifier })
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Failed to send OTP' };
    }
  }

  async verifyLoginOtp(identifier: string, otp: string): Promise<{ success: boolean; token?: string; role?: UserRole; error?: string }> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/verify-login`, { identifier, otp })
      );
      const token = res.token;
      this.setToken(token);
      const session = this.sessionSignal();
      return { success: true, token, role: session?.role };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Invalid OTP or login failed' };
    }
  }

  // --- Registration Flow ---

  async register(data: { name: string; email: string; phone: string; location: string }): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/register`, data)
      );
      return { success: true, userId: res.userId };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Registration failed' };
    }
  }

  async verifyEmail(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/verify-email`, { userId, code })
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Verification failed' };
    }
  }

  async resendOtp(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/resend-otp`, { userId })
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Failed to resend OTP' };
    }
  }

  // --- Logout ---

  logout(): void {
    this.clearTokens();
    this.router.navigate(['/login']);
  }

  // --- User Management (Admin) ---

  async loadUsers(): Promise<User[]> {
    try {
      const users = await firstValueFrom(this.http.get<User[]>(`${environment.apiUrl}/users`));
      this.usersCache.set(users);
      return users;
    } catch {
      return [];
    }
  }

  getUsers(): User[] {
    return this.usersCache();
  }

  async getUser(id: string): Promise<User | null> {
    try {
      return await firstValueFrom(this.http.get<User>(`${environment.apiUrl}/users/${id}`));
    } catch {
      return null;
    }
  }

  async addUser(user: { name: string; email: string; phone: string; location: string; role: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/users`, user));
      await this.loadUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Failed to create user' };
    }
  }

  async updateUser(id: string, data: { name: string; email: string; phone: string; location: string; role?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(this.http.put(`${environment.apiUrl}/users/${id}`, data));
      await this.loadUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Failed to update user' };
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(this.http.delete(`${environment.apiUrl}/users/${userId}`));
      await this.loadUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Failed to delete user' };
    }
  }

  async getPendingApprovalUsers(): Promise<User[]> {
    try {
      return await firstValueFrom(this.http.get<User[]>(`${environment.apiUrl}/users/pending-approval`));
    } catch {
      return [];
    }
  }

  async getRejectedUsers(): Promise<User[]> {
    try {
      return await firstValueFrom(this.http.get<User[]>(`${environment.apiUrl}/users/rejected`));
    } catch {
      return [];
    }
  }

  async approveUser(userId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/users/${userId}/approve`, {}));
      return true;
    } catch {
      return false;
    }
  }

  async rejectUser(userId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/users/${userId}/reject`, {}));
      return true;
    } catch {
      return false;
    }
  }

  // --- Role Switching (dev utility) ---

  switchRole(role: UserRole): void {
    this.logout();
  }
}
