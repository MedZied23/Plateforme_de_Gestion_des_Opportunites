import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, of, throwError } from 'rxjs';
import { switchMap, catchError, takeWhile, finalize, retry, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CvAnalysisProcessResponse {
  message: string;
  status: string;
  folder_id: string;
  document: string;
}

export interface CvAnalysisResults {
  results: {
    cv: {
      nom_user: string;
      presentation: string;
      formations: {
        diplome: string;
        institution: string;
        dateDebut: string;
        dateFin: string;
      }[];
      languesPratiquees: {
        [language: string]: string;
      };
      experiences: {
        employer: string;
        poste: string;
        dateDebut: string;
        dateFin: string;
      }[];
      certifications: string[];
      projets: {
        nom: string;
        year: number;
        client: string;
        domaine: string;
        perimetre: {
          [sentence: string]: string[];
        };
        role: string;
      }[];
    }
  };
  status: string;
  metadata: {
    lastUpdated: string;
    sourceDocument: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CvAnalysisResultsService {
  private apiUrl = !environment.production ? 'http://localhost:7071/api' : 'your-production-azure-function-url/api';
  private analysisResults = new BehaviorSubject<CvAnalysisResults | null>(null);
  private processingStatus = new BehaviorSubject<string>('idle');

  constructor(private http: HttpClient) { }

  // Process CV with the specified folder ID
  processCv(folderId: string): Observable<CvAnalysisProcessResponse> {
    this.processingStatus.next('processing');
    
    // Set proper headers
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    console.log(`Making POST request to ${this.apiUrl}/process-cv with folder_id: ${folderId}`);
    
    return this.http.post<CvAnalysisProcessResponse>(
      `${this.apiUrl}/process-cv`, 
      { folder_id: folderId },
      { headers }
    ).pipe(
      timeout(30000), // 30 second timeout
      retry(1),       // Retry once if it fails
      catchError(error => {
        console.error('Error in process-cv API call:', error);
        this.processingStatus.next('error');
        return throwError(() => new Error(`Failed to process CV: ${error.message || 'Unknown error'}`));
      })
    );
  }

  // Get analysis results with polling until completion
  getAnalysisResults(): Observable<CvAnalysisResults> {
    console.log('Starting polling for analysis results');
    // Poll the endpoint every 3 seconds until status is 'completed'
    return interval(3000).pipe(
      switchMap(() => this.fetchAnalysisResults()),
      takeWhile(response => {
        console.log('Analysis status:', response.status);
        return response.status !== 'completed';
      }, true),
      finalize(() => this.processingStatus.next('completed'))
    );
  }

  // Single fetch of analysis results
  private fetchAnalysisResults(): Observable<CvAnalysisResults> {
    // Set proper headers
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.get<CvAnalysisResults>(
      `${this.apiUrl}/get-analysis-results`,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error fetching analysis results:', error);
        // Return an empty result with status 'processing' to continue polling
        return of({
          results: { cv: { 
            nom_user: '', 
            presentation: '', 
            formations: [], 
            languesPratiquees: {},
            experiences: [],
            certifications: [],
            projets: []
          }},
          status: 'processing',
          metadata: { lastUpdated: '', sourceDocument: '' }
        });
      })
    );
  }

  // Get the current processing status
  getProcessingStatus(): Observable<string> {
    return this.processingStatus.asObservable();
  }

  // Set analysis results in the BehaviorSubject
  setAnalysisResults(results: CvAnalysisResults): void {
    this.analysisResults.next(results);
  }

  // Get analysis results from the BehaviorSubject
  getResults(): Observable<CvAnalysisResults | null> {
    return this.analysisResults.asObservable();
  }
}