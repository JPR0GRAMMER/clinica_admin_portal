import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EspecialidadResponse {
  id: number;
  nombre: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class EspecialidadService {
  private apiUrl = `${environment.apiUrl}/especialidades`;

  constructor(private http: HttpClient) {}

  listarEspecialidades(): Observable<EspecialidadResponse[]> {
    return this.http.get<EspecialidadResponse[]>(this.apiUrl);
  }
}
