import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.ensureValidSession()) {
      router.navigate(['/login']);
      return false;
    }

    const role = auth.currentRole();
    if (role && allowedRoles.includes(role)) {
      return true;
    }
    router.navigate(['/login']);
    return false;
  };
}
