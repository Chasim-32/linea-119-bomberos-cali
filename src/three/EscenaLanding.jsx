import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { MathUtils } from 'three'
import { useEffect, useRef, useState } from 'react'

// Escena 3D de la landing con React Three Fiber: un camión de bomberos hecho
// solo con geometrías básicas (sin modelos externos).
//
// - useFrame: el camión gira solo y las luces de emergencia parpadean.
// - Interacción con el mouse:
//     onPointerOver → el camión crece un poco y cambia a un rojo más vivo.
//     onClick       → enciende o apaga la sirena (las luces dejan de parpadear).

const ROJO = '#dc2626'
const ROJO_VIVO = '#ff3b3b'
const AMARILLO = '#f5c518'

function Rueda({ position }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.3, 0.3, 0.24, 24]} />
      <meshStandardMaterial color="#111827" roughness={0.9} />
    </mesh>
  )
}

function CamionBomberos() {
  const camion = useRef()
  const luzRoja = useRef()
  const luzAmarilla = useRef()
  const focoRojo = useRef()
  const focoAmarillo = useRef()

  const [encima, setEncima] = useState(false)
  const [sirenaActiva, setSirenaActiva] = useState(true)

  // Al salir de la escena se restaura el cursor.
  useEffect(() => () => {
    document.body.style.cursor = 'auto'
  }, [])

  useFrame((state, delta) => {
    const grupo = camion.current

    // Giro lento, que se detiene mientras el mouse está encima.
    if (!encima) grupo.rotation.y += delta * 0.5

    // Crecimiento suave al pasar el mouse.
    const escala = MathUtils.lerp(grupo.scale.x, encima ? 1.1 : 1, 0.12)
    grupo.scale.setScalar(escala)

    // Luces alternadas: una prende cuando la otra se apaga.
    const t = state.clock.elapsedTime
    const fase = Math.sin(t * 9) > 0
    const rojo = sirenaActiva ? (fase ? 1 : 0.08) : 0.08
    const amarillo = sirenaActiva ? (fase ? 0.08 : 1) : 0.08

    luzRoja.current.material.emissiveIntensity = rojo * 2.5
    luzAmarilla.current.material.emissiveIntensity = amarillo * 2.5
    focoRojo.current.intensity = rojo * 3
    focoAmarillo.current.intensity = amarillo * 3
  })

  return (
    <Float speed={1.5} rotationIntensity={0} floatIntensity={0.35}>
      <group
        ref={camion}
        position={[0, -0.45, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setEncima(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setEncima(false)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          setSirenaActiva((activa) => !activa)
        }}
      >
        {/* El conjunto se desplaza para que gire alrededor de su centro */}
        <group position={[-0.32, 0, 0]}>
          {/* Carrocería trasera */}
          <mesh position={[0, 0.78, 0]}>
            <boxGeometry args={[2.2, 0.95, 1.05]} />
            <meshStandardMaterial
              color={encima ? ROJO_VIVO : ROJO}
              roughness={0.45}
            />
          </mesh>

          {/* Franja blanca */}
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[2.22, 0.12, 1.07]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>

          {/* Cabina */}
          <mesh position={[1.35, 0.7, 0]}>
            <boxGeometry args={[0.85, 0.8, 1.05]} />
            <meshStandardMaterial
              color={encima ? ROJO_VIVO : ROJO}
              roughness={0.45}
            />
          </mesh>

          {/* Parabrisas */}
          <mesh position={[1.78, 0.9, 0]}>
            <boxGeometry args={[0.06, 0.34, 0.85]} />
            <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.2} />
          </mesh>

          {/* Parachoques */}
          <mesh position={[1.8, 0.4, 0]}>
            <boxGeometry args={[0.12, 0.14, 1.1]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>

          {/* Escalera sobre el techo */}
          {[-0.28, 0.28].map((z) => (
            <mesh key={z} position={[0, 1.34, z]}>
              <boxGeometry args={[2, 0.06, 0.07]} />
              <meshStandardMaterial color={AMARILLO} />
            </mesh>
          ))}
          {[-0.8, -0.4, 0, 0.4, 0.8].map((x) => (
            <mesh key={x} position={[x, 1.34, 0]}>
              <boxGeometry args={[0.05, 0.05, 0.6]} />
              <meshStandardMaterial color={AMARILLO} />
            </mesh>
          ))}

          {/* Luces de emergencia sobre la cabina */}
          <mesh ref={luzRoja} position={[1.35, 1.18, 0.3]}>
            <boxGeometry args={[0.2, 0.14, 0.24]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#ef4444"
              emissiveIntensity={2.5}
            />
          </mesh>
          <mesh ref={luzAmarilla} position={[1.35, 1.18, -0.3]}>
            <boxGeometry args={[0.2, 0.14, 0.24]} />
            <meshStandardMaterial
              color={AMARILLO}
              emissive={AMARILLO}
              emissiveIntensity={0.2}
            />
          </mesh>
          <pointLight
            ref={focoRojo}
            position={[1.35, 1.5, 0.3]}
            color="#ef4444"
            distance={4}
          />
          <pointLight
            ref={focoAmarillo}
            position={[1.35, 1.5, -0.3]}
            color={AMARILLO}
            distance={4}
          />

          {/* Ruedas */}
          <Rueda position={[-0.7, 0.3, 0.55]} />
          <Rueda position={[-0.7, 0.3, -0.55]} />
          <Rueda position={[1.3, 0.3, 0.55]} />
          <Rueda position={[1.3, 0.3, -0.55]} />
        </group>
      </group>
    </Float>
  )
}

export default function EscenaLanding() {
  return (
    <div className="escena-3d">
      <Canvas
        camera={{ position: [4, 2.4, 4.6], fov: 38 }}
        style={{ height: 320 }}
        dpr={[1, 1.5]}
        aria-label="Camión de bomberos en 3D"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 2]} intensity={1.3} />

        {/* Piso */}
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.6, 48]} />
          <meshStandardMaterial color="#262626" roughness={1} />
        </mesh>

        <CamionBomberos />
      </Canvas>

      <p className="escena-ayuda">Toca el camión para encender o apagar la sirena</p>
    </div>
  )
}
