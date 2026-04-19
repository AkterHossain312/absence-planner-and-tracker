import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { User } from '../models/user.model';
import { Student } from '../models/student.model';
import { Holiday } from '../models/holiday.model';
import { Absence } from '../models/absence.model';

const SEEDED_KEY = 'abs_seeded';

@Injectable({ providedIn: 'root' })
export class SeedService {
  constructor(private storage: StorageService) {}

  seedIfNeeded(): void {
    if (this.storage.get<boolean>(SEEDED_KEY)) return;

    // Seed users
    const users: User[] = [
      { id: 'u1', name: 'Super Admin', email: 'superadmin@school.com', phone: '1111111111', location: 'New York, NY, USA', role: 'superadmin', password: '1234', status: 'active', emailVerified: true, createdAt: new Date().toISOString() },
      { id: 'u2', name: 'Admin User', email: 'admin@school.com', phone: '2222222222', location: 'Los Angeles, CA, USA', role: 'admin', password: '1234', status: 'active', emailVerified: true, createdAt: new Date().toISOString() },
      { id: 'u3', name: 'John Parent', email: 'john@parent.com', phone: '3333333333', location: 'Chicago, IL, USA', role: 'user', password: '1234', status: 'active', emailVerified: true, createdAt: new Date().toISOString() },
      { id: 'u4', name: 'Jane Guardian', email: 'jane@parent.com', phone: '4444444444', location: 'Houston, TX, USA', role: 'user', password: '1234', status: 'active', emailVerified: true, createdAt: new Date().toISOString() },
      { id: 'u5', name: 'Sarah Mother', email: 'sarah@parent.com', phone: '5555555555', location: 'Dallas, TX, USA', role: 'user', password: '1234', status: 'pending_approval', emailVerified: true, createdAt: new Date().toISOString() },
    ];
    this.storage.set('abs_users', users);

    // Seed students
    const students: Student[] = [
      {
        id: 's1', studentId: '1000000000001', name: 'Emma Smith', grade: '5', section: 'A',
        users: [{ userId: 'u3', name: 'John Parent', email: 'john@parent.com', phone: '3333333333', location: 'Chicago, IL, USA', relation: 'father' }],
        subjects: [
          {
            id: 'sub1', name: 'Mathematics',
            schedules: [
              { day: 'Monday', startTime: '09:00', endTime: '10:00' },
              { day: 'Wednesday', startTime: '09:00', endTime: '10:00' },
              { day: 'Friday', startTime: '09:00', endTime: '10:00' }
            ]
          },
          {
            id: 'sub2', name: 'English',
            schedules: [
              { day: 'Tuesday', startTime: '10:00', endTime: '11:00' },
              { day: 'Thursday', startTime: '10:00', endTime: '11:00' }
            ]
          }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 's2', studentId: '1000000000002', name: 'Liam Johnson', grade: '3', section: 'B',
        users: [{ userId: 'u3', name: 'John Parent', email: 'john@parent.com', phone: '3333333333', location: 'Chicago, IL, USA', relation: 'father' }, { userId: 'u4', name: 'Jane Guardian', email: 'jane@parent.com', phone: '4444444444', location: 'Houston, TX, USA', relation: 'guardian' }],
        subjects: [
          {
            id: 'sub3', name: 'Science',
            schedules: [
              { day: 'Monday', startTime: '11:00', endTime: '12:00' },
              { day: 'Thursday', startTime: '11:00', endTime: '12:00' }
            ]
          }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 's3', studentId: '1000000000003', name: 'Olivia Brown', grade: '7', section: 'A',
        users: [{ userId: 'u4', name: 'Jane Guardian', email: 'jane@parent.com', phone: '4444444444', location: 'Houston, TX, USA', relation: 'mother' }],
        subjects: [
          {
            id: 'sub4', name: 'History',
            schedules: [
              { day: 'Tuesday', startTime: '14:00', endTime: '15:00' },
              { day: 'Friday', startTime: '14:00', endTime: '15:00' }
            ]
          }
        ],
        createdAt: new Date().toISOString()
      }
    ];
    this.storage.set('abs_students', students);

    // Seed holidays
    const holidays: Holiday[] = [
      {
        id: 'h1', name: 'Winter Break', startDate: '2026-04-20', endDate: '2026-05-03',
        submissionDeadline: '2026-04-13',
        description: 'Annual winter break for all students', createdBy: 'u1', createdAt: new Date().toISOString()
      },
      {
        id: 'h2', name: 'Spring Holiday', startDate: '2026-06-15', endDate: '2026-06-20',
        submissionDeadline: '2026-06-08',
        description: 'Spring holiday period', createdBy: 'u2', createdAt: new Date().toISOString()
      },
      {
        id: 'h3', name: 'Summer Vacation', startDate: '2026-07-01', endDate: '2026-08-15',
        submissionDeadline: '2026-06-24',
        description: 'Summer vacation for all students', createdBy: 'u1', createdAt: new Date().toISOString()
      }
    ];
    this.storage.set('abs_holidays', holidays);

    // Seed absences
    const absences: Absence[] = [
      {
        id: 'a1', studentId: 's1', studentName: 'Emma Smith', userId: 'u3', userName: 'John Parent',
        holidayId: 'h1', startDate: '2026-04-21', endDate: '2026-04-25', reason: 'Family vacation during winter break',
        homeworkLoad: 'Moderate', digitalKumon: true,
        status: 'pending', lockedBy: null, lockedAt: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      },
      {
        id: 'a2', studentId: 's2', studentName: 'Liam Johnson', userId: 'u4', userName: 'Jane Guardian',
        holidayId: 'h1', startDate: '2026-04-22', endDate: '2026-04-24', reason: 'Medical appointment',
        homeworkLoad: 'Increase', digitalKumon: false,
        status: 'approved', lockedBy: null, lockedAt: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      },
      {
        id: 'a3', studentId: 's3', studentName: 'Olivia Brown', userId: 'u4', userName: 'Jane Guardian',
        holidayId: 'h2', startDate: '2026-06-16', endDate: '2026-06-18', reason: 'Family event',
        homeworkLoad: 'Decrease', digitalKumon: true,
        status: 'rejected', lockedBy: null, lockedAt: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      }
    ];
    this.storage.set('abs_absences', absences);

    // Seed notifications
    this.storage.set('abs_notifications', [
      { id: 'n1', userId: 'all', message: 'Winter Break has been announced (Apr 20 – May 3)', type: 'holiday', read: false, createdAt: new Date().toISOString() },
      { id: 'n2', userId: 'u4', message: 'Absence for Liam Johnson has been approved', type: 'absence_approved', read: false, createdAt: new Date().toISOString() },
      { id: 'n3', userId: 'u4', message: 'Absence for Olivia Brown has been rejected', type: 'absence_rejected', read: false, createdAt: new Date().toISOString() },
    ]);

    // Seed calendar days (all enabled by default)
    this.storage.set('abs_calendar_days', {
      allowedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    });

    this.storage.set(SEEDED_KEY, true);
  }
}
