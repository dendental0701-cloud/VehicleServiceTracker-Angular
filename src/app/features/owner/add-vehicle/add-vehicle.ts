import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../../core/config/apiConfig';

@Component({
  selector: 'app-add-vehicle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-vehicle.html',
  styleUrl: './add-vehicle.css'
})
export class AddVehicle {
  submitting = false;
  errorMessage = '';
  successMessage = '';

  vehicleForm;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.vehicleForm = this.fb.group({
      registrationNumber: [
        '',
        [
          Validators.required,
          Validators.maxLength(20)
        ]
      ],
      make: [
        '',
        [
          Validators.required,
          Validators.maxLength(50)
        ]
      ],
      model: [
        '',
        [
          Validators.required,
          Validators.maxLength(50)
        ]
      ],
      currentMileage: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ]
    });
  }

  saveVehicle(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }

    const formValue = this.vehicleForm.getRawValue();

    const vehicle = {
      registrationNumber:
        formValue.registrationNumber?.trim().toUpperCase(),
      make: formValue.make?.trim(),
      model: formValue.model?.trim(),
      currentMileage: Number(formValue.currentMileage)
    };

    this.submitting = true;

    this.http.post(
      `${API_BASE_URL}/api/vehicles`,
      vehicle,
      { withCredentials: true }
    ).subscribe({
      next: () => {
        this.successMessage = 'Vehicle added successfully!';

        setTimeout(() => {
          this.router.navigate(['/owner/dashboard']);
        }, 700);
      },
      error: (error) => {
        console.error('Add vehicle failed:', error);

        this.errorMessage =
          error.error?.message ??
          error.error?.title ??
          'Unable to add vehicle. Please check the information and try again.';

        this.submitting = false;
      }
    });
  }
}