import { Component, OnInit, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { UsuarioService, UsuarioResponse, UsuarioRegistroDto, UsuarioActualizarDto } from '../../core/services/usuario.service';
import { CatalogoService, Rol, Especialidad } from '../../core/services/catalogo.service';
import { AuthService } from '../../core/services/auth.service';
import { extractErrorMessage } from '../../core/utils/api-error.utils';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class Usuarios implements OnInit {
  users = signal<UsuarioResponse[]>([]);
  activeDropdownIndex = signal<number | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // Modal State
  showCreateModal = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  formError = signal<string>('');
  editingUserId = signal<number | null>(null);
  changePasswordMode = signal<'si' | 'no'>('no');
  
  // Catalogs
  roles = signal<Rol[]>([]);
  especialidades = signal<Especialidad[]>([]);

  // Form
  userForm = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    apellido: new FormControl('', [Validators.required]),
    correo: new FormControl('', [Validators.required, Validators.email]),
    contrasena: new FormControl('', [
      Validators.required, 
      Validators.minLength(8), 
      Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/)
    ]),
    rolId: new FormControl<number | null>(null, [Validators.required]),
    numeroColegiatura: new FormControl(''),
    especialidadId: new FormControl<number | null>(null)
  });

  constructor(
    private usuarioService: UsuarioService,
    private catalogoService: CatalogoService,
    private authService: AuthService
  ) {
    // Dynamic validation for Medico role
    this.userForm.get('rolId')?.valueChanges.subscribe(roleId => {
      const isMedico = this.isMedicoRole(Number(roleId));
      const colegiaturaCtrl = this.userForm.get('numeroColegiatura');
      const especialidadCtrl = this.userForm.get('especialidadId');

      if (isMedico) {
        colegiaturaCtrl?.setValidators([Validators.required]);
        especialidadCtrl?.setValidators([Validators.required]);
      } else {
        colegiaturaCtrl?.clearValidators();
        especialidadCtrl?.clearValidators();
        colegiaturaCtrl?.setValue('');
        especialidadCtrl?.setValue(null);
      }
      colegiaturaCtrl?.updateValueAndValidity();
      especialidadCtrl?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.loadUsers();
    this.loadCatalogos();
  }

  loadCatalogos() {
    this.catalogoService.getRoles().subscribe(data => this.roles.set(data));
    this.catalogoService.getEspecialidades().subscribe(data => this.especialidades.set(data));
  }

  loadUsers() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        const currentUserEmail = this.authService.getCurrentUserEmail();
        const filteredUsers = currentUserEmail 
          ? data.filter(u => u.correo !== currentUserEmail)
          : data;
        
        this.users.set(filteredUsers);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.errorMessage.set(extractErrorMessage(err, 'No se pudieron cargar los usuarios. Revisa tu conexión al servidor.'));
        this.isLoading.set(false);
      }
    });
  }

  toggleDropdown(index: number, event: Event) {
    event.stopPropagation();
    this.activeDropdownIndex.update(current => current === index ? null : index);
  }

  @HostListener('document:click')
  closeDropdown() {
    this.activeDropdownIndex.set(null);
  }

  onAction(action: string, user: UsuarioResponse) {
    this.activeDropdownIndex.set(null);
    if (action === 'editar') {
      this.openEditModal(user);
    } else if (action === 'deshabilitar') {
      this.usuarioService.deshabilitarUsuario(user.id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => alert(extractErrorMessage(err, 'Error al deshabilitar el usuario'))
      });
    } else if (action === 'habilitar') {
      this.usuarioService.habilitarUsuario(user.id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => alert(extractErrorMessage(err, 'Error al habilitar el usuario'))
      });
    } else {
      console.log(`Acción: ${action} sobre el usuario: ${user.nombre} ${user.apellido}`);
    }
  }

  getRoleType(rolNombre: string): 'admin' | 'user' | 'supervisor' {
    if (!rolNombre) return 'user';
    const rol = rolNombre.toLowerCase();
    if (rol.includes('administrador')) return 'admin';
    if (rol.includes('recepcionista') || rol.includes('supervisor')) return 'supervisor';
    return 'user';
  }

  getInitials(nombre: string, apellido: string): string {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase() || 'U';
  }

  // Modal and Form Methods
  openCreateModal() {
    this.editingUserId.set(null);
    this.changePasswordMode.set('si'); // Para crear, siempre debe haber contraseña
    this.userForm.reset();
    this.userForm.get('rolId')?.enable();
    
    // Restaurar validador de contraseña obligatoria para creación
    this.userForm.get('contrasena')?.setValidators([
      Validators.required, 
      Validators.minLength(8), 
      Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/)
    ]);
    this.userForm.get('contrasena')?.updateValueAndValidity();

    this.formError.set('');
    this.showCreateModal.set(true);
  }

  togglePasswordMode(mode: 'si' | 'no') {
    this.changePasswordMode.set(mode);
    const pwdCtrl = this.userForm.get('contrasena');
    if (mode === 'si') {
      pwdCtrl?.setValidators([
        Validators.required, 
        Validators.minLength(8), 
        Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/)
      ]);
    } else {
      pwdCtrl?.clearValidators();
    }
    pwdCtrl?.updateValueAndValidity();
  }

  openEditModal(user: UsuarioResponse) {
    this.editingUserId.set(user.id);
    this.changePasswordMode.set('no');
    this.userForm.reset();
    
    // Buscar el rol correspondiente
    const rol = this.roles().find(r => r.nombre.toLowerCase() === user.rolNombre.toLowerCase());
    
    // Por defecto en edición, la contraseña no se evalúa
    this.userForm.get('contrasena')?.clearValidators();
    this.userForm.get('contrasena')?.updateValueAndValidity();

    // Bloquear el rol porque no se puede cambiar
    this.userForm.get('rolId')?.disable();

    let especialidadId: number | null = null;
    if (user.detallesMedico) {
      const esp = this.especialidades().find(e => e.nombre.toLowerCase() === user.detallesMedico?.especialidadNombre.toLowerCase());
      if (esp) especialidadId = esp.id;
    }

    this.userForm.patchValue({
      nombre: user.nombre,
      apellido: user.apellido,
      correo: user.correo,
      contrasena: '',
      rolId: rol ? rol.id : null,
      numeroColegiatura: user.detallesMedico?.numeroColegiatura || '',
      especialidadId: especialidadId
    });

    this.formError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  isMedicoRole(roleId: number | null): boolean {
    if (!roleId) return false;
    const selectedRole = this.roles().find(r => r.id === roleId);
    return selectedRole?.nombre.toLowerCase().includes('medico') || selectedRole?.nombre.toLowerCase().includes('médico') || false;
  }

  get isMedicoSelected(): boolean {
    const roleId = this.userForm.get('rolId')?.value;
    return this.isMedicoRole(Number(roleId));
  }

  onSubmitUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.formError.set('');
    // Al usar getRawValue obtenemos valores de campos disabled también (como rolId)
    const formValue = this.userForm.getRawValue();
    
    const isEdit = this.editingUserId() !== null;

    let dto: any = {
      nombre: formValue.nombre!,
      apellido: formValue.apellido!,
      correo: formValue.correo!
    };

    if (formValue.contrasena && (!isEdit || this.changePasswordMode() === 'si')) {
      dto.contrasena = formValue.contrasena;
    }

    if (!isEdit) {
      dto.rolId = Number(formValue.rolId!);
    }

    if (this.isMedicoSelected) {
      dto.detallesMedico = {
        numeroColegiatura: formValue.numeroColegiatura!,
        especialidadId: Number(formValue.especialidadId!)
      };
    }

    const request$ = isEdit 
      ? this.usuarioService.actualizarUsuario(this.editingUserId()!, dto as UsuarioActualizarDto)
      : this.usuarioService.registrarUsuario(dto as UsuarioRegistroDto);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeCreateModal();
        this.loadUsers();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.formError.set(extractErrorMessage(err, 'Error al guardar el usuario. Intenta nuevamente.'));
      }
    });
  }
}
