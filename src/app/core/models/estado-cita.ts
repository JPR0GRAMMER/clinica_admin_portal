export enum EstadoCita {
  Confirmada = 'Confirmada',
  Reprogramada = 'Reprogramada',
  Asistio = 'Asistió',
  Cancelada = 'Cancelada',
  NoAsistio = 'No Asistió',
}

export function esReprogramable(estado: EstadoCita): boolean {
  return estado === EstadoCita.Confirmada || estado === EstadoCita.Reprogramada;
}
