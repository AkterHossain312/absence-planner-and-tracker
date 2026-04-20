import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() isOpen = true;
  @Input() onClose?: () => void;

  private allAdminMenuItems: MenuItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', route: '/admin/dashboard' },
    { key: 'holidays', label: 'Holiday Periods', icon: 'bi-calendar-event', route: '/admin/holidays' },
    { key: 'students', label: 'Student Records', icon: 'bi-mortarboard', route: '/admin/students' },
    { key: 'absences', label: 'Absence Approval', icon: 'bi-check-circle', route: '/admin/absence-approval' },
    { key: 'users', label: 'Parent Approvals', icon: 'bi-person-check', route: '/admin/parent-approval' },
    { key: 'student_removal', label: 'Student Removal', icon: 'bi-person-x', route: '/admin/student-removal-approval' },
    { key: 'packing_report', label: 'Daily Packing Report', icon: 'bi-clipboard-data', route: '/admin/packing-report' },
    { key: 'menu_permission', label: 'Menu Permission', icon: 'bi-list-check', route: '/admin/menu-permission' },
    { key: 'feature_permission', label: 'Feature Permission', icon: 'bi-shield-lock', route: '/admin/feature-permission' },
    { key: 'calendar_control', label: 'Calendar Day Control', icon: 'bi-calendar3', route: '/admin/calendar-days' },
    { key: 'system_user', label: 'Add System User', icon: 'bi-person-plus', route: '/admin/add-system-user' },
  ];

  private allUserMenuItems: MenuItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', route: '/user/dashboard' },
    { key: 'my-students', label: 'My Students', icon: 'bi-mortarboard', route: '/user/my-students' },
    { key: 'submit-absence', label: 'Submit Absence', icon: 'bi-pencil-square', route: '/user/submit-absence' },
    { key: 'my-submissions', label: 'My Submissions', icon: 'bi-folder2-open', route: '/user/my-submissions' },
    { key: 'expired-submissions', label: 'Expired Submissions', icon: 'bi-clock-history', route: '/user/expired-submissions' },
  ];

  visibleMenuItems = computed(() => {
    const role = this.auth.currentRole();
    if (!role) return [];
    const items = (role === 'user') ? this.allUserMenuItems : this.allAdminMenuItems;
    return items.filter(item => this.permissionService.isMenuVisibleSync(item.key, role));
  });

  constructor(
    private auth: AuthService,
    private permissionService: PermissionService
  ) {
    this.permissionService.loadMenuPermissions();
  }

  close(): void {
    if (this.onClose) this.onClose();
  }
}
