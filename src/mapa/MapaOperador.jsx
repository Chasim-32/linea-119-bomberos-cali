
import { useEffect, useRef } from 'react'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  useMap,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'
import './mapa.css'

import { crearIcono } from './iconos.js'
import { GRUPOS, colorDeGrupo } from '../data/grupos.js'

const CENTRO_CALI = [3.437, -76.522]

export default function MapaOperador({
  reportes = [],
  seleccionadoId = null,
  onSeleccionar,
}) {
  const marcadorRefs = useRef({})

  const seleccionado = reportes.find(
    (reporte) => reporte.id === seleccionadoId
  )

  return (
    <MapContainer
      center={CENTRO_CALI}
      zoom={13}
      scrollWheelZoom
      style={{ width: '100%', height: '100%' }}
    >
      <LayersControl position="topright">

        <LayersControl.BaseLayer checked name="Calles">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Vista oscura">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>

      </LayersControl>

      {/* MARCADORES DE EMERGENCIAS */}
      {reportes.map((reporte) => {
        const esSeleccionado = reporte.id === seleccionadoId

        const esFinalizado = [
          'Cerrado',
          'Descartado',
        ].includes(reporte.estado)

        const clases = [
          reporte.estado === 'Recibido' ? 'pin--pulso' : '',
          esFinalizado ? 'pin--apagado' : '',
        ].filter(Boolean).join(' ')

        return (
          <Marker
            key={reporte.id}
            ref={(ref) => {
              if (ref) marcadorRefs.current[reporte.id] = ref
              else delete marcadorRefs.current[reporte.id]
            }}
            position={[reporte.lat, reporte.lng]}
            icon={crearIcono(
              colorDeGrupo(reporte.grupo),
              {
                seleccionado: esSeleccionado,
                clases,
              }
            )}
            eventHandlers={{
              click: () => onSeleccionar?.(reporte.id),
            }}
          >
            <Popup>
              <div className="mapa-popup">
                <strong>
                  {reporte.nombres} {reporte.apellidos}
                </strong>

                <span>
                  {reporte.grupo} · {reporte.grupoNombre || 'Emergencia'}
                </span>

                <p>{reporte.descripcion}</p>

                <span><strong>Barrio:</strong> {reporte.barrio}</span>
                <span><strong>Estado:</strong> {reporte.estado}</span>
                {!reporte.ubicacionExacta && (
                  <span><em>Ubicación aproximada por barrio</em></span>
                )}
                <span><strong>Radicado:</strong> {reporte.radicado}</span>
              </div>
            </Popup>
          </Marker>
        )
      })}

      <ControlSeleccionado
        reporte={seleccionado}
        marcadorRefs={marcadorRefs}
      />

      <Leyenda reportes={reportes} />

    </MapContainer>
  )
}

// Centrar el mapa y abrir el popup del reporte seleccionado.
function ControlSeleccionado({ reporte, marcadorRefs }) {
  const map = useMap()

  const id = reporte?.id
  const lat = reporte?.lat
  const lng = reporte?.lng

  // Depende de id/lat/lng y no del objeto completo: así un cambio de estado
  // no vuelve a mover el mapa.
  useEffect(() => {
    if (!id) return

    map.flyTo([lat, lng], 16, { duration: 0.8 })

    const marcador = marcadorRefs.current[id]

    if (marcador) {
      marcador.openPopup()
    }
  }, [id, lat, lng, map, marcadorRefs])

  return null
}

// Leyenda con grupos y cantidades.
function Leyenda({ reportes }) {
  return (
    <div className="leaflet-bottom leaflet-left">
      <div className="leaflet-control leyenda">

        <div className="leyenda__titulo">
          EMERGENCIAS · {reportes.length}
        </div>

        {GRUPOS.map((grupo) => {
          const cantidad = reportes.filter(
            (reporte) => reporte.grupo === grupo.codigo
          ).length

          return (
            <div
              key={grupo.codigo}
              className="leyenda__fila"
              style={{ opacity: cantidad ? 1 : 0.45 }}
            >
              <span
                className="leyenda__punto"
                style={{ background: grupo.color }}
              />

              <span className="leyenda__codigo">
                {grupo.codigo}
              </span>

              <span className="leyenda__nombre">
                {grupo.nombre}
              </span>

              <strong>{cantidad}</strong>
            </div>
          )
        })}

        <div className="leyenda__estados">
          <span><i className="estado-pulso" /> Recibido</span>
          <span><i className="estado-apagado" /> Finalizado</span>
        </div>

      </div>
    </div>
  )
}
