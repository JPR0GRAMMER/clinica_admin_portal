import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Rol {
  id: number;
  nombre: string;
}

export interface Especialidad {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}/roles`);
  }

  getEspecialidades(): Observable<Especialidad[]> {
    return this.http.get<Especialidad[]>(`${this.apiUrl}/especialidades`);
  }
}
