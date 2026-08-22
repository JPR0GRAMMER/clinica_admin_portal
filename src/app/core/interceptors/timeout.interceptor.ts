import { HttpInterceptorFn } from '@angular/common/http';
import { timeout } from 'rxjs';

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  const DEFAULT_TIMEOUT = 30000;

  return next(req).pipe(
    timeout(DEFAULT_TIMEOUT)
  );
};
