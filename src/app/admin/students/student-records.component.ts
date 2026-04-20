import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, Subject, ClassSchedule, RelationType, StudentUser } from '../../core/models/student.model';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

@Component({
  selector: 'app-student-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-records.component.html',
  styleUrl: './student-records.component.scss'
})
export class StudentRecordsComponent {
  days = DAYS;
  students = signal<Student[]>([]);
  existingParents = signal<StudentUser[]>([]);
  showForm = signal(false);
  editing = signal(false);
  overlapError = signal(false);

  form: Partial<Student> = {};
  formUsers: StudentUser[] = [];
  formSubjects: { name: string; schedules: ClassSchedule[]; id: string }[] = [];

  constructor(
    private studentService: StudentService,
    private auth: AuthService,
    private toast: ToastService
  ) {
    this.loadStudents();
  }

  async loadStudents(): Promise<void> {
    const students = await this.studentService.loadAll();
    this.students.set(students);
    this.loadExistingParents();
  }

  loadExistingParents(): void {
    const parentMap = new Map<string, StudentUser>();
    for (const s of this.students()) {
      for (const u of s.users) {
        if (u.email && !parentMap.has(u.email)) {
          parentMap.set(u.email, { ...u });
        }
      }
    }
    this.existingParents.set(Array.from(parentMap.values()));
  }

  getAvailableParents(currentIdx: number): StudentUser[] {
    const selectedEmails = new Set(
      this.formUsers
        .filter((u, i) => i !== currentIdx && u.email)
        .map(u => u.email)
    );
    return this.existingParents().filter(p => !selectedEmails.has(p.email));
  }

  selectExistingParent(idx: number, email: string): void {
    const parent = this.existingParents().find(p => p.email === email);
    if (parent) {
      this.formUsers[idx] = { ...parent };
    }
  }

  openForm(): void {
    this.form = {};
    this.formUsers = [{ userId: '', name: '', email: '', phone: '', location: '', relation: 'father' }];
    this.formSubjects = [];
    this.editing.set(false);
    this.showForm.set(true);
    this.overlapError.set(false);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  editStudent(s: Student): void {
    this.form = { ...s };
    this.formUsers = [...s.users.map(u => ({ ...u }))];
    this.formSubjects = s.subjects.map(sub => ({
      ...sub,
      schedules: sub.schedules.map(sch => ({ ...sch }))
    }));
    this.editing.set(true);
    this.showForm.set(true);
    this.overlapError.set(false);
  }

  addUser(): void {
    this.formUsers.push({ userId: '', name: '', email: '', phone: '', location: '', relation: 'father' });
  }

  removeUser(idx: number): void {
    this.formUsers.splice(idx, 1);
  }

  addSubject(): void {
    this.formSubjects.push({
      id: crypto.randomUUID(),
      name: '',
      schedules: [{ day: 'Monday', startTime: '09:00', endTime: '10:00' }]
    });
  }

  removeSubject(idx: number): void {
    this.formSubjects.splice(idx, 1);
  }

  addSchedule(subjectIdx: number): void {
    this.formSubjects[subjectIdx].schedules.push({ day: 'Monday', startTime: '09:00', endTime: '10:00' });
  }

  removeSchedule(subjectIdx: number, scheduleIdx: number): void {
    this.formSubjects[subjectIdx].schedules.splice(scheduleIdx, 1);
  }

  addScheduleToSubject(sub: { schedules: ClassSchedule[] }): void {
    sub.schedules.push({ day: 'Monday', startTime: '09:00', endTime: '10:00' });
  }

  removeScheduleFromSubject(sub: { schedules: ClassSchedule[] }, scheduleIdx: number): void {
    sub.schedules.splice(scheduleIdx, 1);
  }

  async saveStudent(): Promise<void> {
    // Check for overlapping schedules across all subjects
    const allSchedules = this.formSubjects.flatMap(s => s.schedules);
    if (this.studentService.hasOverlappingSchedule(allSchedules)) {
      this.overlapError.set(true);
      this.toast.error('Overlapping class times detected!');
      return;
    }
    this.overlapError.set(false);

    // Process user entries - backend handles user account creation
    const processedUsers: StudentUser[] = [];
    for (const u of this.formUsers) {
      if (!u.name || !u.email) continue;

      processedUsers.push({
        userId: u.userId || '',
        name: u.name,
        email: u.email,
        phone: u.phone,
        location: u.location,
        relation: u.relation
      });
    }

    const student: Partial<Student> = {
      ...(this.form.id ? { id: this.form.id } : {}),
      studentId: this.form.studentId || this.generateStudentId(),
      name: this.form.name!,
      grade: this.form.grade!,
      section: this.form.section || '',
      ParentRelation: processedUsers[0]?.relation ?? null,
      users: processedUsers,
      subjects: this.formSubjects.filter(s => s.name) as Subject[],
      createdAt: this.form.createdAt || new Date().toISOString()
    };

    const result = await this.studentService.save(student);
    if (!result.success) {
      this.toast.error(result.error || 'Failed to save student');
      return;
    }

    const userCount = processedUsers.length;
    const msg = this.editing()
      ? 'Student updated'
      : `Student added${userCount > 0 ? ' with ' + userCount + ' parent/guardian account(s) created' : ''}`;
    this.toast.success(msg);
    await this.loadStudents();
    this.closeForm();
  }

  async deleteStudent(id: string): Promise<void> {
    if (confirm('Delete this student?')) {
      await this.studentService.delete(id);
      this.toast.success('Student deleted');
      this.loadStudents();
    }
  }

  getUserByRelation(student: Student, relation: RelationType): string {
    const user = student.users.find(u => u.relation === relation);
    return user ? user.name : '—';
  }

  private generateStudentId(): string {
    const existing = new Set(this.students().map(s => s.studentId));
    let id: string;
    do {
      id = Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    } while (existing.has(id));
    return id;
  }
}
