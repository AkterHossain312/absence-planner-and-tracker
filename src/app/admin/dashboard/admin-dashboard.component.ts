import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../core/services/student.service';
import { HolidayService } from '../../core/services/holiday.service';
import { AbsenceService } from '../../core/services/absence.service';
import { StudentRemovalService } from '../../core/services/student-removal.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  totalStudents = computed(() => this.studentService.getAll().length);
  totalHolidays = computed(() => this.holidayService.getAll().length);
  pendingAbsences = computed(() => this.absenceService.getAll().filter(a => a.status === 'pending').length);
  approvedAbsences = computed(() => this.absenceService.getAll().filter(a => a.status === 'approved').length);
  rejectedAbsences = computed(() => this.absenceService.getAll().filter(a => a.status === 'rejected').length);
  totalUsers = computed(() => this.auth.getUsers().length);
  pendingParentApprovals = computed(() => this.auth.getPendingApprovalUsers().length);
  pendingStudentRemovals = computed(() => this.removalService.getPending().length);
  recentAbsences = computed(() => this.absenceService.getAll().slice(0, 5));

  constructor(
    public auth: AuthService,
    private studentService: StudentService,
    private holidayService: HolidayService,
    private absenceService: AbsenceService,
    private removalService: StudentRemovalService
  ) {}
}
