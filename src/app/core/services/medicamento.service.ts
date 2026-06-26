import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Medicamento } from '../models/medicamento';

@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/medicamentos`;

  buscarMedicamentos(termino?: string): Observable<Medicamento[]> {
    let params = new HttpParams();
    if (termino && termino.trim() !== '') {
      params = params.set('busqueda', termino);
    }
    return this.http.get<Medicamento[]>(this.apiUrl, { params });
  }
}
