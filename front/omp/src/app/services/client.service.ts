import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ClientDto {
  id: string;
  nomClient: string;
  contactNom: string;
  pays: string;
  type: string;
  adresse: string;
  telephone: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}/Client`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getClients(): Observable<ClientDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ClientDto[]>(this.apiUrl, { headers });
  }

  createClient(client: ClientDto): Observable<string | ClientDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // The API returns either a string ID or a full ClientDto
    return this.http.post<string | ClientDto>(this.apiUrl, client, { headers });
  }

  updateClient(id: string, client: ClientDto): Observable<ClientDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<ClientDto>(`${this.apiUrl}/${id}`, client, { headers });
  }
}
