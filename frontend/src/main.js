import './style.css'
import { pipeline } from '@huggingface/transformers'

const EMBEDDING_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'

const app = document.querySelector('#app')
app.innerHTML = `
  <h1>Río de recuerdos — prueba local de embeddings (Transformers.js)</h1>
  <p>Esto es solo un chequeo técnico: confirma que el modelo corre en el navegador y que puede leer los dos JSON del dataset. No es la interfaz final.</p>
  <div id="log"></div>
`
const logEl = document.querySelector('#log')

function log(message, kind = '') {
  const line = document.createElement('div')
  if (kind) line.className = kind
  line.textContent = message
  logEl.appendChild(line)
  console.log(message)
}

function cosineSimilarity(a, b) {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

async function run() {
  const start = performance.now()

  try {
    log('Cargando dataset-lectura-afectiva.json y citas-teoricas.json...')
    const [recuerdos, citas] = await Promise.all([
      fetch('/data/dataset-lectura-afectiva.json').then((r) => r.json()),
      fetch('/data/citas-teoricas.json').then((r) => r.json()),
    ])
    log(`Recuerdos cargados: ${recuerdos.length}`, 'ok')
    log(`Citas teóricas cargadas: ${citas.length}`, 'ok')

    log(`Descargando el modelo de embeddings (${EMBEDDING_MODEL})... esto puede tardar la primera vez.`)
    const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL, {
      progress_callback: (event) => {
        if (event.status === 'done') {
          log(`  archivo listo: ${event.file}`)
        }
      },
    })
    log('Modelo cargado.', 'ok')

    const items = [
      ...recuerdos.map((r) => ({
        tipo: 'recuerdo',
        id: r.id,
        etiqueta: r.archivo,
        texto: `${r.recuerdo_afectivo}\n${r.tags_algoritmicas}`,
      })),
      ...citas.map((c) => ({
        tipo: 'cita',
        id: c.id,
        etiqueta: c.autor,
        texto: c.texto,
      })),
    ]

    log(`Generando embeddings para ${items.length} tarjetas (${recuerdos.length} recuerdos + ${citas.length} citas)...`)
    const embeddings = []
    for (const item of items) {
      const output = await extractor(item.texto, { pooling: 'mean', normalize: true })
      embeddings.push({ ...item, vector: Array.from(output.data) })
    }
    log(`Embeddings generados: ${embeddings.length} (dimensión ${embeddings[0].vector.length})`, 'ok')

    const byId = (tipo, id) => embeddings.find((e) => e.tipo === tipo && e.id === id)

    log('')
    log('Chequeo de sentido: similaridad coseno entre algunas tarjetas')

    const pares = [
      ['recuerdo', 4, 'recuerdo', 7, '"caminoaltronador" vs "abue_margaritas" (las dos mencionan a la abuela Celia y margaritas)'],
      ['recuerdo', 4, 'recuerdo', 43, '"caminoaltronador" vs "z_bariloche" (paisaje de Bariloche, sin margaritas ni abuela)'],
      ['cita', 4, 'recuerdo', 36, 'cita de Zuboff sobre el río vs "remarmarce" (paseo en kayak por el río)'],
    ]

    for (const [tipoA, idA, tipoB, idB, descripcion] of pares) {
      const a = byId(tipoA, idA)
      const b = byId(tipoB, idB)
      const sim = cosineSimilarity(a.vector, b.vector)
      log(`  ${descripcion}: ${sim.toFixed(3)}`)
    }

    const elapsed = ((performance.now() - start) / 1000).toFixed(1)
    log('')
    log(`Listo. Todo el proceso tardó ${elapsed}s en este navegador.`, 'ok')
  } catch (err) {
    log(`Error: ${err.message}`, 'warn')
    console.error(err)
  }
}

run()
