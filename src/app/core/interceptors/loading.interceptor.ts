import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoaderService } from '../services/loader.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoaderService);

  // Only show the global loader for API requests.
  const isApiCall = req.url.startsWith(environment.apiUrl);
  if (!isApiCall) {
    return next(req);
  }

  loader.show();
  return next(req).pipe(finalize(() => loader.hide()));
};
