import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { AppNotification } from '../models/notification.model';

const NOTIFICATIONS_KEY = 'abs_notifications';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSignal = signal<AppNotification[]>([]);

  notifications = this.notificationsSignal.asReadonly();
  unreadCount = computed(() => this.notificationsSignal().filter(n => !n.read).length);

  constructor(private storage: StorageService) {
    this.reload();
  }

  reload(): void {
    const all = this.storage.get<AppNotification[]>(NOTIFICATIONS_KEY) ?? [];
    this.notificationsSignal.set(all);
  }

  getForUser(userId: string): AppNotification[] {
    return this.notificationsSignal().filter(n => n.userId === userId || n.userId === 'all');
  }

  add(notification: AppNotification): void {
    const all = this.storage.get<AppNotification[]>(NOTIFICATIONS_KEY) ?? [];
    all.unshift(notification);
    this.storage.set(NOTIFICATIONS_KEY, all);
    this.notificationsSignal.set(all);
  }

  markAsRead(id: string): void {
    const all = this.storage.get<AppNotification[]>(NOTIFICATIONS_KEY) ?? [];
    const n = all.find(x => x.id === id);
    if (n) {
      n.read = true;
      this.storage.set(NOTIFICATIONS_KEY, all);
      this.notificationsSignal.set([...all]);
    }
  }

  markAllRead(userId: string): void {
    const all = this.storage.get<AppNotification[]>(NOTIFICATIONS_KEY) ?? [];
    all.forEach(n => {
      if (n.userId === userId || n.userId === 'all') {
        n.read = true;
      }
    });
    this.storage.set(NOTIFICATIONS_KEY, all);
    this.notificationsSignal.set([...all]);
  }

  broadcast(message: string, type: AppNotification['type']): void {
    this.add({
      id: crypto.randomUUID(),
      userId: 'all',
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  notifyUser(userId: string, message: string, type: AppNotification['type']): void {
    this.add({
      id: crypto.randomUUID(),
      userId,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    });
  }
}
