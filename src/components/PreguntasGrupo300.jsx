// Preguntas de continuación del grupo 300 (Rescates y emergencias médicas):
// sexo y edad, ¿consciente? y ¿respira?
// Solo recopilan información para el operador; no hacen diagnóstico.

export const DATOS_GRUPO_300_INICIAL = {
  sexo: '',
  edad: '',
  edadDesconocida: false,
  consciente: '',
  respira: '',
}

const SEXOS = ['Masculino', 'Femenino', 'No se conoce']
const RESPUESTAS = ['Sí', 'No', 'No se sabe']

function GrupoOpciones({ nombre, titulo, opciones, valor, onCambiar }) {
  return (
    <fieldset className="g300-pregunta">
      <legend>{titulo}</legend>

      <div className="g300-opciones">
        {opciones.map((opcion) => (
          <label
            key={opcion}
            className={`g300-opcion ${valor === opcion ? 'activa' : ''}`}
          >
            <input
              type="radio"
              name={nombre}
              value={opcion}
              checked={valor === opcion}
              onChange={() => onCambiar({ [nombre]: opcion })}
            />
            {opcion}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function PreguntasGrupo300({ datos, onCambiar, errorEdad }) {
  return (
    <div className="g300" role="group" aria-label="Preguntas del grupo 300">
      <div className="g300-cabecera">
        <span className="g300-etiqueta">GRUPO 300</span>
        <strong>Sobre la persona afectada</strong>
        <small>
          Responde lo que puedas ver. Si no lo sabes, elige «No se sabe».
        </small>
      </div>

      <GrupoOpciones
        nombre="sexo"
        titulo="Sexo"
        opciones={SEXOS}
        valor={datos.sexo}
        onCambiar={onCambiar}
      />

      <div className="g300-pregunta">
        <label className="campo" htmlFor="g300-edad">
          Edad (años)
          <input
            id="g300-edad"
            name="edad"
            type="number"
            inputMode="numeric"
            min="0"
            max="120"
            value={datos.edadDesconocida ? '' : datos.edad}
            disabled={datos.edadDesconocida}
            placeholder={datos.edadDesconocida ? 'No se conoce' : 'Ej. 35'}
            aria-invalid={Boolean(errorEdad)}
            onChange={(e) => onCambiar({ edad: e.target.value })}
          />
          {errorEdad && <small>{errorEdad}</small>}
        </label>

        <label className="g300-casilla">
          <input
            type="checkbox"
            checked={datos.edadDesconocida}
            onChange={(e) =>
              onCambiar({ edadDesconocida: e.target.checked, edad: '' })
            }
          />
          No conozco la edad
        </label>
      </div>

      <GrupoOpciones
        nombre="consciente"
        titulo="¿La persona está consciente?"
        opciones={RESPUESTAS}
        valor={datos.consciente}
        onCambiar={onCambiar}
      />

      <GrupoOpciones
        nombre="respira"
        titulo="¿La persona está respirando?"
        opciones={RESPUESTAS}
        valor={datos.respira}
        onCambiar={onCambiar}
      />
    </div>
  )
}
