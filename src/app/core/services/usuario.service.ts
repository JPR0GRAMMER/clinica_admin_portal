import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DetallesMedico {
  numeroColegiatura: string;
  especialidadNombre: string;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rolNombre: string;
  estado: number;
  detallesMedico?: DetallesMedico;
}

export interface DetallesMedicoRegistro {
  numeroColegiatura: string;
  especialidadId: number;
}

export interface UsuarioRegistroDto {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  rolId: number;
  detallesMedico?: DetallesMedicoRegistro | null;
}

export interface UsuarioActualizarDto {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena?: string;
  detallesMedico?: DetallesMedicoRegistro | null;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listarUsuarios(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.apiUrl);
  }

  registrarUsuario(dto: UsuarioRegistroDto): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.apiUrl, dto);
  }

  actualizarUsuario(id: number, dto: UsuarioActualizarDto): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.apiUrl}/${id}`, dto);
  }

  deshabilitarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  habilitarUsuario(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/activar`, {});
  }
}
