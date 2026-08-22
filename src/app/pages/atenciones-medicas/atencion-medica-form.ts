import { Component, OnInit, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CitaService, CitaResponse } from '../../core/services/cita.service';
import { Cie10Service, Cie10Response } from '../../core/services/cie10.service';
import { AtencionMedicaService, AtencionMedicaRegistroDto } from '../../core/services/atencion-medica.service';
import { MedicamentoService } from '../../core/services/medicamento.service';
import { Medicamento } from '../../core/models/medicamento';
import { extractErrorMessage } from '../../core/utils/api-error.utils';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-atencion-medica-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './atencion-medica-form.html',
  styleUrls: ['./atencion-medica-form.css']
})
export class AtencionMedicaForm implements OnInit {
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  formError = signal<string>('');
  errorTimer: any = null;

  citas = signal<CitaResponse[]>([]);

  incluyeReceta = signal<boolean>(false);
  incluyeProcedimiento = signal<boolean>(false);

  allCie10Results = signal<Cie10Response[]>([]);
  isCie10DropdownOpen = signal<boolean>(false);
  cie10SearchQuery = signal<string>('');
  cie10Results = signal<Cie10Response[]>([]);
  isSearchingCie10 = signal<boolean>(false);
  selectedCie10 = signal<Cie10Response | null>(null);

  medicamentosDisponibles = signal<Medicamento[]>([]);
  medicamentosBusqueda = signal<Medicamento[]>([]);
  isMedicamentoDropdownOpen = signal<boolean[]>([]);
  medicamentoSearchQuery = signal<string[]>([]);
  selectedMedicamentos = signal<(Medicamento | null)[]>([]);

  atencionForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private citaService: CitaService,
    private cie10Service: Cie10Service,
    private atencionService: AtencionMedicaService,
    private medicamentoService: MedicamentoService,
    private router: Router,
    private eRef: ElementRef
  ) {
    this.initForm();
  }

  @HostListener('document:click', ['$event'])
  clickOut(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isCie10DropdownOpen.set(false);
      const drops = this.isMedicamentoDropdownOpen().map(() => false);
      this.isMedicamentoDropdownOpen.set(drops);
    }
  }

  initForm() {
    this.atencionForm = this.fb.group({
      citaMedicaId: [null, [Validators.required]],
      motivoConsulta: ['', [Validators.required]],
      diagnostico: ['', [Validators.required, Validators.maxLength(255)]],
      codigoCie10: ['', [Validators.required]],
      receta: this.fb.group({
        indicacionesGenerales: ['', [Validators.required]],
        detalles: this.fb.array([])
      }),
      procedimiento: this.fb.group({
        descripcionProcedimiento: ['', [Validators.required]],
        resultado: ['', [Validators.required]]
      })
    });

    this.atencionForm.get('receta')?.disable();
    this.atencionForm.get('procedimiento')?.disable();
  }

  get detallesReceta(): FormArray {
    return this.atencionForm.get('receta.detalles') as FormArray;
  }

  ngOnInit() {
    this.citaService.listarCitas().subscribe({
      next: (data) => {
        const pendientes = data.filter(c =>
          c.estadoCita === 'Confirmada' || c.estadoCita === 'Reprogramada'
        );
        this.citas.set(pendientes);
      },
      error: () => {}
    });

    this.medicamentoService.buscarMedicamentos().subscribe({
      next: (data) => {
        this.medicamentosDisponibles.set(data);
        this.medicamentosBusqueda.set(data.slice(0, 50));
      },
      error: () => {}
    });

    this.isSearchingCie10.set(true);
    this.cie10Service.listarTodos().subscribe({
      next: (data) => {
        this.allCie10Results.set(data);
        this.cie10Results.set(data.slice(0, 100));
        this.isSearchingCie10.set(false);
        this.isLoading.set(false);
      },
      error: () => {
        this.isSearchingCie10.set(false);
        this.isLoading.set(false);
      }
    });
  }

  showError(msg: string) {
    if (this.errorTimer) clearTimeout(this.errorTimer);
    this.formError.set(msg);
    if (msg) {
      this.errorTimer = setTimeout(() => this.formError.set(''), environment.errorTimeoutMs);
    }
  }

  toggleReceta() {
    const val = !this.incluyeReceta();
    this.incluyeReceta.set(val);
    if (val) {
      this.atencionForm.get('receta')?.enable();
      if (this.detallesReceta.length === 0) {
        this.addMedicamento();
      }
    } else {
      this.atencionForm.get('receta')?.disable();
    }
  }

  toggleProcedimiento() {
    const val = !this.incluyeProcedimiento();
    this.incluyeProcedimiento.set(val);
    if (val) {
      this.atencionForm.get('procedimiento')?.enable();
    } else {
      this.atencionForm.get('procedimiento')?.disable();
    }
  }

  addMedicamento() {
    const detalleForm = this.fb.group({
      medicamentoId: [null, [Validators.required]],
      dosis: ['', [Validators.required]],
      frecuencia: ['', [Validators.required]],
      duracionTratamiento: ['', [Validators.required]],
      cantidadPrescrita: ['', [Validators.required, Validators.min(1)]]
    });
    this.detallesReceta.push(detalleForm);

    this.isMedicamentoDropdownOpen.update(v => [...v, false]);
    this.medicamentoSearchQuery.update(v => [...v, '']);
    this.selectedMedicamentos.update(v => [...v, null]);
  }

  removeMedicamento(index: number) {
    this.detallesReceta.removeAt(index);
    this.isMedicamentoDropdownOpen.update(v => { const n = [...v]; n.splice(index, 1); return n; });
    this.medicamentoSearchQuery.update(v => { const n = [...v]; n.splice(index, 1); return n; });
    this.selectedMedicamentos.update(v => { const n = [...v]; n.splice(index, 1); return n; });
  }

  toggleCie10Dropdown() {
    this.isCie10DropdownOpen.set(!this.isCie10DropdownOpen());
    if (this.isCie10DropdownOpen() && this.cie10SearchQuery().trim() === '') {
      this.cie10Results.set(this.allCie10Results().slice(0, 100));
    }
  }

  onSearchCie10(event: Event) {
    const input = event.target as HTMLInputElement;
    const term = input.value.toLowerCase().trim();
    this.cie10SearchQuery.set(term);

    if (term === '') {
      this.cie10Results.set(this.allCie10Results().slice(0, 100));
    } else {
      const filtrados = this.allCie10Results().filter(c =>
        c.codigo.toLowerCase().includes(term) ||
        c.descripcion.toLowerCase().includes(term)
      ).slice(0, 100);
      this.cie10Results.set(filtrados);
    }
  }

  selectCie10(item: Cie10Response) {
    this.selectedCie10.set(item);
    this.atencionForm.patchValue({ codigoCie10: item.codigo });
    this.atencionForm.get('codigoCie10')?.markAsTouched();
    this.isCie10DropdownOpen.set(false);
  }

  toggleMedicamentoDropdown(index: number, event: Event) {
    event.stopPropagation();
    const current = this.isMedicamentoDropdownOpen()[index];
    const n = this.isMedicamentoDropdownOpen().map(() => false);
    n[index] = !current;
    this.isMedicamentoDropdownOpen.set(n);
  }

  onSearchMedicamento(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const term = input.value.toLowerCase().trim();

    this.medicamentoSearchQuery.update(v => { const n = [...v]; n[index] = term; return n; });

    if (term === '') {
      this.medicamentosBusqueda.set(this.medicamentosDisponibles().slice(0, 50));
    } else {
      const filtrados = this.medicamentosDisponibles().filter(m =>
        m.nombreComercial.toLowerCase().includes(term) ||
        m.principioActivo.toLowerCase().includes(term) ||
        m.codigo.toLowerCase().includes(term)
      ).slice(0, 50);
      this.medicamentosBusqueda.set(filtrados);
    }
  }

  selectMedicamento(index: number, item: Medicamento) {
    this.selectedMedicamentos.update(v => { const n = [...v]; n[index] = item; return n; });

    const control = this.detallesReceta.at(index);
    control.patchValue({ medicamentoId: item.id });
    control.get('medicamentoId')?.markAsTouched();

    const n = [...this.isMedicamentoDropdownOpen()];
    n[index] = false;
    this.isMedicamentoDropdownOpen.set(n);
  }

  onSubmit() {
    if (this.atencionForm.invalid) {
      this.atencionForm.markAllAsTouched();
      this.showError('Por favor, completa todos los campos correctamente.');
      return;
    }

    this.isSaving.set(true);
    this.formError.set('');
    if (this.errorTimer) clearTimeout(this.errorTimer);

    const formValue = this.atencionForm.value;
    const requestData: AtencionMedicaRegistroDto = {
      citaMedicaId: Number(formValue.citaMedicaId),
      motivoConsulta: formValue.motivoConsulta!,
      diagnostico: formValue.diagnostico!,
      codigoCie10: formValue.codigoCie10!
    };

    if (this.incluyeReceta()) {
      requestData.receta = {
        indicacionesGenerales: formValue.receta.indicacionesGenerales,
        detalles: formValue.receta.detalles.map((d: any) => ({
          medicamentoId: Number(d.medicamentoId),
          dosis: d.dosis,
          frecuencia: d.frecuencia,
          duracionTratamiento: d.duracionTratamiento,
          cantidadPrescrita: Number(d.cantidadPrescrita)
        }))
      };
    }

    if (this.incluyeProcedimiento()) {
      requestData.procedimiento = {
        descripcionProcedimiento: formValue.procedimiento.descripcionProcedimiento,
        resultado: formValue.procedimiento.resultado
      };
    }

    this.atencionService.registrarAtencion(requestData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/atenciones']);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.showError(extractErrorMessage(err, 'Error al registrar la atención médica.'));
      }
    });
  }
}

