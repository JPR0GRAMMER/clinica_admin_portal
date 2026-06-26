import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AtencionMedicaService, AtencionMedicaResponseDto } from '../../core/services/atencion-medica.service';
import { extractErrorMessage } from '../../core/utils/api-error.utils';

@Component({
  selector: 'app-atenciones-medicas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './atenciones-medicas.html',
  styleUrls: ['./atenciones-medicas.css']
})
export class AtencionesMedicas implements OnInit {
  atenciones = signal<AtencionMedicaResponseDto[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string>('');

  constructor(private atencionService: AtencionMedicaService) {}

  ngOnInit() {
    this.cargarAtenciones();
  }

  cargarAtenciones() {
    this.isLoading.set(true);
    this.atencionService.listarMisAtenciones().subscribe({
      next: (data) => {
        this.atenciones.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'No se pudieron cargar las atenciones médicas.'));
        this.isLoading.set(false);
      }
    });
  }
}
