export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  type: 'holiday' | 'absence_approved' | 'absence_rejected' | 'info';
  read: boolean;
  createdAt: string;
}
