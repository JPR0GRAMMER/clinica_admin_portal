import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MedicoResponse {
  id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  numeroColegiatura: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicoService {
  private apiUrl = `${environment.apiUrl}/medicos`;

  constructor(private http: HttpClient) {}

  listarMedicos(): Observable<MedicoResponse[]> {
    return this.http.get<MedicoResponse[]>(this.apiUrl);
  }
}
