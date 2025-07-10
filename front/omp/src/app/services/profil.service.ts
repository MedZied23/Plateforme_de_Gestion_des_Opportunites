import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { ProfilDto } from '../models/profil.interface';

@Injectable({
  providedIn: 'root'
})
export class ProfilService {
  private apiUrl = `${environment.apiUrl}/Profil`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getProfils(): Observable<ProfilDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ProfilDto[]>(this.apiUrl, { headers });
  }

  getProfilById(id: string): Observable<ProfilDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ProfilDto>(`${this.apiUrl}/${id}`, { headers });
  }

  getProfilsByPartenaire(partenaireId: string): Observable<ProfilDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ProfilDto[]>(`${this.apiUrl}/partenaire/${partenaireId}`, { headers });
  }

  getProfilsByPropositionFinanciere(propositionFinanciereId: string): Observable<ProfilDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ProfilDto[]>(`${this.apiUrl}/proposition/${propositionFinanciereId}`, { headers });
  }

  createProfil(profil: ProfilDto): Observable<string | ProfilDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<string | ProfilDto>(this.apiUrl, profil, { headers });
  }

  updateProfil(id: string, profil: ProfilDto): Observable<ProfilDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<ProfilDto>(`${this.apiUrl}/${id}`, profil, { headers });
  }

  deleteProfil(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}