import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { LivrableDto } from '../models/livrable.interface';

@Injectable({
  providedIn: 'root'
})
export class LivrableService {
  private apiUrl = `${environment.apiUrl}/Livrable`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getLivrables(): Observable<LivrableDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<LivrableDto[]>(this.apiUrl, { headers });
  }

  getLivrableById(id: string): Observable<LivrableDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<LivrableDto>(`${this.apiUrl}/${id}`, { headers });
  }

  getLivrablesByPhaseId(phaseId: string): Observable<LivrableDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<LivrableDto[]>(`${this.apiUrl}/phase/${phaseId}`, { headers });
  }
  
  getLivrablesByPropositionFinanciereId(propositionFinanciereId: string): Observable<LivrableDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<LivrableDto[]>(`${this.apiUrl}/proposition/${propositionFinanciereId}`, { headers });
  }

  createLivrable(livrable: Omit<LivrableDto, 'id'>): Observable<LivrableDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<LivrableDto>(this.apiUrl, livrable, { headers });
  }

  updateLivrable(id: string, livrable: LivrableDto): Observable<LivrableDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<LivrableDto>(`${this.apiUrl}/${id}`, livrable, { headers });
  }

  deleteLivrable(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}