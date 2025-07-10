import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { ProjetDto } from '../models/projet.interface';

@Injectable({
  providedIn: 'root'
})
export class ProjetService {
  private apiUrl = `${environment.apiUrl}/Projet`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getProjets(): Observable<ProjetDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ProjetDto[]>(this.apiUrl, { headers });
  }

  getProjetById(id: string): Observable<ProjetDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ProjetDto>(`${this.apiUrl}/${id}`, { headers });
  }

  createProjet(projet: ProjetDto): Observable<string | ProjetDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<string | ProjetDto>(this.apiUrl, projet, { headers });
  }

  updateProjet(id: string, projet: ProjetDto): Observable<ProjetDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<ProjetDto>(`${this.apiUrl}/${id}`, projet, { headers });
  }

  deleteProjet(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  patchProjet(projet: ProjetDto): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.patch<void>(`${this.apiUrl}/${projet.id}`, projet, { headers });
  }
}