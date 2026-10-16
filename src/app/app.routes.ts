import { Routes } from '@angular/router';

import { Login } from './features/auth/login/login';
import { Dashboard as OwnerDashboard } from './features/owner/dashboard/dashboard';
import { AddVehicle } from './features/owner/add-vehicle/add-vehicle';
import { VehicleDetails } from './features/owner/vehicle-details/vehicle-details';

import { Dashboard as ServiceCenterDashboard } from './features/service-center/dashboard/dashboard';
import { AddService } from './features/service-center/add-service/add-service';

import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [

  {
    path: 'login',
    component: Login
  },

  // OWNER ROUTES
  {
    path: 'owner/dashboard',
    component: OwnerDashboard,
    canActivate: [authGuard],
    data: { role: 'Owner' }
  },

  {
    path: 'owner/vehicles/new',
    component: AddVehicle,
    canActivate: [authGuard],
    data: { role: 'Owner' }
  },

  {
    path: 'owner/vehicles/:vehicleId',
    component: VehicleDetails,
    canActivate: [authGuard],
    data: { role: 'Owner' }
  },

  // SERVICE CENTER ROUTES
  {
    path: 'service-center/dashboard',
    component: ServiceCenterDashboard,
    canActivate: [authGuard],
    data: { role: 'ServiceCenter' }
  },

  {
    path: 'service-center/service/new',
    component: AddService,
    canActivate: [authGuard],
    data: { role: 'ServiceCenter' }
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];



// Why do we use routes?
// Routes tell Angular which component to display for each URL:
// URL	                    Component
// /login	               Login page
// /owner/dashboard	       Owner dashboard
// /service-center/dashboard	Service Center dashboard


// If your login component uses a different class name or file path, adjust the imports to match the generated files.