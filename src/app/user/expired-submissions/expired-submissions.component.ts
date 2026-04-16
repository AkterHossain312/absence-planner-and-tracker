import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { HolidayService } from '../../core/services/holiday.service';
import { AbsenceService } from '../../core/services/absence.service';
import { StudentService } from '../../core/services/student.service';
import { Holiday } from '../../core/models/holiday.model';

interface ExpiredItem {
  holiday: Holiday;
  studentId: string;
  studentName: string;
}

@Component({
  selector: 'app-expired-submissions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expired-submissions.component.html',
  styleUrl: './expired-submissions.component.scss'
})
export class ExpiredSubmissionsComponent {
  expiredItems = computed(() => {
    const userId = this.auth.currentUserId();
    const students = this.studentService.getByUserId(userId);
    const absences = this.absenceService.getByUserId(userId);
    const holidays = this.holidayService.getAll();
    const now = new Date();
    const items: ExpiredItem[] = [];

    for (const holiday of holidays) {
      const deadline = new Date(holiday.submissionDeadline);
      if (deadline >= now) continue; // deadline hasn't passed yet

      for (const student of students) {
        const hasSubmission = absences.some(
          a => a.holidayId === holiday.id && a.studentId === student.id
        );
        if (!hasSubmission) {
          items.push({
            holiday,
            studentId: student.id,
            studentName: student.name
          });
        }
      }
    }

    return items;
  });

  constructor(
    private auth: AuthService,
    private holidayService: HolidayService,
    private absenceService: AbsenceService,
    private studentService: StudentService
  ) {}
}
