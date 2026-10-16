import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/apiConfig';

interface Vehicle {
  vehicleId: number;
  registrationNumber: string;
  make: string;
  model: string;
  currentMileage: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface CreateServiceRecordRequest {
  vehicleId: number;
  serviceDate: string;
  mileageAtService: number;
  workDone: string;
}

@Component({
  selector: 'app-add-service',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-service.html',
  styleUrl: './add-service.css'
})
export class AddService implements OnInit {

  vehicle: Vehicle | null = null;

  loadingVehicle = true;
  submitting = false;

  errorMessage = '';
  successMessage = '';

  serviceForm;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Date input requires YYYY-MM-DD.
    const today = new Date();
    const localDate = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 10);

    this.serviceForm = this.fb.group({
      serviceDate: [
        localDate,
        Validators.required
      ],
      mileageAtService: [
        0,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(2147483647),
          Validators.pattern(/^\d+$/)
        ]
      ],
      workDone: [
        '',
        [
          Validators.required,
          Validators.maxLength(5000)
        ]
      ]
    });
  }

  ngOnInit(): void {
    const registrationNumber =
      this.route.snapshot.queryParamMap
        .get('registrationNumber')
        ?.trim()
        .toUpperCase();

    if (!registrationNumber) {
      this.loadingVehicle = false;
      this.errorMessage =
        'No vehicle selected. Please search for a vehicle first.';
      return;
    }

    void this.loadVehicle(registrationNumber);
  }

  async loadVehicle(registrationNumber: string): Promise<void> {

    this.loadingVehicle = true;
    this.errorMessage = '';

    try {
      const params = new HttpParams()
        .set('registrationNumber', registrationNumber);

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

      // Pre-fill service mileage with the current vehicle mileage.
      this.serviceForm.patchValue({
        mileageAtService: response.data.currentMileage
      });

    } catch (error) {
      console.error('Unable to load vehicle:', error);

      if (error instanceof HttpErrorResponse) {
        if (error.status === 404) {
          this.errorMessage = 'Vehicle not found.';
        } else if (error.status === 401) {
          this.errorMessage = 'Session expired. Please log in again.';
        } else if (error.status === 403) {
          this.errorMessage = 'Service Center access is required.';
        } else {
          this.errorMessage = 'Unable to load vehicle information.';
        }
      } else {
        this.errorMessage = 'Unable to load vehicle information.';
      }

    } finally {
      this.loadingVehicle = false;
    }
  }

  async saveService(): Promise<void> {

    if (!this.vehicle || this.submitting) {
      return;
    }

    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    const values = this.serviceForm.getRawValue();

    if (!values.serviceDate || !values.workDone?.trim()) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    const mileage = Number(values.mileageAtService);

    if (!Number.isInteger(mileage) ||
        mileage < 0 ||
        mileage > 2147483647) {
      this.errorMessage = 'Please enter a valid service mileage.';
      return;
    }

    // Send a complete UTC ISO timestamp to ASP.NET Core.
    const serviceDate = new Date(
      `${values.serviceDate}T12:00:00`
    ).toISOString();

    const request: CreateServiceRecordRequest = {
      vehicleId: this.vehicle.vehicleId,
      serviceDate,
      mileageAtService: mileage,
      workDone: values.workDone.trim()
    };

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await firstValueFrom(
        this.http.post(
          `${API_BASE_URL}/api/service-records`,
          request,
          { withCredentials: true }
        )
      );

      this.successMessage = 'Service record saved successfully!';

      // Return to Service Center Dashboard.
      setTimeout(() => {
        void this.router.navigate(['/service-center/dashboard']);
      }, 1000);

    } catch (error) {
      console.error('Unable to save service record:', error);

      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          this.errorMessage = 'Session expired. Please log in again.';
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have permission to add service records.';
        } else {
          this.errorMessage =
            error.error?.message ??
            error.error?.title ??
            'Unable to save service record. Please try again.';
        }
      } else {
        this.errorMessage = 'Unable to save service record.';
      }

    } finally {
      this.submitting = false;
    }
  }

  backToDashboard(): void {
    void this.router.navigate(['/service-center/dashboard']);
  }
}



// Code	                              Purpose
// ActivatedRoute    - 	Reads the registration number from the URL
// HttpParams	 -     Sends the registration number safely to your search API
// FormBuilder - 	Creates the service entry form
// Validators - 	Validates mileage, date, and work description
// withCredentials: true	 - Sends the HttpOnly authentication cookie
// POST /api/service-records -	Saves the service record in PostgreSQL
// Router - 	Returns to the Service Center Dashboard