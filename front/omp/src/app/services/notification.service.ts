import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationDto, NotificationQueryParams, CreateNotificationDto } from '../models/notification.interface';
import { PaginatedResponse } from '../models/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/Notification`;

  // Subject to track unread notification count
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    // Initialize unread count on service creation
    this.loadUnreadCount();
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get notifications by recipient with pagination
  getNotificationsByRecipient(
    recipientId: string, 
    params: NotificationQueryParams = {}
  ): Observable<PaginatedResponse<NotificationDto>> {
    let httpParams = new HttpParams();
    
    if (params.pageNumber) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params.isRead !== undefined) {
      httpParams = httpParams.set('isRead', params.isRead.toString());
    }

    return this.http.get<PaginatedResponse<NotificationDto>>(
      `${this.apiUrl}/recipient/${recipientId}`,
      { 
        headers: this.getHeaders(),
        params: httpParams
      }
    ).pipe(
      map(response => ({
        ...response,
        items: response.items.map(item => ({
          ...item,
          dateSent: new Date(item.dateSent),
          dateRead: item.dateRead ? new Date(item.dateRead) : undefined
        }))
      }))
    );
  }

  // Get unread notifications count for current user
  getUnreadCount(userId: string): Observable<number> {
    return this.getNotificationsByRecipient(userId, { isRead: false, pageSize: 1 })
      .pipe(
        map(response => response.totalCount)
      );
  }
  // Load and update unread count
  loadUnreadCount(): void {
    const currentUserId = this.authService.getCurrentUserId();
    if (currentUserId) {
      this.getUnreadCount(currentUserId).subscribe({
        next: (count) => {
          this.unreadCountSubject.next(count);
        },
        error: (error) => {
          console.error('Error loading unread notification count:', error);
        }
      });
    }
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/${notificationId}/mark-as-read`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Delete notification
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${notificationId}`,
      { headers: this.getHeaders() }
    );
  }

  // Get notification by ID
  getNotificationById(id: string): Observable<NotificationDto> {
    return this.http.get<NotificationDto>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(notification => ({
        ...notification,
        dateSent: new Date(notification.dateSent),
        dateRead: notification.dateRead ? new Date(notification.dateRead) : undefined
      }))
    );
  }

  // Refresh unread count (call after marking as read or deleting)
  refreshUnreadCount(): void {
    this.loadUnreadCount();
  }

  // Create new notification
  createNotification(notification: CreateNotificationDto): Observable<NotificationDto> {
    return this.http.post<NotificationDto>(
      `${this.apiUrl}`,
      notification,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => ({
        ...response,
        dateSent: new Date(response.dateSent),
        dateRead: response.dateRead ? new Date(response.dateRead) : undefined
      }))
    );
  }
}