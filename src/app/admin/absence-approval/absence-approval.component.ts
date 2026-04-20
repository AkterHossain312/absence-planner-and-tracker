import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbsenceService } from '../../core/services/absence.service';
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

  filteredAbsences = computed(() => {
    const f = this.filter();
    const all = this.absences();
    return f === 'all' ? all : all.filter(a => a.status === f);
  });

  constructor(
    private absenceService: AbsenceService,
    private toast: ToastService
  ) {
    this.loadAbsences();
  }

  async loadAbsences(): Promise<void> {
    const absences = await this.absenceService.loadAll();
    this.absences.set(absences);
  }

  async updateStatus(absence: Absence, status: AbsenceStatus): Promise<void> {
    if (status === 'approved') {
      await this.absenceService.approveAbsence(absence.id);
    } else if (status === 'rejected') {
      await this.absenceService.rejectAbsence(absence.id);
    } else {
      await this.absenceService.updateStatus(absence.id, status);
    }
    const msg = `Absence for ${absence.studentName} has been ${status}`;
    this.toast.success(msg);
    await this.loadAbsences();
  }
}
