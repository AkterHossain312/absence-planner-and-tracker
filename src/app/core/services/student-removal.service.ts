import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StudentRemovalRequest, RemovalStatus } from '../models/student-removal.model';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StudentRemovalService {
  private requestsCache = signal<StudentRemovalRequest[]>([]);

  constructor(private http: HttpClient) {}

  async loadAll(): Promise<StudentRemovalRequest[]> {
    try {
      const requests = await firstValueFrom(this.http.get<StudentRemovalRequest[]>(`${environment.apiUrl}/student-removals`));
      this.requestsCache.set(requests);
      return requests;
    } catch {
      return [];
    }
  }

  getAll(): StudentRemovalRequest[] {
    return this.requestsCache();
  }

  getByUserId(userId: string): StudentRemovalRequest[] {
    return this.requestsCache().filter(r => r.requestedBy === userId);
  }

  async getPending(): Promise<StudentRemovalRequest[]> {
    try {
      return await firstValueFrom(this.http.get<StudentRemovalRequest[]>(`${environment.apiUrl}/student-removals?status=pending`));
    } catch {
      return [];
    }
  }

  async getById(id: string): Promise<StudentRemovalRequest | null> {
    try {
      return this.requestsCache().find(r => r.id === id) ?? null;
    } catch {
      return null;
    }
  }

  async save(request: Partial<StudentRemovalRequest>): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/student-removals`, request));
      await this.loadAll();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.message || err.error || 'Failed to save removal request' };
    }
  }

  async approve(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/student-removals/${id}/approve`, {}));
      await this.loadAll();
      return true;
    } catch {
      return false;
    }
  }

  async reject(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/student-removals/${id}/reject`, {}));
      await this.loadAll();
      return true;
    } catch {
      return false;
    }
  }

  hasPendingRequest(studentId: string, userId: string): boolean {
    return this.requestsCache().some(
      r => r.studentId === studentId && r.requestedBy === userId && r.status === 'pending'
    );
  }
}
