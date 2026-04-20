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
  loading = signal(false);

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

  async submitRegistration(): Promise<void> {
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

    this.loading.set(true);
    const result = await this.auth.register({
      name: this.name,
      email: this.email,
      phone: this.phone,
      location: this.location
    });
    this.loading.set(false);

    if (!result.success) {
      this.errorMsg.set(result.error!);
      return;
    }

    this.registeredUserId = result.userId!;
    this.toast.info('Verification code sent to your email!');
    this.step.set('verify');
  }

  async verifyEmail(): Promise<void> {
    this.errorMsg.set('');

    if (!this.verificationCode || this.verificationCode.length !== 6 || !/^\d{6}$/.test(this.verificationCode)) {
      this.errorMsg.set('Please enter a valid 6-digit verification code.');
      return;
    }

    this.loading.set(true);
    const result = await this.auth.verifyEmail(this.registeredUserId, this.verificationCode);
    this.loading.set(false);

    if (!result.success) {
      this.errorMsg.set(result.error || 'Verification failed. Please try again.');
      return;
    }

    await this.notificationService.notifyRegistrationPending(this.registeredUserId, this.name, this.email);

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
