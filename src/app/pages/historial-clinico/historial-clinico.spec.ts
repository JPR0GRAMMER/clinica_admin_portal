import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialClinico } from './historial-clinico';

describe('HistorialClinico', () => {
  let component: HistorialClinico;
  let fixture: ComponentFixture<HistorialClinico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialClinico],
    }).compileComponents();

    fixture = TestBed.createComponent(HistorialClinico);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
