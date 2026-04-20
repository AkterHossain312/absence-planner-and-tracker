import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Holiday } from '../models/holiday.model';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private holidaysCache = signal<Holiday[]>([]);

  constructor(private http: HttpClient) {}

  async loadAll(): Promise<Holiday[]> {
    try {
      const holidays = await firstValueFrom(this.http.get<Holiday[]>(`${environment.apiUrl}/holidays`));
      this.holidaysCache.set(holidays);
      return holidays;
    } catch {
      return [];
    }
  }

  getAll(): Holiday[] {
    return this.holidaysCache();
  }

  async getById(id: string): Promise<Holiday | null> {
    try {
      return await firstValueFrom(this.http.get<Holiday>(`${environment.apiUrl}/holidays/${id}`));
    } catch {
      return null;
    }
  }

  async save(holiday: Partial<Holiday>): Promise<{ success: boolean; error?: string }> {
    try {
      if (holiday.id) {
        await firstValueFrom(this.http.put(`${environment.apiUrl}/holidays/${holiday.id}`, holiday));
      } else {
        await firstValueFrom(this.http.post(`${environment.apiUrl}/holidays`, holiday));
      }
      await this.loadAll();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Failed to save holiday' };
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(this.http.delete(`${environment.apiUrl}/holidays/${id}`));
      await this.loadAll();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Failed to delete holiday' };
    }
  }

  // Client-side helpers using cached data
  isDateInHoliday(date: Date): boolean {
    return this.holidaysCache().some(h => {
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  }

  getHolidayForDate(date: Date): Holiday | undefined {
    return this.holidaysCache().find(h => {
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  }
}
