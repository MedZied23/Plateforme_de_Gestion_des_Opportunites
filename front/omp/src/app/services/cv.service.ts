import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { CvDto } from '../models/cv.interface';
import { PaginatedResponse } from '../models/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class CvService {
  private apiUrl = `${environment.apiUrl}/Cv`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getCvs(pageNumber: number = 1, pageSize: number = 6, sortBy: string = 'LastAccessed', sortDirection: string = 'desc'): Observable<PaginatedResponse<CvDto>> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    return this.http.get<PaginatedResponse<CvDto>>(this.apiUrl, { headers, params });
  }

  getCvById(id: string): Observable<CvDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<CvDto>(`${this.apiUrl}/${id}`, { headers });
  }

  getCvByUserId(userId: string): Observable<CvDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<CvDto>(`${this.apiUrl}/user/${userId}`, { headers });
  }

  createCv(cv: CvDto): Observable<string | CvDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<string | CvDto>(this.apiUrl, cv, { headers });
  }

  updateCv(id: string, cv: CvDto): Observable<CvDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<CvDto>(`${this.apiUrl}/${id}`, cv, { headers });
  }

  deleteCv(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  searchCvsByKeywords(
    keywords: string, 
    useFuzzySearch: boolean = true, 
    minimumSimilarityScore: number = 70,
    pageNumber: number = 1,
    pageSize: number = 6
  ): Observable<PaginatedResponse<CvDto>> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    let params = new HttpParams()
      .set('keywords', keywords)
      .set('useFuzzySearch', useFuzzySearch.toString())
      .set('minimumSimilarityScore', minimumSimilarityScore.toString())
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResponse<CvDto>>(`${this.apiUrl}/search`, { headers, params });
  }
}