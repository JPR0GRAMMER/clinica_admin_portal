import { Component, HostListener, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  isProfileMenuOpen = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.isProfileMenuOpen.update(v => !v);
  }

  @HostListener('document:click')
  closeProfileMenu() {
    this.isProfileMenuOpen.set(false);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
