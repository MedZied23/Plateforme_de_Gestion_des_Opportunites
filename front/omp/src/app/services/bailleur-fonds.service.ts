import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface BailleurDeFondDto {
  id: string;
  nomBailleur: string;
  modele?: string; // Making modele optional as it might be null
}

@Injectable({
  providedIn: 'root'
})
export class BailleurDeFondsService {
  private apiUrl = `${environment.apiUrl}/BailleurDeFond`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getBailleursDeFonds(): Observable<BailleurDeFondDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<BailleurDeFondDto[]>(this.apiUrl, { headers });
  }

  createBailleurDeFonds(bailleur: BailleurDeFondDto): Observable<string | BailleurDeFondDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // The API returns either a string ID or a full BailleurDeFondDto
    return this.http.post<string | BailleurDeFondDto>(this.apiUrl, bailleur, { headers });
  }
}
