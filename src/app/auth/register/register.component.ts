import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';

type RegistrationStep = 'form' | 'verify' | 'done';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  step = signal<RegistrationStep>('form');
  errorMsg = signal('');

  name = '';
  email = '';
  phone = '';
  location = '';
  verificationCode = '';

  private registeredUserId = '';

  constructor(
    private auth: AuthService,
    private notificationService: NotificationService,
    private toast: ToastService,
    private router: Router
  ) {}

  submitRegistration(): void {
    this.errorMsg.set('');

    if (!this.name || !this.email || !this.phone) {
      this.errorMsg.set('Please fill in all required fields.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.email)) {
      this.errorMsg.set('Please enter a valid email address.');
      return;
    }

    const result = this.auth.register({
      name: this.name,
      email: this.email,
      phone: this.phone,
      location: this.location
    });

    if (!result.success) {
      this.errorMsg.set(result.error!);
      return;
    }

    this.registeredUserId = result.userId!;
    this.toast.info('Verification code sent to your email!');
    this.step.set('verify');
  }

  verifyEmail(): void {
    this.errorMsg.set('');

    if (!this.verificationCode || this.verificationCode.length !== 6 || !/^\d{6}$/.test(this.verificationCode)) {
      this.errorMsg.set('Please enter a valid 6-digit verification code.');
      return;
    }

    const verified = this.auth.verifyEmail(this.registeredUserId);
    if (!verified) {
      this.errorMsg.set('Verification failed. Please try again.');
      return;
    }

    // Notify admins about the new registration
    const admins = this.auth.getUsers().filter(u => u.role === 'superadmin' || u.role === 'admin');
    for (const admin of admins) {
      this.notificationService.notifyUser(
        admin.id,
        `New parent registration: ${this.name} (${this.email}) is pending approval.`,
        'registration_pending'
      );
    }

    this.toast.success('Email verified! Your account is pending admin approval.');
    this.step.set('done');
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goBack(): void {
    const currentStep = this.step();
    if (currentStep === 'verify') {
      this.step.set('form');
      this.verificationCode = '';
    } else {
      this.goToLogin();
    }
    this.errorMsg.set('');
  }
}
