import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';  // ← AGREGAR ESTA LÍNEA

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],  // ← aAGREGAR RouterLink AQUÍ
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit, AfterViewInit {

  ngOnInit(): void {
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      nav?.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = '1';
          (entry.target as HTMLElement).style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.spec-card, .doc-card, .testi-card, .wf-item, .step-item, .ci-item')
      .forEach((el, i) => {
        (el as HTMLElement).style.opacity = '0';
        (el as HTMLElement).style.transform = 'translateY(24px)';
        (el as HTMLElement).style.transition =
          `opacity 0.55s ${i * 0.07}s ease, transform 0.55s ${i * 0.07}s ease`;
        observer.observe(el);
      });

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const href = (a as HTMLAnchorElement).getAttribute('href');
        const target = href ? document.querySelector(href) : null;
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  enviarSolicitud(event: Event): void {
    const btn = event.target as HTMLButtonElement;
    const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (nameInput?.value.trim()) {
      btn.textContent = '✓ Solicitud enviada — te contactaremos pronto';
      btn.style.background = '#16a34a';
      btn.disabled = true;
    } else {
      nameInput?.focus();
    }
  }
}