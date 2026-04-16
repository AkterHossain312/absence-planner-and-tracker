import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Holiday } from '../models/holiday.model';

const HOLIDAYS_KEY = 'abs_holidays';

@Injectable({ providedIn: 'root' })
export class HolidayService {
  constructor(private storage: StorageService) {}

  getAll(): Holiday[] {
    return this.storage.get<Holiday[]>(HOLIDAYS_KEY) ?? [];
  }

  getById(id: string): Holiday | undefined {
    return this.getAll().find(h => h.id === id);
  }

  save(holiday: Holiday): void {
    const holidays = this.getAll();
    const idx = holidays.findIndex(h => h.id === holiday.id);
    if (idx >= 0) {
      holidays[idx] = holiday;
    } else {
      holidays.push(holiday);
    }
    this.storage.set(HOLIDAYS_KEY, holidays);
  }

  delete(id: string): void {
    const holidays = this.getAll().filter(h => h.id !== id);
    this.storage.set(HOLIDAYS_KEY, holidays);
  }

  isDateInHoliday(date: Date): boolean {
    const holidays = this.getAll();
    return holidays.some(h => {
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  }

  getHolidayForDate(date: Date): Holiday | undefined {
    return this.getAll().find(h => {
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  }
}
