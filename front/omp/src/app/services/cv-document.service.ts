import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { CvAuditLogService } from './cv-audit-log.service';
import { Operation, ElementsCv } from '../models/cv-audit-log.interface';

@Injectable({
  providedIn: 'root'
})
export class CvDocumentService {
  private baseUrl = `${environment.apiUrl}/CvDocument`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cvAuditLogService: CvAuditLogService
  ) { }

  /**
   * Uploads a document for a CV
   * @param cvId The ID of the CV
   * @param file The file to upload (PDF, DOC, or DOCX)
   * @returns An Observable with the URL to access the uploaded file
   */
  uploadDocument(cvId: string, file: File): Observable<{fileUrl: string}> {
    // Create a FormData object to hold the file
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
    
    // Log the request URL and details for debugging
    console.log(`Uploading to URL: ${this.baseUrl}/${cvId}`);
    console.log(`File details: name=${file.name}, type=${file.type}, size=${file.size} bytes`);
    
    return this.http.post<{fileUrl: string}>(`${this.baseUrl}/${cvId}`, formData, { 
      headers,
      // Don't use observe: 'body' with reportProgress as they're not compatible
    }).pipe(
        tap(() => {
          // Create audit log after successful upload
          this.createAuditLog(cvId, Operation.Add);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error uploading CV document:', error);
          
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
   * Gets the URL for a CV document
   * @param cvId The ID of the CV
   * @param fileName The name of the file
   * @returns An Observable with the URL to access the file
   */
  getDocumentUrl(cvId: string, fileName: string): Observable<{fileUrl: string}> {
    // Get the authentication token and create headers
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.get<{fileUrl: string}>(`${this.baseUrl}/${cvId}/${fileName}`, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error getting CV document URL:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Deletes a CV document
   * @param cvId The ID of the CV
   * @param fileName The name of the file to delete
   * @returns An Observable with the deletion result
   */
  deleteDocument(cvId: string, fileName: string): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.delete(`${this.baseUrl}/${cvId}/${fileName}`, { headers })
      .pipe(
        tap(() => {
          // Create audit log after successful deletion
          this.createAuditLog(cvId, Operation.Delete);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error deleting CV document:', error);
          return throwError(() => error);
        })
      );
  }

  private createAuditLog(cvId: string, operation: Operation): void {
    const currentUser = this.authService.getStoredUser();
    const decodedToken = this.authService.getDecodedToken();
    
    if (!currentUser || !decodedToken) {
      console.warn('Cannot create audit log: No current user or token found');
      return;
    }

    // Try to get user ID from JWT token
    const userId = decodedToken.sub || 
                  decodedToken.userId || 
                  decodedToken.id || 
                  decodedToken.nameid ||
                  decodedToken.unique_name ||
                  decodedToken.user_id;

    if (!userId) {
      console.error('Cannot create audit log: No user ID found in token claims');
      return;
    }

    const auditLogData = {
      cvId: cvId,
      typeOperation: operation,
      element: ElementsCv.File,
      modifiedBy: userId,
      dateModification: new Date()
    };

    this.cvAuditLogService.createAuditLog(auditLogData).subscribe({
      next: (response) => {
        console.log('Audit log created successfully:', response);
      },
      error: (error) => {
        console.error('Error creating audit log:', error);
      }
    });
  }
}