import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-parent-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parent-approval.component.html',
  styleUrl: './parent-approval.component.scss'
})
export class ParentApprovalComponent {
  filter = signal<'pending' | 'rejected' | 'all'>('pending');
  pendingUsers = signal<User[]>([]);
  rejectedUsers = signal<User[]>([]);

  filteredUsers = computed(() => {
    const f = this.filter();
    if (f === 'pending') return this.pendingUsers();
    if (f === 'rejected') return this.rejectedUsers();
    return [...this.pendingUsers(), ...this.rejectedUsers()];
  });

  constructor(
    private auth: AuthService,
    private notificationService: NotificationService,
    private toast: ToastService
  ) {
    this.loadUsers();
  }

  loadUsers(): void {
    this.pendingUsers.set(this.auth.getPendingApprovalUsers());
    this.rejectedUsers.set(this.auth.getRejectedUsers());
  }

  approveUser(user: User): void {
    setTimeout(() => {
      this.auth.approveUser(user.id);
      this.notificationService.notifyUser(
        user.id,
        'Your account has been approved! You can now log in.',
        'registration_approved'
      );
      this.toast.success(`Parent "${user.name}" has been approved.`);
      this.loadUsers();
    }, 300);
  }

  rejectUser(user: User): void {
    if (confirm(`Reject registration for "${user.name}"?`)) {
      setTimeout(() => {
        this.auth.rejectUser(user.id);
        this.notificationService.notifyUser(
          user.id,
          'Your account registration has been rejected. Please contact admin for details.',
          'registration_rejected'
        );
        this.toast.success(`Parent "${user.name}" has been rejected.`);
        this.loadUsers();
      }, 300);
    }
  }
}
