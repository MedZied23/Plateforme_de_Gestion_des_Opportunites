import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Create a context token to skip authentication for specific requests
export const SKIP_AUTH_INTERCEPTOR = new HttpContextToken<boolean>(() => false);

// Define interfaces for the analysis results
export interface AnalysisOpportuniteData {
  nomOpportunite: string;
  partnerExists: boolean;
  description: string;
  nature: string;
  pays: string;
  dateDebut: string;
  dateFin: string;
  duree: number;
  bailleurExists: boolean;
  monnaie: string;
  offre: string;
}

export interface AnalysisClientData {
  nomClient: string;
  contactClé: string;
  pays: string;
  type: string;
  adresse: string;
  telephone: string;
}

export interface AnalysisPartenaireData {
  type: string;
  nom: string;
  domaine: string;
  contactCle: string;
}

export interface AnalysisBailleurData {
  nom: string;
}

export interface AnalysisResultsResponse {
  results: {
    Opportunite: AnalysisOpportuniteData;
    Client: AnalysisClientData;
    Partenaires: AnalysisPartenaireData;
    Bailleurs: AnalysisBailleurData;
  };
  metadata: {
    lastUpdated: string;
    sourceDocument: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalysisResultsService {
  // Different API URL specifically for the analysis service
  private analysisApiUrl = 'http://localhost:9000/api';
  
  constructor(private http: HttpClient) { }
  /**
   * Get analysis results
   * @returns Observable of the analysis results
   * Skip auth interceptor by using a custom context
   */
  getAnalysisResults(): Observable<AnalysisResultsResponse> {
    const url = `${this.analysisApiUrl}/get-analysis-results`;
    // Create a context that tells our interceptors to skip adding auth headers
    const httpOptions = {
      context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true)
    };
    return this.http.get<AnalysisResultsResponse>(url, httpOptions);
  }
}