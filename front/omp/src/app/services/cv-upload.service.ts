import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { CvService } from './cv.service';
import { CvDocumentService } from './cv-document.service';

@Injectable({
  providedIn: 'root'
})
export class CvUploadService {
  private apiUrl = `${environment.apiUrl}/Cv`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cvService: CvService,
    private cvDocumentService: CvDocumentService
  ) { }

  /**
   * Creates an empty CV and uploads a document to it
   * @param file The CV document file to upload (PDF, DOC, or DOCX)
   * @returns An Observable with the CV ID and the URL to access the file
   */
  createEmptyCvWithDocument(file: File): Observable<{ cvId: string, fileUrl: string }> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('No authentication token available for CV creation');
      return throwError(() => new Error('Authentication token required'));
    }

    // First create an empty CV
    return this.http.post<string>(`${this.apiUrl}/empty`, {}, { headers })
      .pipe(
        switchMap(cvId => {
          // Then upload the document to that CV
          return this.cvDocumentService.uploadDocument(cvId, file)
            .pipe(
              switchMap(response => {
                return new Observable<{ cvId: string, fileUrl: string }>(observer => {
                  observer.next({
                    cvId: cvId,
                    fileUrl: response.fileUrl
                  });
                  observer.complete();
                });
              })
            );
        }),
        catchError(error => {
          console.error('Error creating CV with document:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Uploads a document to an existing CV
   * @param cvId The ID of the existing CV
   * @param file The CV document file to upload (PDF, DOC, or DOCX)
   * @returns An Observable with the CV ID and the URL to access the file
   */
  uploadDocumentToExistingCv(cvId: string, file: File): Observable<{ cvId: string, fileUrl: string }> {
    // Upload the document directly to the existing CV
    return this.cvDocumentService.uploadDocument(cvId, file)
      .pipe(
        switchMap(response => {
          return new Observable<{ cvId: string, fileUrl: string }>(observer => {
            observer.next({
              cvId: cvId,
              fileUrl: response.fileUrl
            });
            observer.complete();
          });
        }),
        catchError(error => {
          console.error(`Error uploading document to CV ${cvId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Upload a document to a CV, creating a new CV if no ID is provided
   * @param file The CV document file to upload
   * @param existingCvId Optional ID of an existing CV
   * @returns An Observable with the CV ID and the URL to access the file
   */
  uploadCvDocument(file: File, existingCvId?: string): Observable<{ cvId: string, fileUrl: string }> {
    if (existingCvId) {
      // If we have an existing CV ID, upload to that CV
      return this.uploadDocumentToExistingCv(existingCvId, file);
    } else {
      // Otherwise create a new empty CV and upload to it
      return this.createEmptyCvWithDocument(file);
    }
  }
}