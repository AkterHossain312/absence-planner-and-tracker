import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppNotification } from '../models/notification.model';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSignal = signal<AppNotification[]>([]);
  private unreadCountSignal = signal<number>(0);

  notifications = this.notificationsSignal.asReadonly();
  unreadCount = this.unreadCountSignal.asReadonly();

  constructor(private http: HttpClient) {}

  private normalize(value?: string | null): string {
    return (value ?? '').trim().toLowerCase();
  }

  async reload(): Promise<void> {
    try {
      const [notifications, countRes] = await Promise.all([
        firstValueFrom(this.http.get<AppNotification[]>(`${environment.apiUrl}/notifications`)),
        firstValueFrom(this.http.get<{ count: number }>(`${environment.apiUrl}/notifications/unread-count`))
      ]);
      this.notificationsSignal.set(notifications);
      this.unreadCountSignal.set(countRes.count);
    } catch {
      // silently fail
    }
  }

  getForUser(userId: string): AppNotification[] {
    const normalizedUserId = this.normalize(userId);
    const notifications = this.notificationsSignal();
    const filtered = notifications.filter(n => {
      const notificationUserId = this.normalize(n.userId);
      return notificationUserId === normalizedUserId || notificationUserId === 'all';
    });

    // Fallback: if no match is found but API returned notifications, use API payload as-is.
    return filtered.length > 0 ? filtered : notifications;
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/notifications/${id}/read`, {}));
      await this.reload();
    } catch {
      // silently fail
    }
  }

  async markAllRead(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/notifications/mark-all-read`, {}));
      await this.reload();
    } catch {
      // silently fail
    }
  }

  async notifyRegistrationPending(userId: string, userName: string, userEmail: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/notifications/registration-pending`, {
          userId,
          userName,
          userEmail,
          roles: ['superadmin', 'admin']
        })
      );
    } catch {
      // Non-blocking: registration flow should not fail if notification endpoint is unavailable.
    }
  }
}
