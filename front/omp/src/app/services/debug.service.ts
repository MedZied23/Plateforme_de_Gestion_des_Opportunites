import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  private apiUrl = `${environment.apiUrl}/Opportunite`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getCurrentUserDebug(): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.apiUrl}/debug/current-user`, { headers });
  }

  logUserState(): void {
    console.group('🔍 DEBUG: User State Analysis');
    
    // Log token
    const token = this.authService.getToken();
    console.log('Token exists:', !!token);
    
    // Log decoded token
    const decodedToken = this.authService.getDecodedToken();
    console.log('Decoded token:', decodedToken);
    
    // Log authentication status
    const isAuthenticated = this.authService.isAuthenticated();
    console.log('Is authenticated:', isAuthenticated);
    
    // Log current user
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Current user from AuthService:', user);
        
        // Check backend user state
        this.getCurrentUserDebug().subscribe({
          next: (backendUser) => {
            console.log('Current user from Backend:', backendUser);
            console.groupEnd();
          },
          error: (error) => {
            console.error('Backend user debug error:', error);
            console.groupEnd();
          }
        });
      },
      error: (error) => {
        console.error('Frontend user debug error:', error);
        console.groupEnd();
      }
    });
  }
}
