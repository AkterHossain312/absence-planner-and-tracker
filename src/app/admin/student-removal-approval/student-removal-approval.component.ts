import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentRemovalService } from '../../core/services/student-removal.service';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { StudentRemovalRequest, RemovalStatus } from '../../core/models/student-removal.model';

@Component({
  selector: 'app-student-removal-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-removal-approval.component.html',
  styleUrl: './student-removal-approval.component.scss'
})
export class StudentRemovalApprovalComponent {
  requests = signal<StudentRemovalRequest[]>([]);
  filter = signal<'all' | RemovalStatus>('all');

  filteredRequests = computed(() => {
    const f = this.filter();
    const all = this.requests();
    return f === 'all' ? all : all.filter(r => r.status === f);
  });

  constructor(
    private removalService: StudentRemovalService,
    private studentService: StudentService,
    private auth: AuthService,
    private notificationService: NotificationService,
    private toast: ToastService
  ) {
    this.loadRequests();
  }

  loadRequests(): void {
    this.requests.set(this.removalService.getAll());
  }

  approveRemoval(request: StudentRemovalRequest): void {
    if (confirm(`Approve removal of student "${request.studentName}"? This will permanently delete the student record.`)) {
      setTimeout(() => {
        this.removalService.updateStatus(request.id, 'approved', this.auth.currentUserId());
        this.studentService.delete(request.studentId);
        this.notificationService.notifyUser(
          request.requestedBy,
          `Your request to remove "${request.studentName}" has been approved. The student has been removed.`,
          'student_removal_approved'
        );
        this.toast.success(`Student "${request.studentName}" removed.`);
        this.loadRequests();
      }, 300);
    }
  }

  rejectRemoval(request: StudentRemovalRequest): void {
    if (confirm(`Reject removal request for "${request.studentName}"?`)) {
      setTimeout(() => {
        this.removalService.updateStatus(request.id, 'rejected', this.auth.currentUserId());
        this.notificationService.notifyUser(
          request.requestedBy,
          `Your request to remove "${request.studentName}" has been rejected.`,
          'student_removal_rejected'
        );
        this.toast.success('Removal request rejected.');
        this.loadRequests();
      }, 300);
    }
  }
}
