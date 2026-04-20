import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const TOKEN_KEY = 'abs_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = localStorage.getItem(TOKEN_KEY);

  if (token && auth.isTokenExpired(token)) {
    auth.logout();
    return throwError(() => new Error('Session expired'));
  }

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned).pipe(
      catchError((error) => {
        if (error?.status === 401) {
          auth.logout();
        }
        return throwError(() => error);
      })
    );
  }

  return next(req).pipe(
    catchError((error) => {
      if (error?.status === 401) {
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};
