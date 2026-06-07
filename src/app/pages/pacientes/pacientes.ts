import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class Pacientes {

  pacientes = signal([

    {
      dni: '74256318',
      nombre: 'María López',
      edad: 28,
      telefono: '987654321',
      estado: 'Activo'
    },

    {
      dni: '70125489',
      nombre: 'Carlos Pérez',
      edad: 35,
      telefono: '945612378',
      estado: 'Activo'
    },

    {
      dni: '71589632',
      nombre: 'Ana Torres',
      edad: 42,
      telefono: '999888777',
      estado: 'Inactivo'
    },

    {
      dni: '73658921',
      nombre: 'Luis García',
      edad: 31,
      telefono: '955111222',
      estado: 'Activo'
    }

  ]);

}