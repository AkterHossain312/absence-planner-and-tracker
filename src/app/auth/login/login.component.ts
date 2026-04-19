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
  private matchedUserId = '';

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  fillDemo(email: string): void {
    this.identifier = email;
    this.sendOtp();
  }

  sendOtp(): void {
    this.errorMsg.set('');
    const user = this.auth.findUserByEmailOrPhone(this.identifier);
    if (!user) {
      this.errorMsg.set('No account found with this email/phone');
      return;
    }
    this.matchedUserId = user.id;
    this.otpSent.set(true);
    this.toast.info('OTP sent! Enter any 4-digit code.');
  }

  verifyOtp(): void {
    this.errorMsg.set('');
    if (!this.auth.verifyOtp(this.otp)) {
      this.errorMsg.set('Please enter a valid 4-digit code');
      return;
    }
    const user = this.auth.getUsers().find(u => u.id === this.matchedUserId);
    if (!user) return;

    // Check user status before allowing login
    const loginError = this.auth.tryLogin(user);
    if (loginError) {
      this.errorMsg.set(loginError);
      return;
    }

    // Simulate API delay
    setTimeout(() => {
      this.toast.success(`Welcome, ${user.name}!`);
      if (user.role === 'user') {
        this.router.navigate(['/user/dashboard']);
      } else {
        this.router.navigate(['/admin/dashboard']);
      }
    }, 500);
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
