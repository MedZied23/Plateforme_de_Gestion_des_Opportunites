import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OpportuniteDocumentService {  private baseUrl = `${environment.apiUrl}/OpportuniteDocument`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  /**
   * Uploads a document for an opportunité
   * @param opportuniteId The ID of the opportunité
   * @param file The file to upload (PDF, DOC, or DOCX)
   * @returns An Observable with the URL to access the uploaded file
   */  uploadDocument(opportuniteId: string, file: File): Observable<{fileUrl: string}> {
    console.log(`Attempting to upload file: ${file.name}, size: ${file.size}, type: ${file.type} for opportunité: ${opportuniteId}`);
    
    // Verify the opportuniteId is valid
    if (!opportuniteId) {
      console.error('Invalid opportuniteId provided for file upload');
      return throwError(() => new Error('Invalid opportuniteId'));
    }
      const formData = new FormData();
    formData.append('file', file, file.name); // Explicitly include filename
    
    // Get the authentication token and create headers
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('No authentication token available for file upload');
    }
    
    // Important: Do NOT set Content-Type header, let the browser set it with the correct boundary
    
    // Log the request URL and details for debugging
    console.log(`Uploading to URL: ${this.baseUrl}/${opportuniteId}`);
    console.log(`File details: name=${file.name}, type=${file.type}, size=${file.size} bytes`);
    
    return this.http.post<{fileUrl: string}>(`${this.baseUrl}/${opportuniteId}`, formData, { 
      headers,
      // Don't use observe: 'body' with reportProgress as they're not compatible
    }).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Document upload error details:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            message: error.message,
            url: error.url
          });
          
          // Check specific error conditions
          if (error.status === 400) {
            console.error('Bad Request (400) details:', error.error);
          } else if (error.status === 401) {
            console.error('Authentication error (401): Token may be invalid or expired');
          } else if (error.status === 0) {
            console.error('Network error: The server may be unavailable or CORS is not configured correctly');
          }
          
          return throwError(() => error);
        })
      );
  }

  /**
   * Gets the URL to access a document
   * @param opportuniteId The ID of the opportunité
   * @param fileName The name of the file
   * @returns An Observable with the URL to access the file
   */
  getDocumentUrl(opportuniteId: string, fileName: string): Observable<{fileUrl: string}> {
    return this.http.get<{fileUrl: string}>(`${this.baseUrl}/${opportuniteId}/${fileName}`);
  }
}
