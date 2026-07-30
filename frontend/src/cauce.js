// Qué fracción del ancho/alto de una tarjeta avanza el cursor de la cascada en cada paso.
// 0.8 = cada tarjeta nueva se solapa ~20% con la anterior (se ve la mayor parte de cada una).
const AVANCE_RATIO = 0.8

export function renderCauce(container, { recuerdos, citas }) {
  const items = intercalarCitas(recuerdos, citas)
  const layout = ubicarEnCascada(items)

  container.innerHTML = `
    <div class="cauce-viewport">
      <div class="cauce-mundo"></div>
    </div>
    <div class="cauce-pill">
      <span class="icono-menu">☰</span>
      <span class="separador"></span>
      <span>CAUCE</span>
    </div>
    <div class="cauce-nav-espacial">
      <button type="button" data-accion="zoom-in" title="Acercar">+</button>
      <button type="button" data-accion="zoom-out" title="Alejar">–</button>
      <button type="button" data-accion="centrar" title="Centrar vista">◎</button>
      <button type="button" data-accion="ver-todo" title="Ver todo">⛶</button>
    </div>
  `
  const viewport = container.querySelector('.cauce-viewport')
  const mundo = container.querySelector('.cauce-mundo')

  for (const item of layout) {
    mundo.appendChild(crearTarjeta(item))
  }

  const inicial = calcularVistaInicial(viewport, layout)
  const controles = activarPanZoom(viewport, mundo, inicial, layout)

  container.querySelector('.cauce-nav-espacial').addEventListener('click', (e) => {
    const accion = e.target.closest('button')?.dataset.accion
    if (!accion) return
    if (accion === 'zoom-in') controles.zoom(1.25)
    if (accion === 'zoom-out') controles.zoom(0.8)
    if (accion === 'centrar') controles.centrar()
    if (accion === 'ver-todo') controles.verTodo()
  })
}

function intercalarCitas(recuerdos, citas) {
  const items = []
  const paso = Math.ceil(recuerdos.length / citas.length)
  let citaIdx = 0

  recuerdos.forEach((r, i) => {
    items.push({ tipo: 'recuerdo', data: r })
    if ((i + 1) % paso === 0 && citaIdx < citas.length) {
      items.push({ tipo: 'cita', data: citas[citaIdx] })
      citaIdx++
    }
  })
  while (citaIdx < citas.length) {
    items.push({ tipo: 'cita', data: citas[citaIdx] })
    citaIdx++
  }
  return items
}

function ubicarEnCascada(items) {
  let cursorX = 0
  let cursorY = 0

  return items.map((item, i) => {
    const ancho = item.tipo === 'recuerdo' ? 160 + Math.random() * 80 : 210
    const alto = item.tipo === 'recuerdo' ? ancho * 1.2 : ancho * 0.9

    if (i > 0) {
      cursorX += ancho * AVANCE_RATIO + (Math.random() - 0.5) * 20
      cursorY += alto * AVANCE_RATIO + (Math.random() - 0.5) * 20 + Math.sin(i * 0.35) * 18
    }

    const rotacion = (Math.random() - 0.5) * 8
    return { ...item, x: cursorX, y: cursorY, rotacion, ancho, alto }
  })
}

function crearTarjeta(item) {
  const el = document.createElement('div')
  el.className = `tarjeta tarjeta-${item.tipo}`
  el.style.left = `${item.x}px`
  el.style.top = `${item.y}px`
  el.style.width = `${item.ancho}px`
  el.style.transform = `translate(-50%, -50%) rotate(${item.rotacion}deg)`
  el.style.zIndex = String(Math.round(item.x + item.y))

  if (item.tipo === 'recuerdo') {
    const r = item.data
    el.innerHTML = `
      <div class="foto-marco">
        <img src="/images/${encodeURIComponent(r.archivo)}" alt="" loading="lazy">
      </div>
    `
  } else {
    const c = item.data
    el.innerHTML = `
      <blockquote>"${escaparHtml(c.texto)}"</blockquote>
      <div class="autor">${escaparHtml(c.autor)}</div>
    `
  }
  return el
}

function escaparHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function limites(layout) {
  const minX = Math.min(...layout.map((i) => i.x - i.ancho / 2))
  const maxX = Math.max(...layout.map((i) => i.x + i.ancho / 2))
  const minY = Math.min(...layout.map((i) => i.y - i.alto / 2))
  const maxY = Math.max(...layout.map((i) => i.y + i.alto / 2))
  return { minX, maxX, minY, maxY }
}

function calcularVistaInicial(viewport, layout) {
  const rect = viewport.getBoundingClientRect()
  const avgX = layout.reduce((s, i) => s + i.x, 0) / layout.length
  const avgY = layout.reduce((s, i) => s + i.y, 0) / layout.length
  const scale = 0.55
  return {
    x: rect.width / 2 - avgX * scale,
    y: rect.height / 2 - avgY * scale,
    scale,
  }
}

function calcularVistaCompleta(viewport, layout) {
  const rect = viewport.getBoundingClientRect()
  const { minX, maxX, minY, maxY } = limites(layout)
  const anchoTotal = maxX - minX
  const altoTotal = maxY - minY
  const margen = 80
  const scale = Math.min(
    (rect.width - margen * 2) / anchoTotal,
    (rect.height - margen * 2) / altoTotal,
    1.2
  )
  const centroX = (minX + maxX) / 2
  const centroY = (minY + maxY) / 2
  return {
    x: rect.width / 2 - centroX * scale,
    y: rect.height / 2 - centroY * scale,
    scale,
  }
}

function activarPanZoom(viewport, mundo, inicial, layout) {
  let { x, y, scale } = inicial
  let arrastrando = false
  let lastX = 0
  let lastY = 0

  function aplicar() {
    mundo.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
  }

  function zoomHacia(cursorX, cursorY, factor) {
    const worldX = (cursorX - x) / scale
    const worldY = (cursorY - y) / scale
    scale = Math.min(2, Math.max(0.1, scale * factor))
    x = cursorX - worldX * scale
    y = cursorY - worldY * scale
    aplicar()
  }

  viewport.addEventListener('mousedown', (e) => {
    arrastrando = true
    viewport.classList.add('arrastrando')
    lastX = e.clientX
    lastY = e.clientY
  })

  window.addEventListener('mousemove', (e) => {
    if (!arrastrando) return
    x += e.clientX - lastX
    y += e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    aplicar()
  })

  window.addEventListener('mouseup', () => {
    arrastrando = false
    viewport.classList.remove('arrastrando')
  })

  viewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      const rect = viewport.getBoundingClientRect()
      const factor = e.deltaY < 0 ? 1.1 : 0.9
      zoomHacia(e.clientX - rect.left, e.clientY - rect.top, factor)
    },
    { passive: false }
  )

  aplicar()

  return {
    zoom(factor) {
      const rect = viewport.getBoundingClientRect()
      zoomHacia(rect.width / 2, rect.height / 2, factor)
    },
    centrar() {
      ;({ x, y, scale } = calcularVistaInicial(viewport, layout))
      aplicar()
    },
    verTodo() {
      ;({ x, y, scale } = calcularVistaCompleta(viewport, layout))
      aplicar()
    },
  }
}
