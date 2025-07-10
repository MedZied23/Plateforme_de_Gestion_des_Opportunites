import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { ExperienceDto } from '../models/experience.interface';

@Injectable({
  providedIn: 'root'
})
export class ExperienceService {
  private apiUrl = `${environment.apiUrl}/Experience`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getExperiences(): Observable<ExperienceDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ExperienceDto[]>(this.apiUrl, { headers });
  }

  getExperienceById(id: string): Observable<ExperienceDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ExperienceDto>(`${this.apiUrl}/${id}`, { headers });
  }

  createExperience(experience: ExperienceDto): Observable<string | ExperienceDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<string | ExperienceDto>(this.apiUrl, experience, { headers });
  }

  updateExperience(id: string, experience: ExperienceDto): Observable<ExperienceDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<ExperienceDto>(`${this.apiUrl}/${id}`, experience, { headers });
  }

  deleteExperience(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}