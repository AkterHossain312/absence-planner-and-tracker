import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  identifier = '';
  otp = '';
  otpSent = signal(false);
  errorMsg = signal('');
  loading = signal(false);

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  fillDemo(email: string): void {
    this.identifier = email;
    this.sendOtp();
  }

  async sendOtp(): Promise<void> {
    this.errorMsg.set('');
    this.loading.set(true);
    const result = await this.auth.sendLoginOtp(this.identifier);
    this.loading.set(false);
    if (!result.success) {
      this.errorMsg.set(result.error || 'Failed to send OTP');
      return;
    }
    this.otpSent.set(true);
    this.toast.info('OTP sent! Check your email.');
  }

  async verifyOtp(): Promise<void> {
    this.errorMsg.set('');
    if (!this.otp || this.otp.length < 6) {
      this.errorMsg.set('Please enter a valid code');
      return;
    }

    this.loading.set(true);
    const result = await this.auth.verifyLoginOtp(this.identifier, this.otp);
    this.loading.set(false);

    if (!result.success) {
      this.errorMsg.set(result.error || 'Login failed');
      return;
    }

    this.toast.success('Welcome!');
    if (result.role === 'user') {
      this.router.navigate(['/user/dashboard']);
    } else {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  goBack(): void {
    this.otpSent.set(false);
    this.otp = '';
    this.errorMsg.set('');
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
