import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    rememberMe: new FormControl(false)
  });

  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      
      this.isLoading.set(true);
      this.errorMessage.set('');
      
      this.authService.login({ correo: email!, contrasena: password! }).subscribe({
        next: () => {
          this.isLoading.set(false);
          const vistas = this.authService.getVistas();
          if (vistas && vistas.length > 0) {
            this.router.navigate([vistas[0].ruta]);
          } else {
            this.errorMessage.set('El usuario no tiene vistas asignadas.');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          if (err.name === 'TimeoutError') {
            this.errorMessage.set('El servidor tardó demasiado en responder. Revisa tu conexión.');
          } else if (err.status === 401 || err.status === 403) {
            this.errorMessage.set('Credenciales incorrectas. Verifica tu correo y contraseña.');
          } else {
            this.errorMessage.set('Ocurrió un error al intentar iniciar sesión. Inténtalo más tarde.');
          }
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}