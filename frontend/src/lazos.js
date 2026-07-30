const NS = 'http://www.w3.org/2000/svg'

export function crearCapaLazos() {
  const svg = document.createElementNS(NS, 'svg')
  svg.classList.add('capa-lazos')
  return svg
}

// Trazo serpenteante (nunca recto): dos puntos de control desplazados en
// direcciones opuestas respecto a la línea directa, para que dibuje una
// curva con más de una inflexión.
function pathSerpenteante(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const largo = Math.hypot(dx, dy) || 1
  const nx = -dy / largo
  const ny = dx / largo
  const amplitud = Math.min(70, Math.max(20, largo * 0.12))

  const c1x = x1 + dx * 0.33 + nx * amplitud
  const c1y = y1 + dy * 0.33 + ny * amplitud
  const c2x = x1 + dx * 0.66 - nx * amplitud
  const c2y = y1 + dy * 0.66 - ny * amplitud

  return `M ${x1} ${y1} C ${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}`
}

function formatearFecha(fechaIso) {
  const d = new Date(fechaIso)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

export function dibujarLazos(svg, conexiones, obtenerPosicion, focoClave, onClickOtroExtremo) {
  svg.innerHTML = ''

  for (const con of conexiones) {
    const claveA = `${con.tipo_a}-${con.id_a}`
    const claveB = `${con.tipo_b}-${con.id_b}`
    const pa = obtenerPosicion(claveA)
    const pb = obtenerPosicion(claveB)
    if (!pa || !pb) continue

    const claveOtroExtremo = claveA === focoClave ? claveB : claveA

    const grupo = document.createElementNS(NS, 'g')
    grupo.setAttribute('class', 'lazo')
    if (onClickOtroExtremo) {
      grupo.style.cursor = 'pointer'
      grupo.addEventListener('click', (e) => {
        e.stopPropagation()
        onClickOtroExtremo(claveOtroExtremo)
      })
    }

    const trazo = document.createElementNS(NS, 'path')
    trazo.setAttribute('d', pathSerpenteante(pa.x, pa.y, pb.x, pb.y))
    trazo.setAttribute('class', 'lazo-trazo')
    grupo.appendChild(trazo)

    for (const p of [pa, pb]) {
      const punto = document.createElementNS(NS, 'circle')
      punto.setAttribute('cx', p.x)
      punto.setAttribute('cy', p.y)
      punto.setAttribute('r', 4)
      punto.setAttribute('class', 'lazo-punto')
      grupo.appendChild(punto)
    }

    const texto = document.createElementNS(NS, 'text')
    texto.setAttribute('x', (pa.x + pb.x) / 2)
    texto.setAttribute('y', (pa.y + pb.y) / 2)
    texto.setAttribute('class', 'lazo-fecha')
    texto.textContent = formatearFecha(con.formada_en)
    grupo.appendChild(texto)

    svg.appendChild(grupo)
  }
}
