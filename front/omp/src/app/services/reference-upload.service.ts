import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ReferenceService } from './reference.service';
import { ReferenceDocumentService } from './reference-document.service';

@Injectable({
  providedIn: 'root'
})
export class ReferenceUploadService {
  private apiUrl = `${environment.apiUrl}/Reference`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private referenceService: ReferenceService,
    private referenceDocumentService: ReferenceDocumentService
  ) { }
  /**
   * Creates an empty reference and uploads a document to it
   * @param file The reference document file to upload (PDF, DOC, or DOCX)
   * @returns An Observable with the reference ID and the URL to access the file
   */
  createEmptyReferenceWithDocument(file: File): Observable<{ referenceId: string, fileUrl: string }> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('No authentication token available for reference creation');
      return throwError(() => new Error('Authentication token required'));
    }    // Create an empty reference through the reference service
    const emptyReference = {
      nom: 'New Reference', // Temp name
      country: '',
      offre: '',
      client: '',
      budget: 0,
      dateDebut: new Date(),
      dateFin: new Date(),
      equipe: {}, // Changed from array to dictionary
      documentUrl: '',
      description: '',
      services: {},
      lastModified: new Date(),
      lastAccessed: new Date()
    };

    // Create reference through the standard endpoint
    return this.referenceService.createReference(emptyReference).pipe(
      switchMap(reference => {
        // Then upload the document to that reference
        return this.referenceDocumentService.uploadDocument(reference.id, file)
          .pipe(
            switchMap(response => {
              return new Observable<{ referenceId: string, fileUrl: string }>(observer => {
                observer.next({
                  referenceId: reference.id,
                  fileUrl: response.fileUrl
                });
                observer.complete();
              });
            })
          );
      }),
      catchError(error => {
        console.error('Error creating reference with document:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Uploads a document to an existing reference
   * @param referenceId The ID of the existing reference
   * @param file The reference document file to upload (PDF, DOC, or DOCX)
   * @returns An Observable with the reference ID and the URL to access the file
   */
  uploadDocumentToExistingReference(referenceId: string, file: File): Observable<{ referenceId: string, fileUrl: string }> {
    // Upload the document directly to the existing reference
    return this.referenceDocumentService.uploadDocument(referenceId, file)
      .pipe(
        switchMap(response => {
          return new Observable<{ referenceId: string, fileUrl: string }>(observer => {
            observer.next({
              referenceId: referenceId,
              fileUrl: response.fileUrl
            });
            observer.complete();
          });
        }),
        catchError(error => {
          console.error(`Error uploading document to reference ${referenceId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Upload a document to a reference, creating a new reference if no ID is provided
   * @param file The reference document file to upload
   * @param existingReferenceId Optional ID of an existing reference
   * @returns An Observable with the reference ID and the URL to access the file
   */
  uploadReferenceDocument(file: File, existingReferenceId?: string): Observable<{ referenceId: string, fileUrl: string }> {
    if (existingReferenceId) {
      // If we have an existing reference ID, upload to that reference
      return this.uploadDocumentToExistingReference(existingReferenceId, file);
    } else {
      // Otherwise create a new empty reference and upload to it
      return this.createEmptyReferenceWithDocument(file);
    }
  }
}
