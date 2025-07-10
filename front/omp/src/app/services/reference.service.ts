import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ReferenceDto } from '../models/reference.interface';
import { PaginatedResponse } from '../models/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class ReferenceService {
  private apiUrl = `${environment.apiUrl}/Reference`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Get all references with pagination
   */
  getReferences(pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResponse<ReferenceDto>> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<PaginatedResponse<ReferenceDto>>(
      `${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      { headers }
    );
  }

  /**
   * Get a reference by ID
   */
  getReferenceById(id: string): Observable<ReferenceDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ReferenceDto>(`${this.apiUrl}/${id}`, { headers });
  }

  /**
   * Create a new reference
   */
  createReference(reference: Omit<ReferenceDto, 'id'>): Observable<ReferenceDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<ReferenceDto>(this.apiUrl, reference, { headers });
  }

  /**
   * Update an existing reference
   */
  updateReference(id: string, reference: ReferenceDto): Observable<ReferenceDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<ReferenceDto>(`${this.apiUrl}/${id}`, reference, { headers });
  }

  /**
   * Delete a reference
   */
  deleteReference(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  /**
   * Search references by criteria with pagination
   */
  searchReferences(searchQuery: string, pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResponse<ReferenceDto>> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const url = `${this.apiUrl}/search?${searchQuery}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
    return this.http.get<PaginatedResponse<ReferenceDto>>(url, { headers });
  }
}
