export interface NotificationDto {
  id: string;
  recipientIds: string[];
  senderId?: string;
  title: string;
  body: string;
  dateSent: Date;
  read: boolean;
  dateRead?: Date;
  opportuniteId?: string;
  propositionFinanciereId?: string;
}

export interface CreateNotificationDto {
  recipientIds: string[];
  senderId?: string;
  title: string;
  body: string;
  opportuniteId?: string;
  propositionFinanciereId?: string;
}

export interface NotificationQueryParams {
  pageNumber?: number;
  pageSize?: number;
  isRead?: boolean;
}