import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
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
    private toast: ToastService
  ) {
    this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    const [pending, rejected] = await Promise.all([
      this.auth.getPendingApprovalUsers(),
      this.auth.getRejectedUsers()
    ]);
    this.pendingUsers.set(pending);
    this.rejectedUsers.set(rejected);
  }

  async approveUser(user: User): Promise<void> {
    await this.auth.approveUser(user.id);
    this.toast.success(`Parent "${user.name}" has been approved.`);
    await this.loadUsers();
  }

  async rejectUser(user: User): Promise<void> {
    if (confirm(`Reject registration for "${user.name}"?`)) {
      await this.auth.rejectUser(user.id);
      this.toast.success(`Parent "${user.name}" has been rejected.`);
      await this.loadUsers();
    }
  }
}
