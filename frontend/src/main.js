import './style.css'
import { cargarDataset } from './data.js'
import { renderCauce } from './cauce.js'

const app = document.querySelector('#app')

cargarDataset()
  .then((dataset) => renderCauce(app, dataset))
  .catch((err) => {
    app.textContent = `Error cargando el dataset: ${err.message}`
    console.error(err)
  })
