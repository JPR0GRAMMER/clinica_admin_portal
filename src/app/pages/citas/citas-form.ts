import { Component, OnInit, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CitaService, CitaResponse } from '../../core/services/cita.service';
import { PacienteService, PacienteResponse } from '../../core/services/paciente.service';
import { EspecialidadService, EspecialidadResponse } from '../../core/services/especialidad.service';
import { HorarioMedicoService, HorarioMedicoResponse } from '../../core/services/horario-medico.service';
import { MedicoService } from '../../core/services/medico.service';
import { extractErrorMessage } from '../../core/utils/api-error.utils';

export interface DoctorBlock {
  medicoId: number;
  medicoNombre: string;
  bloques: { hora: string; ocupado: boolean }[];
}

@Component({
  selector: 'app-citas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './citas-form.html',
  styleUrls: ['./citas-form.css']
})
export class CitasForm implements OnInit {
  pacientes = signal<PacienteResponse[]>([]);
  especialidades = signal<EspecialidadResponse[]>([]);
  horariosMedico = signal<HorarioMedicoResponse[]>([]);
  
  // Data for the visual grid
  doctorBlocks = signal<DoctorBlock[]>([]);
  
  isLoading = signal<boolean>(true);
  isFetchingHorarios = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  formError = signal<string>('');
  
  // Custom Select State
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
  
  // Para bloquear fechas anteriores a hoy
  minDate = signal<string>('');
  
  citaId = signal<number | null>(null);
  citasOcupadasDelDia = signal<CitaResponse[]>([]); // Para validar ocupación sin cargar todas las citas

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
  clickOut(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isPacienteDropdownOpen.set(false);
    }
  }

  ngOnInit() {
    // Configurar minDate para no permitir seleccionar fechas anteriores a hoy en el HTML
    const today = new Date();
    // Ajuste a la zona horaria local para evitar problemas con UTC
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    this.minDate.set(localToday.toISOString().split('T')[0]);

    this.loadInitialData();

    // Comprobar si estamos en modo edición
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.citaId.set(Number(id));
        this.loadCitaToEdit(Number(id));
      } else {
        this.isLoading.set(false);
      }
    });

    // Reactividad: Si cambia la especialidad
    this.citaForm.get('especialidadId')?.valueChanges.subscribe(especialidadId => {
      if (!this.isLoading()) {
        this.citaForm.patchValue({ medicoId: null, horaCita: '' }, { emitEvent: false });
      }
      this.doctorBlocks.set([]);
      
      if (especialidadId) {
        this.isFetchingHorarios.set(true);
        this.horarioMedicoService.listarPorEspecialidad(Number(especialidadId)).subscribe({
          next: (horarios) => {
            this.horariosMedico.set(horarios);
            this.calculateDoctorBlocks();
          },
          error: () => this.isFetchingHorarios.set(false)
        });
      } else {
        this.horariosMedico.set([]);
      }
    });

    // Reactividad: Si cambia la fecha
    this.citaForm.get('fechaCita')?.valueChanges.subscribe(() => {
      if (!this.isLoading()) {
        this.citaForm.patchValue({ medicoId: null, horaCita: '' }, { emitEvent: false });
      }
      this.isFetchingHorarios.set(true);
      this.calculateDoctorBlocks();
    });
  }

  loadInitialData() {
    this.pacienteService.listarPacientes().subscribe({
      next: (data) => {
        this.pacientes.set(data.filter(p => p.estado === 1));
      }
    });

    this.especialidadService.listarEspecialidades().subscribe({
      next: (data) => this.especialidades.set(data)
    });
  }

  loadCitaToEdit(id: number) {
    this.isLoading.set(true);
    // Para simplificar, listamos todas las citas y buscamos la nuestra, 
    // idealmente habría un endpoint GET /api/citas/{id}
    this.citaService.listarCitas().subscribe({
      next: (citas) => {
        const cita = citas.find(c => c.id === id);
        if (cita) {
          // Buscamos la especialidad
          this.medicoService.listarMedicos().subscribe({
            next: (medicos) => {
              const medico = medicos.find(m => m.id === cita.medicoId);
              const especialidadObj = this.especialidades().find(e => e.nombre === medico?.especialidad);
              
              if (especialidadObj) {
                // Prevenimos que valueChanges borre la hora
                this.citaForm.patchValue({
                  pacienteId: cita.pacienteId,
                  especialidadId: especialidadObj.id,
                  fechaCita: cita.fechaCita,
                  medicoId: cita.medicoId,
                  horaCita: cita.horaCita.substring(0, 5)
                });
              }
              this.isLoading.set(false);
            }
          });
        } else {
          this.router.navigate(['/citas']);
        }
      },
      error: () => this.router.navigate(['/citas'])
    });
  }

  calculateDoctorBlocks() {
    const especialidadId = this.citaForm.get('especialidadId')?.value;
    const fecha = this.citaForm.get('fechaCita')?.value;

    if (!especialidadId || !fecha) {
      this.doctorBlocks.set([]);
      return;
    }

    // Calcular día de la semana (Lunes=1, Domingo=7)
    const dateObj = new Date(fecha);
    if (isNaN(dateObj.getTime())) {
      this.isFetchingHorarios.set(false);
      return;
    }
    
    let diaSemana = dateObj.getUTCDay();
    if (diaSemana === 0) diaSemana = 7;

    // Filtrar los horarios
    const horariosDelDia = this.horariosMedico().filter(h => h.diaSemana === diaSemana);
    
    if (horariosDelDia.length === 0) {
      this.doctorBlocks.set([]);
      this.isFetchingHorarios.set(false);
      return;
    }

    // Para evitar falsos positivos con otras citas, necesitamos cargar las citas del día.
    this.citaService.listarCitas().subscribe({
      next: (citas) => {
        const newBlocks: DoctorBlock[] = [];
        
        // Determinar si la fecha seleccionada es hoy para filtrar horas pasadas
        const now = new Date();
        const selectedDateStr = fecha;
        const offset = now.getTimezoneOffset();
        const localNow = new Date(now.getTime() - (offset * 60 * 1000));
        const isToday = selectedDateStr === localNow.toISOString().split('T')[0];
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentDecimalHour = currentHour + (currentMinutes / 60);

        for (const horario of horariosDelDia) {
          const startHour = parseInt(horario.horaInicio.split(':')[0], 10);
          const endHour = parseInt(horario.horaFin.split(':')[0], 10);

          const citasOcupadas = citas.filter(c => 
            c.medicoId === horario.medicoId && 
            c.fechaCita === fecha && 
            c.estadoCita !== 'Cancelada' &&
            c.estadoCita !== 'No Asistió' &&
            c.id !== this.citaId()
          );

          const horasOcupadas = citasOcupadas.map(c => c.horaCita.substring(0, 5));
          const bloques = [];

          for (let i = startHour; i < endHour; i++) {
            // Si la fecha es hoy, y la hora del bloque ya pasó (o está pasando), no se agrega
            if (isToday && i <= currentDecimalHour) {
              continue;
            }

            const horaStr = i.toString().padStart(2, '0') + ':00';
            const isOccupied = horasOcupadas.includes(horaStr);
            bloques.push({ hora: horaStr, ocupado: isOccupied });
          }

          // Solo agregamos al doctor si le quedan bloques disponibles
          if (bloques.length > 0) {
            newBlocks.push({
              medicoId: horario.medicoId,
              medicoNombre: horario.medicoNombreCompleto,
              bloques: bloques
            });
          }
        }
        this.doctorBlocks.set(newBlocks);
        this.isFetchingHorarios.set(false);
      },
      error: () => this.isFetchingHorarios.set(false)
    });
  }

  selectSlot(medicoId: number, horaStr: string, isOccupied: boolean) {
    if (isOccupied) return;
    this.citaForm.patchValue({
      medicoId: medicoId,
      horaCita: horaStr
    });
  }

  togglePacienteDropdown() {
    this.isPacienteDropdownOpen.set(!this.isPacienteDropdownOpen());
  }

  selectPaciente(id: number) {
    this.citaForm.patchValue({ pacienteId: id });
    this.citaForm.get('pacienteId')?.markAsTouched();
    this.isPacienteDropdownOpen.set(false);
    this.pacienteSearchQuery.set('');
  }

  onSearchPaciente(event: Event) {
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

  onSubmit() {
    if (this.citaForm.invalid) {
      this.citaForm.markAllAsTouched();
      this.formError.set('Por favor, completa todos los campos y selecciona un horario.');
      return;
    }

    this.isSaving.set(true);
    this.formError.set('');

    const formValue = this.citaForm.value;
    const requestData = {
      pacienteId: Number(formValue.pacienteId),
      medicoId: Number(formValue.medicoId),
      fechaCita: formValue.fechaCita!,
      horaCita: formValue.horaCita!
    };

    if (this.citaId()) {
      this.citaService.reprogramarCita(this.citaId()!, requestData).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.router.navigate(['/citas']);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.formError.set(extractErrorMessage(err, 'Error al reprogramar la cita.'));
        }
      });
    } else {
      this.citaService.agendarCita(requestData).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.router.navigate(['/citas']);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.formError.set(extractErrorMessage(err, 'Error al agendar la cita.'));
        }
      });
    }
  }
}
