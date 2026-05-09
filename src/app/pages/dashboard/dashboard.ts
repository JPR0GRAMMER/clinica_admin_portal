import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  userName = signal('Dr. Juan Pérez');
  
  stats = signal([
    { label: 'Pacientes Totales', value: '1,284', icon: 'users', color: '#0066ff' },
    { label: 'Citas Hoy', value: '12', icon: 'calendar', color: '#10b981' },
    { label: 'Nuevos Registros', value: '5', icon: 'user-plus', color: '#f59e0b' },
    { label: 'Consultas Pendientes', value: '3', icon: 'clock', color: '#ef4444' }
  ]);

  recentPatients = signal([
    { id: 1, name: 'María García', lastVisit: 'Hoy, 09:30', status: 'En espera' },
    { id: 2, name: 'Carlos Rodríguez', lastVisit: 'Ayer, 15:45', status: 'Completado' },
    { id: 3, name: 'Ana Martínez', lastVisit: 'Ayer, 11:20', status: 'Completado' },
    { id: 4, name: 'Luis Hernández', lastVisit: '07 May, 10:00', status: 'Cancelado' }
  ]);
}
