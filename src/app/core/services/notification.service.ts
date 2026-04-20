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
    return this.notificationsSignal().filter(n => n.userId === userId || n.userId === 'all');
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
}
