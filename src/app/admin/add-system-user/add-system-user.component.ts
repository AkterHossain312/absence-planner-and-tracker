import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User, UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-add-system-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-system-user.component.html',
  styleUrl: './add-system-user.component.scss'
})
export class AddSystemUserComponent {
  users = signal<User[]>([]);
  showForm = signal(false);
  form: { name: string; email: string; phone: string; location: string; role: UserRole } = {
    name: '', email: '', phone: '', location: '', role: 'admin'
  };

  constructor(
    private auth: AuthService,
    private toast: ToastService
  ) {
    this.loadUsers();
  }

  loadUsers(): void {
    this.users.set(this.auth.getUsers());
  }

  openForm(): void {
    this.form = { name: '', email: '', phone: '', location: '', role: 'admin' };
    this.showForm.set(true);
  }

  createUser(): void {
    const user: User = {
      id: crypto.randomUUID(),
      name: this.form.name,
      email: this.form.email,
      phone: this.form.phone,
      location: this.form.location,
      role: this.form.role,
      password: '1234',
      createdAt: new Date().toISOString()
    };
    setTimeout(() => {
      this.auth.addUser(user);
      this.toast.success(`User "${user.name}" created`);
      this.loadUsers();
      this.showForm.set(false);
    }, 300);
  }
}
