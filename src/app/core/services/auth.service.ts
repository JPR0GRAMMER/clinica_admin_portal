import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface Vista {
  nombre: string;
  ruta: string;
  icono: string;
}

export interface AuthResponse {
  token: string;
  rol: string;
  vistas: Vista[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly VISTAS_KEY = 'auth_vistas';
  private readonly ROL_KEY = 'auth_rol';

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
          localStorage.setItem(this.VISTAS_KEY, JSON.stringify(response.vistas || []));
          localStorage.setItem(this.ROL_KEY, response.rol || '');
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.VISTAS_KEY);
    localStorage.removeItem(this.ROL_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getVistas(): Vista[] {
    const vistas = localStorage.getItem(this.VISTAS_KEY);
    return vistas ? JSON.parse(vistas) : [];
  }

  getRol(): string {
    return localStorage.getItem(this.ROL_KEY) || '';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUserEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payloadBase64Url = token.split('.')[1];
      const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(payloadBase64));
      return payload.sub; // Asumiendo que el Subject del JWT es el correo
    } catch (e) {
      return null;
    }
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
}
