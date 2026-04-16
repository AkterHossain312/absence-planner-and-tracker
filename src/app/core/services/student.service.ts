import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Student } from '../models/student.model';

const STUDENTS_KEY = 'abs_students';

@Injectable({ providedIn: 'root' })
export class StudentService {
  constructor(private storage: StorageService) {}

  getAll(): Student[] {
    return this.storage.get<Student[]>(STUDENTS_KEY) ?? [];
  }

  getById(id: string): Student | undefined {
    return this.getAll().find(s => s.id === id);
  }

  getByUserId(userId: string): Student[] {
    return this.getAll().filter(s => s.users.some(u => u.userId === userId));
  }

  save(student: Student): void {
    const students = this.getAll();
    const idx = students.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      students[idx] = student;
    } else {
      students.push(student);
    }
    this.storage.set(STUDENTS_KEY, students);
  }

  delete(id: string): void {
    const students = this.getAll().filter(s => s.id !== id);
    this.storage.set(STUDENTS_KEY, students);
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
