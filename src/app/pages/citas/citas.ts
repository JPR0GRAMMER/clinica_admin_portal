import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CitaService, CitaResponse } from '../../core/services/cita.service';
import { AuthService } from '../../core/services/auth.service';
import { EstadoCita, esReprogramable } from '../../core/models/estado-cita';

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
  userRole = signal<string>('');

  showStatusModal = signal<boolean>(false);
  readonly EstadoCita = EstadoCita;
  readonly esReprogramable = esReprogramable;
  statusAction = signal<EstadoCita | null>(null);
  selectedCita = signal<CitaResponse | null>(null);

  activeDropdownIndex = signal<number | null>(null);
  private focusBeforeModal: HTMLElement | null = null;

  constructor(private citaService: CitaService, private authService: AuthService) {}

  ngOnInit() {
    this.userRole.set(this.authService.getRol());
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

  onStatusAction(action: EstadoCita, cita: CitaResponse) {
    this.focusBeforeModal = (document.activeElement as HTMLElement).closest('.dropdown-wrapper')?.querySelector<HTMLElement>('.more-btn') || document.activeElement as HTMLElement;
    this.activeDropdownIndex.set(null);
    this.statusAction.set(action);
    this.selectedCita.set(cita);
    this.showStatusModal.set(true);
    setTimeout(() => document.querySelector<HTMLElement>('.modal-overlay .btn-secondary')?.focus());
  }

  closeStatusModal() {
    this.showStatusModal.set(false);
    this.statusAction.set(null);
    this.selectedCita.set(null);
    const target = this.focusBeforeModal;
    setTimeout(() => target?.isConnected && target.focus());
    this.focusBeforeModal = null;
  }

  @HostListener('document:keydown.escape')
  closeWithEscape() {
    if (this.showStatusModal()) this.closeStatusModal();
    else this.activeDropdownIndex.set(null);
  }

  trapModalFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const controls = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
    if (!controls.length) return;
    if (event.shiftKey && document.activeElement === controls[0]) {
      event.preventDefault();
      controls[controls.length - 1].focus();
    } else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) {
      event.preventDefault();
      controls[0].focus();
    }
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

  getStatusBadgeClass(estado: EstadoCita): string {
    switch (estado) {
      case EstadoCita.Confirmada: return 'status-badge active';
      case EstadoCita.Reprogramada: return 'status-badge warning';
      case EstadoCita.Asistio: return 'status-badge success';
      case EstadoCita.Cancelada: return 'status-badge inactive';
      case EstadoCita.NoAsistio: return 'status-badge danger';
      default: return 'status-badge';
    }
  }
}
