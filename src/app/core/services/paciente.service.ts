import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PacienteResponse {
  id: number;
  documentoIdentidad: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  estado: number;
}

export interface PacienteRequest {
  documentoIdentidad: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
}

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private apiUrl = `${environment.apiUrl}/pacientes`;

  constructor(private http: HttpClient) {}

  listarPacientes(): Observable<PacienteResponse[]> {
    return this.http.get<PacienteResponse[]>(this.apiUrl);
  }

  crearPaciente(paciente: PacienteRequest): Observable<PacienteResponse> {
    return this.http.post<PacienteResponse>(this.apiUrl, paciente);
  }

  actualizarPaciente(id: number, paciente: PacienteRequest): Observable<PacienteResponse> {
    return this.http.put<PacienteResponse>(`${this.apiUrl}/${id}`, paciente);
  }

  deshabilitarPaciente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  habilitarPaciente(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/activar`, {});
  }
}
