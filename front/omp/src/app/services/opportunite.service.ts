import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, switchMap, map } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { Nature } from '../enums/nature.enum';

export interface OpportuniteDto {
  id: string;
  nomOpportunite?: string;
  clientId?: string;
  partnerExists?: boolean;  partenaireId?: string[];  // Changed to array of strings (Guid)
  description?: string;
  nature?: Nature;  // AMI = 0, Propale = 1, Pitch = 2
  pays?: string;
  dateDebut?: Date;
  dateFin?: Date;
  duree?: number;
  bailleurExists?: boolean;  // New field
  idBailleurDeFonds?: string[];  // Changed to array of strings (Guid)  associeEnCharge?: string;  // This is a Guid string
  associeEnCharge?: string;
  managerEnCharge?: string;  // This is a Guid string
  coManagerEnCharge?: string;  // This is a Guid string
  seniorManagerEnCharge?: string;  // This is a Guid string
  equipeProjet?: string[];  // Array of Guid strings
  monnaie?: string;
  offre?: string;  // e-ID, TMT, GPS, etc.  idPropositionFinanciere?: string;  // Foreign key to PropositionFinanciere - nullable Guid
  status?: number;  // Status of the opportunity
  commentaire?: string;  // Comment field
  linkTeams1?: string;  // Link to Teams channel 1
  linkTeams2?: string;  // Link to Teams channel 2
  linkPropositionFinanciere?: string;  // Link to financial proposition
  idPropositionFinanciere?: string;  // Foreign key to PropositionFinanciere - nullable Guid
}

@Injectable({
  providedIn: 'root'
})
export class OpportuniteService {
  private apiUrl = `${environment.apiUrl}/Opportunite`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  getOpportunites(): Observable<OpportuniteDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<OpportuniteDto[]>(this.apiUrl, { 
      headers,
      params: {
        pageNumber: '1',
        pageSize: '100', // Increase page size to get more results
        sortBy: 'DateModification',
        sortDirection: 'desc'
      }
    }).pipe(
      tap(response => {
        console.log('API Response:', response);
        console.log('Number of opportunities:', Array.isArray(response) ? response.length : 'Not an array');
      })
    );
  }

  getOpportuniteById(id: string): Observable<OpportuniteDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<OpportuniteDto>(`${this.apiUrl}/${id}`, { headers });
  }

  createOpportunite(opportunite: Omit<OpportuniteDto, 'id'>): Observable<OpportuniteDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<OpportuniteDto>(this.apiUrl, opportunite, { headers });
  }

  updateOpportunite(id: string, opportunite: OpportuniteDto): Observable<OpportuniteDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<OpportuniteDto>(`${this.apiUrl}/${id}`, opportunite, { headers });
  }

  deleteOpportunite(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  getOpportuniteByPropositionFinanciereId(propositionFinanciereId: string): Observable<string | { value: string } | null> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<string | { value: string } | null>(`${this.apiUrl}/proposition-financiere/${propositionFinanciereId}`, { headers });
  }  updateOpportunityStatus(id: string, status: number): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // First get the current opportunity data, then update only the status
    return this.getOpportuniteById(id).pipe(
      switchMap(currentOpportunity => {
        const updatedOpportunity: OpportuniteDto = {
          ...currentOpportunity,
          status: status
        };
        return this.updateOpportunite(id, updatedOpportunity);
      }),
      map(() => void 0) // Convert the response to void to match the original return type
    );
  }

  updateOpportunityStatusWithComment(id: string, status: number, comment?: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // First get the current opportunity data, then update the status and comment
    return this.getOpportuniteById(id).pipe(
      switchMap(currentOpportunity => {
        const updatedOpportunity: OpportuniteDto = {
          ...currentOpportunity,
          status: status,
          commentaire: comment || currentOpportunity.commentaire
        };
        return this.updateOpportunite(id, updatedOpportunity);
      }),
      map(() => void 0) // Convert the response to void to match the original return type
    );
  }
}
