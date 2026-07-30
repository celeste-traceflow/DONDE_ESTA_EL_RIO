export function renderCauce(container, { recuerdos, citas }) {
  const items = intercalarCitas(recuerdos, citas)
  const layout = ubicarEnRecorrido(items)

  container.innerHTML = `
    <div class="cauce-viewport">
      <div class="cauce-mundo"></div>
    </div>
  `
  const viewport = container.querySelector('.cauce-viewport')
  const mundo = container.querySelector('.cauce-mundo')

  for (const item of layout) {
    mundo.appendChild(crearTarjeta(item))
  }

  const inicial = calcularVistaInicial(viewport, layout)
  activarPanZoom(viewport, mundo, inicial)
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

function ubicarEnRecorrido(items) {
  const spacingX = 260
  const amplitud = 200
  const frecuencia = 0.5

  return items.map((item, i) => {
    const x = i * spacingX + (Math.random() - 0.5) * 90
    const y = Math.sin(i * frecuencia) * amplitud + (Math.random() - 0.5) * 70
    const rotacion = (Math.random() - 0.5) * 10
    const ancho = item.tipo === 'recuerdo' ? 150 + Math.random() * 90 : 210
    return { ...item, x, y, rotacion, ancho }
  })
}

function crearTarjeta(item) {
  const el = document.createElement('div')
  el.className = `tarjeta tarjeta-${item.tipo}`
  el.style.left = `${item.x}px`
  el.style.top = `${item.y}px`
  el.style.width = `${item.ancho}px`
  el.style.transform = `translate(-50%, -50%) rotate(${item.rotacion}deg)`

  if (item.tipo === 'recuerdo') {
    const r = item.data
    el.innerHTML = `
      <div class="foto-marco">
        <img src="/images/${encodeURIComponent(r.archivo)}" alt="" loading="lazy">
        <p class="recuerdo-texto">${escaparHtml(r.recuerdo_afectivo)}</p>
        <span class="marca-coordenada">${escaparHtml(r.lugar_y_fecha)}</span>
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

function activarPanZoom(viewport, mundo, inicial) {
  let { x, y, scale } = inicial
  let arrastrando = false
  let lastX = 0
  let lastY = 0

  function aplicar() {
    mundo.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
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
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      const worldX = (cursorX - x) / scale
      const worldY = (cursorY - y) / scale

      const factor = e.deltaY < 0 ? 1.1 : 0.9
      scale = Math.min(2, Math.max(0.15, scale * factor))

      x = cursorX - worldX * scale
      y = cursorY - worldY * scale

      aplicar()
    },
    { passive: false }
  )

  aplicar()
}
