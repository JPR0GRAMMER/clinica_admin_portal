import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CitaResponse, CitaService } from '../../core/services/cita.service';
import { EstadoCita } from '../../core/models/estado-cita';
import { EspecialidadService } from '../../core/services/especialidad.service';
import { HorarioMedicoService } from '../../core/services/horario-medico.service';
import { MedicoService } from '../../core/services/medico.service';
import { PacienteService } from '../../core/services/paciente.service';
import { CitasForm } from './citas-form';

describe('Grilla y formulario de citas', () => {
  const fecha = '2099-01-05';
  const turno = {
    id: 1, medicoId: 10, medicoNombreCompleto: 'Médico de prueba',
    diaSemana: new Date(fecha).getUTCDay() || 7, horaInicio: '08:00:00', horaFin: '13:00:00'
  };
  const listarHorarios = vi.fn();
  const listarCitas = vi.fn();
  const agendar = vi.fn();

  beforeEach(() => {
    listarHorarios.mockReset().mockReturnValue(of([turno]));
    listarCitas.mockReset().mockReturnValue(of([]));
    agendar.mockReset().mockReturnValue(new Subject<CitaResponse>());
    TestBed.configureTestingModule({
      imports: [CitasForm],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
        { provide: CitaService, useValue: { listarCitas, agendarCita: agendar } },
        { provide: HorarioMedicoService, useValue: { listarPorEspecialidad: listarHorarios } },
        { provide: PacienteService, useValue: { listarPacientes: () => of([]) } },
        { provide: EspecialidadService, useValue: { listarEspecialidades: () => of([]) } },
        { provide: MedicoService, useValue: {} }
      ]
    });
  });

  function formulario() {
    const fixture = TestBed.createComponent(CitasForm);
    fixture.detectChanges();
    fixture.componentInstance.citaForm.patchValue({ especialidadId: 1, fechaCita: fecha });
    fixture.detectChanges();
    return fixture;
  }

  function horasVisibles(fixture: ReturnType<typeof formulario>) {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .map(button => button.textContent.trim())
      .filter(text => /^\d{2}:\d{2}$/.test(text));
  }

  it('TC-F-003: ofrece 08:00 y no ofrece 07:00', () => {
    listarHorarios.mockReturnValue(of([{ ...turno, horaInicio: '07:00:00' }]));
    const horas = horasVisibles(formulario());
    expect(horas[0]).toBe('08:00');
    expect(horas).not.toContain('07:00');
  });

  it('TC-F-004: ofrece el último bloque de 12:00 a 13:00', () => {
    expect(horasVisibles(formulario()).at(-1)).toBe('12:00');
  });

  it('TC-F-005: el cierre 13:00 no es un inicio disponible', () => {
    expect(horasVisibles(formulario())).not.toContain('13:00');
  });

  it('regresión: conserva minutos y solo ofrece bloques completos', () => {
    listarHorarios.mockReturnValue(of([{ ...turno, horaInicio: '08:30:00', horaFin: '12:45:00' }]));
    expect(horasVisibles(formulario())).toEqual(['08:30', '09:30', '10:30', '11:30']);
  });

  it('libera el horario de una cita cancelada', () => {
    listarCitas.mockReturnValue(of([{
      id: 3, pacienteId: 1, pacienteNombreCompleto: 'Paciente', pacienteDni: '12345678',
      medicoId: 10, medicoNombreCompleto: 'Médico de prueba', medicoEspecialidad: 'General',
      fechaCita: fecha, horaCita: '09:00:00', estadoCita: EstadoCita.Cancelada
    } satisfies CitaResponse]));
    const bloques = formulario().componentInstance.doctorBlocks()[0].bloques;
    expect(bloques.find(b => b.hora === '09:00')?.ocupado).toBe(false);
  });

  it('TC-F-011: un doble envío pendiente origina una sola petición', () => {
    const fixture = formulario();
    const componente = fixture.componentInstance;
    componente.citaForm.patchValue({ pacienteId: 1, medicoId: 10, horaCita: '08:00' });
    componente.onSubmit();
    componente.onSubmit();
    expect(agendar).toHaveBeenCalledTimes(1);
  });
});
