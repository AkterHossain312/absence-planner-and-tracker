import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { StudentRemovalRequest, RemovalStatus } from '../models/student-removal.model';

const REMOVAL_REQUESTS_KEY = 'abs_student_removal_requests';

@Injectable({ providedIn: 'root' })
export class StudentRemovalService {
  constructor(private storage: StorageService) {}

  getAll(): StudentRemovalRequest[] {
    return this.storage.get<StudentRemovalRequest[]>(REMOVAL_REQUESTS_KEY) ?? [];
  }

  getByUserId(userId: string): StudentRemovalRequest[] {
    return this.getAll().filter(r => r.requestedBy === userId);
  }

  getPending(): StudentRemovalRequest[] {
    return this.getAll().filter(r => r.status === 'pending');
  }

  getById(id: string): StudentRemovalRequest | undefined {
    return this.getAll().find(r => r.id === id);
  }

  save(request: StudentRemovalRequest): void {
    const all = this.getAll();
    const idx = all.findIndex(r => r.id === request.id);
    if (idx >= 0) {
      all[idx] = request;
    } else {
      all.push(request);
    }
    this.storage.set(REMOVAL_REQUESTS_KEY, all);
  }

  updateStatus(id: string, status: RemovalStatus, reviewedBy: string): void {
    const request = this.getById(id);
    if (request) {
      request.status = status;
      request.reviewedBy = reviewedBy;
      request.updatedAt = new Date().toISOString();
      this.save(request);
    }
  }

  hasPendingRequest(studentId: string, userId: string): boolean {
    return this.getAll().some(
      r => r.studentId === studentId && r.requestedBy === userId && r.status === 'pending'
    );
  }
}
