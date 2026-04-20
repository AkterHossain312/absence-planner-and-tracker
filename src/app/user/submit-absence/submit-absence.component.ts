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

  // Calendar picker state
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  startCalendarOpen = signal(false);
  endCalendarOpen = signal(false);
  startCalendarMonth = signal(new Date());
  endCalendarMonth = signal(new Date());

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
    this.loadData();
  }

  private async loadData(): Promise<void> {
    await Promise.all([
      this.studentService.loadAll(),
      this.holidayService.loadAll(),
      this.absenceService.loadAll(),
      this.permissionService.loadCalendarDays()
    ]);
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
      this.startCalendarMonth.set(new Date(holiday.startDate));
      this.endCalendarMonth.set(new Date(holiday.startDate));
    } else {
      this.minDate = '';
      this.maxDate = '';
      if (this.selectedHolidayId === 'other') {
        this.startCalendarMonth.set(new Date());
        this.endCalendarMonth.set(new Date());
      }
    }
    this.startDate = '';
    this.endDate = '';
  }

  // Calendar helpers
  getCalendarDays(monthDate: Date): (Date | null)[] {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }

  isDaySelectable(date: Date, type: 'start' | 'end' = 'start'): boolean {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    if (!this.allowedDays().includes(dayName)) return false;

    if (this.minDate) {
      const min = new Date(this.minDate);
      if (date < new Date(min.getFullYear(), min.getMonth(), min.getDate())) return false;
    }
    if (this.maxDate) {
      const max = new Date(this.maxDate);
      if (date > new Date(max.getFullYear(), max.getMonth(), max.getDate())) return false;
    }

    // Cross-date constraints
    if (type === 'end' && this.startDate) {
      const start = new Date(this.startDate);
      if (date < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
    }
    if (type === 'start' && this.endDate) {
      const end = new Date(this.endDate);
      if (date > new Date(end.getFullYear(), end.getMonth(), end.getDate())) return false;
    }
    return true;
  }

  isSelected(date: Date, type: 'start' | 'end'): boolean {
    const val = type === 'start' ? this.startDate : this.endDate;
    if (!val) return false;
    return this.formatDate(date) === val;
  }

  isInRange(date: Date): boolean {
    if (!this.startDate || !this.endDate) return false;
    const d = this.formatDate(date);
    return d > this.startDate && d < this.endDate;
  }

  selectDate(date: Date, type: 'start' | 'end'): void {
    if (!this.isDaySelectable(date, type)) return;
    const formatted = this.formatDate(date);
    if (type === 'start') {
      this.startDate = formatted;
      this.startCalendarOpen.set(false);
    } else {
      this.endDate = formatted;
      this.endCalendarOpen.set(false);
    }
  }

  changeMonth(calendarMonth: ReturnType<typeof signal<Date>>, delta: number): void {
    const current = calendarMonth();
    calendarMonth.set(new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  toggleCalendar(type: 'start' | 'end'): void {
    if (type === 'start') {
      this.startCalendarOpen.update(v => !v);
      this.endCalendarOpen.set(false);
    } else {
      this.endCalendarOpen.update(v => !v);
      this.startCalendarOpen.set(false);
    }
  }

  formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  submitAbsence(): void {
    const errors: string[] = [];

    if (!this.selectedHolidayId) {
      errors.push('Please select a holiday period or "Other" for custom dates');
    }

    // Validate dates are within selected holiday range
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (start > end) {
      errors.push('Last Attendance Day must be before Return Day');
    }

    if (this.selectedHolidayId !== 'other') {
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
    }

    // Check allowed days for selected start and end dates only
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    if (!this.permissionService.isDayAllowed(start)) {
      errors.push(`${dayNames[start.getDay()]} (${start.toLocaleDateString()}) is a disabled day`);
    }
    if (!this.permissionService.isDayAllowed(end)) {
      errors.push(`${dayNames[end.getDay()]} (${end.toLocaleDateString()}) is a disabled day`);
    }

    if (errors.length > 0) {
      this.validationErrors.set(errors);
      return;
    }
    this.validationErrors.set([]);

    const student = this.studentService.getAll().find(s => s.id === this.selectedStudentId);
    if (!student) return;

    const absence: Absence = {
      id: crypto.randomUUID(),
      studentId: this.selectedStudentId,
      studentName: student.name,
      userId: this.auth.currentUserId(),
      userName: this.auth.currentUserName(),
      holidayId: this.selectedHolidayId === 'other' ? null : this.selectedHolidayId,
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

    setTimeout(async () => {
      await this.absenceService.save(absence);

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
