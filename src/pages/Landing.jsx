
import { Link } from 'react-router-dom'
import EscenaLanding from '../three/EscenaLanding.jsx'
import TarjetaGrupo from '../components/TarjetaGrupo.jsx'
import { GRUPOS, EJEMPLOS_GRUPO } from '../data/grupos.js'

export default function Landing() {
  return (
    <main className="landing">

      {/* Navegación */}
      <header className="landing-header">
        <Link to="/" className="brand">
          <span className="brand-symbol">119</span>
          <span className="brand-name">
            LÍNEA <strong>119</strong>
            <small>BOMBEROS CALI</small>
          </span>
        </Link>

        <nav className="landing-nav">
          <a href="#servicios">Servicios</a>
          <a href="#recomendaciones">Recomendaciones</a>
          <Link to="/operador" className="nav-operator">
            Panel operador <span>↗</span>
          </Link>
        </nav>
      </header>

      {/* Hero principal */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-label">
            <span className="status-dot"></span>
            ATENCIÓN DE EMERGENCIAS · CALI
          </div>

          <h1>
            Estamos
            <br />
            contigo en
            <br />
            <span>cada emergencia.</span>
          </h1>

          <p className="hero-description">
            Cuando cada segundo cuenta, estamos preparados para actuar.
            Reporta tu emergencia y permite que nuestro equipo conozca
            lo que está sucediendo.
          </p>

          <div className="hero-actions">
            <Link to="/reportar" className="btn-primary">
              Reportar emergencia <span>↗</span>
            </Link>

            <a href="tel:119" className="btn-secondary">
              Llamar al 119 <span>☎</span>
            </a>
          </div>

          <div className="hero-note">
            <span>119</span>
            <p>Línea de atención para emergencias</p>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-tag visual-tag-top">
            <span className="visual-tag-dot"></span>
            SISTEMA DE ATENCIÓN
          </div>

          <div className="siren-scene">
            <EscenaLanding />
          </div>

          <div className="visual-caption">
            <span>RESPUESTA</span>
            <strong>INMEDIATA</strong>
          </div>

          <div className="visual-number">119</div>
        </div>

        <div className="hero-index">01 / 03 — ATENCIÓN</div>
      </section>

      {/* Franja informativa */}
      <section className="emergency-strip">
        <div>
          <span className="strip-icon">!</span>
          <p>
            <strong>¿Estás ante una emergencia?</strong>
            <span>Proporciona información clara para facilitar la atención.</span>
          </p>
        </div>

        <Link to="/reportar">
          INICIAR REPORTE <span>↗</span>
        </Link>
      </section>

      {/* Servicios */}
      <section className="services-section" id="servicios">
        <div className="section-heading">
          <div>
            <span className="section-kicker">01 — NUESTRA ATENCIÓN</span>
            <h2>
              Preparados para
              <br />
              <span>responder.</span>
            </h2>
          </div>

          <p>
            Estos son los siete grupos de emergencia del protocolo de
            despacho. Elige el que mejor describa lo que ocurre.
          </p>
        </div>

        <div className="services-grid">
          {GRUPOS.map((grupo) => (
            <TarjetaGrupo
              key={grupo.codigo}
              grupo={grupo}
              ejemplos={EJEMPLOS_GRUPO[grupo.codigo]}
            />
          ))}
        </div>
      </section>

      {/* Recomendaciones */}
      <section className="recommendations-section" id="recomendaciones">
        <div className="recommendations-intro">
          <span className="section-kicker">02 — ANTES DE REPORTAR</span>
          <h2>
            Tu información
            <br />
            <span>hace la diferencia.</span>
          </h2>
          <p>
            Para facilitar la atención, procura compartir información
            precisa sobre lo que está ocurriendo.
          </p>
          <Link to="/reportar" className="recommendation-link">
            Reportar ahora <span>↗</span>
          </Link>
        </div>

        <div className="recommendations-list">
          <article className="recommendation-item">
            <span>01</span>
            <div>
              <h3>Identifica el lugar</h3>
              <p>Indica la dirección, barrio y puntos de referencia.</p>
            </div>
          </article>

          <article className="recommendation-item">
            <span>02</span>
            <div>
              <h3>Describe lo sucedido</h3>
              <p>Explica qué ocurre y qué tipo de emergencia observas.</p>
            </div>
          </article>

          <article className="recommendation-item">
            <span>03</span>
            <div>
              <h3>Comparte un contacto</h3>
              <p>Proporciona un teléfono para facilitar la comunicación.</p>
            </div>
          </article>

          <article className="recommendation-item">
            <span>04</span>
            <div>
              <h3>Mantente en un lugar seguro</h3>
              <p>No te expongas al peligro mientras llega la ayuda.</p>
            </div>
          </article>
        </div>
      </section>

      {/* Cierre */}
      <section className="landing-cta">
        <span className="section-kicker">LÍNEA 119 · CALI</span>
        <h2>
          La atención
          <br />
          comienza contigo.
        </h2>
        <Link to="/reportar" className="btn-cta">
          Reportar una emergencia <span>↗</span>
        </Link>
        <div className="cta-number">119</div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <Link to="/" className="footer-brand">
          LÍNEA <strong>119</strong>
        </Link>
        <p>Plataforma de reporte y gestión de emergencias · Bomberos Cali</p>
        <Link to="/operador">Acceso radio operador ↗</Link>
      </footer>

    </main>
  )
}
