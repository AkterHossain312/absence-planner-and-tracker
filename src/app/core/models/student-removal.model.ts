export type RemovalStatus = 'pending' | 'approved' | 'rejected';

export interface StudentRemovalRequest {
  id: string;
  studentId: string;
  studentName: string;
  requestedBy: string;
  requestedByName: string;
  reason: string;
  status: RemovalStatus;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
