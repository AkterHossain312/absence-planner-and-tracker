import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbsenceService } from '../../core/services/absence.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { Absence, AbsenceStatus } from '../../core/models/absence.model';

@Component({
  selector: 'app-absence-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './absence-approval.component.html',
  styleUrl: './absence-approval.component.scss'
})
export class AbsenceApprovalComponent {
  absences = signal<Absence[]>([]);
  filter = signal<'all' | AbsenceStatus>('all');

  filteredAbsences = signal<Absence[]>([]);

  constructor(
    private absenceService: AbsenceService,
    private notificationService: NotificationService,
    private toast: ToastService
  ) {
    this.loadAbsences();
  }

  loadAbsences(): void {
    const all = this.absenceService.getAll();
    this.absences.set(all);
    this.applyFilter();
  }

  applyFilter(): void {
    const f = this.filter();
    const all = this.absences();
    this.filteredAbsences.set(f === 'all' ? all : all.filter(a => a.status === f));
  }

  updateStatus(absence: Absence, status: AbsenceStatus): void {
    setTimeout(() => {
      this.absenceService.updateStatus(absence.id, status);
      const msg = `Absence for ${absence.studentName} has been ${status}`;
      this.notificationService.notifyUser(absence.userId, msg, status === 'approved' ? 'absence_approved' : 'absence_rejected');
      this.toast.success(msg);
      this.loadAbsences();
    }, 300);
  }
}
