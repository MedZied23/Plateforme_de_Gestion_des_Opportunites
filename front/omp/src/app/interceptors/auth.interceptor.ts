import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpEvent,
  HttpContext,
  HttpErrorResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SKIP_AUTH_INTERCEPTOR } from '../services/analysis-results.service';

export const AuthInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  
  // Check if this request should skip authentication
  const skipAuth = request.context.get(SKIP_AUTH_INTERCEPTOR);
  
  // If we should skip auth for this request, process it without adding auth headers
  if (skipAuth) {
    console.log('Skipping auth for request:', request.url);
    return next(request);
  }
  
  const token = authService.getToken();
  
  if (token) {
    // Clone the request and add the authorization header
    const authRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return next(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.error('Unauthorized access - 401');
          // Optionally redirect to login or show appropriate error message
        } else if (error.status === 403) {
          console.error('Forbidden access - 403');
          // Handle forbidden access
        }
        
        return throwError(() => error);
      })
    );
  }
  
  return next(request);
};
