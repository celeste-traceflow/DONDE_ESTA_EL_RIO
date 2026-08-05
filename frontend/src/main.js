import './style.css'
import { cargarDataset } from './data.js'
import { renderCauce } from './cauce.js'
import { renderNacimiento } from './nacimiento.js'
import { crearMenuSuperior } from './menu.js'

const app = document.querySelector('#app')

const contenido = document.createElement('div')
contenido.className = 'seccion-contenido'
app.appendChild(contenido)

let menu = null
let seccionActual = 'rio' // por ahora el punto de entrada sigue siendo el Cauce
let datasetPromise = null

function obtenerDatasetCacheado() {
  if (!datasetPromise) datasetPromise = cargarDataset()
  return datasetPromise
}

function navegar(seccion) {
  seccionActual = seccion
  menu?.remove()
  menu = crearMenuSuperior(seccionActual, navegar)
  app.appendChild(menu)
  mostrarSeccion(seccion)
}

function mostrarSeccion(seccion) {
  contenido.innerHTML = ''

  if (seccion === 'nacimiento') {
    renderNacimiento(contenido)
    return
  }

  if (seccion === 'rio') {
    obtenerDatasetCacheado()
      .then((dataset) => renderCauce(contenido, dataset))
      .catch((err) => {
        contenido.textContent = `Error cargando el dataset: ${err.message}`
        console.error(err)
      })
    return
  }

  // "Donde está el río" y "Dataset sensible" todavía no están armadas.
  contenido.innerHTML = `
    <div class="seccion-proximamente">
      <p>Próximamente.</p>
    </div>
  `
}

menu = crearMenuSuperior(seccionActual, navegar)
app.appendChild(menu)
mostrarSeccion(seccionActual)
