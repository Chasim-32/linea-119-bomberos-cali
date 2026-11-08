import './operador.css'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import MapaOperador from '../mapa/MapaOperador.jsx'
import { useReportes } from '../context/ReportesContext.jsx'
import Desprendible from '../components/Desprendible.jsx'
import { GRUPOS, colorDeGrupo } from '../data/grupos.js'

const UNIDADES = ['Máquina', 'Rescate', 'Ambulancia', 'HazMat']

const ESTADOS = [
  'Todos',
  'Recibido',
  'Validado',
  'Unidad despachada',
  'Cerrado',
  'Descartado',
]

function horaReporte(fecha) {
  return new Date(fecha).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Operador() {
  const { reportes, actualizarReporte, validarReporte: validarEnContexto } =
    useReportes()

  const [seleccionadoId, setSeleccionadoId] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroGrupo, setFiltroGrupo] = useState('Todos')
  const [verDesprendible, setVerDesprendible] = useState(false)
  const [errorAccion, setErrorAccion] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [grupoEditado, setGrupoEditado] = useState('')
  const [unidadSeleccionada, setUnidadSeleccionada] = useState('')

  const seleccionado = reportes.find(
    (reporte) => reporte.id === seleccionadoId
  )

  const reportesFiltrados = useMemo(() => {
    return reportes
      .filter((reporte) => {
        const coincideEstado =
          filtroEstado === 'Todos' || reporte.estado === filtroEstado

        const coincideGrupo =
          filtroGrupo === 'Todos' || String(reporte.grupo) === filtroGrupo

        const texto = busqueda.toLowerCase()

        const coincideBusqueda = [
          reporte.radicado,
          reporte.nombres,
          reporte.apellidos,
          reporte.barrio,
          reporte.direccion,
          String(reporte.grupo),
        ].some((valor) => String(valor || '').toLowerCase().includes(texto))

        return coincideEstado && coincideGrupo && coincideBusqueda
      })
      .sort(
        (a, b) =>
          new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
      )
  }, [reportes, filtroEstado, filtroGrupo, busqueda])

  const conteos = useMemo(() => ({
    total: reportes.length,
    recibidos: reportes.filter((r) => r.estado === 'Recibido').length,
    validados: reportes.filter((r) => r.estado === 'Validado').length,
    despachados: reportes.filter((r) => r.estado === 'Unidad despachada').length,
  }), [reportes])

  function seleccionarReporte(reporte) {
    setSeleccionadoId(reporte.id)
    setGrupoEditado(String(reporte.grupo))
    setUnidadSeleccionada('')
    setErrorAccion('')
    setVerDesprendible(false)
  }

  // Ejecuta una acción sobre el reporte y muestra el error si no se pudo guardar.
  function ejecutarAccion(accion) {
    setErrorAccion('')

    try {
      accion()
    } catch (error) {
      console.error(error)
      setErrorAccion(error.message || 'No fue posible completar la acción.')
    }
  }

  function validarReporte() {
    if (!seleccionado) return

    ejecutarAccion(() => validarEnContexto(seleccionado.id, grupoEditado))
  }

  function descartarReporte() {
    if (!seleccionado) return

    const confirmar = window.confirm(
      '¿Estás seguro de descartar este reporte?'
    )

    if (!confirmar) return

    ejecutarAccion(() =>
      actualizarReporte(seleccionado.id, {
        estado: 'Descartado',
        fechaDescarte: new Date().toISOString(),
      })
    )
  }

  function despacharUnidad() {
    if (!seleccionado) return

    if (seleccionado.estado !== 'Validado') {
      setErrorAccion('Primero debes validar el reporte.')
      return
    }

    if (!unidadSeleccionada) {
      setErrorAccion('Selecciona una unidad para realizar el despacho.')
      return
    }

    ejecutarAccion(() => {
      actualizarReporte(seleccionado.id, {
        estado: 'Unidad despachada',
        unidad: unidadSeleccionada,
        fechaDespacho: new Date().toISOString(),
      })

      setUnidadSeleccionada('')
    })
  }

  function cerrarReporte() {
    if (!seleccionado) return

    if (seleccionado.estado !== 'Unidad despachada') {
      setErrorAccion('Solo puedes cerrar un reporte con una unidad despachada.')
      return
    }

    const confirmar = window.confirm(
      '¿Confirmas que la atención de esta emergencia ha finalizado?'
    )

    if (!confirmar) return

    ejecutarAccion(() =>
      actualizarReporte(seleccionado.id, {
        estado: 'Cerrado',
        fechaCierre: new Date().toISOString(),
      })
    )
  }

  function nombreGrupo(codigo) {
    return GRUPOS.find((g) => g.codigo === codigo)?.nombre || 'Sin clasificar'
  }

  function textoDato(valor) {
    return valor === null || valor === undefined || valor === ''
      ? 'No indicado'
      : valor
  }

  function claseEstado(estado) {
    return estado.toLowerCase().replaceAll(' ', '-')
  }

  return (
    <main className="operador-page">

      {/* BARRA SUPERIOR */}
      <header className="operador-header">
        <Link to="/" className="operador-logo">
          <span>119</span>
          BOMBEROS CALI
        </Link>

        <div className="operador-header-centro">
          <span className="indicador-conexion" />
          SISTEMA DE GESTIÓN DE EMERGENCIAS
        </div>

        <Link to="/" className="operador-salir">
          Volver al inicio ↗
        </Link>
      </header>

      {/* CONTENIDO */}
      <section className="operador-contenido">

        <div className="operador-titulo">
          <div>
            <span className="seccion-etiqueta">CENTRO DE CONTROL · CALI</span>
            <h1>Radio <span>operador.</span></h1>
            <p>Monitoreo y gestión de emergencias en tiempo real dentro de esta aplicación.</p>
          </div>

          <div className="operador-fecha">
            <strong>{new Date().toLocaleDateString('es-CO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}</strong>
            <span>LÍNEA DE ATENCIÓN 119</span>
          </div>
        </div>

        {/* INDICADORES */}
        <div className="operador-indicadores">
          <div className="indicador-card">
            <span>TOTAL DE REPORTES</span>
            <strong>{conteos.total}</strong>
            <small>Registros recibidos</small>
          </div>

          <div className="indicador-card indicador-recibido">
            <span>POR ATENDER</span>
            <strong>{conteos.recibidos}</strong>
            <small>Esperando validación</small>
          </div>

          <div className="indicador-card indicador-validado">
            <span>VALIDADOS</span>
            <strong>{conteos.validados}</strong>
            <small>Listos para despacho</small>
          </div>

          <div className="indicador-card indicador-despachado">
            <span>EN ATENCIÓN</span>
            <strong>{conteos.despachados}</strong>
            <small>Unidades despachadas</small>
          </div>
        </div>

        {/* MAPA Y LISTA */}
        <div className="operador-dashboard">

          <section className="operador-mapa-panel">
            <div className="panel-cabecera">
              <div>
                <span className="seccion-etiqueta">GEORREFERENCIACIÓN</span>
                <h2>Mapa de emergencias</h2>
              </div>
              <span className="contador-reportes">
                {reportes.length} REPORTES
              </span>
            </div>

            <div className="operador-mapa">
              <MapaOperador
                reportes={reportes}
                seleccionadoId={seleccionadoId}
                onSeleccionar={(id) => {
                  const reporte = reportes.find((r) => r.id === id)
                  if (reporte) seleccionarReporte(reporte)
                }}
              />
            </div>
          </section>

          {/* LISTA */}
          <aside className="operador-lista">
            <div className="panel-cabecera">
              <div>
                <span className="seccion-etiqueta">CENTRO DE DESPACHO</span>
                <h2>Reportes recibidos</h2>
              </div>
              <strong>{reportesFiltrados.length}</strong>
            </div>

            <input
              className="operador-busqueda"
              type="search"
              placeholder="Buscar reporte, barrio o persona..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <select
              className="operador-filtro"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              aria-label="Filtrar por estado"
            >
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado === 'Todos' ? 'Todos los estados' : estado}
                </option>
              ))}
            </select>

            <select
              className="operador-filtro"
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
              aria-label="Filtrar por grupo de emergencia"
            >
              <option value="Todos">Todos los grupos</option>
              {GRUPOS.map((grupo) => (
                <option key={grupo.codigo} value={String(grupo.codigo)}>
                  {grupo.codigo} · {grupo.nombre}
                </option>
              ))}
            </select>

            <div className="lista-reportes">
              {reportesFiltrados.length === 0 ? (
                <div className="lista-vacia">
                  <span>119</span>
                  <strong>No hay reportes</strong>
                  <p>
                    {reportes.length === 0
                      ? 'Las nuevas emergencias aparecerán aquí.'
                      : 'No se encontraron reportes con esos filtros.'}
                  </p>
                </div>
              ) : (
                reportesFiltrados.map((reporte) => (
                  <button
                    key={reporte.id}
                    className={`reporte-lista-item ${
                      seleccionadoId === reporte.id ? 'activo' : ''
                    }`}
                    onClick={() => seleccionarReporte(reporte)}
                  >
                    <div className="reporte-lista-superior">
                      <strong>#{reporte.radicado}</strong>
                      <span className={`estado-badge ${claseEstado(reporte.estado)}`}>
                        {reporte.estado}
                      </span>
                    </div>

                    <div className="reporte-lista-info">
                      <strong>
                        {reporte.nombres} {reporte.apellidos}
                      </strong>
                      <span className="grupo-chip">
                        <i style={{ background: colorDeGrupo(reporte.grupo) }} />
                        <b>{reporte.grupo}</b> {nombreGrupo(reporte.grupo)}
                      </span>
                      <span>{reporte.barrio} · {horaReporte(reporte.fechaCreacion)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>

        {/* DETALLE */}
        {seleccionado && (
          <section className="operador-detalle">
            <div className="detalle-cabecera">
              <div>
                <span className="seccion-etiqueta">GESTIÓN DEL INCIDENTE</span>
                <h2>Detalle del reporte</h2>
                <p>Radicado: {seleccionado.radicado}</p>
              </div>

              <button
                className="detalle-cerrar"
                onClick={() => setSeleccionadoId(null)}
              >
                Cerrar detalle ×
              </button>
            </div>

            <div className="detalle-grid">

              <div className="detalle-bloque">
                <h3>01 · Ciudadano</h3>
                <p><strong>Nombre:</strong> {seleccionado.nombres} {seleccionado.apellidos}</p>
                <p><strong>Teléfono:</strong> {seleccionado.telefono}</p>
                <p>
                  <strong>Recepción:</strong>{' '}
                  {new Date(seleccionado.fechaCreacion).toLocaleString('es-CO')}
                </p>
                <p>
                  <strong>Validación:</strong>{' '}
                  {seleccionado.fechaValidacion
                    ? new Date(seleccionado.fechaValidacion).toLocaleString('es-CO')
                    : 'Pendiente'}
                </p>
                <a
                  className="detalle-llamar"
                  href={`tel:${seleccionado.telefono}`}
                >
                  <span>☎</span> Llamar al ciudadano
                </a>
              </div>

              <div className="detalle-bloque">
                <h3>02 · Emergencia</h3>
                <p><strong>Grupo:</strong> {nombreGrupo(seleccionado.grupo)}</p>
                <p><strong>Estado:</strong> {seleccionado.estado}</p>
                <p><strong>Descripción:</strong></p>
                <p>{seleccionado.descripcion}</p>
              </div>

              <div className="detalle-bloque">
                <h3>03 · Ubicación</h3>
                <p><strong>Dirección:</strong> {seleccionado.direccion}</p>
                <p><strong>Barrio:</strong> {seleccionado.barrio}</p>
                <p><strong>Referencia:</strong> {textoDato(seleccionado.referencia)}</p>
                <p><strong>Edificio:</strong> {textoDato(seleccionado.edificio)}</p>
                <p>
                  <strong>Coordenadas:</strong>{' '}
                  {Number(seleccionado.lat).toFixed(5)}, {Number(seleccionado.lng).toFixed(5)}
                  {' · '}
                  {seleccionado.ubicacionExacta
                    ? 'GPS del ciudadano'
                    : 'Aproximada por barrio (no es GPS)'}
                </p>

                <a
                  className="detalle-maps"
                  href={`https://www.google.com/maps?q=${seleccionado.lat},${seleccionado.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver ubicación en Google Maps ↗
                </a>
              </div>
            </div>

            {/* EXTRA: PREGUNTAS DEL GRUPO 300 */}
            {seleccionado.grupo === 300 && seleccionado.datosGrupo300 && (
              <div className="detalle-grupo300">
                <h3>Persona afectada · Grupo 300</h3>

                <dl>
                  <div>
                    <dt>Sexo</dt>
                    <dd>{textoDato(seleccionado.datosGrupo300.sexo)}</dd>
                  </div>
                  <div>
                    <dt>Edad</dt>
                    <dd>
                      {seleccionado.datosGrupo300.edadDesconocida
                        ? 'No se conoce'
                        : seleccionado.datosGrupo300.edad === null ||
                            seleccionado.datosGrupo300.edad === undefined
                          ? 'No indicado'
                          : `${seleccionado.datosGrupo300.edad} años`}
                    </dd>
                  </div>
                  <div>
                    <dt>¿Está consciente?</dt>
                    <dd>{textoDato(seleccionado.datosGrupo300.consciente)}</dd>
                  </div>
                  <div>
                    <dt>¿Está respirando?</dt>
                    <dd>{textoDato(seleccionado.datosGrupo300.respira)}</dd>
                  </div>
                </dl>
              </div>
            )}

            {/* FOTOGRAFÍAS */}
            {seleccionado.fotos?.length > 0 && (
              <div className="detalle-fotografias">
                <h3>04 · Evidencias fotográficas</h3>

                <div className="detalle-fotos-grid">
                  {seleccionado.fotos.map((foto, i) => (
                    <a
                      key={i}
                      href={foto.src}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src={foto.src} alt={foto.nombre} />
                      <span>{foto.nombre}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* DESPACHO */}
            <div className="detalle-acciones">
              <div className="detalle-cabecera-acciones">
                <div>
                  <span className="seccion-etiqueta">CONTROL OPERATIVO</span>
                  <h3>Gestión de la emergencia</h3>
                </div>
              </div>

              {errorAccion && (
                <p className="error-accion" role="alert">{errorAccion}</p>
              )}

              {seleccionado.fechaValidacion && (
                <button
                  type="button"
                  className="accion-desprendible"
                  onClick={() => setVerDesprendible(true)}
                >
                  Ver desprendible de verificación
                </button>
              )}

              {seleccionado.estado === 'Recibido' && (
                <div className="acciones-validacion">
                  <label className="campo">
                    Clasificación de emergencia
                    <select
                      value={grupoEditado}
                      onChange={(e) => setGrupoEditado(e.target.value)}
                    >
                      {GRUPOS.map((grupo) => (
                        <option key={grupo.codigo} value={grupo.codigo}>
                          {grupo.codigo} · {grupo.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="botones-acciones">
                    <button
                      className="accion-validar"
                      onClick={validarReporte}
                    >
                      ✓ Validar emergencia
                    </button>

                    <button
                      className="accion-descartar"
                      onClick={descartarReporte}
                    >
                      Descartar reporte
                    </button>
                  </div>
                </div>
              )}

              {seleccionado.estado === 'Validado' && (
                <div className="acciones-despacho">
                  <label className="campo">
                    Seleccionar unidad
                    <select
                      value={unidadSeleccionada}
                      onChange={(e) => setUnidadSeleccionada(e.target.value)}
                    >
                      <option value="">Selecciona una unidad</option>
                      {UNIDADES.map((unidad) => (
                        <option key={unidad} value={unidad}>{unidad}</option>
                      ))}
                    </select>
                  </label>

                  <button
                    className="accion-despachar"
                    disabled={!unidadSeleccionada}
                    onClick={despacharUnidad}
                  >
                    Despachar unidad →
                  </button>
                </div>
              )}

              {seleccionado.estado === 'Unidad despachada' && (
                <div className="estado-final">
                  <p>
                    Unidad asignada: <strong>{seleccionado.unidad}</strong>
                  </p>

                  <button
                    className="accion-cerrar"
                    onClick={cerrarReporte}
                  >
                    Finalizar atención y cerrar caso
                  </button>
                </div>
              )}

              {seleccionado.estado === 'Cerrado' && (
                <div className="mensaje-final">
                  ✓ Esta emergencia fue atendida y cerrada.
                </div>
              )}

              {seleccionado.estado === 'Descartado' && (
                <div className="mensaje-final mensaje-descartado">
                  Este reporte fue descartado.
                </div>
              )}
            </div>
          </section>
        )}

      </section>

      {verDesprendible && seleccionado?.fechaValidacion && (
        <Desprendible
          reporte={seleccionado}
          onCerrar={() => setVerDesprendible(false)}
        />
      )}
    </main>
  )
}
