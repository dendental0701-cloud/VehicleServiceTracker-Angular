import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';

  role: 'Owner' | 'ServiceCenter' = 'Owner';

  loading = false;
  errorMessage = '';

  onLogin(): void {

    this.errorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.loading = true;

    const loginRequest =
      this.role === 'Owner'
        ? this.authService.ownerLogin(
            this.email.trim(),
            this.password
          )
        : this.authService.serviceCenterLogin(
            this.email.trim(),
            this.password
          );

    loginRequest.subscribe({
      next: (response: any) => {

        this.loading = false;

        console.log('Login response:', response);

        if (response?.success === false) {
          this.errorMessage =
            response.message || 'Invalid email or password.';
          return;
        }

        const destination =
          this.role === 'Owner'
            ? '/owner/dashboard'
            : '/service-center/dashboard';

        this.router.navigateByUrl(destination);
      },

      error: (error: any) => {

        this.loading = false;

        console.error('Login failed:', error);

        this.errorMessage =
          error.error?.message ||
          'Unable to log in. Please check the API connection and credentials.';
      }
    });
  }
}




// 1. @Component()
// Defines the Angular component and connects its TypeScript class to the HTML and CSS files.
// 2. inject(AuthService)
// Gets the authentication service through Angular's dependency injection system.
// 3. FormsModule
// Allows us to use template-driven forms with ngModel.
// 4. onLogin()
// Runs when the user submits the login form.
// 5. subscribe()
// Handles the asynchronous HTTP response.
// - next: Handles a successful HTTP response.
// - error: Handles an HTTP or network error.