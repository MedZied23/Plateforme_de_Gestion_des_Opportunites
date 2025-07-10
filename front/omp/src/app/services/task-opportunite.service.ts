import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { TaskOpportuniteDto } from '../models/task-opportunite.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskOpportuniteService {
  private apiUrl = `${environment.apiUrl}/OpportuniteTask`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Get a task by its ID
   * @param id The task ID
   * @returns Observable of TaskOpportuniteDto
   */
  getTaskById(id: string): Observable<TaskOpportuniteDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<TaskOpportuniteDto>(`${this.apiUrl}/${id}`, { headers });
  }
  /**
   * Get all tasks for a specific opportunity
   * @param opportuniteId The opportunity ID
   * @returns Observable of TaskOpportuniteDto array
   */
  getTasksByOpportuniteId(opportuniteId: string): Observable<TaskOpportuniteDto[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<TaskOpportuniteDto[]>(`${this.apiUrl}/by-opportunite/${opportuniteId}`, { headers });
  }

  /**
   * Update an existing task
   * @param id The task ID
   * @param task The updated task data
   * @returns Observable of TaskOpportuniteDto
   */
  updateTask(id: string, task: TaskOpportuniteDto): Observable<TaskOpportuniteDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<TaskOpportuniteDto>(`${this.apiUrl}/${id}`, task, { headers });
  }

  /**
   * Create a new manual task
   * @param task The task data to create
   * @returns Observable of TaskOpportuniteDto
   */
  createTask(task: Partial<TaskOpportuniteDto>): Observable<TaskOpportuniteDto> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<TaskOpportuniteDto>(this.apiUrl, task, { headers });
  }

  /**
   * Delete a task
   * @param id The task ID to delete
   * @returns Observable of void
   */
  deleteTask(id: string): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}
