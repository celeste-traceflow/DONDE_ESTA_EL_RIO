import { pipeline } from '@huggingface/transformers'

const MODELO = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
let extractorPromise = null

function obtenerExtractor(onProgreso) {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODELO, {
      progress_callback: onProgreso,
    })
  }
  return extractorPromise
}

export async function calcularEmbedding(texto, onProgreso) {
  const extractor = await obtenerExtractor(onProgreso)
  const output = await extractor(texto, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

// Los vectores ya vienen normalizados (normalize:true), así que el producto
// punto ya es la similaridad coseno.
export function similitudCoseno(a, b) {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}

// El embedding de un recuerdo combina sus tags algorítmicas (separadas por
// tag, no palabra por palabra) según lo que se subrayó/tachó: subrayar pesa
// más (se repite), tachar la saca del todo. Deliberadamente NO incluye el
// recuerdo_afectivo — las conexiones se guían por la lectura algorítmica
// modulada por el gesto afectivo, no por el texto propio.
export function construirTextoRecuerdo(recuerdo, tagsEstado = {}) {
  const partes = []
  recuerdo.tags_algoritmicas.split('\n').forEach((linea) => {
    const idx = linea.indexOf(':')
    if (idx === -1) return
    const valor = linea.slice(idx + 1).trim()
    valor
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((seg) => {
        const estado = tagsEstado[seg]
        if (estado === 'tachado') return
        partes.push(seg)
        if (estado === 'subrayado') partes.push(seg, seg)
      })
  })
  return partes.join(', ')
}

export function construirTextoCita(cita) {
  return cita.texto
}
