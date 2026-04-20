import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { StudentRemovalService } from '../../core/services/student-removal.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, Subject, ClassSchedule, RelationType, StudentUser } from '../../core/models/student.model';
import { StudentRemovalRequest } from '../../core/models/student-removal.model';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

@Component({
  selector: 'app-my-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-students.component.html',
  styleUrl: './my-students.component.scss'
})
export class MyStudentsComponent {
  days = DAYS;
  private refreshTrigger = signal(0);

  myStudents = computed(() => { this.refreshTrigger(); return this.studentService.getByUserId(this.auth.currentUserId()); });
  myRemovalRequests = computed(() => { this.refreshTrigger(); return this.removalService.getByUserId(this.auth.currentUserId()); });

  // Add Student form
  showAddForm = signal(false);
  form: Partial<Student> = {};
  formSubjects: { name: string; schedules: ClassSchedule[]; id: string }[] = [];
  formRelation: RelationType = 'father';
  overlapError = signal(false);

  // Link Student form
  showLinkForm = signal(false);
  linkStudentId = '';
  linkRelation: RelationType = 'mother';
  linkError = signal('');
  foundStudent = signal<Student | null>(null);
  availableRelations = signal<RelationType[]>([]);

  // Removal form
  showRemovalForm = signal(false);
  removalStudentId = '';
  removalStudentName = '';
  removalReason = '';

  constructor(
    private studentService: StudentService,
    private auth: AuthService,
    private removalService: StudentRemovalService,
    private toast: ToastService
  ) {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    await Promise.all([
      this.studentService.loadAll(),
      this.removalService.loadAll()
    ]);
  }

  // --- Add Student ---

  openAddForm(): void {
    this.form = {};
    this.formSubjects = [];
    this.formRelation = 'father';
    this.overlapError.set(false);
    this.showAddForm.set(true);
  }

  closeAddForm(): void {
    this.showAddForm.set(false);
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

  addScheduleToSubject(sub: { schedules: ClassSchedule[] }): void {
    sub.schedules.push({ day: 'Monday', startTime: '09:00', endTime: '10:00' });
  }

  removeScheduleFromSubject(sub: { schedules: ClassSchedule[] }, idx: number): void {
    sub.schedules.splice(idx, 1);
  }

  saveStudent(): void {
    const allSchedules = this.formSubjects.flatMap(s => s.schedules);
    if (this.studentService.hasOverlappingSchedule(allSchedules)) {
      this.overlapError.set(true);
      this.toast.error('Overlapping class times detected!');
      return;
    }
    this.overlapError.set(false);

    const session = this.auth.currentSession();
    if (!session) return;

    const parentUser: StudentUser = {
      userId: session.userId,
      name: session.name,
      email: session.email,
      phone: '',
      location: '',
      relation: this.formRelation
    };

    // Try to fill phone/location from user record
    const currentUser = this.auth.getUsers().find(u => u.id === session.userId);
    if (currentUser) {
      parentUser.phone = currentUser.phone;
      parentUser.location = currentUser.location;
    }

    const student: Student = {
      id: crypto.randomUUID(),
      studentId: this.generateStudentId(),
      name: this.form.name!,
      grade: this.form.grade!,
      section: this.form.section || '',
      users: [parentUser],
      subjects: this.formSubjects.filter(s => s.name) as Subject[],
      createdAt: new Date().toISOString()
    };

    setTimeout(async () => {
      await this.studentService.save(student);
      this.refreshTrigger.update(v => v + 1);
      this.toast.success(`Student "${student.name}" added successfully.`);
      this.closeAddForm();
    }, 300);
  }

  // --- Link to Existing Student ---

  openLinkForm(): void {
    this.linkStudentId = '';
    this.linkRelation = 'mother';
    this.linkError.set('');
    this.foundStudent.set(null);
    this.availableRelations.set([]);
    this.showLinkForm.set(true);
  }

  closeLinkForm(): void {
    this.showLinkForm.set(false);
  }

  searchStudent(): void {
    this.linkError.set('');
    this.foundStudent.set(null);

    if (!this.linkStudentId.trim()) {
      this.linkError.set('Please enter a Student ID.');
      return;
    }

    const student = this.studentService.getAll().find(s => s.studentId === this.linkStudentId.trim());
    if (!student) {
      this.linkError.set('No student found with this ID.');
      return;
    }

    // Check if already linked
    if (student.users.some(u => u.userId === this.auth.currentUserId())) {
      this.linkError.set('You are already linked to this student.');
      return;
    }

    // Determine which relation slots are still available
    const allRoles: RelationType[] = ['father', 'mother', 'guardian'];
    const takenRoles = new Set(student.users.map(u => u.relation));
    const available = allRoles.filter(r => !takenRoles.has(r));

    if (available.length === 0) {
      this.linkError.set('This student already has a father, mother, and guardian assigned. No available role to link.');
      return;
    }

    this.availableRelations.set(available);
    this.linkRelation = available[0];
    this.foundStudent.set(student);
  }

  confirmLink(): void {
    const student = this.foundStudent();
    if (!student) return;

    // Ensure the chosen relation is still available
    if (student.users.some(u => u.relation === this.linkRelation)) {
      this.linkError.set(`The role "${this.linkRelation}" is already taken for this student.`);
      return;
    }

    const session = this.auth.currentSession();
    if (!session) return;

    const currentUser = this.auth.getUsers().find(u => u.id === session.userId);

    const parentUser: StudentUser = {
      userId: session.userId,
      name: session.name,
      email: session.email,
      phone: currentUser?.phone || '',
      location: currentUser?.location || '',
      relation: this.linkRelation
    };

    student.users.push(parentUser);

    setTimeout(async () => {
      await this.studentService.save(student);
      this.refreshTrigger.update(v => v + 1);
      this.toast.success(`You have been linked to "${student.name}" as ${this.linkRelation}.`);
      this.closeLinkForm();
    }, 300);
  }

  // --- Request Student Removal ---

  openRemovalForm(student: Student): void {
    this.removalStudentId = student.id;
    this.removalStudentName = student.name;
    this.removalReason = '';
    this.showRemovalForm.set(true);
  }

  closeRemovalForm(): void {
    this.showRemovalForm.set(false);
  }

  submitRemoval(): void {
    if (!this.removalReason.trim()) {
      this.toast.error('Please provide a reason for removal.');
      return;
    }

    if (this.removalService.hasPendingRequest(this.removalStudentId, this.auth.currentUserId())) {
      this.toast.warning('A removal request for this student is already pending.');
      this.closeRemovalForm();
      return;
    }

    const request: StudentRemovalRequest = {
      id: crypto.randomUUID(),
      studentId: this.removalStudentId,
      studentName: this.removalStudentName,
      requestedBy: this.auth.currentUserId(),
      requestedByName: this.auth.currentUserName(),
      reason: this.removalReason,
      status: 'pending',
      reviewedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTimeout(async () => {
      await this.removalService.save(request);

      this.toast.success('Removal request submitted. Awaiting admin approval.');
      this.refreshTrigger.update(v => v + 1);
      this.closeRemovalForm();
    }, 300);
  }

  hasPendingRemoval(studentId: string): boolean {
    return this.removalService.hasPendingRequest(studentId, this.auth.currentUserId());
  }

  getRemovalStatus(studentId: string): string {
    const requests = this.myRemovalRequests();
    const latest = requests.filter(r => r.studentId === studentId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    return latest?.status || '';
  }

  private generateStudentId(): string {
    const existing = new Set(this.studentService.getAll().map(s => s.studentId));
    let id: string;
    do {
      id = Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    } while (existing.has(id));
    return id;
  }
}
