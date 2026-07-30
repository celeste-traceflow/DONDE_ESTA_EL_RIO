const CATEGORIAS_TAGS = [
  'MEDIO',
  'OBJETOS',
  'PERSONA',
  'ESCENARIO',
  'COLORES',
  'ILUMINACIÓN',
  'COMPOSICIÓN',
  'TEXTURA',
  'POSTURA',
]

function parsearTags(texto) {
  const filas = {}
  texto.split('\n').forEach((linea) => {
    const idx = linea.indexOf(':')
    if (idx === -1) return
    const categoria = linea.slice(0, idx).trim().toUpperCase()
    const valor = linea.slice(idx + 1).trim()
    filas[categoria] = valor
  })
  return CATEGORIAS_TAGS.map((categoria) => ({ categoria, valor: filas[categoria] || '—' }))
}

function escaparHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

export function abrirTarjetaCentrada(recuerdo, { onCerrar } = {}) {
  const filas = parsearTags(recuerdo.tags_algoritmicas)

  const overlay = document.createElement('div')
  overlay.className = 'tarjeta-centrada-overlay'
  overlay.innerHTML = `
    <div class="tc-contenido">
      <div class="tc-tags">
        <div class="tc-tags-header">
          <span>Tags algorítmicas</span>
          <span class="tc-tags-controles">
            <button type="button" title="Editar (próximamente)">✎</button>
            <button type="button" title="Exportar (próximamente)">⊞</button>
            <button type="button" data-accion="cerrar" title="Cerrar">✕</button>
          </span>
        </div>
        <table>
          ${filas.map((f) => `<tr><th>${f.categoria}</th><td>${escaparHtml(f.valor)}</td></tr>`).join('')}
        </table>
      </div>

      <div class="tc-foto foto-marco">
        <img src="/images/${encodeURIComponent(recuerdo.archivo)}" alt="">
      </div>

      <div class="tc-recuerdo">
        <p>${escaparHtml(recuerdo.recuerdo_afectivo)}</p>
        <span class="marca-coordenada">${escaparHtml(recuerdo.lugar_y_fecha)}</span>
      </div>
    </div>

    <div class="tc-menu-operativo">
      <button type="button" title="Mostrar/ocultar conexiones (próximamente)">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 8.5c1.5 2 3.3 2 4.8 0s3.3-2 4.8 0 3.3 2 4.8 0 3.3-2 4.8 0"/>
          <path d="M2 15.5c1.5 2 3.3 2 4.8 0s3.3-2 4.8 0 3.3 2 4.8 0 3.3-2 4.8 0"/>
        </svg>
      </button>
      <span class="tc-menu-separador"></span>
      <button type="button" title="Nuevo post-it (próximamente)">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 3h9l5 5v13H5z"/>
          <path d="M14 3v5h5"/>
          <path d="M12 11.5v6M9 14.5h6"/>
        </svg>
      </button>
      <span class="tc-menu-separador"></span>
      <button type="button" title="Editar post-it (próximamente)">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 3h8l4 4v13H4z"/>
          <path d="M12 3v4h4"/>
          <path d="M13 15l5.5-5.5 2 2L15 17l-2.6.6z"/>
        </svg>
      </button>
      <span class="tc-menu-separador"></span>
      <button type="button" title="Nueva cita teórica (próximamente)">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 8c0-2 1.3-3.2 3-3.2M4 8c0 1.8.9 2.8 2.2 3M8.4 8c0-2 1.3-3.2 3-3.2M8.4 8c0 1.8.9 2.8 2.2 3"/>
          <path d="M13 12h7v8h-7z"/>
          <path d="M16.5 14.3v3.4M14.8 16h3.4"/>
        </svg>
      </button>
    </div>
  `

  function cerrar() {
    overlay.remove()
    onCerrar?.()
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cerrar()
  })
  overlay.querySelector('[data-accion="cerrar"]').addEventListener('click', cerrar)

  document.body.appendChild(overlay)

  return { cerrar }
}
