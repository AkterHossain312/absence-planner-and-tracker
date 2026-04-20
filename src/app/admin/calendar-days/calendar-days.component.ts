import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';

const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-calendar-days',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar-days.component.html',
  styleUrl: './calendar-days.component.scss'
})
export class CalendarDaysComponent {
  allDays = ALL_DAYS;
  enabledDays = signal<string[]>([]);

  constructor(
    private permissionService: PermissionService,
    private toast: ToastService
  ) {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    const config = await this.permissionService.loadCalendarDays();
    this.enabledDays.set(config.allowedDays);
  }

  isDayEnabled(day: string): boolean {
    return this.enabledDays().includes(day);
  }

  toggleDay(day: string): void {
    this.enabledDays.update(days =>
      days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    );
  }

  async save(): Promise<void> {
    const result = await this.permissionService.saveCalendarDays({ allowedDays: this.enabledDays() });
    if (result.success) {
      this.toast.success('Calendar day configuration saved');
    } else {
      this.toast.error(result.error || 'Failed to save calendar days');
    }
  }
}
