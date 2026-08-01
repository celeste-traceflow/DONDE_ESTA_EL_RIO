import layoutInicial from './layout-inicial.json'
import { abrirTarjetaCentrada } from './tarjeta-centrada.js'
import { sincronizarEmbeddingsYConexiones } from './conexiones.js'
import { obtenerConexiones, obtenerTodosTagsEstado, obtenerPostItsConteo } from './api.js'
import { crearCapaLazos, dibujarLazos } from './lazos.js'

// Qué fracción del ancho/alto de una tarjeta avanza el cursor de la cascada en cada paso.
// 0.8 = cada tarjeta nueva se solapa ~20% con la anterior (se ve la mayor parte de cada una).
const AVANCE_RATIO = 0.8

const CLAVE_POSICIONES = 'rio-cauce-posiciones'

// Profundidad ligada al sedimento: cuanto más se tocó una tarjeta (conexiones,
// subrayados/tachados, post-its), más "cerca" se siente — se mueve un poco más
// que el resto al hacer pan/zoom, en vez de que todo el cauce se desplace
// como un plano único.
const TOPE_SEDIMENTO = 6
const AMPLITUD_PROFUNDIDAD = 0.25

function calcularProfundidades(layout, conexiones, tagsEstado, postItsConteo) {
  const conteoConexiones = new Map()
  for (const c of conexiones) {
    const claveA = `${c.tipo_a}-${c.id_a}`
    const claveB = `${c.tipo_b}-${c.id_b}`
    conteoConexiones.set(claveA, (conteoConexiones.get(claveA) || 0) + 1)
    conteoConexiones.set(claveB, (conteoConexiones.get(claveB) || 0) + 1)
  }

  const profundidades = new Map()
  for (const item of layout) {
    const clave = `${item.tipo}-${item.data.id}`
    const conexionesCard = conteoConexiones.get(clave) || 0
    const tagsCard = item.tipo === 'recuerdo' ? Object.keys(tagsEstado[item.data.id] || {}).length : 0
    const postItsCard = item.tipo === 'recuerdo' ? postItsConteo[item.data.id] || 0 : 0
    const sedimento = conexionesCard + tagsCard + postItsCard
    profundidades.set(clave, 1 + (Math.min(sedimento, TOPE_SEDIMENTO) / TOPE_SEDIMENTO) * AMPLITUD_PROFUNDIDAD)
  }
  return profundidades
}

function iconoConexionesSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="18" height="18">
      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M22.68,43.69c21.86-21.86,32.79,21.86,54.65,0"/>
      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M22.68,56.31c21.86-21.86,32.79,21.86,54.65,0"/>
    </svg>
  `
}

function cargarPosicionesGuardadas() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_POSICIONES) || '{}')
  } catch {
    return {}
  }
}

function guardarEstado(tarjeta) {
  const posiciones = cargarPosicionesGuardadas()
  posiciones[`${tarjeta.dataset.tipo}-${tarjeta.dataset.id}`] = {
    x: parseFloat(tarjeta.style.left),
    y: parseFloat(tarjeta.style.top),
    ancho: parseFloat(tarjeta.style.width),
  }
  localStorage.setItem(CLAVE_POSICIONES, JSON.stringify(posiciones))
}

function aplicarPosicionesGuardadas(layout) {
  const guardadasLocal = cargarPosicionesGuardadas()
  return layout.map((item) => {
    const clave = `${item.tipo}-${item.data.id}`
    const guardada = guardadasLocal[clave] || layoutInicial[clave]
    if (!guardada) return item
    return { ...item, x: guardada.x, y: guardada.y, ancho: guardada.ancho ?? item.ancho }
  })
}

export function renderCauce(container, { recuerdos, citas }) {
  const items = intercalarCitas(recuerdos, citas)
  const layout = aplicarPosicionesGuardadas(ubicarEnCascada(items))
  const porClave = new Map(layout.map((item) => [`${item.tipo}-${item.data.id}`, item.data]))
  const secuenciaRecuerdos = layout.filter((item) => item.tipo === 'recuerdo').map((item) => item.data)

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
      <button type="button" data-accion="conexiones" class="boton-modo-conexiones" title="Modo conexiones">${iconoConexionesSvg()}</button>
    </div>
  `
  const viewport = container.querySelector('.cauce-viewport')
  const mundo = container.querySelector('.cauce-mundo')

  const capaLazos = crearCapaLazos()
  mundo.appendChild(capaLazos)

  for (const item of layout) {
    mundo.appendChild(crearTarjeta(item))
  }

  const pill = container.querySelector('.cauce-pill')
  const navEspacial = container.querySelector('.cauce-nav-espacial')
  const botonModoConexiones = container.querySelector('.boton-modo-conexiones')

  function posicionDeTarjeta(clave) {
    const [tipo, id] = clave.split('-')
    const el = mundo.querySelector(`[data-tipo="${tipo}"][data-id="${id}"]`)
    if (!el) return null
    // Suma el corrimiento de profundidad (parallax) — sin esto, el lazo queda
    // apuntando a donde estaría la tarjeta sin ese efecto, no a donde se ve.
    return {
      x: parseFloat(el.style.left) + (parseFloat(el.dataset.offsetX) || 0),
      y: parseFloat(el.style.top) + (parseFloat(el.dataset.offsetY) || 0),
    }
  }

  let conexionesCache = []
  let tarjetaConexionesVisibles = null
  let modoConexiones = false

  function refrescarLazos() {
    const visibles = tarjetaConexionesVisibles
      ? conexionesCache.filter(
          (c) =>
            `${c.tipo_a}-${c.id_a}` === tarjetaConexionesVisibles ||
            `${c.tipo_b}-${c.id_b}` === tarjetaConexionesVisibles
        )
      : []
    dibujarLazos(capaLazos, visibles, posicionDeTarjeta, tarjetaConexionesVisibles, (claveOtroExtremo) => {
      irA(claveOtroExtremo)
    })
  }

  Promise.all([obtenerConexiones(), obtenerTodosTagsEstado(), obtenerPostItsConteo()])
    .then(([conexiones, tagsEstado, postItsConteo]) => {
      conexionesCache = conexiones
      refrescarLazos()
      controles.setProfundidades(calcularProfundidades(layout, conexiones, tagsEstado, postItsConteo))
    })
    .catch((err) => console.error('[conexiones] error cargando', err))

  function abrirRecuerdoCentrado(data) {
    const indiceInicial = secuenciaRecuerdos.indexOf(data)
    viewport.classList.add('enfocado-atras')
    pill.classList.add('enfocado-atras')
    navEspacial.classList.add('enfocado-atras')
    abrirTarjetaCentrada(secuenciaRecuerdos, indiceInicial, {
      onCerrar: () => {
        viewport.classList.remove('enfocado-atras')
        pill.classList.remove('enfocado-atras')
        navEspacial.classList.remove('enfocado-atras')
      },
    })
  }

  // Navega hacia el otro extremo de una conexión: la cámara acompaña con un
  // paneo animado hasta la tarjeta destino y recién ahí, si es un recuerdo,
  // se abre su tarjeta centrada (si es una cita, solo queda centrada ahí).
  function irA(clave) {
    const data = porClave.get(clave)
    if (!data) return
    const pos = posicionDeTarjeta(clave)
    if (!pos) return
    const rect = viewport.getBoundingClientRect()
    controles.centrarEnAnimado(pos.x, pos.y, rect.width / 2, rect.height / 2).then(() => {
      if (clave.startsWith('recuerdo-')) {
        tarjetaConexionesVisibles = clave
        refrescarLazos()
        abrirRecuerdoCentrado(data)
      }
    })
  }

  const inicial = calcularVistaInicial(viewport, layout)
  const controles = activarPanZoom(
    viewport,
    mundo,
    inicial,
    layout,
    (tarjetaEl) => {
      const clave = `${tarjetaEl.dataset.tipo}-${tarjetaEl.dataset.id}`
      if (modoConexiones) {
        tarjetaConexionesVisibles = tarjetaConexionesVisibles === clave ? null : clave
        refrescarLazos()
        return
      }
      if (tarjetaEl.dataset.tipo !== 'recuerdo') return
      abrirRecuerdoCentrado(porClave.get(clave))
    },
    () => refrescarLazos()
  )

  container.querySelector('.cauce-nav-espacial').addEventListener('click', (e) => {
    const accion = e.target.closest('button')?.dataset.accion
    if (!accion) return
    if (accion === 'zoom-in') controles.zoom(1.25)
    if (accion === 'zoom-out') controles.zoom(0.8)
    if (accion === 'centrar') controles.centrar()
    if (accion === 'ver-todo') controles.verTodo()
    if (accion === 'conexiones') {
      modoConexiones = !modoConexiones
      botonModoConexiones.classList.toggle('activo', modoConexiones)
      if (!modoConexiones) {
        tarjetaConexionesVisibles = null
        refrescarLazos()
      }
    }
  })

  // Corre en segundo plano: no bloquea el Cauce, que ya se ve con los datos
  // estáticos. La primera vez calcula los embeddings que falten (puede
  // tardar); las siguientes veces ya están cacheados en Postgres.
  sincronizarEmbeddingsYConexiones(recuerdos, citas, (mensaje) => console.log('[conexiones]', mensaje)).catch(
    (err) => console.error('[conexiones] error sincronizando', err)
  )
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
      const ancho = item.tipo === 'recuerdo' ? 160 + Math.random() * 80 : 150
      const alto = item.tipo === 'recuerdo' ? ancho * 1.2 : ancho * 0.65

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
  el.dataset.tipo = item.tipo
  el.dataset.id = item.data.id
  el.dataset.rotacion = item.rotacion
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

  for (const esquina of ['tl', 'tr', 'bl', 'br']) {
    const tirador = document.createElement('div')
    tirador.className = `resize-handle resize-handle-${esquina}`
    tirador.dataset.esquina = esquina
    tirador.title = 'Cambiar tamaño'
    el.appendChild(tirador)
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

function activarPanZoom(viewport, mundo, inicial, layout, onClickTarjeta, onArrastrarTarjeta) {
  let { x, y, scale } = inicial
  let arrastrandoMundo = false
  let tarjetaArrastrada = null
  let tarjetaX = 0
  let tarjetaY = 0
  let tarjetaRedimensionada = null
  let anchoRedimensionado = 0
  let signoRedimension = 1
  let distanciaMovida = 0
  let lastX = 0
  let lastY = 0

  const tarjetas = mundo.querySelectorAll('.tarjeta')
  const xInicialProfundidad = inicial.x
  const yInicialProfundidad = inicial.y
  let profundidades = new Map()

  function aplicarProfundidad() {
    const deltaX = x - xInicialProfundidad
    const deltaY = y - yInicialProfundidad
    tarjetas.forEach((el) => {
      const factor = profundidades.get(`${el.dataset.tipo}-${el.dataset.id}`) ?? 1
      const offsetX = factor === 1 ? 0 : (deltaX * (factor - 1)) / scale
      const offsetY = factor === 1 ? 0 : (deltaY * (factor - 1)) / scale
      el.dataset.offsetX = offsetX
      el.dataset.offsetY = offsetY
      el.style.transform = `translate(${offsetX}px, ${offsetY}px) translate(-50%, -50%) rotate(${el.dataset.rotacion}deg)`
    })
  }

  function aplicar() {
    mundo.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
    aplicarProfundidad()
    // El desplazamiento de profundidad mueve la tarjeta lejos de su posición
    // "cruda" (left/top); si hay lazos visibles, hay que recalcularlos en el
    // mismo momento o quedan apuntando al lugar viejo.
    onArrastrarTarjeta?.()
  }

  let animacionToken = 0
  function animarCamara(targetX, targetY, duracion = 650) {
    const miToken = ++animacionToken
    const inicioX = x
    const inicioY = y
    const t0 = performance.now()
    return new Promise((resolve) => {
      function paso(t) {
        if (miToken !== animacionToken) return resolve()
        const p = Math.min(1, (t - t0) / duracion)
        const ease = 1 - Math.pow(1 - p, 3)
        x = inicioX + (targetX - inicioX) * ease
        y = inicioY + (targetY - inicioY) * ease
        aplicar()
        if (p < 1) requestAnimationFrame(paso)
        else resolve()
      }
      requestAnimationFrame(paso)
    })
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
    lastX = e.clientX
    lastY = e.clientY
    distanciaMovida = 0

    const tirador = e.target.closest('.resize-handle')
    if (tirador) {
      tarjetaRedimensionada = tirador.closest('.tarjeta')
      anchoRedimensionado = parseFloat(tarjetaRedimensionada.style.width)
      signoRedimension = tirador.dataset.esquina.includes('l') ? -1 : 1
      return
    }

    const tarjeta = e.target.closest('.tarjeta')
    if (tarjeta) {
      tarjetaArrastrada = tarjeta
      tarjetaX = parseFloat(tarjeta.style.left)
      tarjetaY = parseFloat(tarjeta.style.top)
      tarjeta.classList.add('arrastrando')
      tarjeta.style.zIndex = 9999
    } else {
      arrastrandoMundo = true
      viewport.classList.add('arrastrando')
    }
  })

  window.addEventListener('mousemove', (e) => {
    if (tarjetaRedimensionada) {
      anchoRedimensionado = Math.max(60, anchoRedimensionado + (signoRedimension * (e.clientX - lastX)) / scale)
      tarjetaRedimensionada.style.width = `${anchoRedimensionado}px`
      lastX = e.clientX
      lastY = e.clientY
      return
    }

    if (tarjetaArrastrada) {
      distanciaMovida += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY)
      tarjetaX += (e.clientX - lastX) / scale
      tarjetaY += (e.clientY - lastY) / scale
      tarjetaArrastrada.style.left = `${tarjetaX}px`
      tarjetaArrastrada.style.top = `${tarjetaY}px`
      lastX = e.clientX
      lastY = e.clientY
      onArrastrarTarjeta?.()
      return
    }

    if (!arrastrandoMundo) return
    x += e.clientX - lastX
    y += e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    aplicar()
  })

  window.addEventListener('mouseup', () => {
    if (tarjetaRedimensionada) {
      guardarEstado(tarjetaRedimensionada)
      tarjetaRedimensionada = null
    }
    if (tarjetaArrastrada) {
      if (distanciaMovida < 4) {
        onClickTarjeta?.(tarjetaArrastrada)
      } else {
        guardarEstado(tarjetaArrastrada)
      }
      tarjetaArrastrada.classList.remove('arrastrando')
      tarjetaArrastrada = null
    }
    arrastrandoMundo = false
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
    centrarEn(worldX, worldY, cursorX, cursorY) {
      x = cursorX - worldX * scale
      y = cursorY - worldY * scale
      aplicar()
    },
    centrarEnAnimado(worldX, worldY, cursorX, cursorY) {
      const targetX = cursorX - worldX * scale
      const targetY = cursorY - worldY * scale
      return animarCamara(targetX, targetY)
    },
    setProfundidades(mapa) {
      profundidades = mapa
      aplicarProfundidad()
    },
  }
}
