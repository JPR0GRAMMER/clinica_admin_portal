import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HorarioMedicoResponse {
  id: number;
  medicoId: number;
  medicoNombreCompleto: string;
  diaSemana: number; // 1 = Lunes, 7 = Domingo (en Java LocalDate)
  horaInicio: string; // Formato HH:mm:ss
  horaFin: string; // Formato HH:mm:ss
}

@Injectable({
  providedIn: 'root'
})
export class HorarioMedicoService {
  private apiUrl = `${environment.apiUrl}/horarios-medicos`;

  constructor(private http: HttpClient) {}

  listarPorMedico(medicoId: number): Observable<HorarioMedicoResponse[]> {
    return this.http.get<HorarioMedicoResponse[]>(`${this.apiUrl}/medico/${medicoId}`);
  }

  listarPorEspecialidad(especialidadId: number): Observable<HorarioMedicoResponse[]> {
    return this.http.get<HorarioMedicoResponse[]>(`${this.apiUrl}/especialidad/${especialidadId}`);
  }
}
