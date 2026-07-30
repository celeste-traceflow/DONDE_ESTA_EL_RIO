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
      <button type="button" title="Mostrar/ocultar conexiones (próximamente)">≈</button>
      <button type="button" title="Nuevo post-it (próximamente)">▭+</button>
      <button type="button" title="Editar post-it (próximamente)">▭✎</button>
      <button type="button" title="Nueva cita teórica (próximamente)">❝+</button>
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
