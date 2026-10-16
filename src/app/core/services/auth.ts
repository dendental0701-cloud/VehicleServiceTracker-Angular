import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../config/apiConfig';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);

  // OWNER LOGIN
  ownerLogin(email: string, password: string) {
    return this.http.post(
      `${API_BASE_URL}/api/auth/owner/login`,
      { email, password },
      { withCredentials: true }
    );
  }

  // SERVICE CENTER LOGIN
  serviceCenterLogin(email: string, password: string) {
    return this.http.post(
      `${API_BASE_URL}/api/auth/service-center/login`,
      { email, password },
      { withCredentials: true }
    );
  }

  // LOGOUT
  async logout(): Promise<void> {

    try {

      const response = await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>(
          `${API_BASE_URL}/api/auth/logout`,
          {},
          { withCredentials: true }
        )
      );

      if (!response.success) {
        throw new Error('Logout failed.');
      }

      // Redirect to Login after successful logout
      await this.router.navigate(['/login'], {
        replaceUrl: true
      });

    } catch (error) {

      console.error('Logout API error:', error);
      throw error;

    }
  }

}