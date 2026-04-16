import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../core/services/student.service';
import { AbsenceService } from '../../core/services/absence.service';
import { HolidayService } from '../../core/services/holiday.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss'
})
export class UserDashboardComponent {
  myStudents = computed(() => this.studentService.getByUserId(this.auth.currentUserId()));
  myAbsences = computed(() => this.absenceService.getByUserId(this.auth.currentUserId()));
  pendingCount = computed(() => this.myAbsences().filter(a => a.status === 'pending').length);
  approvedCount = computed(() => this.myAbsences().filter(a => a.status === 'approved').length);
  upcomingHolidays = computed(() => {
    const now = new Date();
    return this.holidayService.getAll().filter(h => new Date(h.endDate) >= now);
  });

  constructor(
    public auth: AuthService,
    private studentService: StudentService,
    private absenceService: AbsenceService,
    private holidayService: HolidayService,
    private router: Router
  ) {}

  submitAbsencePlan(holidayId: string): void {
    this.router.navigate(['/user/submit-absence'], { queryParams: { holidayId } });
  }
}
