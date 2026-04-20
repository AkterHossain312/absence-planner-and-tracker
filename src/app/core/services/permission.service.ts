import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MenuPermission, FeaturePermission, CalendarDayConfig } from '../models/permission.model';
import { UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private menuPermsCache = signal<MenuPermission[]>([]);
  private featurePermsCache = signal<FeaturePermission[]>([]);
  private calendarDaysCache = signal<CalendarDayConfig>({ allowedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] });

  constructor(private http: HttpClient) {}

  // Menu Permissions
  async loadMenuPermissions(): Promise<MenuPermission[]> {
    try {
      const perms = await firstValueFrom(this.http.get<MenuPermission[]>(`${environment.apiUrl}/permissions/menu`));
      this.menuPermsCache.set(perms);
      return perms;
    } catch {
      return this.getDefaultMenuPermissions();
    }
  }

  getMenuPermissions(): MenuPermission[] {
    const cached = this.menuPermsCache();
    return cached.length > 0 ? cached : this.getDefaultMenuPermissions();
  }

  async saveMenuPermissions(perms: MenuPermission[]): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(this.http.put(`${environment.apiUrl}/permissions/menu`, perms));
      this.menuPermsCache.set(perms);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || 'Failed to save menu permissions' };
    }
  }

  async isMenuVisible(menuKey: string, role: UserRole): Promise<boolean> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/permissions/check-menu?menuKey=${menuKey}&role=${role}`)
      );
      return res.allowed === true;
    } catch {
      // Fallback to cached data
      const perms = this.getMenuPermissions();
      const perm = perms.find(p => p.menuKey === menuKey);
      return perm ? perm.roles.includes(role) : false;
    }
  }

  isMenuVisibleSync(menuKey: string, role: UserRole): boolean {
    const perms = this.getMenuPermissions();
    const perm = perms.find(p => p.menuKey === menuKey);
    return perm ? perm.roles.includes(role) : false;
  }

  // Feature Permissions
  async loadFeaturePermissions(): Promise<FeaturePermission[]> {
    try {
      const perms = await firstValueFrom(this.http.get<FeaturePermission[]>(`${environment.apiUrl}/permissions/features`));
      this.featurePermsCache.set(perms);
      return perms;
    } catch {
      return [];
    }
  }

  getFeaturePermissions(): FeaturePermission[] {
    return this.featurePermsCache();
  }

  async saveFeaturePermissions(perms: FeaturePermission[]): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(this.http.put(`${environment.apiUrl}/permissions/features`, perms));
      this.featurePermsCache.set(perms);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || 'Failed to save feature permissions' };
    }
  }

  getFeaturePermission(menuKey: string, role: UserRole): FeaturePermission | undefined {
    return this.featurePermsCache().find(p => p.menuKey === menuKey && p.role === role);
  }

  async canPerformAction(menuKey: string, role: UserRole, action: 'add' | 'edit' | 'delete' | 'view'): Promise<boolean> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/permissions/check-feature?menuKey=${menuKey}&role=${role}&action=${action}`)
      );
      return res.allowed === true;
    } catch {
      return this.canPerformActionSync(menuKey, role, action);
    }
  }

  canPerformActionSync(menuKey: string, role: UserRole, action: 'add' | 'edit' | 'delete' | 'view'): boolean {
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
  async loadCalendarDays(): Promise<CalendarDayConfig> {
    try {
      const config = await firstValueFrom(this.http.get<CalendarDayConfig>(`${environment.apiUrl}/permissions/calendar-days`));
      this.calendarDaysCache.set(config);
      return config;
    } catch {
      return this.calendarDaysCache();
    }
  }

  getCalendarDays(): CalendarDayConfig {
    return this.calendarDaysCache();
  }

  async saveCalendarDays(config: CalendarDayConfig): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(this.http.put(`${environment.apiUrl}/permissions/calendar-days`, config));
      this.calendarDaysCache.set(config);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || 'Failed to save calendar days' };
    }
  }

  isDayAllowed(date: Date): boolean {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    return this.calendarDaysCache().allowedDays.includes(dayName);
  }

  private getDefaultMenuPermissions(): MenuPermission[] {
    return [
      { menuKey: 'dashboard', label: 'Dashboard', roles: ['superadmin', 'admin', 'user'] },
      { menuKey: 'holidays', label: 'Holiday Periods', roles: ['superadmin', 'admin'] },
      { menuKey: 'students', label: 'Student Records', roles: ['superadmin', 'admin'] },
      { menuKey: 'packing_report', label: 'Daily Packing Report', roles: ['superadmin', 'admin'] },
      { menuKey: 'menu_permission', label: 'Menu Permission', roles: ['superadmin', 'admin'] },
      { menuKey: 'feature_permission', label: 'Feature Permission', roles: ['superadmin', 'admin'] },
      { menuKey: 'system_user', label: 'Add System User', roles: ['superadmin', 'admin'] },
      { menuKey: 'absences', label: 'Absence Approval', roles: ['superadmin', 'admin'] },
      { menuKey: 'users', label: 'Parent Approvals', roles: ['superadmin', 'admin'] },
      { menuKey: 'student_removal', label: 'Student Removal', roles: ['superadmin', 'admin'] },
      { menuKey: 'calendar_control', label: 'Calendar Day Control', roles: ['superadmin', 'admin'] },
      { menuKey: 'my-students', label: 'My Students', roles: ['user'] },
      { menuKey: 'submit-absence', label: 'Submit Absence', roles: ['user'] },
      { menuKey: 'my-submissions', label: 'My Submissions', roles: ['user'] },
      { menuKey: 'expired-submissions', label: 'Expired Submissions', roles: ['user'] },
    ];
  }
}
