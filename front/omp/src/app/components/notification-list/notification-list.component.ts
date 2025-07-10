import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { NotificationDto } from '../../models/notification.interface';
import { PaginatedResponse } from '../../models/pagination.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css']
})
export class NotificationListComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private subscriptions: Subscription[] = [];

  notifications: NotificationDto[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalCount = 0;
  
  // Filters
  showUnreadOnly = false;

  // Make Math available in template
  Math = Math;
  
  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadNotifications(): void {
    const currentUserId = this.authService.getCurrentUserId();    if (!currentUserId) {
      this.error = 'Utilisateur non authentifié';
      return;
    }

    this.isLoading = true;
    this.error = null;

    const params = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      isRead: this.showUnreadOnly ? false : undefined
    };

    const subscription = this.notificationService.getNotificationsByRecipient(currentUserId, params)
      .subscribe({
        next: (response: PaginatedResponse<NotificationDto>) => {
          this.notifications = response.items;
          this.totalCount = response.totalCount;
          this.totalPages = response.totalPages;
          this.isLoading = false;
        },        error: (error) => {
          console.error('Error loading notifications:', error);
          this.error = 'Échec du chargement des notifications';
          this.isLoading = false;
        }
      });

    this.subscriptions.push(subscription);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadNotifications();
    }
  }

  onFilterChange(): void {
    this.currentPage = 1; // Reset to first page when filter changes
    this.loadNotifications();
  }
  markAsRead(notification: NotificationDto): void {
    if (notification.read) return;

    const subscription = this.notificationService.markAsRead(notification.id)
      .subscribe({
        next: () => {
          notification.read = true;
          notification.dateRead = new Date();
          this.notificationService.refreshUnreadCount();
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });

    this.subscriptions.push(subscription);
  }

  onNotificationClick(notification: NotificationDto): void {
    this.markAsRead(notification);
    
    // Handle redirection based on notification type
    if (notification.opportuniteId) {
      // Navigate to opportunity tracking page
      this.router.navigate(['/layout/opportunity-tracking', notification.opportuniteId]);
    } else if (notification.propositionFinanciereId) {
      // Navigate to proposition financiere page with query parameter
      this.router.navigate(['/layout/offre-financiere'], {
        queryParams: { propositionId: notification.propositionFinanciereId }
      });
    }
  }
  deleteNotification(notification: NotificationDto): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      const subscription = this.notificationService.deleteNotification(notification.id)
        .subscribe({
          next: () => {
            this.notifications = this.notifications.filter(n => n.id !== notification.id);
            this.notificationService.refreshUnreadCount();
            
            // If this was the last item on the page and not the first page, go to previous page
            if (this.notifications.length === 0 && this.currentPage > 1) {
              this.currentPage--;
              this.loadNotifications();
            } else {
              // Update total count
              this.totalCount--;
              this.totalPages = Math.ceil(this.totalCount / this.pageSize);
            }
          },
          error: (error) => {
            console.error('Error deleting notification:', error);
          }
        });

      this.subscriptions.push(subscription);
    }
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours !== 1 ? 's' : ''}`;
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jour${diffInDays !== 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }

  getPaginationArray(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
}
