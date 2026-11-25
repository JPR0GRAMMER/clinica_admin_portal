import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';
import { afterEach, vi } from 'vitest';
import { HomeComponent } from './home';

describe('Home', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
