import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentRemovalService } from '../../core/services/student-removal.service';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
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
    private toast: ToastService
  ) {
    this.loadRequests();
  }

  async loadRequests(): Promise<void> {
    const requests = await this.removalService.loadAll();
    this.requests.set(requests);
  }

  async approveRemoval(request: StudentRemovalRequest): Promise<void> {
    if (confirm(`Approve removal of student "${request.studentName}"? This will permanently delete the student record.`)) {
      await this.removalService.approve(request.id);
      await this.studentService.delete(request.studentId);
      this.toast.success(`Student "${request.studentName}" removed.`);
      await this.loadRequests();
    }
  }

  async rejectRemoval(request: StudentRemovalRequest): Promise<void> {
    if (confirm(`Reject removal request for "${request.studentName}"?`)) {
      await this.removalService.reject(request.id);
      this.toast.success('Removal request rejected.');
      await this.loadRequests();
    }
  }
}
