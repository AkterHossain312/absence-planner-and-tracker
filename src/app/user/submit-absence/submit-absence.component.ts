import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../core/services/student.service';
import { AbsenceService } from '../../core/services/absence.service';
import { HolidayService } from '../../core/services/holiday.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { Student } from '../../core/models/student.model';
import { Absence, HomeworkLoad } from '../../core/models/absence.model';
import { Holiday } from '../../core/models/holiday.model';

@Component({
  selector: 'app-submit-absence',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './submit-absence.component.html',
  styleUrl: './submit-absence.component.scss'
})
export class SubmitAbsenceComponent {
  selectedHolidayId = '';
  selectedStudentId = '';
  startDate = '';
  endDate = '';
  reason = '';
  homeworkLoad: HomeworkLoad | '' = '';
  digitalKumon = false;
  minDate = '';
  maxDate = '';

  myStudents = computed(() => this.studentService.getByUserId(this.auth.currentUserId()));
  holidays = computed(() => this.holidayService.getAll());
  selectedHoliday = computed(() => this.holidays().find(h => h.id === this.selectedHolidayId) || null);
  allowedDays = computed(() => this.permissionService.getCalendarDays().allowedDays);
  validationErrors = signal<string[]>([]);

  constructor(
    private auth: AuthService,
    private studentService: StudentService,
    private absenceService: AbsenceService,
    private holidayService: HolidayService,
    private permissionService: PermissionService,
    private toast: ToastService,
    private route: ActivatedRoute
  ) {
    const holidayId = this.route.snapshot.queryParamMap.get('holidayId');
    if (holidayId) {
      this.selectedHolidayId = holidayId;
      this.onHolidayChange();
    }
  }

  onHolidayChange(): void {
    const holiday = this.holidays().find(h => h.id === this.selectedHolidayId);
    if (holiday) {
      this.minDate = holiday.startDate;
      this.maxDate = holiday.endDate;
    } else {
      this.minDate = '';
      this.maxDate = '';
    }
    this.startDate = '';
    this.endDate = '';
  }

  submitAbsence(): void {
    const errors: string[] = [];

    if (!this.selectedHolidayId) {
      errors.push('Please select a holiday period');
    }

    // Validate dates are within selected holiday range
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (start > end) {
      errors.push('Last Attendance Day must be before Return Day');
    }

    const holiday = this.holidays().find(h => h.id === this.selectedHolidayId);
    if (holiday) {
      const hStart = new Date(holiday.startDate);
      const hEnd = new Date(holiday.endDate);
      if (start < hStart || start > hEnd) {
        errors.push('Last Attendance Day is not within the selected holiday period');
      }
      if (end < hStart || end > hEnd) {
        errors.push('Return Day is not within the selected holiday period');
      }
    }

    // Check allowed days
    const current = new Date(start);
    while (current <= end) {
      if (!this.permissionService.isDayAllowed(current)) {
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        errors.push(`${dayNames[current.getDay()]} (${current.toLocaleDateString()}) is a disabled day`);
      }
      current.setDate(current.getDate() + 1);
    }

    if (errors.length > 0) {
      this.validationErrors.set(errors);
      return;
    }
    this.validationErrors.set([]);

    const student = this.studentService.getById(this.selectedStudentId);
    if (!student) return;

    const absence: Absence = {
      id: crypto.randomUUID(),
      studentId: this.selectedStudentId,
      studentName: student.name,
      userId: this.auth.currentUserId(),
      userName: this.auth.currentUserName(),
      holidayId: this.selectedHolidayId,
      startDate: this.startDate,
      endDate: this.endDate,
      reason: this.reason,
      homeworkLoad: this.homeworkLoad as HomeworkLoad,
      digitalKumon: this.digitalKumon,
      status: 'pending',
      lockedBy: null,
      lockedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTimeout(() => {
      this.absenceService.save(absence);
      this.toast.success('Absence submitted successfully');
      this.selectedHolidayId = '';
      this.selectedStudentId = '';
      this.startDate = '';
      this.endDate = '';
      this.reason = '';
      this.homeworkLoad = '';
      this.digitalKumon = false;
      this.minDate = '';
      this.maxDate = '';
    }, 400);
  }
}
