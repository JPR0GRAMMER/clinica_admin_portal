import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AtencionMedicaService, AtencionMedicaResponseDto } from '../../core/services/atencion-medica.service';
import { extractErrorMessage } from '../../core/utils/api-error.utils';

@Component({
  selector: 'app-atencion-medica-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './atencion-medica-detalle.html',
  styleUrls: ['./atencion-medica-detalle.css']
})
export class AtencionMedicaDetalle implements OnInit {
  atencion = signal<AtencionMedicaResponseDto | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private atencionService: AtencionMedicaService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarDetalle(Number(id));
      } else {
        this.error.set('ID de atención no válido');
        this.isLoading.set(false);
      }
    });
  }

  cargarDetalle(id: number) {
    this.isLoading.set(true);
    this.atencionService.obtenerAtencion(id).subscribe({
      next: (data) => {
        this.atencion.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'No se pudo cargar el detalle de la atención médica.'));
        this.isLoading.set(false);
      }
    });
  }
}
