import { HttpInterceptorFn } from '@angular/common/http';
import { timeout } from 'rxjs';

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  const DEFAULT_TIMEOUT = 15000; // 15 seconds
  
  return next(req).pipe(
    timeout(DEFAULT_TIMEOUT)
  );
};
