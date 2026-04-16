import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { MenuPermission } from '../../core/models/permission.model';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-menu-permission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-permission.component.html',
  styleUrl: './menu-permission.component.scss'
})
export class MenuPermissionComponent {
  permissions = signal<MenuPermission[]>([]);
  isAdmin = computed(() => this.auth.currentRole() === 'admin');

  constructor(
    private permissionService: PermissionService,
    private auth: AuthService,
    private toast: ToastService
  ) {
    this.permissions.set(this.permissionService.getMenuPermissions());
  }

  hasRole(perm: MenuPermission, role: UserRole): boolean {
    return perm.roles.includes(role);
  }

  toggleRole(perm: MenuPermission, role: UserRole): void {
    if (role === 'superadmin' && this.isAdmin()) return;
    const perms = this.permissions();
    const target = perms.find(p => p.menuKey === perm.menuKey);
    if (!target) return;
    if (target.roles.includes(role)) {
      target.roles = target.roles.filter(r => r !== role);
    } else {
      target.roles = [...target.roles, role];
    }
    this.permissions.set([...perms]);
  }

  savePermissions(): void {
    this.permissionService.saveMenuPermissions(this.permissions());
    this.toast.success('Menu permissions saved');
  }
}
