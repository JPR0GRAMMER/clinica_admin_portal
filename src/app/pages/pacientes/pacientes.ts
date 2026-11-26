import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { PacienteService, PacienteResponse } from '../../core/services/paciente.service';
import { extractErrorMessage } from '../../core/utils/api-error.utils';
import { environment } from '../../../environments/environment';

function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const selectedDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate > today) {
    return { futureDate: true };
  }
  return null;
}

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pacientes.html',
  styleUrls: ['./pacientes.css']
})
export class Pacientes implements OnInit {
  pacientes = signal<PacienteResponse[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  showCreateModal = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  formError = signal<string>('');
  errorTimer: any = null;
  editingPacienteId = signal<number | null>(null);

  showConfirmModal = signal<boolean>(false);
  confirmAction = signal<'deshabilitar' | 'habilitar' | null>(null);
  selectedPaciente = signal<PacienteResponse | null>(null);

  activeDropdownIndex = signal<number | null>(null);
  private focusBeforeModal: HTMLElement | null = null;

  pacienteForm = new FormGroup({
    documentoIdentidad: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(8),
      Validators.pattern('^[0-9]+$')
    ]),
    nombre: new FormControl('', [Validators.required]),
    apellido: new FormControl('', [Validators.required]),
    fechaNacimiento: new FormControl('', [Validators.required, pastDateValidator]),
    telefono: new FormControl('', [Validators.required, Validators.maxLength(15)]),
    correo: new FormControl('', [Validators.required, Validators.email])
  });

  constructor(private pacienteService: PacienteService) {}

  ngOnInit() {
    this.loadPacientes();

    document.addEventListener('click', () => {
      this.activeDropdownIndex.set(null);
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

  onAction(action: 'editar' | 'deshabilitar' | 'habilitar', paciente: PacienteResponse) {
    this.focusBeforeModal = (document.activeElement as HTMLElement).closest('.dropdown-wrapper')?.querySelector<HTMLElement>('.more-btn') || document.activeElement as HTMLElement;
    this.activeDropdownIndex.set(null);
    if (action === 'editar') {
      this.openEditModal(paciente);
    } else if (action === 'deshabilitar' || action === 'habilitar') {
      this.confirmAction.set(action);
      this.selectedPaciente.set(paciente);
      this.showConfirmModal.set(true);
      setTimeout(() => document.querySelector<HTMLElement>('.modal-overlay .btn-secondary')?.focus());
    }
  }

  closeConfirmModal() {
    this.showConfirmModal.set(false);
    this.confirmAction.set(null);
    this.selectedPaciente.set(null);
    this.restoreFocus();
  }

  executeConfirmAction() {
    const action = this.confirmAction();
    const paciente = this.selectedPaciente();

    if (!action || !paciente) return;

    this.isSaving.set(true);

    if (action === 'deshabilitar') {
      this.pacienteService.deshabilitarPaciente(paciente.id).subscribe(() => {
        this.isSaving.set(false);
        this.closeConfirmModal();
        this.loadPacientes();
      });
    } else if (action === 'habilitar') {
      this.pacienteService.habilitarPaciente(paciente.id).subscribe(() => {
        this.isSaving.set(false);
        this.closeConfirmModal();
        this.loadPacientes();
      });
    }
  }

  openCreateModal() {
    this.focusBeforeModal = document.activeElement as HTMLElement;
    this.editingPacienteId.set(null);
    this.pacienteForm.reset();
    this.formError.set('');
    this.showCreateModal.set(true);
    setTimeout(() => document.getElementById('paciente-documento')?.focus());
  }

  openEditModal(paciente: PacienteResponse) {
    this.editingPacienteId.set(paciente.id);
    this.pacienteForm.reset({
      documentoIdentidad: paciente.documentoIdentidad,
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      fechaNacimiento: paciente.fechaNacimiento,
      telefono: paciente.telefono,
      correo: paciente.correo
    });
    this.formError.set('');
    this.showCreateModal.set(true);
    setTimeout(() => document.getElementById('paciente-documento')?.focus());
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.restoreFocus();
  }

  @HostListener('document:keydown.escape')
  closeWithEscape() {
    if (this.showCreateModal()) this.closeCreateModal();
    else if (this.showConfirmModal()) this.closeConfirmModal();
    else this.activeDropdownIndex.set(null);
  }

  trapModalFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const modal = event.currentTarget as HTMLElement;
    const controls = Array.from(modal.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'));
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private restoreFocus() {
    const target = this.focusBeforeModal?.isConnected ? this.focusBeforeModal : document.querySelector<HTMLElement>('.more-btn, .page-header .btn-primary');
    setTimeout(() => target?.focus());
    this.focusBeforeModal = null;
  }

  showError(msg: string) {
    if (this.errorTimer) clearTimeout(this.errorTimer);
    this.formError.set(msg);
    if (msg) {
      this.errorTimer = setTimeout(() => this.formError.set(''), environment.errorTimeoutMs);
    }
  }

  onSubmitPaciente() {
    if (this.pacienteForm.invalid) {
      this.pacienteForm.markAllAsTouched();
      this.formError.set('Revisa los campos marcados antes de guardar el paciente.');
      return;
    }

    this.isSaving.set(true);
    this.formError.set('');
    if (this.errorTimer) clearTimeout(this.errorTimer);

    const formValue = this.pacienteForm.value;
    const dto = {
      documentoIdentidad: formValue.documentoIdentidad!,
      nombre: formValue.nombre!,
      apellido: formValue.apellido!,
      fechaNacimiento: formValue.fechaNacimiento!,
      telefono: formValue.telefono!,
      correo: formValue.correo!
    };

    const id = this.editingPacienteId();
    const request$ = id
      ? this.pacienteService.actualizarPaciente(id, dto)
      : this.pacienteService.crearPaciente(dto);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeCreateModal();
        this.loadPacientes();
      },
      error: (err) => {
        console.error('Error guardando paciente:', err);
        this.isSaving.set(false);
        this.showError(extractErrorMessage(err, 'Ocurrió un error al registrar el paciente.'));
      }
    });
  }

  loadPacientes() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.pacienteService.listarPacientes().subscribe({
      next: (data) => {
        this.pacientes.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar pacientes:', err);
        this.errorMessage.set(extractErrorMessage(err, 'No se pudieron cargar los pacientes. Revisa tu conexión al servidor.'));
        this.isLoading.set(false);
      }
    });
  }

  getInitials(nombre: string, apellido: string): string {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase() || 'P';
  }
}
