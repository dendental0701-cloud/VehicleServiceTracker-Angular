import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/apiConfig';

import { AuthService } from '../../../core/services/auth';

interface Vehicle {
  vehicleId: number;
  registrationNumber: string;
  make: string;
  model: string;
  currentMileage: number;
}

interface ServiceRecord {
  serviceRecordId: number;
  vehicleId: number;
  serviceCenterId: number;
  serviceDate: string;
  mileageAtService: number;
  workDone: string;
  nextServiceDue: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Component({
  selector: 'app-service-center-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  registrationNumber = '';

  vehicle: Vehicle | null = null;
  serviceHistory: ServiceRecord[] = [];

  overdueVehicles: Vehicle[] = [];

  loading = false;
  searching = false;
  loadingOverdue = false;
  errorMessage = '';
  overdueError = '';

  constructor(
  private http: HttpClient,
  private router: Router,
  private authService: AuthService
) {}

  ngOnInit(): void {
    void this.loadOverdueVehicles();
  }

  async searchVehicle(): Promise<void> {

    const registration = this.registrationNumber
      .trim()
      .toUpperCase();

    if (!registration) {
      this.errorMessage = 'Please enter a vehicle registration number.';
      return;
    }

    this.searching = true;
    this.errorMessage = '';
    this.vehicle = null;
    this.serviceHistory = [];

    try {

      const params = new HttpParams()
        .set('registrationNumber', registration);

      const response = await firstValueFrom(
        this.http.get<ApiResponse<Vehicle>>(
          `${API_BASE_URL}/api/service-centers/vehicles/search`,
          {
            params,
            withCredentials: true
          }
        )
      );

      if (!response.success || !response.data) {
        throw new Error('Vehicle not found.');
      }

      this.vehicle = response.data;

      await this.loadServiceHistory(response.data.vehicleId);

    } catch (error) {

      console.error('Vehicle search failed:', error);

      if (error instanceof HttpErrorResponse) {
        if (error.status === 404) {
          this.errorMessage = 'No vehicle found with this registration number.';
        } else if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please log in again.';
        } else if (error.status === 403) {
          this.errorMessage = 'This account does not have Service Center access.';
        } else {
          this.errorMessage = 'Unable to search vehicle. Please try again.';
        }
      } else {
        this.errorMessage = 'Unable to search vehicle. Please try again.';
      }

    } finally {
      this.searching = false;
    }
  }

  async loadServiceHistory(vehicleId: number): Promise<void> {

    this.loading = true;

    try {

      const response = await firstValueFrom(
        this.http.get<ApiResponse<ServiceRecord[]>>(
          `${API_BASE_URL}/api/service-records/vehicle/${vehicleId}`,
          { withCredentials: true }
        )
      );

      this.serviceHistory = [...(response.data ?? [])]
        .sort(
          (a, b) =>
            new Date(b.serviceDate).getTime() -
            new Date(a.serviceDate).getTime()
        );

    } catch (error) {
      console.error('Service history failed:', error);
      this.serviceHistory = [];
      this.errorMessage = 'Vehicle found, but service history could not be loaded.';
    } finally {
      this.loading = false;
    }
  }

  async loadOverdueVehicles(): Promise<void> {

    this.loadingOverdue = true;
    this.overdueError = '';

    try {

      const response = await firstValueFrom(
        this.http.get<ApiResponse<Vehicle[]>>(
          `${API_BASE_URL}/api/service-centers/overdue-vehicles`,
          { withCredentials: true }
        )
      );

      this.overdueVehicles = response.data ?? [];

    } catch (error) {
      console.error('Unable to load overdue vehicles:', error);
      this.overdueError = 'Unable to load overdue vehicles.';
    } finally {
      this.loadingOverdue = false;
    }
  }

  addService(): void {

    if (!this.vehicle) {
      return;
    }

    this.router.navigate(
      ['/service-center/service/new'],
      {
        queryParams: {
          registrationNumber: this.vehicle.registrationNumber
        }
      }
    );
  }

  async logout(): Promise<void> {

  try {
    await this.authService.logout();
  } catch (error) {
    alert('Logout failed. Please try again.');
  }

} 
}




// FormsModule supports [(ngModel)] for the registration number search.
// HttpParams safely passes the registration number to your API.
// withCredentials: true sends your HttpOnly authentication cookie.
// loadOverdueVehicles() loads vehicles that need maintenance.
// searchVehicle() searches for a vehicle using its registration number.
// loadServiceHistory() retrieves all recorded services.
// addService() opens the Add Service page with the selected registration number.