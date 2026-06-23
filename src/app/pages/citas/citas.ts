import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CitaService, CitaResponse } from '../../core/services/cita.service';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './citas.html',
  styleUrls: ['./citas.css']
})
export class Citas implements OnInit {
  citas = signal<CitaResponse[]>([]);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  
  // Status Action Modal State
  showStatusModal = signal<boolean>(false);
  statusAction = signal<string | null>(null);
  selectedCita = signal<CitaResponse | null>(null);

  // Dropdown
  activeDropdownIndex = signal<number | null>(null);

  constructor(private citaService: CitaService) {}

  ngOnInit() {
    this.loadData();

    document.addEventListener('click', () => {
      this.activeDropdownIndex.set(null);
    });
  }

  loadData() {
    this.isLoading.set(true);
    this.citaService.listarCitas().subscribe({
      next: (data) => {
        this.citas.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleDropdown(index: number, event: Event) {
    event.stopPropagation();
    if (this.activeDropdownIndex() === index) {
      this.activeDropdownIndex.set(null);
    } else {
      this.activeDropdownIndex.set(index);
    }
  }

  onStatusAction(action: string, cita: CitaResponse) {
    this.activeDropdownIndex.set(null);
    this.statusAction.set(action);
    this.selectedCita.set(cita);
    this.showStatusModal.set(true);
  }

  closeStatusModal() {
    this.showStatusModal.set(false);
    this.statusAction.set(null);
    this.selectedCita.set(null);
  }

  executeStatusAction() {
    const action = this.statusAction();
    const cita = this.selectedCita();
    
    if (!action || !cita) return;

    this.isSaving.set(true);
    
    this.citaService.cambiarEstado(cita.id, action).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeStatusModal();
        this.loadData();
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  getStatusBadgeClass(estado: string): string {
    switch (estado) {
      case 'Confirmada': return 'status-badge active';
      case 'Reprogramada': return 'status-badge warning';
      case 'Asistió': return 'status-badge success';
      case 'Cancelada': return 'status-badge inactive';
      case 'No Asistió': return 'status-badge danger';
      default: return 'status-badge';
    }
  }
}
