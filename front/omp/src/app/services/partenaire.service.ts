import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export enum TypePartenaire {
  ExpertIndividuel = 0,
  Entreprise = 1
}

export interface PartenaireDto {
  id: string;
  type?: TypePartenaire;  // Made optional with '?' to match backend changes
  nom?: string;
  domaine?: string;
  contactCle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PartenaireService {
  private apiUrl = `${environment.apiUrl}/Partenaire`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getPartenaires(): Observable<PartenaireDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<PartenaireDto[]>(this.apiUrl, { headers });
  }

  getPartenaireById(id: string): Observable<PartenaireDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<PartenaireDto>(`${this.apiUrl}/${id}`, { headers });
  }
  
  getPartenairesByName(name: string): Observable<PartenaireDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<PartenaireDto[]>(`${this.apiUrl}/search?name=${encodeURIComponent(name)}`, { headers });
  }

  createPartenaire(partenaire: PartenaireDto): Observable<string | PartenaireDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // The API returns either a string ID or a full PartenaireDto
    return this.http.post<string | PartenaireDto>(this.apiUrl, partenaire, { headers });
  }

  updatePartenaire(id: string, partenaire: PartenaireDto): Observable<PartenaireDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<PartenaireDto>(`${this.apiUrl}/${id}`, partenaire, { headers });
  }

  deletePartenaire(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}
