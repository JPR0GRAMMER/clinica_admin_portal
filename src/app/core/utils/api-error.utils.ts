export function extractErrorMessage(err: any, fallbackMessage: string = 'Ocurrió un error inesperado.'): string {
  if (err?.error?.mensaje) {
    return err.error.mensaje;
  }
  if (err?.error && typeof err.error === 'string') {
    return err.error;
  }
  if (err?.message) {
    return err.message;
  }

  return fallbackMessage;
}
