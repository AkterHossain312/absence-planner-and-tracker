import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, roleGuard('superadmin', 'admin')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'holidays', loadComponent: () => import('./admin/holidays/holiday-management.component').then(m => m.HolidayManagementComponent) },
      { path: 'students', loadComponent: () => import('./admin/students/student-records.component').then(m => m.StudentRecordsComponent) },
      { path: 'absence-approval', loadComponent: () => import('./admin/absence-approval/absence-approval.component').then(m => m.AbsenceApprovalComponent) },
      { path: 'packing-report', loadComponent: () => import('./admin/packing-report/packing-report.component').then(m => m.PackingReportComponent) },
      { path: 'menu-permission', loadComponent: () => import('./admin/menu-permission/menu-permission.component').then(m => m.MenuPermissionComponent) },
      { path: 'feature-permission', loadComponent: () => import('./admin/feature-permission/feature-permission.component').then(m => m.FeaturePermissionComponent) },
      { path: 'calendar-days', loadComponent: () => import('./admin/calendar-days/calendar-days.component').then(m => m.CalendarDaysComponent) },
      { path: 'add-system-user', loadComponent: () => import('./admin/add-system-user/add-system-user.component').then(m => m.AddSystemUserComponent) },
    ]
  },
  {
    path: 'user',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, roleGuard('user')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./user/dashboard/user-dashboard.component').then(m => m.UserDashboardComponent) },
      { path: 'submit-absence', loadComponent: () => import('./user/submit-absence/submit-absence.component').then(m => m.SubmitAbsenceComponent) },
      { path: 'my-submissions', loadComponent: () => import('./user/my-submissions/my-submissions.component').then(m => m.MySubmissionsComponent) },
      { path: 'expired-submissions', loadComponent: () => import('./user/expired-submissions/expired-submissions.component').then(m => m.ExpiredSubmissionsComponent) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
