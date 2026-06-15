import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { PacienteService, PacienteResponse } from '../../core/services/paciente.service';

function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const selectedDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Permitimos si la fecha es hoy o anterior. Si es mayor a hoy, es futuro.
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
  // Data State
  pacientes = signal<PacienteResponse[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Modal & Edit State
  showCreateModal = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  formError = signal<string>('');
  editingPacienteId = signal<number | null>(null);

  // Confirm Modal State
  showConfirmModal = signal<boolean>(false);
  confirmAction = signal<'deshabilitar' | 'habilitar' | null>(null);
  selectedPaciente = signal<PacienteResponse | null>(null);

  // Dropdown State
  activeDropdownIndex = signal<number | null>(null);

  // Form
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

    // Cerrar dropdown al hacer clic fuera
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
    this.activeDropdownIndex.set(null);
    if (action === 'editar') {
      this.openEditModal(paciente);
    } else if (action === 'deshabilitar' || action === 'habilitar') {
      this.confirmAction.set(action);
      this.selectedPaciente.set(paciente);
      this.showConfirmModal.set(true);
    }
  }

  closeConfirmModal() {
    this.showConfirmModal.set(false);
    this.confirmAction.set(null);
    this.selectedPaciente.set(null);
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
    this.editingPacienteId.set(null);
    this.pacienteForm.reset();
    this.formError.set('');
    this.showCreateModal.set(true);
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
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  onSubmitPaciente() {
    if (this.pacienteForm.invalid) {
      this.pacienteForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.formError.set('');

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
        this.loadPacientes(); // Recargar grilla
      },
      error: (err) => {
        console.error('Error guardando paciente:', err);
        this.isSaving.set(false);
        if (err.error && err.error.mensaje) {
          this.formError.set(err.error.mensaje);
        } else {
          this.formError.set('Ocurrió un error al registrar el paciente.');
        }
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
        if (err.error && err.error.mensaje) {
          this.errorMessage.set(err.error.mensaje);
        } else {
          this.errorMessage.set('No se pudieron cargar los pacientes. Revisa tu conexión al servidor.');
        }
        this.isLoading.set(false);
      }
    });
  }

  getInitials(nombre: string, apellido: string): string {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase() || 'P';
  }
}
