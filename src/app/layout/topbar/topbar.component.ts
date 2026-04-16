import { Component, signal, computed, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserRole } from '../../core/models/user.model';

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
  unreadCount = computed(() => {
    const userId = this.auth.currentUserId();
    return this.notificationService.getForUser(userId).filter(n => !n.read).length;
  });
  userNotifications = computed(() => {
    return this.notificationService.getForUser(this.auth.currentUserId());
  });
  initials = computed(() => {
    const name = this.auth.currentUserName();
    if (!name) return '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  });

  constructor(
    public auth: AuthService,
    private notificationService: NotificationService
  ) {}

  onToggleSidebar(event: Event): void {
    event.stopPropagation();
    this.toggleSidebar.emit();
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
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
    this.notificationService.markAllRead(this.auth.currentUserId());
  }

  switchRole(role: UserRole): void {
    this.auth.switchRole(role);
    this.showUserMenu.set(false);
    this.showNotifications.set(false);
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
