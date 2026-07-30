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

const ICONO_CONEXIONES = `
  <path fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" d="M22.68,43.69c21.86-21.86,32.79,21.86,54.65,0"/>
  <path fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" d="M22.68,56.31c21.86-21.86,32.79,21.86,54.65,0"/>
`

const ICONO_NUEVO_POSTIT = `
  <polyline fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" points="30.77 36.26 37.36 36.26 37.36 25.27 25.27 36.26"/>
  <line fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" x1="37.36" y1="25.27" x2="74.73" y2="25.27"/>
  <polyline fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" points="74.73 25.27 74.73 74.73 25.27 74.73 25.27 36.26"/>
  <line fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" x1="42.68" y1="51.93" x2="60.62" y2="51.93"/>
  <line fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" x1="51.65" y1="60.9" x2="51.65" y2="42.96"/>
`

const ICONO_EDITAR_POSTIT = `
  <path fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" d="M79.67,29.12h0c0-.7-.28-1.38-.78-1.88l-6.14-6.14c-.5-.5-1.17-.78-1.88-.78h0c-.7,0-1.38.28-1.88.78l-22.3,22.3v9.89h9.89l22.3-22.3c.5-.5.78-1.17.78-1.88Z"/>
  <line fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" x1="64.84" y1="25.27" x2="74.73" y2="35.16"/>
  <polyline fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" points="25.82 41.21 32.42 41.21 32.42 30.22 20.33 41.21"/>
  <line fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" x1="32.42" y1="30.22" x2="53.3" y2="30.22"/>
  <polyline fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" points="69.78 46.7 69.78 79.67 20.33 79.67 20.33 41.21"/>
`

const ICONO_NUEVA_CITA = `
  <polyline fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" points="54.64 31.05 79.57 31.05 79.57 76.91 33.71 76.91 33.71 51.99"/>
  <line fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" x1="65.61" y1="53.98" x2="47.67" y2="53.98"/>
  <line fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" x1="56.64" y1="45.01" x2="56.64" y2="62.95"/>
  <path fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" d="M33.71,41.33c0,1.77-.58,3.17-1.73,4.21-1.15,1.04-2.62,1.56-4.39,1.56-2.08,0-3.79-.69-5.14-2.08-1.35-1.39-2.02-3.42-2.02-6.12,0-2.54.36-4.71,1.1-6.52.73-1.81,1.62-3.35,2.66-4.62,1.04-1.27,2.12-2.29,3.23-3.06,1.11-.77,2.09-1.31,2.94-1.62l2.89,4.04c-1.69.85-3.06,1.98-4.1,3.41-1.04,1.43-1.56,3.22-1.56,5.37.31-.08.73-.12,1.27-.12,1.54,0,2.73.54,3.58,1.62.85,1.08,1.27,2.39,1.27,3.92ZM50.57,41.33c0,1.77-.58,3.17-1.73,4.21-1.15,1.04-2.62,1.56-4.39,1.56-2.08,0-3.79-.69-5.14-2.08-1.35-1.39-2.02-3.42-2.02-6.12,0-2.54.36-4.71,1.09-6.52.73-1.81,1.62-3.35,2.66-4.62,1.04-1.27,2.12-2.29,3.23-3.06,1.12-.77,2.09-1.31,2.94-1.62l2.89,4.04c-1.69.85-3.06,1.98-4.1,3.41-1.04,1.43-1.56,3.22-1.56,5.37.31-.08.73-.12,1.27-.12,1.54,0,2.73.54,3.58,1.62.85,1.08,1.27,2.39,1.27,3.92Z"/>
`

// Flechas de navegación — dibujadas en el mismo lenguaje visual (línea, #ede5d3,
// stroke-width 2.17) hasta que Cele pase el ícono de flecha propio del diseño.
const ICONO_FLECHA_IZQ = `
  <polyline fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" points="60 25 35 50 60 75"/>
`
const ICONO_FLECHA_DER = `
  <polyline fill="none" stroke="#ede5d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.17" points="40 25 65 50 40 75"/>
`

function svg(contenido, tamaño = 20) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${tamaño}" height="${tamaño}">${contenido}</svg>`
}

// Contorno tipo estampilla postal: perforaciones semicirculares a lo largo de
// todo el perímetro, calculadas según el ancho/alto real del elemento (se
// adapta solo al largo de cada recuerdo escrito).
function pathEstampilla(w, h, radio) {
  const nTop = Math.max(3, Math.round(w / (2 * radio)))
  const nLado = Math.max(3, Math.round(h / (2 * radio)))
  const stepX = w / nTop
  const stepY = h / nLado

  let d = `M 0 0`
  for (let i = 1; i <= nTop; i++) d += ` A ${stepX / 2} ${stepX / 2} 0 0 0 ${i * stepX} 0`
  for (let i = 1; i <= nLado; i++) d += ` A ${stepY / 2} ${stepY / 2} 0 0 0 ${w} ${i * stepY}`
  for (let i = 1; i <= nTop; i++) d += ` A ${stepX / 2} ${stepX / 2} 0 0 0 ${w - i * stepX} ${h}`
  for (let i = 1; i <= nLado; i++) d += ` A ${stepY / 2} ${stepY / 2} 0 0 0 0 ${h - i * stepY}`
  return d + ' Z'
}

function aplicarBordeEstampilla(el, radio = 7) {
  const w = el.offsetWidth
  const h = el.offsetHeight
  if (!w || !h) return
  el.style.clipPath = `path('${pathEstampilla(w, h, radio)}')`
}

export function abrirTarjetaCentrada(secuencia, indiceInicial, { onCerrar } = {}) {
  let indice = indiceInicial
  let observadorRecuerdo = null

  const overlay = document.createElement('div')
  overlay.className = 'tarjeta-centrada-overlay'
  document.body.appendChild(overlay)

  function cerrar() {
    observadorRecuerdo?.disconnect()
    overlay.remove()
    onCerrar?.()
  }

  function irA(nuevoIndice) {
    indice = (nuevoIndice + secuencia.length) % secuencia.length
    render()
  }

  function render() {
    const recuerdo = secuencia[indice]
    const filas = parsearTags(recuerdo.tags_algoritmicas)

    overlay.innerHTML = `
      <button type="button" class="tc-flecha tc-flecha-izq" title="Recuerdo anterior">${svg(ICONO_FLECHA_IZQ, 22)}</button>

      <div class="tc-contenido">
        <div class="tc-foto foto-marco">
          <img src="/images/${encodeURIComponent(recuerdo.archivo)}" alt="">
        </div>

        <div class="tc-detalle">
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

          <div class="tc-recuerdo">
            <p>${escaparHtml(recuerdo.recuerdo_afectivo)}</p>
            <span class="marca-coordenada">${escaparHtml(recuerdo.lugar_y_fecha)}</span>
          </div>
        </div>
      </div>

      <button type="button" class="tc-flecha tc-flecha-der" title="Recuerdo siguiente">${svg(ICONO_FLECHA_DER, 22)}</button>

      <div class="tc-menu-operativo">
        <button type="button" title="Mostrar/ocultar conexiones (próximamente)">${svg(ICONO_CONEXIONES, 30)}</button>
        <span class="tc-menu-separador"></span>
        <button type="button" title="Nuevo post-it (próximamente)">${svg(ICONO_NUEVO_POSTIT, 30)}</button>
        <span class="tc-menu-separador"></span>
        <button type="button" title="Editar post-it (próximamente)">${svg(ICONO_EDITAR_POSTIT, 30)}</button>
        <span class="tc-menu-separador"></span>
        <button type="button" title="Nueva cita teórica (próximamente)">${svg(ICONO_NUEVA_CITA, 30)}</button>
      </div>
    `

    overlay.querySelector('[data-accion="cerrar"]').addEventListener('click', cerrar)
    overlay.querySelector('.tc-flecha-izq').addEventListener('click', (e) => {
      e.stopPropagation()
      irA(indice - 1)
    })
    overlay.querySelector('.tc-flecha-der').addEventListener('click', (e) => {
      e.stopPropagation()
      irA(indice + 1)
    })

    const recuerdoEl = overlay.querySelector('.tc-recuerdo')
    aplicarBordeEstampilla(recuerdoEl)

    // El tamaño real de la tarjeta puede seguir moviéndose después de esta
    // primera medición (fuente terminando de cargar, imagen vecina acomodando
    // su lugar, etc.) — en vez de adivinar la causa, recalculamos el contorno
    // cada vez que el tamaño real cambie.
    observadorRecuerdo?.disconnect()
    observadorRecuerdo = new ResizeObserver(() => aplicarBordeEstampilla(recuerdoEl))
    observadorRecuerdo.observe(recuerdoEl)
  }

  render()

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cerrar()
  })

  return { cerrar }
}
