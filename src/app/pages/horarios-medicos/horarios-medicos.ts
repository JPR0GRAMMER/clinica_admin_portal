import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HorarioMedicoRequest, HorarioMedicoResponse, HorarioMedicoService } from '../../core/services/horario-medico.service';
import { MedicoResponse, MedicoService } from '../../core/services/medico.service';
import { extractErrorMessage } from '../../core/utils/api-error.utils';

const DIAS_SEMANA = [
  { id: 1, nombre: 'Lunes' },
  { id: 2, nombre: 'Martes' },
  { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves' },
  { id: 5, nombre: 'Viernes' },
  { id: 6, nombre: 'Sábado' },
  { id: 7, nombre: 'Domingo' }
];

@Component({
  selector: 'app-horarios-medicos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './horarios-medicos.html',
  styleUrl: './horarios-medicos.css'
})
export class HorariosMedicos implements OnInit {
  readonly diasSemana = DIAS_SEMANA;
  horarios = signal<HorarioMedicoResponse[]>([]);
  medicos = signal<MedicoResponse[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal('');
  formError = signal('');
  showFormModal = signal(false);
  showDeleteModal = signal(false);
  editingHorario = signal<HorarioMedicoResponse | null>(null);
  selectedHorario = signal<HorarioMedicoResponse | null>(null);
  selectedMedicoFilter = signal<number | null>(null);
  selectedDiaFilter = signal<number | null>(null);

  horarioForm = new FormGroup({
    medicoId: new FormControl<number | null>(null, Validators.required),
    diaSemana: new FormControl<number | null>(null, Validators.required),
    horaInicio: new FormControl('', Validators.required),
    horaFin: new FormControl('', Validators.required)
  });

  constructor(
    private horarioService: HorarioMedicoService,
    private medicoService: MedicoService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.medicoService.listarMedicos().subscribe({
      next: medicos => {
        this.medicos.set(medicos);
        this.loadHorarios();
      },
      error: err => this.handleLoadError(err)
    });
  }

  loadHorarios(): void {
    this.horarioService.listarTodos().subscribe({
      next: horarios => {
        this.horarios.set(horarios);
        this.isLoading.set(false);
      },
      error: err => this.handleLoadError(err)
    });
  }

  private handleLoadError(err: unknown): void {
    this.errorMessage.set(extractErrorMessage(err, 'No se pudieron cargar los horarios médicos.'));
    this.isLoading.set(false);
  }

  get horariosFiltrados(): HorarioMedicoResponse[] {
    return this.horarios().filter(horario =>
      (this.selectedMedicoFilter() === null || horario.medicoId === this.selectedMedicoFilter()) &&
      (this.selectedDiaFilter() === null || horario.diaSemana === this.selectedDiaFilter())
    );
  }

  onMedicoFilter(value: string): void {
    this.selectedMedicoFilter.set(value ? Number(value) : null);
  }

  onDiaFilter(value: string): void {
    this.selectedDiaFilter.set(value ? Number(value) : null);
  }

  openCreateModal(): void {
    this.editingHorario.set(null);
    this.formError.set('');
    this.horarioForm.reset();
    this.showFormModal.set(true);
  }

  openEditModal(horario: HorarioMedicoResponse): void {
    this.editingHorario.set(horario);
    this.formError.set('');
    this.horarioForm.setValue({
      medicoId: horario.medicoId,
      diaSemana: horario.diaSemana,
      horaInicio: this.toInputTime(horario.horaInicio),
      horaFin: this.toInputTime(horario.horaFin)
    });
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
  }

  openDeleteModal(horario: HorarioMedicoResponse): void {
    this.selectedHorario.set(horario);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedHorario.set(null);
  }

  saveHorario(): void {
    if (this.horarioForm.invalid) {
      this.horarioForm.markAllAsTouched();
      return;
    }

    const value = this.horarioForm.getRawValue();
    if (value.horaInicio! >= value.horaFin!) {
      this.formError.set('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const request: HorarioMedicoRequest = {
      medicoId: Number(value.medicoId),
      diaSemana: Number(value.diaSemana),
      horaInicio: value.horaInicio!,
      horaFin: value.horaFin!
    };
    const editing = this.editingHorario();
    const request$ = editing
      ? this.horarioService.actualizar(editing.id, request)
      : this.horarioService.crear(request);

    this.isSaving.set(true);
    this.formError.set('');
    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeFormModal();
        this.loadHorarios();
      },
      error: err => {
        this.isSaving.set(false);
        this.formError.set(extractErrorMessage(err, 'No se pudo guardar el horario médico.'));
      }
    });
  }

  deleteHorario(): void {
    const horario = this.selectedHorario();
    if (!horario) return;

    this.isSaving.set(true);
    this.horarioService.eliminar(horario.id).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeDeleteModal();
        this.loadHorarios();
      },
      error: err => {
        this.isSaving.set(false);
        this.closeDeleteModal();
        this.errorMessage.set(extractErrorMessage(err, 'No se pudo eliminar el horario médico.'));
      }
    });
  }

  getDiaNombre(dia: number): string {
    return this.diasSemana.find(item => item.id === dia)?.nombre ?? 'Sin día';
  }

  getMedicoNombre(medico: MedicoResponse): string {
    return `Dr./Dra. ${medico.nombre} ${medico.apellido}`;
  }

  formatTime(time: string): string {
    return this.toInputTime(time);
  }

  private toInputTime(time: string): string {
    return time?.slice(0, 5) ?? '';
  }
}
