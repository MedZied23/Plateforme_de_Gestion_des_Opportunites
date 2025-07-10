import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { PropositionFinanciereDto } from '../models/proposition-financiere.interface';
import { PaginatedResponse } from '../models/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class PropositionFinanciereService {
  private apiUrl = `${environment.apiUrl}/PropositionFinanciere`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);  /**
   * Get propositions financières with pagination and sorting
   * @param pageNumber The page number (starting from 1)
   * @param pageSize The number of items per page
   * @param sortBy The field to sort by (default: 'lastModified')
   * @param sortDirection The sort direction ('asc' or 'desc', default: 'desc')
   * @returns Observable of PaginatedResponse containing PropositionFinanciereDto array
   */
  getPropositionsFinancieres(
    pageNumber: number = 1, 
    pageSize: number = 10,
    sortBy: string = 'lastModified',
    sortDirection: string = 'desc'
  ): Observable<PaginatedResponse<PropositionFinanciereDto>> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    return this.http.get<PaginatedResponse<PropositionFinanciereDto>>(this.apiUrl, { headers, params });
  }
  
  /**
   * Get all propositions financières without pagination (for backward compatibility)
   * @returns Observable of PropositionFinanciereDto array
   */
  getAllPropositionsFinancieres(): Observable<PropositionFinanciereDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<PropositionFinanciereDto[]>(`${this.apiUrl}/all`, { headers });
  }

  /**
   * Get a specific proposition financière by ID
   * @param id The ID of the proposition financière
   * @returns Observable of PropositionFinanciereDto
   */
  getPropositionFinanciereById(id: string): Observable<PropositionFinanciereDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<PropositionFinanciereDto>(`${this.apiUrl}/${id}`, { headers });
  }

  /**
   * Get propositions financières related to an opportunity
   * @param opportuniteId The ID of the opportunity
   * @returns Observable of PropositionFinanciereDto array
   */
  getPropositionsByOpportuniteId(opportuniteId: string): Observable<PropositionFinanciereDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<PropositionFinanciereDto[]>(`${this.apiUrl}/opportunite/${opportuniteId}`, { headers });
  }

  /**
   * Create a new proposition financière
   * @param proposition The proposition financière data
   * @returns Observable of the created PropositionFinanciereDto or string ID
   */
  createPropositionFinanciere(proposition: Omit<PropositionFinanciereDto, 'id'>): Observable<string | PropositionFinanciereDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<string | PropositionFinanciereDto>(this.apiUrl, proposition, { headers });
  }

  /**
   * Update an existing proposition financière
   * @param id The ID of the proposition to update
   * @param proposition The updated proposition financière data
   * @returns Observable of the updated PropositionFinanciereDto
   */
  updatePropositionFinanciere(id: string, proposition: PropositionFinanciereDto): Observable<PropositionFinanciereDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<PropositionFinanciereDto>(`${this.apiUrl}/${id}`, proposition, { headers });
  }

  /**
   * Delete a proposition financière
   * @param id The ID of the proposition to delete
   * @returns Observable of void
   */
  deletePropositionFinanciere(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  /**
   * Generate a matrix report for a proposition financière
   * @param id The ID of the proposition financière
   * @returns Observable of the matrix data
   */
  generateMatriceReport(id: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.apiUrl}/${id}/matrice-report`, { headers });
  }
}