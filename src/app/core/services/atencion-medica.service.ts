import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Cie10Dto {
  codigo: string;
  descripcion: string;
}

export interface AtencionMedicaRegistroDto {
  citaMedicaId: number;
  motivoConsulta: string;
  diagnostico: string;
  codigoCie10: string;
  receta?: RecetaMedicaDto;
  procedimiento?: ProcedimientoMedicoDto;
}

export interface DetalleRecetaDto {
  medicamentoId: number;
  dosis: string;
  frecuencia: string;
  duracionTratamiento: string;
  cantidadPrescrita: number;
}

export interface RecetaMedicaDto {
  indicacionesGenerales: string;
  detalles: DetalleRecetaDto[];
}

export interface ProcedimientoMedicoDto {
  descripcionProcedimiento: string;
  resultado: string;
}

export interface DetalleRecetaResponseDto {
  medicamentoNombre: string;
  medicamentoPrincipioActivo: string;
  dosis: string;
  frecuencia: string;
  duracionTratamiento: string;
  cantidadPrescrita: number;
}

export interface RecetaResponseDto {
  indicacionesGenerales: string;
  detalles: DetalleRecetaResponseDto[];
}

export interface ProcedimientoResponseDto {
  descripcionProcedimiento: string;
  resultado: string;
}

export interface AtencionMedicaResponseDto {
  id: number;
  citaMedicaId: number;
  pacienteNombreCompleto: string;
  pacienteDocumento: string;
  medicoNombreCompleto: string;
  medicoColegiatura: string;
  motivoConsulta: string;
  diagnostico: string;
  cie10: Cie10Dto;
  fechaAtencion: string;
  recetas?: RecetaResponseDto[];
  procedimientos?: ProcedimientoResponseDto[];
}

@Injectable({
  providedIn: 'root'
})
export class AtencionMedicaService {
  private apiUrl = `${environment.apiUrl}/atenciones`;

  constructor(private http: HttpClient) { }

  registrarAtencion(data: AtencionMedicaRegistroDto): Observable<AtencionMedicaResponseDto> {
    return this.http.post<AtencionMedicaResponseDto>(this.apiUrl, data);
  }

  listarMisAtenciones(): Observable<AtencionMedicaResponseDto[]> {
    return this.http.get<AtencionMedicaResponseDto[]>(this.apiUrl);
  }

  obtenerAtencion(id: number): Observable<AtencionMedicaResponseDto> {
    return this.http.get<AtencionMedicaResponseDto>(`${this.apiUrl}/${id}`);
  }
}
