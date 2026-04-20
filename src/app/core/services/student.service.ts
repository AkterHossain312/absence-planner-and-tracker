import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Student } from '../models/student.model';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private studentsCache = signal<Student[]>([]);

  constructor(private http: HttpClient) {}

  async loadAll(): Promise<Student[]> {
    try {
      const students = await firstValueFrom(this.http.get<Student[]>(`${environment.apiUrl}/students`));
      this.studentsCache.set(students);
      return students;
    } catch {
      return [];
    }
  }

  getAll(): Student[] {
    return this.studentsCache();
  }

  getByUserId(userId: string): Student[] {
    return this.studentsCache().filter(s => s.users.some(u => u.userId === userId));
  }

  async getById(id: string): Promise<Student | null> {
    try {
      return await firstValueFrom(this.http.get<Student>(`${environment.apiUrl}/students/${id}`));
    } catch {
      return null;
    }
  }

  async getByStudentId(studentId: string): Promise<Student | null> {
    try {
      return await firstValueFrom(this.http.get<Student>(`${environment.apiUrl}/students/by-student-id/${studentId}`));
    } catch {
      return null;
    }
  }

  async save(student: Partial<Student>): Promise<{ success: boolean; error?: string; data?: Student }> {
    try {
      if (student.id) {
        const updated = await firstValueFrom(this.http.put<Student>(`${environment.apiUrl}/students/${student.id}`, student));
        await this.loadAll();
        return { success: true, data: updated };
      } else {
        const created = await firstValueFrom(this.http.post<Student>(`${environment.apiUrl}/students`, student));
        await this.loadAll();
        return { success: true, data: created };
      }
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Failed to save student' };
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(this.http.delete(`${environment.apiUrl}/students/${id}`));
      await this.loadAll();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Failed to delete student' };
    }
  }

  async linkStudent(studentId: string, relation: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/students/${studentId}/link`, { relation }));
      await this.loadAll();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Failed to link student' };
    }
  }

  hasOverlappingSchedule(schedules: { day: string; startTime: string; endTime: string }[]): boolean {
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        if (schedules[i].day === schedules[j].day) {
          const s1Start = this.timeToMinutes(schedules[i].startTime);
          const s1End = this.timeToMinutes(schedules[i].endTime);
          const s2Start = this.timeToMinutes(schedules[j].startTime);
          const s2End = this.timeToMinutes(schedules[j].endTime);
          if (s1Start < s2End && s2Start < s1End) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
