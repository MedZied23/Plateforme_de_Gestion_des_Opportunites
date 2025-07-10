import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { NotificationDto } from '../../models/notification.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-dropdown.component.html',
  styleUrl: './notification-dropdown.component.css'
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private subscriptions: Subscription[] = [];

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  notifications: NotificationDto[] = [];
  isLoading = false;
  currentUserId: string | null = null;

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    this.loadRecentNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadRecentNotifications(): void {
    if (!this.currentUserId) return;

    this.isLoading = true;
    const subscription = this.notificationService.getNotificationsByRecipient(
      this.currentUserId,
      { pageNumber: 1, pageSize: 5 } // Show only 5 most recent notifications
    ).subscribe({
      next: (response) => {
        this.notifications = response.items;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });

    this.subscriptions.push(subscription);
  }

  markAsRead(notification: NotificationDto): void {
    if (!notification.read) {
      const subscription = this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.read = true;
          notification.dateRead = new Date();
          // Refresh the unread count in the service
          this.notificationService.refreshUnreadCount();
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });

      this.subscriptions.push(subscription);
    }
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
    
    this.close.emit();
  }

  viewAllNotifications(): void {
    this.close.emit();
    // Navigation will be handled by the routerLink in the template
  }

  closeDropdown(): void {
    this.close.emit();
  }

  getTimeSince(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'À l\'instant';
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `Il y a ${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `Il y a ${days}j`;
    }
  }

  // Truncate long notification bodies
  truncateText(text: string, maxLength: number = 80): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}