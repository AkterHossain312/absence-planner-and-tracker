export type AbsenceStatus = 'pending' | 'approved' | 'rejected';

export type HomeworkLoad = 'Increase' | 'Decrease' | 'Moderate';

export interface Absence {
  id: string;
  studentId: string;
  studentName: string;
  userId: string;
  userName: string;
  holidayId: string | null;
  startDate: string;
  endDate: string;
  reason: string;
  homeworkLoad: HomeworkLoad;
  digitalKumon: boolean;
  status: AbsenceStatus;
  lockedBy: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
