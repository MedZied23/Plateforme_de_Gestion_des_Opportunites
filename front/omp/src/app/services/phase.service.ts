import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { Phase } from '../models/phase.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PhaseService {
  private apiUrl = `${environment.apiUrl}/Phase`; // Changed from '/phases' to '/Phase'

  constructor(private http: HttpClient) {
    console.log('PhaseService initialized with API URL:', this.apiUrl);
  }

  getPhases(): Observable<Phase[]> {
    return this.http.get<Phase[]>(this.apiUrl);
  }

  getPhaseById(id: string): Observable<Phase> {
    return this.http.get<Phase>(`${this.apiUrl}/${id}`);
  }

  getPhasesByPropositionId(propositionId: string): Observable<Phase[]> {
    // Use the dedicated endpoint we created in the backend
    return this.http.get<Phase[]>(`${this.apiUrl}/byProposition/${propositionId}`)
      .pipe(
        // Sort phases by numero (in case they aren't already sorted by the backend)
        map(phases => phases.sort((a, b) => (a.numero || 0) - (b.numero || 0)))
      );
  }

  createPhase(phase: Phase): Observable<Phase> {
    // Directly send the phase object to the API
    // This will preserve the numero value set in the add-livrable component
    return this.http.post<Phase>(this.apiUrl, phase);
  }

  updatePhase(phase: Phase): Observable<Phase> {
    return this.http.put<Phase>(`${this.apiUrl}/${phase.id}`, phase);
  }

  deletePhase(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}