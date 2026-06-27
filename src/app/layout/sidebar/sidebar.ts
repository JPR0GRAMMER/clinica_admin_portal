import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, Vista } from '../../core/services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar implements OnInit {
  vistas: (Vista & { safeIcono?: SafeHtml })[] = [];

  constructor(private authService: AuthService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    const rawVistas = this.authService.getVistas();
    this.vistas = rawVistas.map(v => ({
      ...v,
      safeIcono: this.sanitizer.bypassSecurityTrustHtml(v.icono)
    }));
  }
}
