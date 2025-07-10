import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { FormationDto } from '../models/formation.interface';

@Injectable({
  providedIn: 'root'
})
export class FormationService {
  private apiUrl = `${environment.apiUrl}/Formation`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getFormations(): Observable<FormationDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<FormationDto[]>(this.apiUrl, { headers });
  }

  getFormationById(id: string): Observable<FormationDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<FormationDto>(`${this.apiUrl}/${id}`, { headers });
  }

  createFormation(formation: FormationDto): Observable<string | FormationDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<string | FormationDto>(this.apiUrl, formation, { headers });
  }

  updateFormation(id: string, formation: FormationDto): Observable<FormationDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<FormationDto>(`${this.apiUrl}/${id}`, formation, { headers });
  }

  deleteFormation(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}