import { Component, signal, computed } from '@angular/core';
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
  totalStudents = signal(0);
  totalHolidays = signal(0);
  pendingAbsences = signal(0);
  approvedAbsences = signal(0);
  rejectedAbsences = signal(0);
  totalUsers = signal(0);
  pendingParentApprovals = signal(0);
  pendingStudentRemovals = signal(0);
  recentAbsences = signal<any[]>([]);

  constructor(
    public auth: AuthService,
    private studentService: StudentService,
    private holidayService: HolidayService,
    private absenceService: AbsenceService,
    private removalService: StudentRemovalService
  ) {
    this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    const [students, holidays, absences, users, pendingApprovals, pendingRemovals] = await Promise.all([
      this.studentService.loadAll(),
      this.holidayService.loadAll(),
      this.absenceService.loadAll(),
      this.auth.loadUsers(),
      this.auth.getPendingApprovalUsers(),
      this.removalService.getPending()
    ]);

    this.totalStudents.set(students.length);
    this.totalHolidays.set(holidays.length);
    this.pendingAbsences.set(absences.filter(a => a.status === 'pending').length);
    this.approvedAbsences.set(absences.filter(a => a.status === 'approved').length);
    this.rejectedAbsences.set(absences.filter(a => a.status === 'rejected').length);
    this.totalUsers.set(users.length);
    this.pendingParentApprovals.set(pendingApprovals.length);
    this.pendingStudentRemovals.set(pendingRemovals.length);
    this.recentAbsences.set(absences.slice(0, 5));
  }
}
