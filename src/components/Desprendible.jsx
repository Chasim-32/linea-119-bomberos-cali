import { useEffect } from 'react'
import { createPortal } from 'react-dom'

import './desprendible.css'

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

// Desprendible de verificación. Solo se genera para reportes ya validados
// (los que tienen fechaValidacion). Se imprime con window.print(); el CSS de
// impresión (desprendible.css) oculta el resto de la aplicación.
export default function Desprendible({ reporte, onCerrar }) {
  useEffect(() => {
    function alPresionarTecla(e) {
      if (e.key === 'Escape') onCerrar()
    }

    window.addEventListener('keydown', alPresionarTecla)
    return () => window.removeEventListener('keydown', alPresionarTecla)
  }, [onCerrar])

  if (!reporte) return null

  const validado = Boolean(reporte.fechaValidacion)

  return createPortal(
    <div
      className="desprendible-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="desprendible-titulo"
    >
      <div className="desprendible-ventana">
        <div className="desprendible-acciones">
          {validado && (
            <button
              type="button"
              className="desprendible-imprimir"
              onClick={() => window.print()}
            >
              Imprimir desprendible
            </button>
          )}

          <button
            type="button"
            className="desprendible-cerrar"
            onClick={onCerrar}
          >
            Cerrar ×
          </button>
        </div>

        <article className="desprendible">
          <header className="desprendible-cabecera">
            <span className="desprendible-marca">119</span>

            <div>
              <strong>LÍNEA 119 · BOMBEROS CALI</strong>
              <small>Sistema de recepción y gestión de emergencias</small>
            </div>
          </header>

          <h2 id="desprendible-titulo">Desprendible de verificación</h2>

          {!validado ? (
            <p className="desprendible-aviso">
              Este reporte aún no ha sido validado por un operador. El
              desprendible solo está disponible para reportes validados.
            </p>
          ) : (
            <>
              <div className="desprendible-radicado">
                <span>NÚMERO DE RADICADO</span>
                <strong>{reporte.radicado}</strong>
              </div>

              <dl className="desprendible-datos">
                <div>
                  <dt>Fecha de recepción</dt>
                  <dd>{formatearFecha(reporte.fechaCreacion)}</dd>
                </div>

                <div>
                  <dt>Fecha de validación</dt>
                  <dd>{formatearFecha(reporte.fechaValidacion)}</dd>
                </div>

                <div>
                  <dt>Tipo de emergencia</dt>
                  <dd>
                    {reporte.grupo} · {reporte.grupoNombre}
                  </dd>
                </div>

                <div>
                  <dt>Barrio</dt>
                  <dd>{reporte.barrio}</dd>
                </div>

                <div>
                  <dt>Estado actual</dt>
                  <dd>{reporte.estado}</dd>
                </div>
              </dl>

              <p className="desprendible-pie">
                Este documento certifica que el reporte fue revisado y validado
                por un radio operador. No reemplaza la llamada al 119.
              </p>
            </>
          )}
        </article>
      </div>
    </div>,
    document.body
  )
}
