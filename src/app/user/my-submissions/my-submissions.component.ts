import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AbsenceService } from '../../core/services/absence.service';
import { HolidayService } from '../../core/services/holiday.service';
import { PermissionService } from '../../core/services/permission.service';
import { StudentService } from '../../core/services/student.service';
import { ToastService } from '../../core/services/toast.service';
import { Absence } from '../../core/models/absence.model';

@Component({
  selector: 'app-my-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-submissions.component.html',
  styleUrl: './my-submissions.component.scss'
})
export class MySubmissionsComponent {
  myAbsences = computed(() => this.absenceService.getByUserId(this.auth.currentUserId()));
  editingAbsence = signal<Absence | null>(null);
  lockWarning = signal('');
  editErrors = signal<string[]>([]);

  editStartDate = '';
  editEndDate = '';
  editReason = '';

  constructor(
    private auth: AuthService,
    private absenceService: AbsenceService,
    private holidayService: HolidayService,
    private permissionService: PermissionService,
    private studentService: StudentService,
    private toast: ToastService
  ) {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    await Promise.all([
      this.absenceService.loadAll(),
      this.holidayService.loadAll(),
      this.studentService.loadAll(),
      this.permissionService.loadCalendarDays()
    ]);
  }

  async startEdit(absence: Absence): Promise<void> {
    await this.absenceService.lockAbsence(absence.id);
    this.lockWarning.set('');
    this.editingAbsence.set(absence);
    this.editStartDate = absence.startDate;
    this.editEndDate = absence.endDate;
    this.editReason = absence.reason;
    this.editErrors.set([]);
  }

  async cancelEdit(): Promise<void> {
    const current = this.editingAbsence();
    if (current) {
      await this.absenceService.unlockAbsence(current.id);
    }
    this.editingAbsence.set(null);
    this.lockWarning.set('');
  }

  async saveEdit(): Promise<void> {
    const errors: string[] = [];
    const start = new Date(this.editStartDate);
    const end = new Date(this.editEndDate);

    if (start > end) {
      errors.push('Start date must be before end date');
    }
    if (!this.holidayService.isDateInHoliday(start)) {
      errors.push('Start date is not within any holiday period');
    }
    if (!this.holidayService.isDateInHoliday(end)) {
      errors.push('End date is not within any holiday period');
    }

    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    if (!this.permissionService.isDayAllowed(start)) {
      errors.push(`${dayNames[start.getDay()]} (${start.toLocaleDateString()}) is a disabled day`);
    }
    if (!this.permissionService.isDayAllowed(end)) {
      errors.push(`${dayNames[end.getDay()]} (${end.toLocaleDateString()}) is a disabled day`);
    }

    if (errors.length > 0) {
      this.editErrors.set(errors);
      return;
    }

    const absence = this.editingAbsence();
    if (!absence) return;

    absence.startDate = this.editStartDate;
    absence.endDate = this.editEndDate;
    absence.reason = this.editReason;
    absence.updatedAt = new Date().toISOString();

    await this.absenceService.save(absence);
    await this.absenceService.unlockAbsence(absence.id);
    this.editingAbsence.set(null);
    this.toast.success('Absence updated');
  }
}
