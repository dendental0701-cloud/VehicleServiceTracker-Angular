import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/apiConfig';

interface Vehicle {
  vehicleId: number;
  ownerId: number;
  registrationNumber: string;
  make: string;
  model: string;
  currentMileage: number;
  createdAt: string;
}

interface ServiceRecord {
  serviceRecordId: number;
  vehicleId: number;
  serviceCenterId: number;
  serviceDate: string;
  mileageAtService: number;
  workDone: string;
  nextServiceDue: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Component({
  selector: 'app-vehicle-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-details.html',
  styleUrl: './vehicle-details.css'
})
export class VehicleDetails implements OnInit {

  vehicle: Vehicle | null = null;
  serviceHistory: ServiceRecord[] = [];

  loading = true;
  error = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const vehicleId = Number(
      this.route.snapshot.paramMap.get('vehicleId')
    );

    if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0) {
      this.error = 'Invalid vehicle ID.';
      this.loading = false;
      return;
    }

    void this.loadVehicleDetails(vehicleId);
  }

  async loadVehicleDetails(vehicleId: number): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const vehicleResponse = await firstValueFrom(
        this.http.get<ApiResponse<Vehicle>>(
          `${API_BASE_URL}/api/vehicles/${vehicleId}`,
          { withCredentials: true }
        )
      );

      if (!vehicleResponse.success || !vehicleResponse.data) {
        throw new Error('Vehicle information is unavailable.');
      }

      this.vehicle = vehicleResponse.data;

      const historyResponse = await firstValueFrom(
        this.http.get<ApiResponse<ServiceRecord[]>>(
          `${API_BASE_URL}/api/vehicles/${vehicleId}/service-history`,
          { withCredentials: true }
        )
      );

      if (!historyResponse.success) {
        throw new Error('Unable to retrieve service history.');
      }

      this.serviceHistory = [...(historyResponse.data ?? [])]
        .sort((a, b) =>
          new Date(b.serviceDate).getTime() -
          new Date(a.serviceDate).getTime()
        );

    } catch (err) {
      console.error('Vehicle details error:', err);

      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          this.error = 'Your session has expired. Please log in again.';
        } else if (err.status === 403) {
          this.error = 'You do not have permission to view this vehicle.';
        } else if (err.status === 404) {
          this.error = 'Vehicle not found.';
        } else {
          this.error = 'Unable to load vehicle details. Please try again.';
        }
      } else {
        this.error = 'Unable to load vehicle details. Please try again.';
      }

    } finally {
      this.loading = false;
    }
  }

  get lastService(): ServiceRecord | null {
    return this.serviceHistory[0] ?? null;
  }

  get nextServiceDue(): string | null {
    return this.lastService?.nextServiceDue ?? null;
  }

  get mileageOverdue(): boolean {
    if (!this.vehicle || !this.lastService) {
      return false;
    }

    return this.vehicle.currentMileage >=
      this.lastService.mileageAtService + 10000;
  }

  get dateOverdue(): boolean {
    if (!this.nextServiceDue) {
      return false;
    }

    const dueDate = new Date(this.nextServiceDue);

    if (Number.isNaN(dueDate.getTime())) {
      return false;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    return today >= dueDate;
  }

  get isOverdue(): boolean {
    return this.mileageOverdue || this.dateOverdue;
  }

  get nextServiceMileage(): number | null {
    if (!this.lastService) {
      return null;
    }

    return this.lastService.mileageAtService + 10000;
  }

  backToDashboard(): void {
    void this.router.navigate(['/owner/dashboard']);
  }
}






// ActivatedRoute - reads the vehicleId from the URL.
// HttpClient  - calls your ASP.NET Core APIs.
// withCredentials: true sends the authentication cookie.
// Promise and async/await load the vehicle and service history.
// lastService - identifies the latest service record.
// isOverdue checks both mileage and service due date.
// backToDashboard() returns the owner to the dashboard.