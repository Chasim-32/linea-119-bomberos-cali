// Tarjeta de un grupo de emergencia (código, nombre, ejemplos y color).
// El color viene de data/grupos.js, el mismo que usa el mapa.
export default function TarjetaGrupo({ grupo, ejemplos }) {
  return (
    <article className="grupo-card" style={{ '--grupo-color': grupo.color }}>
      <span className="grupo-codigo">{grupo.codigo}</span>
      <h3>{grupo.nombre}</h3>
      {ejemplos && <p>{ejemplos}</p>}
    </article>
  )
}
