import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Usuarios } from './pages/usuarios/usuarios';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { authGuard } from './core/guards/auth.guard';
import { Pacientes } from './pages/pacientes/pacientes';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'usuarios', component: Usuarios },
      { path: 'horarios-medicos', loadComponent: () => import('./pages/horarios-medicos/horarios-medicos').then(m => m.HorariosMedicos) },
      { path: 'pacientes', component: Pacientes },
      { path: 'citas', loadComponent: () => import('./pages/citas/citas').then(m => m.Citas) },
      { path: 'citas/agendar', loadComponent: () => import('./pages/citas/citas-form').then(m => m.CitasForm) },
      { path: 'citas/editar/:id', loadComponent: () => import('./pages/citas/citas-form').then(m => m.CitasForm) },
      { path: 'citas/:citaId/historial-clinico', loadComponent: () => import('./pages/historial-clinico/historial-clinico').then(m => m.HistorialClinico) },
      { path: 'atenciones', loadComponent: () => import('./pages/atenciones-medicas/atenciones-medicas').then(m => m.AtencionesMedicas) },
      { path: 'atenciones/registrar', loadComponent: () => import('./pages/atenciones-medicas/atencion-medica-form').then(m => m.AtencionMedicaForm) },
      { path: 'atenciones/detalle/:id', loadComponent: () => import('./pages/atenciones-medicas/atencion-medica-detalle').then(m => m.AtencionMedicaDetalle) },
      { path: 'hospitalizacion', loadComponent: () => import('./pages/hospitalizacion/hospitalizacion').then(m => m.Hospitalizacion) },
      { path: 'dispensacion', loadComponent: () => import('./pages/dispensacion/dispensacion').then(m => m.Dispensacion) },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) }
    ]
  },
  { path: '**', redirectTo: '' }
];
