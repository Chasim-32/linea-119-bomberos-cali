import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useReportes } from '../context/ReportesContext.jsx'
import PreguntasGrupo300, {
  DATOS_GRUPO_300_INICIAL,
} from '../components/PreguntasGrupo300.jsx'
import { GRUPOS } from '../data/grupos.js'
import { BARRIOS } from '../data/barrios.js'
import './Reportar.css'

const FORMULARIO_INICIAL = {
  nombres: '',
  apellidos: '',
  telefono: '',
  grupo: '',
  descripcion: '',
  direccion: '',
  barrio: '',
  referencia: '',
  edificio: '',
  edificioNoAplica: false,
}

// Texto que ve el ciudadano según el estado que le pone el operador.
const MENSAJES_ESTADO = {
  Recibido: 'Tu reporte fue recibido y está en espera de revisión.',
  Validado: 'Un operador revisó y validó tu reporte.',
  'Unidad despachada': 'Se despachó una unidad hacia el lugar de la emergencia.',
  Cerrado: 'La atención de esta emergencia finalizó.',
  Descartado:
    'El operador descartó este reporte (falso o duplicado). Si sigue la emergencia, llama al 119.',
}

// Devuelve un objeto { campo: mensaje } con los errores del formulario.
// Si está vacío, todos los campos obligatorios están completos.
function validarCampos(formulario, datos300) {
  const errores = {}

  if (!formulario.grupo) {
    errores.grupo = 'Selecciona el tipo de emergencia.'
  } else if (!GRUPOS.some((g) => g.codigo === Number(formulario.grupo))) {
    errores.grupo = 'El tipo de emergencia no es válido.'
  }

  if (!formulario.descripcion.trim()) {
    errores.descripcion = 'Cuéntanos brevemente qué está pasando.'
  }

  if (!formulario.direccion.trim()) {
    errores.direccion = 'Escribe la dirección de la emergencia.'
  }

  if (!formulario.barrio) {
    errores.barrio = 'Selecciona el barrio.'
  } else if (!BARRIOS.some((b) => b.nombre === formulario.barrio)) {
    errores.barrio = 'El barrio no es válido.'
  }

  if (!formulario.referencia.trim()) {
    errores.referencia = 'Indica un punto de referencia.'
  }

  if (!formulario.edificioNoAplica && !formulario.edificio.trim()) {
    errores.edificio = 'Escribe el nombre del edificio o marca «No aplica».'
  }

  if (!formulario.nombres.trim()) {
    errores.nombres = 'Escribe tus nombres.'
  }

  if (!formulario.apellidos.trim()) {
    errores.apellidos = 'Escribe tus apellidos.'
  }

  if (!/^\d{10}$/.test(formulario.telefono)) {
    errores.telefono = 'Escribe un celular válido de 10 dígitos.'
  }

  // Las respuestas del grupo 300 no bloquean el envío; solo se valida la edad.
  if (
    Number(formulario.grupo) === 300 &&
    !datos300.edadDesconocida &&
    datos300.edad !== ''
  ) {
    const edad = Number(datos300.edad)

    if (!Number.isInteger(edad) || edad < 0 || edad > 120) {
      errores.edad = 'Escribe una edad entre 0 y 120 años.'
    }
  }

  return errores
}

async function comprimirImagen(file) {
  const url = URL.createObjectURL(file)

  try {
    const imagen = new Image()
    imagen.src = url

    await new Promise((resolve, reject) => {
      imagen.onload = resolve
      imagen.onerror = reject
    })

    const maxDimension = 1280
    const escala = Math.min(
      1,
      maxDimension / Math.max(imagen.width, imagen.height)
    )

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(imagen.width * escala)
    canvas.height = Math.round(imagen.height * escala)

    const contexto = canvas.getContext('2d')

    if (!contexto) {
      throw new Error('No se pudo procesar la imagen.')
    }

    contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height)

    return canvas.toDataURL('image/jpeg', 0.72)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function Reportar() {
  const { agregarReporte, obtenerReporte } = useReportes()

  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL)
  const [errores, setErrores] = useState({})
  const [datos300, setDatos300] = useState(DATOS_GRUPO_300_INICIAL)
  const [tocados, setTocados] = useState({})
  const [fotos, setFotos] = useState([])
  const fotosRef = useRef([])

  const [cargando, setCargando] = useState(false)
  const [confirmacion, setConfirmacion] = useState(null)

  useEffect(() => {
    fotosRef.current = fotos
  }, [fotos])

  useEffect(() => {
    return () => {
      fotosRef.current.forEach((foto) => {
        URL.revokeObjectURL(foto.preview)
      })
    }
  }, [])

  // Errores calculados a partir de lo que hay escrito en el formulario.
  const erroresCampos = useMemo(
    () => validarCampos(formulario, datos300),
    [formulario, datos300]
  )

  const formularioValido = Object.keys(erroresCampos).length === 0

  // Solo se muestra el error de un campo cuando la persona ya pasó por él.
  const mensaje = (campo) => (tocados[campo] ? erroresCampos[campo] : '')

  function tocar(campo) {
    setTocados((actual) => ({ ...actual, [campo]: true }))
  }

  // Actualizar los campos del formulario.
  function cambiarCampo(e) {
    const { name, value, type, checked } = e.target
    const nuevoValor = type === 'checkbox' ? checked : value

    setFormulario((actual) => ({
      ...actual,
      [name]: nuevoValor,
      // Si marca «No aplica», se limpia el nombre del edificio.
      ...(name === 'edificioNoAplica' && checked ? { edificio: '' } : {}),
    }))

    setErrores((actual) => ({ ...actual, general: '' }))

    // Al salir del grupo 300 no debe quedar información de ese extra.
    if (name === 'grupo' && Number(value) !== 300) {
      setDatos300(DATOS_GRUPO_300_INICIAL)
    }
  }

  function cambiarDatos300(cambios) {
    setDatos300((actual) => ({ ...actual, ...cambios }))
  }

  // Seleccionar y comprimir fotografías.
  async function seleccionarFotos(e) {
    const archivos = Array.from(e.target.files || [])

    if (!archivos.length) return

    if (fotos.length + archivos.length > 3) {
      setErrores((actual) => ({
        ...actual,
        fotos: 'Puedes adjuntar máximo 3 fotografías.',
      }))

      e.target.value = ''
      return
    }

    if (
      archivos.some(
        (archivo) => !archivo.type.startsWith('image/')
      )
    ) {
      setErrores((actual) => ({
        ...actual,
        fotos: 'Selecciona únicamente archivos de imagen.',
      }))

      e.target.value = ''
      return
    }

    if (
      archivos.some(
        (archivo) => archivo.size > 10 * 1024 * 1024
      )
    ) {
      setErrores((actual) => ({
        ...actual,
        fotos: 'Cada imagen debe pesar máximo 10 MB.',
      }))

      e.target.value = ''
      return
    }

    const nuevasFotos = []

    try {
      for (const archivo of archivos) {
        const preview = URL.createObjectURL(archivo)

        try {
          const src = await comprimirImagen(archivo)

          nuevasFotos.push({
            nombre: archivo.name,
            preview,
            src,
          })
        } catch (error) {
          URL.revokeObjectURL(preview)
          throw error
        }
      }

      setFotos((actuales) => [
        ...actuales,
        ...nuevasFotos,
      ])

      setErrores((actual) => ({
        ...actual,
        fotos: '',
      }))
    } catch (error) {
      nuevasFotos.forEach((foto) => {
        URL.revokeObjectURL(foto.preview)
      })

      setErrores((actual) => ({
        ...actual,
        fotos: 'No fue posible procesar una de las fotografías.',
      }))
    }

    e.target.value = ''
  }

  // Eliminar una fotografía.
  function eliminarFoto(indice) {
    setFotos((actuales) => {
      const foto = actuales[indice]

      if (foto) {
        URL.revokeObjectURL(foto.preview)
      }

      return actuales.filter((_, i) => i !== indice)
    })
  }

  // Registrar el reporte.
  function enviarReporte(e) {
    e.preventDefault()

    if (cargando || !formularioValido) return

    const barrioSeleccionado = BARRIOS.find(
      (barrio) => barrio.nombre === formulario.barrio
    )

    const grupoSeleccionado = GRUPOS.find(
      (grupo) =>
        Number(grupo.codigo) === Number(formulario.grupo)
    )

    if (!barrioSeleccionado || !grupoSeleccionado) {
      setErrores({
        general:
          'No pudimos identificar el barrio o el tipo de emergencia. Revísalos e inténtalo de nuevo.',
      })

      return
    }

    setCargando(true)

    try {
      const esGrupo300 = grupoSeleccionado.codigo === 300

      const nuevoReporte = agregarReporte({
        nombres: formulario.nombres.trim(),
        apellidos: formulario.apellidos.trim(),
        telefono: formulario.telefono.trim(),

        grupo: grupoSeleccionado.codigo,
        grupoNombre: grupoSeleccionado.nombre,
        descripcion: formulario.descripcion.trim(),

        direccion: formulario.direccion.trim(),
        barrio: barrioSeleccionado.nombre,
        referencia: formulario.referencia.trim(),
        edificioNoAplica: formulario.edificioNoAplica,
        edificio: formulario.edificioNoAplica
          ? 'No aplica'
          : formulario.edificio.trim(),

        // Ubicación aproximada: coordenadas del barrio (data/barrios.js).
        lat: barrioSeleccionado.lat,
        lng: barrioSeleccionado.lng,
        ubicacionExacta: false,

        fotos: fotos.map(({ nombre, src }) => ({ nombre, src })),

        // Solo el grupo 300 lleva preguntas de continuación.
        datosGrupo300: esGrupo300
          ? {
              sexo: datos300.sexo || null,
              edad: datos300.edadDesconocida || datos300.edad === ''
                ? null
                : Number(datos300.edad),
              edadDesconocida: datos300.edadDesconocida,
              consciente: datos300.consciente || null,
              respira: datos300.respira || null,
            }
          : null,
      })

      setConfirmacion(nuevoReporte)
    } catch (error) {
      console.error('Error al registrar el reporte:', error)

      setErrores({
        general:
          error.message ||
          'No fue posible registrar el reporte. Inténtalo nuevamente o llama al 119.',
      })
    } finally {
      setCargando(false)
    }
  }

  // Pantalla de confirmación. Se lee el reporte del estado global para que el
  // estado cambie cuando el operador lo actualiza.
  if (confirmacion) {
    const reporte = obtenerReporte(confirmacion.id) ?? confirmacion

    return (
      <main className="reporte-page reporte-confirmacion">

        <header className="reporte-header">
          <Link to="/" className="reporte-logo">
            <span className="logo-marca">119</span>
            <span>BOMBEROS <strong>CALI</strong></span>
          </Link>

          <a href="tel:119" className="reporte-llamada">
            Llamar al 119
          </a>
        </header>

        <section className="confirmacion-card">

          <div className="confirmacion-icono">✓</div>

          <span className="seccion-etiqueta">
            LÍNEA 119 · BOMBEROS CALI
          </span>

          <h1>Reporte recibido</h1>

          <p>
            La información de la emergencia quedó registrada.
            Mantén tu teléfono disponible.
          </p>

          <div className="radicado">
            <span>NÚMERO DE RADICADO</span>
            <strong>{reporte.radicado}</strong>
          </div>

          <div className="confirmacion-datos">

            <div>
              <span>Tipo de emergencia</span>
              <strong>{reporte.grupoNombre}</strong>
            </div>

            <div>
              <span>Barrio</span>
              <strong>{reporte.barrio}</strong>
            </div>

            <div>
              <span>Fecha y hora de recepción</span>
              <strong>
                {new Date(reporte.fechaCreacion).toLocaleString('es-CO')}
              </strong>
            </div>

            <div>
              <span>Estado actual</span>
              <strong
                className={`estado-reporte estado-${reporte.estado
                  .toLowerCase()
                  .replaceAll(' ', '-')}`}
              >
                {reporte.estado}
              </strong>
            </div>

          </div>

          <p className="confirmacion-estado" role="status">
            {MENSAJES_ESTADO[reporte.estado]}
            {reporte.estado === 'Unidad despachada' && reporte.unidad
              ? ` Unidad asignada: ${reporte.unidad}.`
              : ''}
          </p>

          <div className="confirmacion-aviso">
            <strong>Importante:</strong> si la situación requiere
            atención inmediata, llama directamente al 119.
            Este formulario no reemplaza la llamada de emergencia.
          </div>

          <a className="boton-llamar" href="tel:119">
            Llamar al 119
          </a>

          <Link to="/" className="formulario-regresar">
            Volver al inicio
          </Link>

        </section>
      </main>
    )
  }

  return (
    <main className="reporte-page">

      {/* ENCABEZADO */}
      <header className="reporte-header">

        <Link to="/" className="reporte-logo">
          <span className="logo-marca">119</span>
          <span>BOMBEROS <strong>CALI</strong></span>
        </Link>

        <a href="tel:119" className="reporte-llamada">
          <span aria-hidden="true">☎</span>
          Llamar al 119
        </a>

      </header>

      {/* INTRODUCCIÓN */}
      <section className="reporte-intro">

        <span className="seccion-etiqueta">
          CENTRO DE EMERGENCIAS
        </span>

        <h1>
          Reportar una <span>emergencia.</span>
        </h1>

        <p>
          Completa los datos esenciales. Te tomará menos de un minuto.
        </p>

        <div className="reporte-alerta">

          <span className="alerta-icono">!</span>

          <div>
            <strong>¿Hay peligro inmediato?</strong>
            <span>
              Llama al 119. No esperes a completar este formulario.
            </span>
          </div>

          <a href="tel:119">119</a>

        </div>
      </section>

      {/* FORMULARIO */}
      <form
        className="formulario-emergencia"
        onSubmit={enviarReporte}
        noValidate
      >

        {/* SECCIÓN 1: EMERGENCIA */}
        <section className="formulario-seccion">

          <div className="formulario-titulo">

            <span className="paso-numero">01</span>

            <div>
              <h2>¿Qué está pasando?</h2>
              <p>
                Indica el tipo de emergencia y describe lo esencial.
              </p>
            </div>

          </div>

          <label className="campo">
            Tipo de emergencia <b>*</b>

            <select
              name="grupo"
              value={formulario.grupo}
              onChange={cambiarCampo}
              onBlur={() => tocar('grupo')}
              aria-invalid={Boolean(mensaje('grupo'))}
            >
              <option value="">Selecciona una opción</option>

              {GRUPOS.map((grupo) => (
                <option
                  key={grupo.codigo}
                  value={grupo.codigo}
                >
                  {grupo.codigo} · {grupo.nombre}
                </option>
              ))}
            </select>

            {mensaje('grupo') && (
              <small>{mensaje('grupo')}</small>
            )}
          </label>

          <label className="campo">
            Describe brevemente la situación <b>*</b>

            <textarea
              name="descripcion"
              value={formulario.descripcion}
              onChange={cambiarCampo}
              onBlur={() => tocar('descripcion')}
              placeholder="Ej. Se presenta un incendio en una vivienda del segundo piso..."
              rows={3}
              maxLength={500}
              aria-invalid={Boolean(mensaje('descripcion'))}
            />

            <span className="campo-contador">
              {formulario.descripcion.length}/500
            </span>

            {mensaje('descripcion') && (
              <small>{mensaje('descripcion')}</small>
            )}
          </label>

          {/* EXTRA: preguntas de continuación del grupo 300 */}
          {Number(formulario.grupo) === 300 && (
            <PreguntasGrupo300
              datos={datos300}
              onCambiar={cambiarDatos300}
              errorEdad={erroresCampos.edad}
            />
          )}

        </section>

        {/* SECCIÓN 2: UBICACIÓN */}
        <section className="formulario-seccion">

          <div className="formulario-titulo">

            <span className="paso-numero">02</span>

            <div>
              <h2>¿Dónde ocurre?</h2>
              <p>
                Una ubicación clara permite orientar la atención.
              </p>
            </div>

          </div>

          <div className="formulario-grid">

            <label className="campo campo-ancho">
              Dirección o lugar <b>*</b>

              <input
                name="direccion"
                value={formulario.direccion}
                onChange={cambiarCampo}
                onBlur={() => tocar('direccion')}
                placeholder="Ej. Calle 5 # 20-30"
                autoComplete="street-address"
                aria-invalid={Boolean(mensaje('direccion'))}
              />

              {mensaje('direccion') && (
                <small>{mensaje('direccion')}</small>
              )}
            </label>

            <label className="campo">
              Barrio <b>*</b>

              <select
                name="barrio"
                value={formulario.barrio}
                onChange={cambiarCampo}
                onBlur={() => tocar('barrio')}
                aria-invalid={Boolean(mensaje('barrio'))}
              >
                <option value="">Selecciona el barrio</option>

                {BARRIOS.map((barrio) => (
                  <option
                    key={barrio.nombre}
                    value={barrio.nombre}
                  >
                    {barrio.nombre}
                  </option>
                ))}
              </select>

              {mensaje('barrio') && (
                <small>{mensaje('barrio')}</small>
              )}
            </label>

            <label className="campo">
              Punto de referencia <b>*</b>

              <input
                name="referencia"
                value={formulario.referencia}
                onChange={cambiarCampo}
                onBlur={() => tocar('referencia')}
                placeholder="Ej. Frente al parque"
                aria-invalid={Boolean(mensaje('referencia'))}
              />

              {mensaje('referencia') && (
                <small>{mensaje('referencia')}</small>
              )}
            </label>

            <div className="campo">
              <label htmlFor="edificio">
                Nombre del edificio <b>*</b>
              </label>

              <input
                id="edificio"
                name="edificio"
                value={formulario.edificio}
                onChange={cambiarCampo}
                onBlur={() => tocar('edificio')}
                placeholder={
                  formulario.edificioNoAplica
                    ? 'No aplica'
                    : 'Ej. Edificio Torre Sur'
                }
                disabled={formulario.edificioNoAplica}
                aria-invalid={Boolean(mensaje('edificio'))}
              />

              <label className="campo-casilla">
                <input
                  type="checkbox"
                  name="edificioNoAplica"
                  checked={formulario.edificioNoAplica}
                  onChange={cambiarCampo}
                />
                No aplica
              </label>

              {mensaje('edificio') && (
                <small>{mensaje('edificio')}</small>
              )}
            </div>

          </div>

        </section>

        {/* SECCIÓN 3: CONTACTO */}
        <section className="formulario-seccion">

          <div className="formulario-titulo">

            <span className="paso-numero">03</span>

            <div>
              <h2>¿Cómo te contactamos?</h2>
              <p>
                Usaremos estos datos si necesitamos confirmar información.
              </p>
            </div>

          </div>

          <div className="formulario-grid">

            <label className="campo">
              Celular de contacto <b>*</b>

              <input
                name="telefono"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                value={formulario.telefono}
                onChange={(e) => {
                  const telefono = e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 10)

                  setFormulario((actual) => ({
                    ...actual,
                    telefono,
                  }))

                  setErrores((actual) => ({ ...actual, general: '' }))
                }}
                onBlur={() => tocar('telefono')}
                placeholder="Ej. 3001234567"
                aria-invalid={Boolean(mensaje('telefono'))}
              />

              {mensaje('telefono') && (
                <small>{mensaje('telefono')}</small>
              )}
            </label>

            <label className="campo">
              Nombres <b>*</b>

              <input
                name="nombres"
                value={formulario.nombres}
                onChange={cambiarCampo}
                onBlur={() => tocar('nombres')}
                placeholder="Nombres de quien reporta"
                autoComplete="given-name"
                aria-invalid={Boolean(mensaje('nombres'))}
              />

              {mensaje('nombres') && (
                <small>{mensaje('nombres')}</small>
              )}
            </label>

            <label className="campo">
              Apellidos <b>*</b>

              <input
                name="apellidos"
                value={formulario.apellidos}
                onChange={cambiarCampo}
                onBlur={() => tocar('apellidos')}
                placeholder="Apellidos de quien reporta"
                autoComplete="family-name"
                aria-invalid={Boolean(mensaje('apellidos'))}
              />

              {mensaje('apellidos') && (
                <small>{mensaje('apellidos')}</small>
              )}
            </label>

          </div>

        </section>

        {/* SECCIÓN 4: FOTOGRAFÍAS */}
        <section className="formulario-seccion formulario-evidencia">

          <div className="formulario-titulo">

            <span className="paso-numero">+</span>

            <div>
              <h2>Agregar fotografías</h2>
              <p>
                Opcional. Adjunta imágenes solo si puedes hacerlo sin ponerte en riesgo.
              </p>
            </div>

          </div>

          <label className="subir-fotos">

            <span className="subir-fotos-icono">＋</span>

            <span>
              <strong>Seleccionar fotografías</strong>
              <small>
                Máximo 3 imágenes · 10 MB por imagen
              </small>
            </span>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={seleccionarFotos}
            />

          </label>

          {errores.fotos && (
            <small className="error-fotos">
              {errores.fotos}
            </small>
          )}

          {fotos.length > 0 && (
            <div className="fotos-preview">

              {fotos.map((foto, indice) => (
                <div
                  className="foto-item"
                  key={foto.preview}
                >
                  <img
                    src={foto.preview}
                    alt={foto.nombre}
                  />

                  <button
                    type="button"
                    onClick={() => eliminarFoto(indice)}
                    aria-label={`Eliminar ${foto.nombre}`}
                  >
                    ×
                  </button>

                  <span>{foto.nombre}</span>
                </div>
              ))}

            </div>
          )}

        </section>

        {/* ERRORES GENERALES */}
        {errores.general && (
          <p className="error-general" role="alert">
            {errores.general}
          </p>
        )}

        {/* BOTÓN DE ENVÍO */}
        <div className="formulario-final">

          <p>
            <b>*</b> Campos obligatorios.{' '}
            {formularioValido
              ? 'Todo listo para enviar.'
              : 'El botón se activa cuando completes todos.'}{' '}
            Si no puedes completar el formulario, llama al 119.
          </p>

          <button
            type="submit"
            disabled={cargando || !formularioValido}
            className="boton-enviar"
          >
            {cargando
              ? 'Registrando reporte...'
              : 'Enviar reporte'}

            {!cargando && <span>→</span>}
          </button>

          <Link to="/" className="formulario-regresar">
            Cancelar y volver al inicio
          </Link>

        </div>

      </form>
    </main>
  )
}