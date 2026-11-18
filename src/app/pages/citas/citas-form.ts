import { Component, OnInit, OnDestroy, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CitaService, CitaResponse } from '../../core/services/cita.service';
import { PacienteService, PacienteResponse } from '../../core/services/paciente.service';
import { EspecialidadService, EspecialidadResponse } from '../../core/services/especialidad.service';
import { HorarioMedicoService, HorarioMedicoResponse } from '../../core/services/horario-medico.service';
import { MedicoService } from '../../core/services/medico.service';
import { extractErrorMessage } from '../../core/utils/api-error.utils';
import { environment } from '../../../environments/environment';

export interface TimeSlot {
  hora: string;
  ocupado: boolean;
}

export interface DoctorBlock {
  medicoId: number;
  medicoNombre: string;
  bloques: TimeSlot[];
}

@Component({
  selector: 'app-citas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './citas-form.html',
  styleUrls: ['./citas-form.css']
})
export class CitasForm implements OnInit, OnDestroy {
  private static readonly HORA_APERTURA_CLINICA = 8;
  private static readonly ESTADO_CANCELADA = 'Cancelada';
  private static readonly ESTADO_ACTIVO = 1;

  pacientes = signal<PacienteResponse[]>([]);
  especialidades = signal<EspecialidadResponse[]>([]);
  horariosMedico = signal<HorarioMedicoResponse[]>([]);
  doctorBlocks = signal<DoctorBlock[]>([]);

  isLoading = signal<boolean>(true);
  isFetchingHorarios = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  formError = signal<string>('');
  private errorTimer: ReturnType<typeof setTimeout> | null = null;

  isPacienteDropdownOpen = signal<boolean>(false);
  pacienteSearchQuery = signal<string>('');

  filteredPacientes = computed(() => {
    const query = this.pacienteSearchQuery().toLowerCase().trim();
    if (!query) return this.pacientes();

    return this.pacientes().filter(p => {
      const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
      return nombreCompleto.includes(query) || p.documentoIdentidad.includes(query);
    });
  });

  minDate = signal<string>('');
  citaId = signal<number | null>(null);
  citasOcupadasDelDia = signal<CitaResponse[]>([]);

  citaForm = new FormGroup({
    pacienteId: new FormControl<number | null>(null, [Validators.required]),
    especialidadId: new FormControl<number | null>(null, [Validators.required]),
    fechaCita: new FormControl('', [Validators.required]),
    medicoId: new FormControl<number | null>(null, [Validators.required]),
    horaCita: new FormControl('', [Validators.required])
  });

  constructor(
    private citaService: CitaService,
    private pacienteService: PacienteService,
    private especialidadService: EspecialidadService,
    private horarioMedicoService: HorarioMedicoService,
    private medicoService: MedicoService,
    private router: Router,
    private route: ActivatedRoute,
    private eRef: ElementRef
  ) {}

  @HostListener('document:click', ['$event'])
  clickOut(event: Event): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isPacienteDropdownOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.minDate.set(this.getLocalTodayIsoDate());
    this.setupFormListeners();
    this.initializeComponentData();
  }

  ngOnDestroy(): void {
    this.clearErrorTimer();
  }

  private initializeComponentData(): void {
    this.isLoading.set(true);

    forkJoin({
      pacientes: this.pacienteService.listarPacientes(),
      especialidades: this.especialidadService.listarEspecialidades()
    }).subscribe({
      next: ({ pacientes, especialidades }) => {
        this.pacientes.set(pacientes.filter(p => p.estado === CitasForm.ESTADO_ACTIVO));
        this.especialidades.set(especialidades);

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
          const id = Number(idParam);
          this.citaId.set(id);
          this.loadCitaToEdit(id);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.showError('Error al cargar los datos iniciales del formulario.');
      }
    });
  }

  private setupFormListeners(): void {
    this.citaForm.get('especialidadId')?.valueChanges.subscribe(especialidadId => {
      if (!this.isLoading()) {
        this.citaForm.patchValue({ medicoId: null, horaCita: '' }, { emitEvent: false });
      }
      this.doctorBlocks.set([]);

      if (especialidadId) {
        this.fetchHorariosAndCalculateBlocks(Number(especialidadId));
      } else {
        this.horariosMedico.set([]);
      }
    });

    this.citaForm.get('fechaCita')?.valueChanges.subscribe(() => {
      if (!this.isLoading()) {
        this.citaForm.patchValue({ medicoId: null, horaCita: '' }, { emitEvent: false });
      }
      this.calculateDoctorBlocks();
    });
  }

  private fetchHorariosAndCalculateBlocks(especialidadId: number, onComplete?: () => void): void {
    this.isFetchingHorarios.set(true);
    this.horarioMedicoService.listarPorEspecialidad(especialidadId).subscribe({
      next: (horarios) => {
        this.horariosMedico.set(horarios);
        this.calculateDoctorBlocks();
        onComplete?.();
      },
      error: () => {
        this.isFetchingHorarios.set(false);
        onComplete?.();
      }
    });
  }

  private loadCitaToEdit(id: number): void {
    forkJoin({
      citas: this.citaService.listarCitas(),
      medicos: this.medicoService.listarMedicos()
    }).subscribe({
      next: ({ citas, medicos }) => {
        const cita = citas.find(c => c.id === id);
        if (!cita) {
          this.router.navigate(['/citas']);
          return;
        }

        const medico = medicos.find(m => m.id === cita.medicoId);
        const especialidadObj = this.especialidades().find(e => e.nombre === medico?.especialidad);

        if (!especialidadObj) {
          this.isLoading.set(false);
          return;
        }

        this.citaForm.patchValue({
          pacienteId: cita.pacienteId,
          especialidadId: especialidadObj.id,
          fechaCita: cita.fechaCita,
          medicoId: cita.medicoId,
          horaCita: cita.horaCita.substring(0, 5)
        }, { emitEvent: false });

        this.fetchHorariosAndCalculateBlocks(especialidadObj.id, () => {
          this.isLoading.set(false);
        });
      },
      error: () => this.router.navigate(['/citas'])
    });
  }

  calculateDoctorBlocks(): void {
    const especialidadId = this.citaForm.get('especialidadId')?.value;
    const fecha = this.citaForm.get('fechaCita')?.value;

    if (!especialidadId || !fecha) {
      this.doctorBlocks.set([]);
      this.isFetchingHorarios.set(false);
      return;
    }

    const diaSemana = this.extractIsoDayOfWeek(fecha);
    if (!diaSemana) {
      this.doctorBlocks.set([]);
      this.isFetchingHorarios.set(false);
      return;
    }

    const horariosDelDia = this.horariosMedico().filter(h => h.diaSemana === diaSemana);
    if (horariosDelDia.length === 0) {
      this.doctorBlocks.set([]);
      this.isFetchingHorarios.set(false);
      return;
    }

    this.isFetchingHorarios.set(true);
    this.citaService.listarCitas().subscribe({
      next: (citas) => {
        const isToday = fecha === this.getLocalTodayIsoDate();
        const now = new Date();
        const currentDecimalHour = now.getHours() + (now.getMinutes() / 60);

        const blocksByMedico = new Map<number, DoctorBlock>();

        for (const horario of horariosDelDia) {
          const effectiveStartHour = this.getEffectiveStartHour(horario.horaInicio);
          const endHour = this.getEndHour(horario.horaFin);

          const horasOcupadas = new Set(
            citas
              .filter(c =>
                c.medicoId === horario.medicoId &&
                c.fechaCita === fecha &&
                c.estadoCita !== CitasForm.ESTADO_CANCELADA &&
                c.id !== this.citaId()
              )
              .map(c => c.horaCita.substring(0, 5))
          );

          const bloquesTurno: TimeSlot[] = [];

          for (let hour = effectiveStartHour; hour < endHour; hour++) {
            if (isToday && hour <= currentDecimalHour) {
              continue;
            }

            const horaStr = `${hour.toString().padStart(2, '0')}:00`;
            bloquesTurno.push({
              hora: horaStr,
              ocupado: horasOcupadas.has(horaStr)
            });
          }

          if (bloquesTurno.length > 0) {
            const existingDoctor = blocksByMedico.get(horario.medicoId);
            if (existingDoctor) {
              const existingHours = new Set(existingDoctor.bloques.map(b => b.hora));
              for (const slot of bloquesTurno) {
                if (!existingHours.has(slot.hora)) {
                  existingDoctor.bloques.push(slot);
                }
              }
              existingDoctor.bloques.sort((a, b) => a.hora.localeCompare(b.hora));
            } else {
              blocksByMedico.set(horario.medicoId, {
                medicoId: horario.medicoId,
                medicoNombre: horario.medicoNombreCompleto,
                bloques: bloquesTurno
              });
            }
          }
        }

        this.doctorBlocks.set(Array.from(blocksByMedico.values()));
        this.isFetchingHorarios.set(false);
      },
      error: () => this.isFetchingHorarios.set(false)
    });
  }

  /**
   * Calcula la primera hora en punto válida dentro del horario del médico.
   * Si el horario inicia con minutos (ej. 07:30 o 08:30), redondea a la siguiente hora en punto (08:00 o 09:00)
   * y garantiza que ningún turno inicie antes de HORA_APERTURA_CLINICA (08:00).
   */
  private getEffectiveStartHour(horaInicio: string): number {
    const [hours, minutes] = horaInicio.split(':').map(Number);
    const firstFullHour = minutes > 0 ? hours + 1 : hours;
    return Math.max(CitasForm.HORA_APERTURA_CLINICA, firstFullHour);
  }

  private getEndHour(horaFin: string): number {
    const [hours] = horaFin.split(':').map(Number);
    return hours;
  }

  /**
   * Obtiene el día de la semana ISO (1 = Lunes ... 7 = Domingo) sin desfases de zona horaria.
   */
  private extractIsoDayOfWeek(fechaIso: string): number | null {
    const parts = fechaIso.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      return null;
    }
    const [year, month, day] = parts;
    const localDate = new Date(year, month - 1, day);
    if (isNaN(localDate.getTime())) {
      return null;
    }
    const dayOfWeek = localDate.getDay();
    return dayOfWeek === 0 ? 7 : dayOfWeek;
  }

  private getLocalTodayIsoDate(): string {
    const today = new Date();
    const offsetMs = today.getTimezoneOffset() * 60 * 1000;
    return new Date(today.getTime() - offsetMs).toISOString().split('T')[0];
  }

  selectSlot(medicoId: number, horaStr: string, isOccupied: boolean): void {
    if (isOccupied) return;
    this.citaForm.patchValue({
      medicoId,
      horaCita: horaStr
    });
  }

  togglePacienteDropdown(): void {
    this.isPacienteDropdownOpen.update(open => !open);
  }

  selectPaciente(id: number): void {
    this.citaForm.patchValue({ pacienteId: id });
    this.citaForm.get('pacienteId')?.markAsTouched();
    this.isPacienteDropdownOpen.set(false);
    this.pacienteSearchQuery.set('');
  }

  onSearchPaciente(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pacienteSearchQuery.set(input.value);
  }

  getSelectedPacienteName(): string {
    const id = this.citaForm.get('pacienteId')?.value;
    if (!id) return '';
    const paciente = this.pacientes().find(p => p.id === id);
    if (!paciente) return '';
    return `${paciente.nombre} ${paciente.apellido} (DNI: ${paciente.documentoIdentidad})`;
  }

  showError(msg: string): void {
    this.clearErrorTimer();
    this.formError.set(msg);
    if (msg) {
      this.errorTimer = setTimeout(() => this.formError.set(''), environment.errorTimeoutMs);
    }
  }

  private clearErrorTimer(): void {
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
      this.errorTimer = null;
    }
  }

  onSubmit(): void {
    if (this.citaForm.invalid) {
      this.citaForm.markAllAsTouched();
      this.showError('Por favor, completa todos los campos y selecciona un horario.');
      return;
    }

    this.isSaving.set(true);
    this.formError.set('');
    this.clearErrorTimer();

    const formValue = this.citaForm.getRawValue();
    const requestData = {
      pacienteId: Number(formValue.pacienteId),
      medicoId: Number(formValue.medicoId),
      fechaCita: formValue.fechaCita!,
      horaCita: formValue.horaCita!
    };

    const id = this.citaId();
    const request$ = id
      ? this.citaService.reprogramarCita(id, requestData)
      : this.citaService.agendarCita(requestData);

    const defaultErrorMsg = id
      ? 'Error al reprogramar la cita.'
      : 'Error al agendar la cita.';

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/citas']);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.showError(extractErrorMessage(err, defaultErrorMsg));
      }
    });
  }
}