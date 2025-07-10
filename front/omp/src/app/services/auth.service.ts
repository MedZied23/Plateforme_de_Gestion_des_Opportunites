import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthResponse, LoginRequest } from '../models/auth.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/Auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  private jwtHelper = new JwtHelperService();
  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<AuthResponse> {
    const loginData: LoginRequest = { email, password };
    console.log('Auth service: Sending login request to API');
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => {
          console.log('Auth service: Login successful, received token');
          this.setToken(response.token);
          this.setUser({
            email: response.email,
            nom: response.nom,
            prenom: response.prenom,
            role: response.role
          });
          console.log('Auth service: User data stored in localStorage');
          console.log('Auth service: Authenticated as', response.prenom, response.nom, '(', response.role, ')');
        }),
        catchError(error => {
          console.error('Auth service: Login error', error);
          return throwError(() => error);
        })
      );
  }  getCurrentUser(): Observable<any> {
    const userData = this.getDecodedToken();
    console.log('Auth service: Getting current user from token', userData);
    
    if (userData) {
      // Extract user ID from JWT token claims
      const userId = userData.sub || 
                    userData.nameid || 
                    userData['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                    userData.userId || 
                    userData.id;
      
      // Extract role with better debugging
      let role = userData['role'] || userData['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      console.log('Auth service: Raw role from token:', role);
      
      // Convert role to number
      let roleNumber = 0;
      if (typeof role === 'string') {
        // Try to parse as number first
        const parsed = parseInt(role);
        if (!isNaN(parsed)) {
          roleNumber = parsed;
        } else {
          // Map string roles to numbers
          const roleMap: { [key: string]: number } = {
            'Admin': 0,
            'Associe': 1,
            'Directeur': 2,
            'SeniorManager': 3,
            'Manager': 4,
            'AssistantManager': 5,
            'Senior': 6,
            'Junior': 7,
            'User': 8
          };
          roleNumber = roleMap[role] !== undefined ? roleMap[role] : 8; // Default to User
        }
      } else if (typeof role === 'number') {
        roleNumber = role;
      }
      
      console.log('Auth service: Converted role number:', roleNumber);
      
      const user = {
        id: userId,
        email: userData.email,
        nom: userData['nom'],
        prenom: userData['prenom'],
        role: roleNumber
      };
      
      console.log('Auth service: Final user object:', user);
      
      return new Observable(observer => {
        observer.next(user);
        observer.complete();
      });
    } else {
      console.error('Auth service: No authenticated user found');
      return new Observable(observer => {
        observer.error('No authenticated user found');
        observer.complete();
      });
    }
  }

  getCurrentUserId(): string | null {
    const userData = this.getDecodedToken();
    if (userData) {
      return userData.sub || 
             userData.nameid || 
             userData['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
             userData.userId || 
             userData.id || null;
    }
    return null;
  }

  getStoredUser(): any {
    const userData = localStorage.getItem(this.USER_KEY);
    console.log('Auth service: Retrieved stored user data');
    return userData ? JSON.parse(userData) : null;
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    console.log('Auth service: Token stored in localStorage');
  }

  private setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    console.log('Auth service: User data stored in localStorage');
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('Auth service: Retrieved token from localStorage', token ? 'Token exists' : 'No token found');
    return token;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const isValid = token != null && !this.jwtHelper.isTokenExpired(token);
    console.log('Auth service: Authentication check', isValid ? 'Valid token' : 'Invalid or expired token');
    return isValid;
  }

  getDecodedToken(): any {
    const token = this.getToken();
    const decodedToken = token ? this.jwtHelper.decodeToken(token) : null;
    console.log('Auth service: Token decoded', decodedToken ? 'Successfully' : 'Failed - no token');
    return decodedToken;
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    console.log('Auth service: User logged out, storage cleared');
  }
}
