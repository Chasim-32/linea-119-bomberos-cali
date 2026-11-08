import { createContext, useContext, useEffect, useState } from 'react'

import { GRUPOS } from '../data/grupos.js'

const ReportesContext = createContext(null)
const STORAGE_KEY = 'bomberos119_reportes'

// Recuperar los reportes guardados. Siempre devuelve un arreglo.
function obtenerReportesGuardados() {
  try {
    const guardados = localStorage.getItem(STORAGE_KEY)
    const lista = guardados ? JSON.parse(guardados) : []
    return Array.isArray(lista) ? lista : []
  } catch (error) {
    console.error('Error al recuperar los reportes:', error)
    return []
  }
}

// Radicado único: 119-AAMMDD-NNNN. Se vuelve a generar si ya existe.
function generarRadicado(reportesActuales) {
  const existentes = new Set(reportesActuales.map((r) => r.radicado))
  const hoy = new Date()
  const fecha =
    String(hoy.getFullYear()).slice(-2) +
    String(hoy.getMonth() + 1).padStart(2, '0') +
    String(hoy.getDate()).padStart(2, '0')

  let radicado
  do {
    const sufijo = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    radicado = `119-${fecha}-${sufijo}`
  } while (existentes.has(radicado))

  return radicado
}

export function ReportesProvider({ children }) {
  const [reportes, setReportes] = useState(obtenerReportesGuardados)

  // Si otra pestaña modifica los reportes (evento storage), se refleja aquí.
  useEffect(() => {
    function alCambiarAlmacenamiento(evento) {
      if (evento.key === STORAGE_KEY || evento.key === null) {
        setReportes(obtenerReportesGuardados())
      }
    }

    window.addEventListener('storage', alCambiarAlmacenamiento)
    return () => window.removeEventListener('storage', alCambiarAlmacenamiento)
  }, [])

  // Guardar primero y actualizar el estado solo si el almacenamiento funciona.
  function guardarReportes(nuevosReportes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevosReportes))
      setReportes(nuevosReportes)
      return true
    } catch (error) {
      console.error('Error al guardar los reportes:', error)

      if (error.name === 'QuotaExceededError') {
        throw new Error(
          'El almacenamiento está lleno. Intenta enviar el reporte sin fotografías.'
        )
      }

      throw new Error('No fue posible guardar el reporte en el navegador.')
    }
  }

  // Registrar una nueva emergencia.
  function agregarReporte(datos) {
    // Recuperar la lista más reciente antes de agregar el reporte.
    const reportesActuales = obtenerReportesGuardados()

    const nuevoReporte = {
      ...datos,
      id:
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      radicado: generarRadicado(reportesActuales),
      fechaCreacion: new Date().toISOString(),
      estado: 'Recibido',
      unidad: null,
      fechaValidacion: null,
    }

    guardarReportes([...reportesActuales, nuevoReporte])

    return nuevoReporte
  }

  // Modificar información o estado de un reporte.
  function actualizarReporte(id, cambios) {
    // Se parte de lo guardado para no pisar cambios hechos desde otra pestaña.
    const reportesActuales = obtenerReportesGuardados()

    if (!reportesActuales.some((reporte) => reporte.id === id)) {
      throw new Error('El reporte ya no existe.')
    }

    const nuevosReportes = reportesActuales.map((reporte) =>
      reporte.id === id ? { ...reporte, ...cambios } : reporte
    )

    guardarReportes(nuevosReportes)
  }

  // Validar un reporte recibido (el operador puede corregir el grupo).
  function validarReporte(id, codigoGrupo) {
    const reporte = obtenerReportesGuardados().find((r) => r.id === id)

    if (!reporte) {
      throw new Error('El reporte ya no existe.')
    }

    if (reporte.estado !== 'Recibido') {
      throw new Error('Solo se puede validar un reporte en estado Recibido.')
    }

    const grupo = GRUPOS.find((g) => g.codigo === Number(codigoGrupo))

    if (!grupo) {
      throw new Error('Selecciona un grupo de emergencia válido.')
    }

    const cambios = {
      grupo: grupo.codigo,
      grupoNombre: grupo.nombre,
      estado: 'Validado',
      // La fecha de creación no se toca: recepción y validación son distintas.
      fechaValidacion: new Date().toISOString(),
    }

    // Si el operador sale del grupo 300, los datos del extra ya no aplican.
    if (grupo.codigo !== 300) {
      cambios.datosGrupo300 = null
    }

    actualizarReporte(id, cambios)
  }

  // Consultar un reporte específico.
  function obtenerReporte(id) {
    return reportes.find((reporte) => reporte.id === id)
  }

  // Consultar un reporte por su número de radicado.
  function obtenerReportePorRadicado(radicado) {
    return reportes.find((reporte) => reporte.radicado === radicado)
  }

  // Eliminar un reporte.
  function eliminarReporte(id) {
    const nuevosReportes = obtenerReportesGuardados().filter(
      (reporte) => reporte.id !== id
    )

    guardarReportes(nuevosReportes)
  }

  return (
    <ReportesContext.Provider
      value={{
        reportes,
        agregarReporte,
        actualizarReporte,
        validarReporte,
        obtenerReporte,
        obtenerReportePorRadicado,
        eliminarReporte,
      }}
    >
      {children}
    </ReportesContext.Provider>
  )
}

export function useReportes() {
  const contexto = useContext(ReportesContext)

  if (!contexto) {
    throw new Error('useReportes debe utilizarse dentro de ReportesProvider')
  }

  return contexto
}
