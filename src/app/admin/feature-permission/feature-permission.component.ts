import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { FeaturePermission } from '../../core/models/permission.model';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-feature-permission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feature-permission.component.html',
  styleUrl: './feature-permission.component.scss'
})
export class FeaturePermissionComponent {
  allPermissions: FeaturePermission[] = [];
  filteredPermissions = signal<FeaturePermission[]>([]);
  selectedRole: UserRole = 'admin';

  constructor(
    private permissionService: PermissionService,
    private toast: ToastService
  ) {
    this.allPermissions = this.permissionService.getFeaturePermissions();
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredPermissions.set(this.allPermissions.filter(p => p.role === this.selectedRole));
  }

  savePermissions(): void {
    this.permissionService.saveFeaturePermissions(this.allPermissions);
    this.toast.success('Feature permissions saved');
  }
}
