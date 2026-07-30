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

// Curva del cauce: suma de ondas de distinta frecuencia/amplitud para un
// meandro orgánico (curvas chicas y otras más amplias), no una onda uniforme.
function formaRio(x) {
  return (
    Math.sin(x * 0.0055) * 130 +
    Math.sin(x * 0.017 + 1.3) * 55 +
    Math.sin(x * 0.0035 + 2.7) * 85
  )
}

function ubicarEnCascada(items) {
  const puntos = []
  const paso = 3 // resolución de muestreo del camino, en px
  let x = 0
  let prevX = 0
  let prevY = formaRio(0)
  let distAcumulada = 0
  let proximaDistancia = 0
  let idx = 0

  while (idx < items.length) {
    const y = formaRio(x)
    const dx = x - prevX
    const dy = y - prevY
    distAcumulada += Math.hypot(dx, dy)
    prevX = x
    prevY = y

    if (distAcumulada >= proximaDistancia) {
      const item = items[idx]
      const ancho = item.tipo === 'recuerdo' ? 160 + Math.random() * 80 : 105
      const alto = item.tipo === 'recuerdo' ? ancho * 1.2 : ancho * 0.9

      // jitter perpendicular a la curva, para que no queden todas clavadas sobre la línea
      const largoTangente = Math.hypot(dx, dy) || 1
      const normalX = -dy / largoTangente
      const normalY = dx / largoTangente
      const jitterPerp = (Math.random() - 0.5) * 60

      puntos.push({
        ...item,
        x: x + normalX * jitterPerp,
        y: y + normalY * jitterPerp,
        rotacion: 0,
        ancho,
        alto,
      })

      idx++
      proximaDistancia = distAcumulada + ancho * AVANCE_RATIO
    }

    x += paso
  }

  return puntos
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
