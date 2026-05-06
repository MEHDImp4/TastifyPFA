import axiosInstance from '@shared/auth/axiosInstance'
import type { Table } from '@shared/types/tables'
import type { WizardState } from '../pages/Reservations/WizardContext'

interface AvailableTablesParams {
  date: string
  heure_debut: string
  heure_fin: string
  nombre_personnes: number
}

export const fetchAvailableTables = async (params: AvailableTablesParams): Promise<Table[]> => {
  const { data } = await axiosInstance.get<Table[]>('/reservations/available_tables/', { params })
  return data
}

export const createReservation = async (state: WizardState) => {
  const payload = {
    table: state.selectedTable!.id,
    date_reservation: state.date,
    heure_debut: `${state.heure_debut}:00`,
    heure_fin: `${state.heure_fin}:00`,
    nombre_personnes: state.nombre_personnes,
  }

  const { data } = await axiosInstance.post('/reservations/', payload)
  return data
}
