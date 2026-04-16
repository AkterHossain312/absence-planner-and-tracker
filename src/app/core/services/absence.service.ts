import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Absence, AbsenceStatus } from '../models/absence.model';

const ABSENCES_KEY = 'abs_absences';
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

@Injectable({ providedIn: 'root' })
export class AbsenceService {
  constructor(private storage: StorageService) {}

  getAll(): Absence[] {
    return this.storage.get<Absence[]>(ABSENCES_KEY) ?? [];
  }

  getByUserId(userId: string): Absence[] {
    return this.getAll().filter(a => a.userId === userId);
  }

  getById(id: string): Absence | undefined {
    return this.getAll().find(a => a.id === id);
  }

  save(absence: Absence): void {
    const absences = this.getAll();
    const idx = absences.findIndex(a => a.id === absence.id);
    if (idx >= 0) {
      absences[idx] = absence;
    } else {
      absences.push(absence);
    }
    this.storage.set(ABSENCES_KEY, absences);
  }

  delete(id: string): void {
    const absences = this.getAll().filter(a => a.id !== id);
    this.storage.set(ABSENCES_KEY, absences);
  }

  updateStatus(id: string, status: AbsenceStatus): void {
    const absence = this.getById(id);
    if (absence) {
      absence.status = status;
      absence.updatedAt = new Date().toISOString();
      this.save(absence);
    }
  }

  acquireLock(absenceId: string, userId: string): boolean {
    const absence = this.getById(absenceId);
    if (!absence) return false;

    if (absence.lockedBy && absence.lockedBy !== userId) {
      const lockedAt = new Date(absence.lockedAt!).getTime();
      if (Date.now() - lockedAt < LOCK_TIMEOUT) {
        return false;
      }
    }

    absence.lockedBy = userId;
    absence.lockedAt = new Date().toISOString();
    this.save(absence);
    return true;
  }

  releaseLock(absenceId: string): void {
    const absence = this.getById(absenceId);
    if (absence) {
      absence.lockedBy = null;
      absence.lockedAt = null;
      this.save(absence);
    }
  }

  isLocked(absenceId: string, currentUserId: string): { locked: boolean; lockedBy: string | null } {
    const absence = this.getById(absenceId);
    if (!absence || !absence.lockedBy) return { locked: false, lockedBy: null };
    if (absence.lockedBy === currentUserId) return { locked: false, lockedBy: null };
    const lockedAt = new Date(absence.lockedAt!).getTime();
    if (Date.now() - lockedAt >= LOCK_TIMEOUT) return { locked: false, lockedBy: null };
    return { locked: true, lockedBy: absence.lockedBy };
  }
}
