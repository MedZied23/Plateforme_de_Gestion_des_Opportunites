import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { CvAuditLogDto, Operation, ElementsCv } from '../models/cv-audit-log.interface';
import { PaginatedResponse } from '../models/pagination.interface';

@Injectable({
    providedIn: 'root'
})
export class CvAuditLogService {
    private apiUrl = `${environment.apiUrl}/CvAuditLog`;
    private http = inject(HttpClient);
    private authService = inject(AuthService);    /**
     * Get audit logs with pagination
     * @param pageNumber The page number (1-based)
     * @param pageSize The number of items per page
     * @param sortBy Optional field to sort by
     * @param sortDirection Optional sort direction ('asc' or 'desc')
     * @returns An Observable of paginated audit log entries
     */
    getAuditLogs(
        pageNumber: number = 1,
        pageSize: number = 10,
        sortBy?: string,
        sortDirection: string = 'desc'
    ): Observable<PaginatedResponse<CvAuditLogDto>> {
        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        let params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        if (sortBy) {
            params = params
                .set('sortBy', sortBy)
                .set('sortDirection', sortDirection);
        }

        return this.http.get<PaginatedResponse<CvAuditLogDto>>(this.apiUrl, { headers, params });
    }

    /**
     * Create a new audit log entry
     * @param auditLog The audit log entry to create
     * @returns An Observable of the created audit log entry
     */    createAuditLog(auditLog: Omit<CvAuditLogDto, 'id' | 'modifiedOn'>): Observable<CvAuditLogDto> {
        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });        // Transform the data to match the backend CreateCvAuditLogCommand structure
        const apiPayload = {
            cvId: auditLog.cvId,
            typeOperation: auditLog.typeOperation,  // Now sending integer enum values
            element: auditLog.element,               // Now sending integer enum values
            modifiedBy: auditLog.modifiedBy
        };

        return this.http.post<CvAuditLogDto>(this.apiUrl, apiPayload, { headers });
    }    /**
     * Get audit logs for a specific CV with pagination
     * @param cvId The ID of the CV
     * @param pageNumber The page number (1-based)
     * @param pageSize The number of items per page
     * @param sortBy Optional field to sort by (default: 'DateModification')
     * @param sortDirection Optional sort direction ('asc' or 'desc', default: 'desc')
     * @returns An Observable of paginated audit log entries
     */
    getAuditLogsByCvId(
        cvId: string,
        pageNumber: number = 1,
        pageSize: number = 50,
        sortBy: string = 'DateModification',
        sortDirection: string = 'desc'
    ): Observable<PaginatedResponse<CvAuditLogDto>> {
        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString())
            .set('sortBy', sortBy)
            .set('sortDirection', sortDirection);

        return this.http.get<PaginatedResponse<CvAuditLogDto>>(`${this.apiUrl}/cv/${cvId}`, { headers, params });
    }
}