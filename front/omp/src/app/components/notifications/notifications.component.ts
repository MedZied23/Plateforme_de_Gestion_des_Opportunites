import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { NotificationDto } from '../../models/notification.interface';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: NotificationDto[] = [];
  isLoading: boolean = true;
  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadNotifications(): void {
    this.isLoading = true;
    
    const notificationSub = this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });

    this.subscription.add(notificationSub);
  }

  onNotificationClick(notification: NotificationDto): void {
    if (!notification.read) {
      this.markAsRead(notification);
    }
  }

  markAsRead(notification: NotificationDto): void {
    if (notification.read) return;

    const markReadSub = this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        // Update unread count
        this.notificationService.loadUnreadCount();
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });

    this.subscription.add(markReadSub);
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => !n.read);
    
    if (unreadNotifications.length === 0) return;

    unreadNotifications.forEach(notification => {
      this.markAsRead(notification);
    });
  }
  getTimeSince(date: Date): string {
    const now = new Date();
    const sentDate = new Date(date);
    const diffMs = now.getTime() - sentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return sentDate.toLocaleDateString('fr-FR');
    }
  }

  trackByNotificationId(index: number, notification: NotificationDto): string {
    return notification.id;
  }
}