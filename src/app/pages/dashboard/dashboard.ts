import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {

  userName = signal('Dr. Silva');

  stats = signal([
    { label: 'Citas Programadas', value: '42 Hoy', trend: '+12% vs ayer', icon: 'calendar', color: '#004394' },
    { label: 'Pacientes en Espera', value: '8 Ahora', trend: 'Tiempo prom: 15m', icon: 'users', color: '#f59e0b' },
    { label: 'Camas Ocupadas', value: '104 / 120', progress: 86, icon: 'bed', color: '#64748b' },
    { label: 'Urgencias Activas', value: '3', link: 'Ver Detalles', type: 'urgent', color: '#004394' }
  ]);

  agenda = signal([
    { time: '08:00 AM', patient: 'Elena Vargas', id: '89452', motive: 'Revisión Post-operatoria', status: 'COMPLETADO' },
    { time: '09:30 AM', patient: 'Carlos Mendoza', id: '45123', motive: 'Consulta General', status: 'EN CURSO' },
    { time: '10:15 AM', patient: 'Lucía Romero', id: '12890', motive: 'Resultados Laboratorio', status: 'EN ESPERA' },
    { time: '11:00 AM', patient: 'Martín Torres', id: '67341', motive: 'Seguimiento Cardiología', status: 'CONFIRMADO' },
    { time: '12:30 PM', patient: 'Ana Belén', id: '90214', motive: 'Evaluación Pre-quirúrgica', status: 'CONFIRMADO' }
  ]);

  recentActivity = signal([
    { title: 'Resultados de laboratorio disponibles', detail: 'Paciente: Lucía Romero. Análisis de sangre completo.', time: 'HACE 10 MIN', type: 'blue' },
    { title: 'Actualización de historia clínica', detail: 'Dr. Silva añadió notas a la visita de Elena Vargas.', time: 'HACE 45 MIN', type: 'gray' },
    { title: 'Alerta de Farmacia', detail: 'Stock bajo de Amoxicilina 500mg. Solicitar reposición.', time: 'HACE 2 HORAS', type: 'red' },
    { title: 'Ingreso Hospitalario', detail: 'Paciente asignado a la cama 304, planta 3.', time: 'AYER 18:30', type: 'gray' }
  ]);

}