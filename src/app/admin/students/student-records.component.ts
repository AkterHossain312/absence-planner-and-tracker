import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, Subject, ClassSchedule, RelationType, StudentUser } from '../../core/models/student.model';
import { User } from '../../core/models/user.model';

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

  loadStudents(): void {
    this.students.set(this.studentService.getAll());
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

  saveStudent(): void {
    // Check for overlapping schedules across all subjects
    const allSchedules = this.formSubjects.flatMap(s => s.schedules);
    if (this.studentService.hasOverlappingSchedule(allSchedules)) {
      this.overlapError.set(true);
      this.toast.error('Overlapping class times detected!');
      return;
    }
    this.overlapError.set(false);

    // Auto-create user accounts for parents/guardians
    const processedUsers: StudentUser[] = [];
    for (const u of this.formUsers) {
      if (!u.name || !u.email) continue;

      // Check if user already exists (by email) or create new one
      let existingUser = this.auth.findUserByEmailOrPhone(u.email);
      if (!existingUser && u.phone) {
        existingUser = this.auth.findUserByEmailOrPhone(u.phone);
      }

      let userId = u.userId;
      if (!existingUser) {
        // Create new user account with role 'user'
        const newUser: User = {
          id: crypto.randomUUID(),
          name: u.name,
          email: u.email,
          phone: u.phone,
          location: u.location,
          role: 'user',
          password: '1234',
          createdAt: new Date().toISOString()
        };
        this.auth.addUser(newUser);
        userId = newUser.id;
      } else {
        userId = existingUser.id;
      }

      processedUsers.push({
        userId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        location: u.location,
        relation: u.relation
      });
    }

    const student: Student = {
      id: this.form.id || crypto.randomUUID(),
      studentId: this.form.studentId || this.generateStudentId(),
      name: this.form.name!,
      grade: this.form.grade!,
      section: this.form.section || '',
      users: processedUsers,
      subjects: this.formSubjects.filter(s => s.name) as Subject[],
      createdAt: this.form.createdAt || new Date().toISOString()
    };

    setTimeout(() => {
      this.studentService.save(student);
      const userCount = processedUsers.length;
      const msg = this.editing()
        ? 'Student updated'
        : `Student added${userCount > 0 ? ' with ' + userCount + ' parent/guardian account(s) created' : ''}`;
      this.toast.success(msg);
      this.loadStudents();
      this.closeForm();
    }, 300);
  }

  deleteStudent(id: string): void {
    if (confirm('Delete this student?')) {
      this.studentService.delete(id);
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
