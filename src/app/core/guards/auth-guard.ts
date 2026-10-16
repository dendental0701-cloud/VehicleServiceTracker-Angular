import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';

import { API_BASE_URL } from '../config/apiConfig';

interface CurrentUserResponse {
  success: boolean;
  role: string;
  userId: number;
}

export const authGuard: CanActivateFn = (route) => {

  const http = inject(HttpClient);
  const router = inject(Router);

  const allowedRole = route.data['role'] as string;

  return http.get<CurrentUserResponse>(
    `${API_BASE_URL}/api/auth/me`,
    { withCredentials: true }
  ).pipe(

    map(user => {

      if (user.role === allowedRole) {
        return true;
      }

      if (user.role === 'Owner') {
        return router.createUrlTree(['/owner/dashboard']);
      }

      if (user.role === 'ServiceCenter') {
        return router.createUrlTree(['/service-center/dashboard']);
      }

      return router.createUrlTree(['/login']);

    }),

    catchError(() => {
      return of(router.createUrlTree(['/login']));
    })

  );
};