import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HolidayService } from '../../core/services/holiday.service';
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
    private auth: AuthService,
    private toast: ToastService
  ) {
    this.loadHolidays();
  }

  async loadHolidays(): Promise<void> {
    const holidays = await this.holidayService.loadAll();
    this.holidays.set(holidays);
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

  async saveHoliday(): Promise<void> {
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

    await this.holidayService.save(holiday);
    this.toast.success(this.editing() ? 'Holiday updated' : 'Holiday created');
    await this.loadHolidays();
    this.closeForm();
  }

  async deleteHoliday(id: string): Promise<void> {
    if (confirm('Delete this holiday?')) {
      await this.holidayService.delete(id);
      this.toast.success('Holiday deleted');
      await this.loadHolidays();
    }
  }
}
