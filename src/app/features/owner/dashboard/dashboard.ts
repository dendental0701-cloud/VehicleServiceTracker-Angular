import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/apiConfig';

import { AuthService } from '../../../core/services/auth';

interface CurrentUserResponse {
  success?: boolean;
  role: string;
  userId?: number;
}

interface Vehicle {
  vehicleId: number;
  ownerId: number;
  registrationNumber: string;
  make: string;
  model: string;
  currentMileage: number;
  createdAt: string;
}

interface VehiclesResponse {
  success: boolean;
  data: Vehicle[];
}

interface ServiceRecord {
  serviceRecordId: number;
  vehicleId: number;
  serviceCenterId: number;
  serviceDate: string;
  mileageAtService: number;
  workDone: string;
  nextServiceDue: string;
  createdAt: string;
}

interface ServiceHistoryResponse {
  success: boolean;
  data: ServiceRecord[];
}

interface VehicleWithService extends Vehicle {
  lastService?: ServiceRecord;
  isOverdue: boolean;
  daysOverdue: number;
  mileageOverdue: boolean;
  dateOverdue: boolean;
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  vehicles: VehicleWithService[] = [];

  loading = true;
  error = '';

  constructor(
  private http: HttpClient,
  private router: Router,
  private authService: AuthService
) {}

  ngOnInit(): void {
    void this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    try {
      this.loading = true;
      this.error = '';

      // 1. Get the currently logged-in user.
      const currentUser =
        await firstValueFrom(
          this.http.get<CurrentUserResponse>(
            `${API_BASE_URL}/api/auth/me`,
            { withCredentials: true }
          )
        );

      // 2. Ensure that the logged-in user is an Owner.
      if (currentUser.role !== 'Owner') {
        await this.router.navigate(['/login']);
        return;
      }

      // 3. Load vehicles belonging to the authenticated user.
      const vehicleResponse =
        await firstValueFrom(
          this.http.get<VehiclesResponse>(
            `${API_BASE_URL}/api/vehicles`,
            { withCredentials: true }
          )
        );

      const vehicleList = vehicleResponse.data ?? [];

      // 4. Load service history for each vehicle.
      const vehiclesWithService =
        await Promise.all(
          vehicleList.map(async (vehicle) => {

            try {
              const historyResponse =
                await firstValueFrom(
                  this.http.get<ServiceHistoryResponse>(
                    `${API_BASE_URL}/api/vehicles/${vehicle.vehicleId}/service-history`,
                    { withCredentials: true }
                  )
                );

              const history = historyResponse.data ?? [];

              // Assumes the API returns newest service records first.
              const lastService =
                history.length > 0
                  ? history[0]
                  : undefined;

              if (!lastService) {
                return {
                  ...vehicle,
                  lastService: undefined,
                  isOverdue: false,
                  daysOverdue: 0,
                  mileageOverdue: false,
                  dateOverdue: false
                };
              }

              // Mileage-based service interval.
              const mileageOverdue =
                vehicle.currentMileage >=
                lastService.mileageAtService + 10000;

              // Date-based service due check.
              const dateOverdue =
                !!lastService.nextServiceDue &&
                new Date() >=
                new Date(lastService.nextServiceDue);

              const isOverdue =
                mileageOverdue || dateOverdue;

              const daysOverdue =
                dateOverdue
                  ? this.getDaysOverdue(
                      lastService.nextServiceDue
                    )
                  : 0;

              return {
                ...vehicle,
                lastService,
                isOverdue,
                daysOverdue,
                mileageOverdue,
                dateOverdue
              };

            } catch (error) {
              // Keep the vehicle visible even if its
              // service-history request fails.
              console.error(
                'Unable to load service history for vehicle:',
                vehicle.vehicleId,
                error
              );

              return {
                ...vehicle,
                lastService: undefined,
                isOverdue: false,
                daysOverdue: 0,
                mileageOverdue: false,
                dateOverdue: false
              };
            }
          })
        );

      this.vehicles = vehiclesWithService;

    } catch (error) {
      console.error(
        'Unable to load owner dashboard:',
        error
      );

      this.error =
        'Unable to load your dashboard. Please check your login and try again.';

    } finally {
      this.loading = false;
    }
  }

  get totalVehicles(): number {
    return this.vehicles.length;
  }

  get overdueCount(): number {
    return this.vehicles.filter(
      vehicle => vehicle.isOverdue
    ).length;
  }

  get upToDateCount(): number {
    return this.vehicles.filter(
      vehicle =>
        !vehicle.isOverdue &&
        !!vehicle.lastService
    ).length;
  }

  get noServiceCount(): number {
    return this.vehicles.filter(
      vehicle => !vehicle.lastService
    ).length;
  }

  getDaysOverdue(date?: string): number {
    if (!date) {
      return 0;
    }

    const dueDate = new Date(date);
    const today = new Date();

    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const difference =
      today.getTime() - dueDate.getTime();

    return Math.max(
      0,
      Math.floor(
        difference / (1000 * 60 * 60 * 24)
      )
    );
  }

  formatDate(date?: string): string {
    if (!date) {
      return 'No service yet';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Not available';
    }

    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  addVehicle(): void {
    this.router.navigate(['/owner/vehicles/new']);
  }

  viewVehicle(vehicleId: number): void {
    this.router.navigate([
      '/owner/vehicles',
      vehicleId
    ]);
  }async logout(): Promise<void> {

  try {
    await this.authService.logout();
  } catch (error) {
    alert('Logout failed. Please try again.');
  }

}
}



// @Component - defines the Angular component.
// templateUrl - connects the TypeScript file to its HTML.
// styleUrl -  connects the component to its CSS.
// showMessage() -  handles button clicks.
// Router - navigates between application pages.
// logout()  - returns the user to the login page.