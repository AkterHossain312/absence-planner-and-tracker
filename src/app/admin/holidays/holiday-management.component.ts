import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HolidayService } from '../../core/services/holiday.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Holiday } from '../../core/models/holiday.model';

@Component({
  selector: 'app-holiday-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './holiday-management.component.html',
  styleUrl: './holiday-management.component.scss'
})
export class HolidayManagementComponent {
  holidays = signal<Holiday[]>([]);
  showForm = signal(false);
  editing = signal(false);
  form: Partial<Holiday> = {};

  constructor(
    private holidayService: HolidayService,
    private notificationService: NotificationService,
    private auth: AuthService,
    private toast: ToastService
  ) {
    this.loadHolidays();
  }

  loadHolidays(): void {
    this.holidays.set(this.holidayService.getAll());
  }

  openForm(): void {
    this.form = {};
    this.editing.set(false);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.form = {};
  }

  editHoliday(h: Holiday): void {
    this.form = { ...h };
    this.editing.set(true);
    this.showForm.set(true);
  }

  saveHoliday(): void {
    const holiday: Holiday = {
      id: this.form.id || crypto.randomUUID(),
      name: this.form.name!,
      startDate: this.form.startDate!,
      endDate: this.form.endDate!,
      submissionDeadline: this.form.submissionDeadline || '',
      description: this.form.description || '',
      createdBy: this.auth.currentUserId(),
      createdAt: this.form.createdAt || new Date().toISOString()
    };

    setTimeout(() => {
      this.holidayService.save(holiday);
      if (!this.editing()) {
        this.notificationService.broadcast(
          `New holiday: ${holiday.name} (${holiday.startDate} to ${holiday.endDate})`,
          'holiday'
        );
      }
      this.toast.success(this.editing() ? 'Holiday updated' : 'Holiday created');
      this.loadHolidays();
      this.closeForm();
    }, 300);
  }

  deleteHoliday(id: string): void {
    if (confirm('Delete this holiday?')) {
      this.holidayService.delete(id);
      this.toast.success('Holiday deleted');
      this.loadHolidays();
    }
  }
}
