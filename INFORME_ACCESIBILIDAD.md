# Informe de accesibilidad e inclusión

**Fecha:** 24 de noviembre de 2026  
**Rama:** `feat/interfaces-inclusivas`  
**Alcance:** inicio de sesión, agenda de citas, consulta de pacientes y registro de atenciones médicas.  
**Referencia:** [WCAG 2.2 nivel AA](https://www.w3.org/TR/WCAG22/).

## Método

Se revisaron las plantillas y estilos de Angular y se probaron los flujos en Chrome con el backend y una copia local del respaldo clínico. Se usó axe para reglas WCAG 2.0, 2.1 y 2.2 A/AA; además se probaron teclado, foco, apertura y cierre de diálogos, y un ancho de 320 píxeles CSS para redistribución. Los datos de pacientes y credenciales no forman parte de este informe.

## Brechas detectadas y correcciones

| Vista afectada | Hallazgo inicial | Impacto y referencia WCAG | Corrección aplicada |
| --- | --- | --- | --- |
| Agendar cita (`/citas/agendar`) y registrar atención (`/atenciones/registrar`) | Los selectores de paciente, CIE-10 y medicamentos eran `div` activados solo por clic. | Bloqueaban teclado y no exponían nombre ni función: 2.1.1 y 4.1.2. | Se cambiaron por botones y opciones nativas; la búsqueda recibe el foco al abrir, `Escape` cierra y la selección devuelve el foco al botón. |
| Encabezado y navegación lateral; Pacientes (`/pacientes`) y Citas (`/citas`) | Botones de acciones, perfil y enlaces de la barra lateral carecían de nombre accesible. | Un lector de pantalla no podía identificar su propósito: 4.1.2 y 2.4.4. | Se añadieron nombres accesibles y estados `aria-expanded`; la tabla de citas identifica su columna de acciones. |
| Pacientes (`/pacientes`), agendar cita (`/citas/agendar`) y registrar atención (`/atenciones/registrar`) | Algunos campos tenían etiquetas visuales sin asociación programática. | La etiqueta no se anunciaba junto con el control: 1.3.1 y 3.3.2. | Se añadieron identificadores y etiquetas asociadas; los errores de campos se vincularon donde se mostraban. |
| Formulario de Pacientes (`/pacientes`) y confirmación de Citas (`/citas`) | El diálogo de pacientes no recibía el foco, no tenía función de diálogo y no se cerraba con `Escape`. | La navegación podía quedar en el fondo: 2.4.3 y 4.1.2; patrón de diálogo WAI-ARIA. | Se añadió nombre y función de diálogo, foco inicial, contención del foco con `Tab`, cierre con `Escape` y devolución del foco. Se hizo lo mismo con la confirmación de estado de citas. |
| Inicio de sesión (`/login`) | El acceso no explicaba los campos inválidos al enviarse vacío. | El usuario no sabía qué corregir: 3.3.1. | Se muestra un mensaje de error anunciado y se marcan los campos inválidos. |
| Encabezado compartido; Citas (`/citas`), Pacientes (`/pacientes`) y Atenciones (`/atenciones`) | Algunos textos tenían contraste insuficiente; había controles sin indicador de foco claro. | Dificultaban lectura y orientación: 1.4.3 y 2.4.7. | Se oscurecieron textos detectados y se añadió un indicador visible de foco para controles interactivos. |
| Agendar cita (`/citas/agendar`) y registrar atención (`/atenciones/registrar`) | Citas y atenciones cortaban campos a 320 píxeles CSS. | Pérdida de contenido al ampliar: 1.4.10. | Se ajustaron columnas, anchos mínimos y espacios; las tablas de datos conservan desplazamiento horizontal propio. |
| Todas las vistas; idioma en `src/index.html` | La interfaz en español declaraba `lang="en"`. | Pronunciación incorrecta en lectores de pantalla: 3.1.1. | Se cambió el idioma del documento a `es`. |
| Inicio de sesión (`/login`) | El control para mostrar la contraseña era demasiado pequeño. | Objetivo táctil reducido: 2.5.8. | Se amplió a un mínimo de 44 × 44 píxeles y su nombre cambia entre mostrar y ocultar. |

## Verificación posterior

- `npm run build`: correcto.
- `npm test -- --watch=false`: 3 archivos y 8 pruebas correctas.
- axe: sin infracciones en los estados revisados de login, agenda, pacientes, formulario de atenciones, diálogo de pacientes y receta desplegada.
- Con teclado se inició sesión y se seleccionaron paciente y CIE-10 con `Tab` y `Enter`; el foco volvió al selector después de elegir.
- El diálogo de pacientes recibió el foco al abrir, mantuvo `Tab` dentro y se cerró con `Escape`.
- A 320 píxeles CSS, ningún campo de los formularios de citas y atenciones quedó fuera del ancho visible.

## Alcance de la conclusión

Estas correcciones resuelven las brechas observadas en los flujos indicados. **No constituyen una certificación integral de conformidad WCAG 2.2 AA.** Antes de afirmarla falta una revisión humana con NVDA, ampliación de texto al 200 %, contraste y estados de error en todos los recorridos y una auditoría de las pantallas restantes. Las pruebas automáticas no pueden verificar por sí solas que la experiencia anunciada por el lector de pantalla sea comprensible.

