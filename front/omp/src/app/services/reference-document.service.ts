import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReferenceDocumentService {
  private baseUrl = `${environment.apiUrl}/ReferenceDocument`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Uploads a document for a reference
   * @param referenceId The ID of the reference
   * @param file The file to upload (PDF, DOC, or DOCX)
   * @returns An Observable with the URL to access the uploaded file
   */
  uploadDocument(referenceId: string, file: File): Observable<{fileUrl: string}> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Get the authentication token and create headers
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('No authentication token available for file upload');
    }
    
    console.log(`Uploading to URL: ${this.baseUrl}/${referenceId}`);
    console.log(`File details: name=${file.name}, type=${file.type}, size=${file.size} bytes`);
    
    return this.http.post<{fileUrl: string}>(`${this.baseUrl}/${referenceId}`, formData, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error uploading reference document:', error);
          
          if (error.status === 400) {
            console.error('Bad request: File validation failed');
          } else if (error.status === 401) {
            console.error('Unauthorized: Not authenticated');
          } else if (error.status === 0) {
            console.error('Network error: The server may be unavailable or CORS is not configured correctly');
          }
          
          return throwError(() => error);
        })
      );
  }

  /**
   * Gets the URL for a reference document
   * @param referenceId The ID of the reference
   * @param fileName The name of the file
   * @returns An Observable with the URL to access the file
   */
  getDocumentUrl(referenceId: string, fileName: string): Observable<{fileUrl: string}> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.get<{fileUrl: string}>(`${this.baseUrl}/${referenceId}/${fileName}`, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error getting reference document URL:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Deletes a reference document
   * @param referenceId The ID of the reference
   * @param fileName The name of the file to delete
   * @returns An Observable with the deletion result
   */
  deleteDocument(referenceId: string, fileName: string): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.delete(`${this.baseUrl}/${referenceId}/${fileName}`, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error deleting reference document:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Downloads a reference document
   * @param fileUrl The URL of the file to download
   * @param fileName The name to save the file as
   * @returns An Observable with the file blob
   */
  downloadDocument(fileUrl: string, fileName: string): Observable<Blob> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.get(fileUrl, { 
      headers,
      responseType: 'blob' 
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error downloading reference document:', error);
        return throwError(() => error);
      })
    );
  }
}