import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Usuarios } from './pages/usuarios/usuarios';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'usuarios', component: Usuarios },
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' }
    ]
  },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: '**', redirectTo: '' }
];