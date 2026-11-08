# Línea 119 · Bomberos Cali — Prototipo web

Aplicación web (React + Vite) que simula el flujo completo de un reporte de emergencia:
**landing → reporte del ciudadano → tablero del radio operador → validación → despacho → cierre**,
con un mapa real de Cali (Leaflet + OpenStreetMap) y una escena 3D (React Three Fiber).

- **Integrantes:** _(completar nombres y códigos)_
- **Sitio desplegado:** _(completar con el enlace de Vercel o Netlify)_

## Cómo correrlo

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build de producción en /dist
npm run preview   # previsualizar el build
```

Para probar el flujo, abre `/reportar` y luego `/operador` en el **mismo navegador**.
Si abres cada ruta en una pestaña distinta, el estado se sincroniza con el evento `storage`.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/` | Landing: botón «Reportar emergencia», «Llamar al 119», escena 3D y los 7 grupos de emergencia |
| `/reportar` | Interrogatorio inicial, fotos y confirmación con estado en vivo |
| `/operador` | Mapa, lista, detalle, validar/descartar, despachar, cerrar y desprendible |

## Estructura

| Archivo | Qué hace |
| --- | --- |
| `src/context/ReportesContext.jsx` | Único estado global de reportes y única escritura en `localStorage` (clave `bomberos119_reportes`). Genera `id` y radicado único, valida y actualiza reportes, y escucha el evento `storage` |
| `src/pages/Reportar.jsx` | Formulario controlado con validación; el botón «Enviar reporte» se activa solo con todos los obligatorios completos |
| `src/pages/Operador.jsx` | Indicadores, búsqueda, filtros por estado y grupo, detalle y flujo de gestión |
| `src/mapa/MapaOperador.jsx` | Mapa Leaflet conectado a los reportes reales; `pin--pulso` para Recibido y `pin--apagado` para Cerrado/Descartado |
| `src/components/TarjetaGrupo.jsx` | Tarjeta de cada grupo de emergencia (landing) |
| `src/components/PreguntasGrupo300.jsx` | Extra: sexo, edad, ¿consciente?, ¿respira? |
| `src/components/Desprendible.jsx` | Desprendible de verificación imprimible (`window.print()` + `@media print`) |
| `src/three/EscenaLanding.jsx` | Escena propia: camión de bomberos con `useFrame` e interacción con el mouse |
| `src/data/grupos.js`, `src/data/barrios.js` | Grupos del protocolo y 19 barrios con coordenadas aproximadas |

## Flujo de estados

`Recibido` → `Validado` → `Unidad despachada` → `Cerrado` (o `Recibido` → `Descartado`).

- La **fecha de recepción** (`fechaCreacion`) y la **fecha de validación** (`fechaValidacion`) son distintas y nunca se sobrescriben.
- El botón de despacho solo aparece en reportes `Validado`.
- El **desprendible de verificación** solo se puede abrir cuando el reporte tiene fecha de validación.
- El ciudadano ve en la pantalla de confirmación el estado actualizado por el operador.

## Escena 3D

Camión de bomberos construido solo con geometrías básicas de Three.js (sin modelos ni recursos externos).
`useFrame` hace girar el camión y alterna las luces de emergencia; al pasar el mouse el camión crece
y cambia de color, y al hacer clic se enciende o apaga la sirena.

## Extras implementados

- Preguntas de continuación del grupo 300 (aparecen solo con ese grupo, se guardan en `datosGrupo300` y se ven en el detalle del operador).
- Sincronización entre pestañas con el evento `storage`.
- Filtro por grupo de emergencia en el tablero.

## Respuestas a las 5 preguntas de Bomberos

1. **¿Puede llegarle al radio operador un mapa con la ubicación exacta?**
   *Hecho:* el ciudadano puede compartir su GPS (opcional); si no, se usa la coordenada aproximada del barrio y el detalle lo indica. El mapa muestra cada reporte y el enlace «Ver ubicación en Google Maps».
   *Falta para producción:* backend para que el reporte llegue al operador desde otro dispositivo, mini mapa para marcar el punto exacto y verificación de la precisión del GPS.
2. **¿Puede el ciudadano recibir una respuesta automática?**
   *Hecho:* pantalla de confirmación con radicado, hora y estado, que cambia cuando el operador actualiza el caso.
   *Falta:* notificación fuera de la pantalla (SMS, WhatsApp o push) y un servidor que la envíe.
3. **¿Qué pasa si llegan reportes masivos?**
   *Hecho:* lista ordenada por recepción con búsqueda, filtros por estado y grupo, y pines que se distinguen por estado.
   *Falta:* agrupar reportes cercanos, simular carga, priorizar y una base de datos que soporte el volumen.
4. **¿Puede el operador hacer una videollamada?**
   *No implementado* (fuera de alcance). El operador puede llamar al ciudadano con el botón «Llamar» (`tel:`).
   *Falta:* servicio de video (por ejemplo WebRTC), consentimiento del ciudadano y autenticación del operador.
5. **¿Se pueden enviar varias fotos o videos con recomendaciones?**
   *Hecho:* hasta 3 fotos con miniaturas, validación de tipo y tamaño y compresión antes de guardarlas.
   *Falta:* videos, ventana con recomendaciones para tomarlos y almacenamiento en servidor (`localStorage` tiene un límite de unos 5 MB).

## Pregunta de diseño: ¿qué preguntas del protocolo se pueden omitir con foto, video o videollamada?

- **«¿Dónde es su emergencia?» — punto de referencia y nombre del edificio:** una foto de la fachada o del entorno permite al operador reconocer el lugar sin pedir esos datos por voz.
- **«¿Cuál es su emergencia?» — «¿Qué ve?»:** una foto o video muestra si hay llamas, humo, un vehículo accidentado o una inundación; el operador puede confirmar el grupo sin hacer preguntas adicionales.

_(El equipo debe revisar y ajustar estas respuestas antes de la sustentación.)_

## Limitaciones

- Los datos se guardan en el `localStorage` del navegador: no hay backend, autenticación ni sincronización entre dispositivos. El panel del operador solo ve los reportes guardados en el mismo navegador.
- La ubicación por barrio es aproximada; solo el GPS (si el ciudadano lo autoriza) es más preciso.
- No hay despacho real de unidades ni monitoreo en tiempo real.
- Los datos de prueba deben ser ficticios.
