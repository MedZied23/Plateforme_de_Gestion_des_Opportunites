import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface UserDto {
  id: string;        // UUID format
  nom: string;
  prenom: string;
  email: string;
  phone: string;
  role: number;      // Role as numeric value (enum)
}

export interface CreateUserRequest {
  nom: string;
  prenom: string;
  email: string;
  phone: string;
  password: string;
  role: number;
}

export interface UpdateUserRequest {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  phone: string;
  role: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/User`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getUsers(): Observable<UserDto[]> {
    // Get the JWT token using authService
    const token = this.authService.getToken();
    
    // Set up headers with Authorization token
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    console.log('Fetching users with token:', token ? 'Token exists' : 'No token');
    return this.http.get<UserDto[]>(this.apiUrl, { headers });
  }
  
  getUserById(id: string): Observable<UserDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<UserDto>(`${this.apiUrl}/${id}`, { headers });
  }

  createUser(user: CreateUserRequest): Observable<UserDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Creating user:', user);
    return this.http.post<UserDto>(this.apiUrl, user, { headers });
  }

  updateUser(user: UpdateUserRequest): Observable<UserDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Updating user:', user);
    return this.http.put<UserDto>(`${this.apiUrl}/${user.id}`, user, { headers });
  }

  deleteUser(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Deleting user:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}
