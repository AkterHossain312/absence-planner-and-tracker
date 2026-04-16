import { UserRole } from './user.model';

export interface MenuPermission {
  menuKey: string;
  label: string;
  roles: UserRole[];
}

export interface FeaturePermission {
  menuKey: string;
  role: UserRole;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
}

export interface CalendarDayConfig {
  allowedDays: string[];
}
