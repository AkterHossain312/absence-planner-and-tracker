import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { MenuPermission, FeaturePermission, CalendarDayConfig } from '../models/permission.model';
import { UserRole } from '../models/user.model';

const MENU_PERMS_KEY = 'abs_menu_permissions';
const FEATURE_PERMS_KEY = 'abs_feature_permissions';
const CALENDAR_DAYS_KEY = 'abs_calendar_days';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private storage: StorageService) {}

  // Menu Permissions
  getMenuPermissions(): MenuPermission[] {
    const saved = this.storage.get<MenuPermission[]>(MENU_PERMS_KEY);
    if (!saved) return this.getDefaultMenuPermissions();
    const defaults = this.getDefaultMenuPermissions();
    const savedKeys = new Set(saved.map(p => p.menuKey));
    const missing = defaults.filter(d => !savedKeys.has(d.menuKey));
    return [...saved, ...missing];
  }

  saveMenuPermissions(perms: MenuPermission[]): void {
    this.storage.set(MENU_PERMS_KEY, perms);
  }

  isMenuVisible(menuKey: string, role: UserRole): boolean {
    const perms = this.getMenuPermissions();
    const perm = perms.find(p => p.menuKey === menuKey);
    return perm ? perm.roles.includes(role) : false;
  }

  // Feature Permissions
  getFeaturePermissions(): FeaturePermission[] {
    return this.storage.get<FeaturePermission[]>(FEATURE_PERMS_KEY) ?? this.getDefaultFeaturePermissions();
  }

  saveFeaturePermissions(perms: FeaturePermission[]): void {
    this.storage.set(FEATURE_PERMS_KEY, perms);
  }

  getFeaturePermission(menuKey: string, role: UserRole): FeaturePermission | undefined {
    return this.getFeaturePermissions().find(p => p.menuKey === menuKey && p.role === role);
  }

  canPerformAction(menuKey: string, role: UserRole, action: 'add' | 'edit' | 'delete' | 'view'): boolean {
    const perm = this.getFeaturePermission(menuKey, role);
    if (!perm) return role === 'superadmin';
    switch (action) {
      case 'add': return perm.canAdd;
      case 'edit': return perm.canEdit;
      case 'delete': return perm.canDelete;
      case 'view': return perm.canView;
    }
  }

  // Calendar Day Control
  getCalendarDays(): CalendarDayConfig {
    return this.storage.get<CalendarDayConfig>(CALENDAR_DAYS_KEY) ?? {
      allowedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    };
  }

  saveCalendarDays(config: CalendarDayConfig): void {
    this.storage.set(CALENDAR_DAYS_KEY, config);
  }

  isDayAllowed(date: Date): boolean {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    return this.getCalendarDays().allowedDays.includes(dayName);
  }

  private getDefaultMenuPermissions(): MenuPermission[] {
    return [
      { menuKey: 'dashboard', label: 'Dashboard', roles: ['superadmin', 'admin', 'user'] },
      { menuKey: 'holidays', label: 'Holiday Periods', roles: ['superadmin', 'admin'] },
      { menuKey: 'students', label: 'Student Records', roles: ['superadmin', 'admin'] },
      { menuKey: 'packing-report', label: 'Daily Packing Report', roles: ['superadmin', 'admin'] },
      { menuKey: 'menu-permission', label: 'Menu Permission', roles: ['superadmin', 'admin'] },
      { menuKey: 'feature-permission', label: 'Feature Permission', roles: ['superadmin', 'admin'] },
      { menuKey: 'add-system-user', label: 'Add System User', roles: ['superadmin', 'admin'] },
      { menuKey: 'absence-approval', label: 'Absence Approval', roles: ['superadmin', 'admin'] },
      { menuKey: 'parent-approval', label: 'Parent Approvals', roles: ['superadmin', 'admin'] },
      { menuKey: 'student-removal-approval', label: 'Student Removal', roles: ['superadmin', 'admin'] },
      { menuKey: 'calendar-days', label: 'Calendar Day Control', roles: ['superadmin', 'admin'] },
      { menuKey: 'my-students', label: 'My Students', roles: ['user'] },
      { menuKey: 'submit-absence', label: 'Submit Absence', roles: ['user'] },
      { menuKey: 'my-submissions', label: 'My Submissions', roles: ['user'] },
      { menuKey: 'expired-submissions', label: 'Expired Submissions', roles: ['user'] },
    ];
  }

  private getDefaultFeaturePermissions(): FeaturePermission[] {
    const menus = ['holidays', 'students', 'packing-report', 'menu-permission', 'feature-permission', 'add-system-user', 'absence-approval', 'parent-approval', 'student-removal-approval', 'calendar-days', 'my-students', 'submit-absence', 'my-submissions', 'expired-submissions'];
    const roles: UserRole[] = ['superadmin', 'admin', 'user'];
    const perms: FeaturePermission[] = [];
    for (const menu of menus) {
      for (const role of roles) {
        perms.push({
          menuKey: menu,
          role,
          canAdd: role !== 'user',
          canEdit: role !== 'user',
          canDelete: role === 'superadmin',
          canView: true,
        });
      }
    }
    return perms;
  }
}
