import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PackingRow {
  student: string;
  grade: string;
  section: string;
  date: string;
  items: string[];
  status: string;
}

@Component({
  selector: 'app-packing-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './packing-report.component.html',
  styleUrl: './packing-report.component.scss'
})
export class PackingReportComponent {
  mockData: PackingRow[] = [
    { student: 'Emma Smith', grade: '5', section: 'A', date: '2026-04-11', items: ['Lunch Box', 'Water Bottle', 'Books'], status: 'Complete' },
    { student: 'Liam Johnson', grade: '3', section: 'B', date: '2026-04-11', items: ['Lunch Box', 'Books'], status: 'Partial' },
    { student: 'Olivia Brown', grade: '7', section: 'A', date: '2026-04-11', items: ['Lunch Box', 'Water Bottle', 'Books', 'Art Supplies'], status: 'Complete' },
    { student: 'Emma Smith', grade: '5', section: 'A', date: '2026-04-10', items: ['Lunch Box', 'Books'], status: 'Partial' },
    { student: 'Liam Johnson', grade: '3', section: 'B', date: '2026-04-10', items: ['Lunch Box', 'Water Bottle', 'Books'], status: 'Complete' },
  ];
}
