const NS = 'http://www.w3.org/2000/svg'

// Una banda ondulada, sumando dos senos de distinta frecuencia (igual
// espíritu que formaRio en cauce.js) para que no se vea como una onda
// perfecta sino como un meandro real.
function pathBanda(ancho, yBase, amplitud, frecuencia, fase) {
  const pasos = 48
  let d = ''
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos
    const x = ancho * t
    const y =
      yBase +
      Math.sin(t * Math.PI * frecuencia + fase) * amplitud +
      Math.sin(t * Math.PI * frecuencia * 2.2 + fase * 1.6) * amplitud * 0.3
    d += i === 0 ? `M ${x} ${y}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d
}

// Textura de fondo tipo mapa hidrográfico: solo meandros abstractos, sin
// ningún topónimo ni recorte de lugar real (no es un mapa "de verdad", es
// una evocación). Deliberadamente menos sinuosa y mucho más tenue que los
// lazos de conexión — es paisaje, no información.
export function crearMapaFondo(minX, maxX, minY, maxY) {
  const margen = 900
  const x0 = minX - margen
  const y0 = minY - margen
  const ancho = maxX - minX + margen * 2
  const alto = maxY - minY + margen * 2

  const svg = document.createElementNS(NS, 'svg')
  svg.classList.add('capa-mapa-fondo')
  svg.setAttribute('width', ancho)
  svg.setAttribute('height', alto)
  svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`)
  svg.style.left = `${x0}px`
  svg.style.top = `${y0}px`

  const bandas = 6
  const paso = alto / (bandas + 1)
  for (let i = 0; i < bandas; i++) {
    const yBase = paso * (i + 1) + (Math.random() - 0.5) * paso * 0.4
    const amplitud = 70 + Math.random() * 140
    const frecuencia = 1.6 + Math.random() * 1.4
    const fase = Math.random() * Math.PI * 2
    const path = document.createElementNS(NS, 'path')
    path.setAttribute('d', pathBanda(ancho, yBase, amplitud, frecuencia, fase))
    path.setAttribute('class', 'mapa-fondo-linea')
    svg.appendChild(path)
  }

  return svg
}
