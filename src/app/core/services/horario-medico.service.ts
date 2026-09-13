import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HorarioMedicoResponse {
  id: number;
  medicoId: number;
  medicoNombreCompleto: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

export interface HorarioMedicoRequest {
  medicoId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

@Injectable({
  providedIn: 'root'
})
export class HorarioMedicoService {
  private apiUrl = `${environment.apiUrl}/horarios-medicos`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<HorarioMedicoResponse[]> {
    return this.http.get<HorarioMedicoResponse[]>(this.apiUrl);
  }

  crear(horario: HorarioMedicoRequest): Observable<HorarioMedicoResponse> {
    return this.http.post<HorarioMedicoResponse>(this.apiUrl, horario);
  }

  actualizar(id: number, horario: HorarioMedicoRequest): Observable<HorarioMedicoResponse> {
    return this.http.put<HorarioMedicoResponse>(`${this.apiUrl}/${id}`, horario);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarPorMedico(medicoId: number): Observable<HorarioMedicoResponse[]> {
    return this.http.get<HorarioMedicoResponse[]>(`${this.apiUrl}/medico/${medicoId}`);
  }

  listarPorEspecialidad(especialidadId: number): Observable<HorarioMedicoResponse[]> {
    return this.http.get<HorarioMedicoResponse[]>(`${this.apiUrl}/especialidad/${especialidadId}`);
  }
}
