const NS = 'http://www.w3.org/2000/svg'

export function crearCapaLazos() {
  const svg = document.createElementNS(NS, 'svg')
  svg.classList.add('capa-lazos')
  return svg
}

// Trazo sinuoso (nunca recto): varias ondas a lo largo de la línea directa
// (no solo una curva simple), suavizadas con quadratics encadenadas —
// mismo espíritu que el meandro del propio Cauce.
function pathSerpenteante(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const largo = Math.hypot(dx, dy) || 1
  const nx = -dy / largo
  const ny = dx / largo
  const amplitud = Math.min(26, Math.max(8, largo * 0.045))
  const ondas = largo > 500 ? 4 : largo > 200 ? 3 : 2

  const pasos = ondas * 2 + 2
  const puntos = []
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos
    const onda = Math.sin(t * Math.PI * ondas) * amplitud
    puntos.push({
      x: x1 + dx * t + nx * onda,
      y: y1 + dy * t + ny * onda,
    })
  }

  let d = `M ${puntos[0].x} ${puntos[0].y}`
  for (let i = 1; i < puntos.length - 1; i++) {
    const actual = puntos[i]
    const siguiente = puntos[i + 1]
    const medioX = (actual.x + siguiente.x) / 2
    const medioY = (actual.y + siguiente.y) / 2
    d += ` Q ${actual.x} ${actual.y} ${medioX} ${medioY}`
  }
  const ultimo = puntos[puntos.length - 1]
  d += ` L ${ultimo.x} ${ultimo.y}`
  return d
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
