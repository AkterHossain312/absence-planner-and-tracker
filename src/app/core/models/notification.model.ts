export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  type: 'holiday' | 'absence_approved' | 'absence_rejected' | 'absence_submitted' | 'info';
  read: boolean;
  createdAt: string;
}
