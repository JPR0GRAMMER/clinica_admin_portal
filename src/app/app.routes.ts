import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';

import { Pacientes } from './pages/pacientes/pacientes';
import { Doctores } from './pages/doctores/doctores';
import { Usuarios } from './pages/usuarios/usuarios';
import { Citas } from './pages/citas/citas';
import { HistorialClinico } from './pages/historial-clinico/historial-clinico';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'dashboard',
    component: DashboardComponent
  },

  {
    path: 'pacientes',
    component: Pacientes
  },

  {
    path: 'doctores',
    component: Doctores
  },

  {
    path: 'usuarios',
    component: Usuarios
  },

  {
    path: 'citas',
    component: Citas
  },

  {
    path: 'historial-clinico',
    component: HistorialClinico
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];