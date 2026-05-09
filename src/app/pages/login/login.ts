import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      
      this.isLoading.set(true);
      this.errorMessage.set('');
      
      // Simulate API call with hardcoded credentials
      setTimeout(() => {
        this.isLoading.set(false);
        
        if (email === 'admin@clinica.com' && password === 'admin123') {
          console.log('Login successful');
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set('Credenciales incorrectas. Intenta con admin@clinica.com / admin123');
        }
      }, 1200);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
