import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoCita } from '../models/estado-cita';

export interface CitaResponse {
  id: number;
  pacienteId: number;
  pacienteNombreCompleto: string;
  pacienteDni: string;
  medicoId: number;
  medicoNombreCompleto: string;
  medicoEspecialidad: string;
  fechaCita: string;
  horaCita: string;
  estadoCita: EstadoCita;
}

export interface CitaRequest {
  pacienteId: number;
  medicoId: number;
  fechaCita: string;
  horaCita: string;
}

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrl = `${environment.apiUrl}/citas`;

  constructor(private http: HttpClient) {}

  agendarCita(cita: CitaRequest): Observable<CitaResponse> {
    return this.http.post<CitaResponse>(this.apiUrl, cita);
  }

  listarCitas(): Observable<CitaResponse[]> {
    return this.http.get<CitaResponse[]>(this.apiUrl);
  }

  obtenerCita(id: number): Observable<CitaResponse> {
    return this.http.get<CitaResponse>(`${this.apiUrl}/${id}`);
  }

  reprogramarCita(id: number, cita: CitaRequest): Observable<CitaResponse> {
    return this.http.put<CitaResponse>(`${this.apiUrl}/${id}`, cita);
  }

  cambiarEstado(id: number, estado: EstadoCita): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/estado?estado=${encodeURIComponent(estado)}`, {});
  }
}
