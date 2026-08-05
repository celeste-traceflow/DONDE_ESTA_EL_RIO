// Menú superior, siempre visible, compartido por las 4 secciones del sitio.
export const SECCIONES = [
  { clave: 'inicio', etiqueta: 'Donde está el río' },
  { clave: 'nacimiento', etiqueta: 'Nacimiento' },
  { clave: 'dataset', etiqueta: 'Dataset sensible' },
  { clave: 'rio', etiqueta: 'Río de recuerdos' },
]

export function crearMenuSuperior(seccionActual, onNavegar) {
  const contenedor = document.createElement('div')
  contenedor.className = 'menu-superior'

  const actual = SECCIONES.find((s) => s.clave === seccionActual)

  contenedor.innerHTML = `
    <div class="menu-superior-pill">
      <button type="button" class="menu-superior-hamburguesa" title="Menú">☰</button>
      <span class="menu-superior-separador"></span>
      <span class="menu-superior-etiqueta">${actual ? actual.etiqueta.toUpperCase() : ''}</span>
    </div>
    <div class="menu-desplegable" hidden>
      ${SECCIONES.map(
        (s) =>
          `<button type="button" class="menu-desplegable-item${s.clave === seccionActual ? ' activo' : ''}" data-seccion="${s.clave}">${s.etiqueta}</button>`
      ).join('')}
    </div>
  `

  const desplegable = contenedor.querySelector('.menu-desplegable')

  contenedor.querySelector('.menu-superior-hamburguesa').addEventListener('click', (e) => {
    e.stopPropagation()
    desplegable.hidden = !desplegable.hidden
  })

  document.addEventListener('click', (e) => {
    if (!contenedor.contains(e.target)) desplegable.hidden = true
  })

  desplegable.querySelectorAll('.menu-desplegable-item').forEach((boton) => {
    boton.addEventListener('click', () => {
      desplegable.hidden = true
      onNavegar(boton.dataset.seccion)
    })
  })

  return contenedor
}
