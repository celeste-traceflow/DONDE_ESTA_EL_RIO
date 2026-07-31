import { obtenerTagsEstado, guardarTagEstado, obtenerPostIts, crearPostIt, actualizarPostIt, borrarPostIt } from './api.js'
import { actualizarEmbeddingRecuerdo } from './conexiones.js'

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

// El post-it no tiene alto fijo: crece o se achica con lo que se escribe,
// igual que la tarjeta de recuerdo (que tampoco tiene alto fijo, solo fluye).
function ajustarAlturaTexto(textarea) {
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

// Cada tag se muestra como una lista separada por comas; dentro de cada
// elemento, cada palabra suelta es su propia unidad clickeable para
// subrayar/tachar (ej. "marco de puerta" → "marco", "de" y "puerta" por
// separado).
function renderizarValor(valor) {
  if (valor === '—') return valor
  return valor
    .split(',')
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) =>
      seg
        .split(/\s+/)
        .filter(Boolean)
        .map((palabra) => `<span class="tag-palabra" data-palabra="${escaparHtml(palabra)}">${escaparHtml(palabra)}</span>`)
        .join(' ')
    )
    .join(', ')
}

function aplicarEstadoPalabra(span, estado) {
  span.classList.remove('tag-subrayado', 'tag-tachado')
  if (estado === 'subrayado') span.classList.add('tag-subrayado')
  if (estado === 'tachado') span.classList.add('tag-tachado')
  span.dataset.estado = estado || 'ninguno'
}

const ICONO_SUBRAYAR = `
  <path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.13" d="M16.35,57.08c-1.5,1.5-2.6,3.36-3.18,5.4l-5.25,18.39c-.07.24-.11.5-.11.75h0c0,1.51,1.23,2.74,2.74,2.74h0c.25,0,.51-.04.75-.11l18.39-5.25c2.04-.58,3.9-1.68,5.4-3.18l46.05-46.05c1.06-1.06,1.66-2.5,1.66-4h0c0-1.5-.6-2.94-1.66-4l-10.75-10.75c-1.06-1.06-2.5-1.66-4-1.66h0c-1.5,0-2.94.6-4,1.66L16.35,57.08Z"/>
  <line fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.13" x1="20.66" y1="81.59" x2="10.59" y2="71.53"/>
  <line fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.13" x1="35.94" y1="75" x2="17.19" y2="56.25"/>
  <path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.13" d="M56.25,17.19l21.78,21.78c1.06,1.06,1.66,2.5,1.66,4h0c0,1.5-.6,2.94-1.66,4l-7.72,7.72"/>
  <circle fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.13" cx="45.31" cy="46.87" r="1.56"/>
  <path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.13" d="M72.66,13.28l4.17-4.17c.83-.83,1.95-1.29,3.12-1.29h0c2.44,0,4.42,1.98,4.42,4.42h0c0,1.17-.47,2.3-1.29,3.12l-4.17,4.17"/>
  <line fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.13" x1="92.19" y1="92.19" x2="31.25" y2="92.19"/>
`

const ICONO_TACHAR = `
  <path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.13" d="M43.75,60.07v18.05c0,2.59-2.1,4.69-4.69,4.69h-6.25v9.37h34.37v-9.37h-6.25c-2.59,0-4.69-2.1-4.69-4.69v-18.05"/>
  <path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.13" d="M56.25,39.93v-19.62h18.75c2.59,0,4.69,2.1,4.69,4.69v4.69h9.37V7.81H10.94v21.87h9.37v-4.69c0-2.59,2.1-4.69,4.69-4.69h18.75v19.62"/>
  <line fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.13" x1="6.21" y1="50" x2="93.79" y2="50"/>
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

const ICONO_BORRAR_POSTIT = `
  <line fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" x1="20" y1="30" x2="80" y2="30"/>
  <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M38,30v-8c0-3.31,2.69-6,6-6h12c3.31,0,6,2.69,6,6v8"/>
  <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M28,30l4,52c0,3.31,2.69,6,6,6h24c3.31,0,6-2.69,6-6l4-52"/>
  <line fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" x1="42" y1="44" x2="42" y2="72"/>
  <line fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" x1="58" y1="44" x2="58" y2="72"/>
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
  let abortArrastrePostits = null

  const overlay = document.createElement('div')
  overlay.className = 'tarjeta-centrada-overlay'
  document.body.appendChild(overlay)

  function cerrar() {
    observadorRecuerdo?.disconnect()
    abortArrastrePostits?.abort()
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
        <div class="tc-tags">
          <div class="tc-tags-header">
            <span>Tags algorítmicas</span>
            <span class="tc-tags-controles">
              <button type="button" class="modo-boton" data-modo="subrayado" title="Subrayar">${svg(ICONO_SUBRAYAR, 20)}</button>
              <button type="button" class="modo-boton" data-modo="tachado" title="Tachar">${svg(ICONO_TACHAR, 20)}</button>
            </span>
          </div>
          <p class="tc-tags-guia">¿Alguna de estas palabras te resuena o te hace ruido hoy? Subrayá o tachá la que creas necesaria.</p>
          <table>
            ${filas.map((f) => `<tr><th>${f.categoria}</th><td>${renderizarValor(f.valor)}</td></tr>`).join('')}
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

      <div class="tc-postits-capa"></div>

      <button type="button" class="tc-flecha tc-flecha-der" title="Recuerdo siguiente">${svg(ICONO_FLECHA_DER, 22)}</button>

      <div class="tc-menu-operativo">
        <button type="button" data-accion="nuevo-postit" title="Nuevo post-it">${svg(ICONO_NUEVO_POSTIT, 30)}</button>
        <span class="tc-menu-separador"></span>
        <button type="button" data-accion="editar-postit" title="Editar post-it">${svg(ICONO_EDITAR_POSTIT, 30)}</button>
        <span class="tc-menu-separador"></span>
        <button type="button" title="Nueva cita teórica (próximamente)">${svg(ICONO_NUEVA_CITA, 30)}</button>
      </div>
    `

    overlay.querySelector('.tc-flecha-izq').addEventListener('click', (e) => {
      e.stopPropagation()
      irA(indice - 1)
    })
    overlay.querySelector('.tc-flecha-der').addEventListener('click', (e) => {
      e.stopPropagation()
      irA(indice + 1)
    })

    const tablaTagsEl = overlay.querySelector('.tc-tags table')
    let estadoActual = {}
    let modoActivo = null

    const botonesModo = overlay.querySelectorAll('.modo-boton')
    botonesModo.forEach((boton) => {
      boton.addEventListener('click', () => {
        const modo = boton.dataset.modo
        modoActivo = modoActivo === modo ? null : modo
        botonesModo.forEach((b) => b.classList.toggle('activo', b.dataset.modo === modoActivo))
      })
    })

    tablaTagsEl.addEventListener('click', (e) => {
      const span = e.target.closest('.tag-palabra')
      if (!span || !modoActivo) return
      const actual = span.dataset.estado || 'ninguno'
      const siguiente = actual === modoActivo ? 'ninguno' : modoActivo
      aplicarEstadoPalabra(span, siguiente)

      const palabra = span.dataset.palabra
      if (siguiente === 'ninguno') delete estadoActual[palabra]
      else estadoActual[palabra] = siguiente

      guardarTagEstado(recuerdo.id, palabra, siguiente === 'ninguno' ? null : siguiente)
      // Recalcula el embedding de esta tarjeta (y sus conexiones) con el peso
      // nuevo. No bloquea la interacción: corre en segundo plano.
      actualizarEmbeddingRecuerdo(recuerdo, estadoActual).catch((err) =>
        console.error('[conexiones] error actualizando embedding', err)
      )
    })

    obtenerTagsEstado(recuerdo.id).then((estados) => {
      estadoActual = estados
      tablaTagsEl.querySelectorAll('.tag-palabra').forEach((span) => {
        const estado = estados[span.dataset.palabra]
        if (estado) aplicarEstadoPalabra(span, estado)
      })
    })

    const contenedorPostits = overlay.querySelector('.tc-postits-capa')
    const botonNuevoPostit = overlay.querySelector('[data-accion="nuevo-postit"]')
    const botonEditarPostit = overlay.querySelector('[data-accion="editar-postit"]')
    let postits = []
    let postitEditandoId = null
    let modoEditarPostit = false
    let arrastre = null

    abortArrastrePostits?.abort()
    abortArrastrePostits = new AbortController()
    const { signal: señalArrastre } = abortArrastrePostits

    function renderizarPostits() {
      contenedorPostits.innerHTML = postits
        .map((p) => {
          const editando = p.id === postitEditandoId
          return `
            <div class="postit postit-${p.variante}${editando ? ' editando' : ''}" data-id="${p.id}" style="left: calc(50% + ${p.pos_x}px); top: calc(50% + ${p.pos_y}px);">
              <textarea class="postit-texto" ${editando ? '' : 'readonly'} placeholder="Escribí algo...">${escaparHtml(p.texto)}</textarea>
              <label class="postit-coordenada">
                <input type="text" class="postit-lugar-fecha" ${editando ? '' : 'readonly'} placeholder="Lugar y fecha" value="${escaparHtml(p.lugar_fecha || '')}">
              </label>
              <div class="postit-controles">
                <button type="button" class="postit-variante${p.variante === 'gris' ? ' activa' : ''}" data-variante="gris" title="Gris topo"></button>
                <button type="button" class="postit-variante${p.variante === 'beige' ? ' activa' : ''}" data-variante="beige" title="Beige"></button>
                <button type="button" class="postit-variante${p.variante === 'piedra' ? ' activa' : ''}" data-variante="piedra" title="Piedra"></button>
                <button type="button" class="postit-borrar" title="Borrar post-it">${svg(ICONO_BORRAR_POSTIT, 14)}</button>
              </div>
            </div>
          `
        })
        .join('')

      contenedorPostits.querySelectorAll('.postit').forEach((el) => {
        const id = Number(el.dataset.id)
        const textarea = el.querySelector('.postit-texto')
        const inputLugarFecha = el.querySelector('.postit-lugar-fecha')

        ajustarAlturaTexto(textarea)
        textarea.addEventListener('input', () => ajustarAlturaTexto(textarea))

        el.addEventListener('mousedown', (e) => {
          if (e.target.closest('.postit-controles')) return
          const campoEditable = e.target.closest('.postit-texto, .postit-lugar-fecha')
          if (campoEditable && !campoEditable.readOnly) return
          e.preventDefault()
          const p = postits.find((x) => x.id === id)
          arrastre = {
            id,
            el,
            posX: p.pos_x,
            posY: p.pos_y,
            lastX: e.clientX,
            lastY: e.clientY,
            distancia: 0,
          }
        })

        textarea.addEventListener('blur', () => {
          if (postitEditandoId !== id) return
          const nuevoTexto = textarea.value
          const p = postits.find((x) => x.id === id)
          if (p) p.texto = nuevoTexto
          actualizarPostIt(id, { texto: nuevoTexto })
        })

        inputLugarFecha.addEventListener('blur', () => {
          if (postitEditandoId !== id) return
          const nuevoValor = inputLugarFecha.value
          const p = postits.find((x) => x.id === id)
          if (p) p.lugar_fecha = nuevoValor
          actualizarPostIt(id, { lugar_fecha: nuevoValor })
        })

        el.querySelectorAll('.postit-variante').forEach((boton) => {
          boton.addEventListener('click', (e) => {
            e.stopPropagation()
            const variante = boton.dataset.variante
            const p = postits.find((x) => x.id === id)
            if (p) p.variante = variante
            actualizarPostIt(id, { variante })
            renderizarPostits()
          })
        })

        el.querySelector('.postit-borrar').addEventListener('click', (e) => {
          e.stopPropagation()
          postits = postits.filter((x) => x.id !== id)
          if (postitEditandoId === id) postitEditandoId = null
          borrarPostIt(id)
          renderizarPostits()
        })
      })
    }

    window.addEventListener(
      'mousemove',
      (e) => {
        if (!arrastre) return
        const dx = e.clientX - arrastre.lastX
        const dy = e.clientY - arrastre.lastY
        arrastre.distancia += Math.abs(dx) + Math.abs(dy)
        arrastre.posX += dx
        arrastre.posY += dy
        arrastre.lastX = e.clientX
        arrastre.lastY = e.clientY
        arrastre.el.style.left = `calc(50% + ${arrastre.posX}px)`
        arrastre.el.style.top = `calc(50% + ${arrastre.posY}px)`
      },
      { signal: señalArrastre }
    )

    window.addEventListener(
      'mouseup',
      () => {
        if (!arrastre) return
        const { id, posX, posY, distancia } = arrastre
        if (distancia < 4) {
          if (modoEditarPostit && postitEditandoId !== id) {
            postitEditandoId = id
            renderizarPostits()
            contenedorPostits.querySelector(`.postit[data-id="${id}"] .postit-texto`)?.focus()
          }
        } else {
          const p = postits.find((x) => x.id === id)
          if (p) {
            p.pos_x = posX
            p.pos_y = posY
          }
          actualizarPostIt(id, { pos_x: posX, pos_y: posY })
        }
        arrastre = null
      },
      { signal: señalArrastre }
    )

    obtenerPostIts(recuerdo.id).then((lista) => {
      postits = lista
      renderizarPostits()
    })

    botonNuevoPostit.addEventListener('click', async (e) => {
      e.stopPropagation()
      const fotoRect = overlay.querySelector('.tc-foto').getBoundingClientRect()
      const posX = fotoRect.left + 24 - window.innerWidth / 2
      const posY = fotoRect.top + 24 - window.innerHeight / 2
      const nuevo = await crearPostIt(recuerdo.id, { texto: '', variante: 'gris', pos_x: posX, pos_y: posY })
      postits.push(nuevo)
      postitEditandoId = nuevo.id
      renderizarPostits()
      contenedorPostits.querySelector(`.postit[data-id="${nuevo.id}"] .postit-texto`)?.focus()
    })

    botonEditarPostit.addEventListener('click', (e) => {
      e.stopPropagation()
      modoEditarPostit = !modoEditarPostit
      botonEditarPostit.classList.toggle('activo', modoEditarPostit)
      if (!modoEditarPostit) {
        postitEditandoId = null
        renderizarPostits()
      }
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
