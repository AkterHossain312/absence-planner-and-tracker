import { Component, signal, computed, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  showNotifications = signal(false);
  showUserMenu = signal(false);

  currentRole = this.auth.currentRole;
  unreadCount = this.notificationService.unreadCount;
  userNotifications = computed(() => {
    return [...this.notificationService.notifications()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });
  initials = computed(() => {
    const name = this.auth.currentUserName();
    if (!name) return '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  });

  constructor(
    public auth: AuthService,
    private notificationService: NotificationService
  ) {
    this.notificationService.reload();
  }

  onToggleSidebar(event: Event): void {
    event.stopPropagation();
    this.toggleSidebar.emit();
  }

  toggleNotifications(): void {
    const willOpen = !this.showNotifications();
    if (willOpen) {
      this.notificationService.reload();
    }
    this.showNotifications.set(willOpen);
    this.showUserMenu.set(false);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
    this.showNotifications.set(false);
  }

  markRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
  }

  logout(): void {
    this.auth.logout();
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.showNotifications.set(false);
    this.showUserMenu.set(false);
  }
}
