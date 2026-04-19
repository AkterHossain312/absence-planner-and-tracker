export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  type: 'holiday' | 'absence_approved' | 'absence_rejected' | 'absence_submitted' | 'info'
    | 'registration_pending' | 'registration_approved' | 'registration_rejected'
    | 'student_removal_pending' | 'student_removal_approved' | 'student_removal_rejected';
  read: boolean;
  createdAt: string;
}
