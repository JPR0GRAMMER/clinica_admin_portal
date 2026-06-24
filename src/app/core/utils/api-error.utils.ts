export function extractErrorMessage(err: any, fallbackMessage: string = 'Ocurrió un error inesperado.'): string {
  // Si el backend envía la estructura { "mensaje": "..." }
  if (err?.error?.mensaje) {
    return err.error.mensaje;
  }
  // Si el backend envía un string plano
  if (err?.error && typeof err.error === 'string') {
    return err.error;
  }
  // Fallback a mensajes estándar de Error o HttpErrorResponse
  if (err?.message) {
    // A veces HttpErrorResponse.message es toda la URL, pero es mejor que nada
    // Si queremos evitarlo, podemos retornar fallbackMessage directamente
    return err.message;
  }
  
  return fallbackMessage;
}
