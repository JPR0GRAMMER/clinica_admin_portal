import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AtencionMedicaService, HistorialClinicoResponse } from '../../core/services/atencion-medica.service';
import { extractErrorMessage } from '../../core/utils/api-error.utils';

@Component({
  selector: 'app-historial-clinico',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './historial-clinico.html',
  styleUrl: './historial-clinico.css'
})
export class HistorialClinico implements OnInit {
  historial = signal<HistorialClinicoResponse | null>(null);
  isLoading = signal(true);
  error = signal('');

  constructor(
    private route: ActivatedRoute,
    private atencionService: AtencionMedicaService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const citaId = Number(params.get('citaId'));
      if (!citaId) {
        this.error.set('La cita seleccionada no es válida.');
        this.isLoading.set(false);
        return;
      }
      this.cargarHistorial(citaId);
    });
  }

  cargarHistorial(citaId: number): void {
    this.isLoading.set(true);
    this.error.set('');
    this.atencionService.obtenerHistorialPorCita(citaId).subscribe({
      next: historial => {
        this.historial.set(historial);
        this.isLoading.set(false);
      },
      error: err => {
        this.historial.set(null);
        this.error.set(extractErrorMessage(err, 'No se pudo cargar el historial clínico.'));
        this.isLoading.set(false);
      }
    });
  }

  nombreCompleto(paciente: HistorialClinicoResponse['paciente']): string {
    return `${paciente.nombre} ${paciente.apellido}`;
  }
}
