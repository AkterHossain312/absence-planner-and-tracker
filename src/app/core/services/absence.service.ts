import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Absence, AbsenceStatus } from '../models/absence.model';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AbsenceService {
  private absencesCache = signal<Absence[]>([]);

  constructor(private http: HttpClient) {}

  async loadAll(): Promise<Absence[]> {
    try {
      const absences = await firstValueFrom(this.http.get<Absence[]>(`${environment.apiUrl}/absences`));
      this.absencesCache.set(absences);
      return absences;
    } catch {
      return [];
    }
  }

  getAll(): Absence[] {
    return this.absencesCache();
  }

  getByUserId(userId: string): Absence[] {
    return this.absencesCache().filter(a => a.userId === userId);
  }

  async getById(id: string): Promise<Absence | null> {
    try {
      return await firstValueFrom(this.http.get<Absence>(`${environment.apiUrl}/absences/${id}`));
    } catch {
      return null;
    }
  }

  async save(absence: Partial<Absence>): Promise<{ success: boolean; error?: string; data?: Absence }> {
    try {
      if (absence.id) {
        const updated = await firstValueFrom(this.http.put<Absence>(`${environment.apiUrl}/absences/${absence.id}`, absence));
        await this.loadAll();
        return { success: true, data: updated };
      } else {
        const created = await firstValueFrom(this.http.post<Absence>(`${environment.apiUrl}/absences`, absence));
        await this.loadAll();
        return { success: true, data: created };
      }
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Failed to save absence' };
    }
  }

  async updateStatus(id: string, status: AbsenceStatus): Promise<boolean> {
    try {
      await firstValueFrom(this.http.put(`${environment.apiUrl}/absences/${id}`, { status }));
      await this.loadAll();
      return true;
    } catch {
      return false;
    }
  }

  async lockAbsence(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/absences/${id}/lock`, {}));
      return true;
    } catch {
      return false;
    }
  }

  async unlockAbsence(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/absences/${id}/unlock`, {}));
      return true;
    } catch {
      return false;
    }
  }

  async approveAbsence(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/absences/${id}/approve`, {}));
      await this.loadAll();
      return true;
    } catch {
      return false;
    }
  }

  async rejectAbsence(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/absences/${id}/reject`, {}));
      await this.loadAll();
      return true;
    } catch {
      return false;
    }
  }

  async getExpired(): Promise<Absence[]> {
    try {
      return await firstValueFrom(this.http.get<Absence[]>(`${environment.apiUrl}/absences/expired`));
    } catch {
      return [];
    }
  }

  async getPending(): Promise<Absence[]> {
    try {
      return await firstValueFrom(this.http.get<Absence[]>(`${environment.apiUrl}/absences?status=pending`));
    } catch {
      return [];
    }
  }
}
