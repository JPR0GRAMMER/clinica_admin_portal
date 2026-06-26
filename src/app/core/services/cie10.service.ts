import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Cie10Response {
  codigo: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class Cie10Service {
  private apiUrl = `${environment.apiUrl}/cie10`;

  constructor(private http: HttpClient) { }

  listarTodos(): Observable<Cie10Response[]> {
    return this.http.get<Cie10Response[]>(this.apiUrl);
  }
}
