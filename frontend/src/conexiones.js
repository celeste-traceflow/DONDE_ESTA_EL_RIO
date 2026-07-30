import { calcularEmbedding, similitudCoseno, construirTextoRecuerdo, construirTextoCita } from './embeddings.js'
import {
  obtenerEmbeddings,
  guardarEmbedding,
  obtenerTodosTagsEstado,
  guardarConexiones,
} from './api.js'

const VECINOS_POR_TARJETA = 3

let cacheEmbeddings = null // Map: "tipo-id" -> vector

async function asegurarCache() {
  if (cacheEmbeddings) return cacheEmbeddings
  const guardados = await obtenerEmbeddings()
  cacheEmbeddings = new Map(guardados.map((e) => [`${e.tipo}-${e.item_id}`, e.vector]))
  return cacheEmbeddings
}

function conexionesDesde(clave, cache) {
  const vector = cache.get(clave)
  const [tipoA, idA] = clave.split('-')
  return [...cache.entries()]
    .filter(([k]) => k !== clave)
    .map(([k, v]) => ({ k, similaridad: similitudCoseno(vector, v) }))
    .sort((a, b) => b.similaridad - a.similaridad)
    .slice(0, VECINOS_POR_TARJETA)
    .map(({ k, similaridad }) => {
      const [tipoB, idB] = k.split('-')
      return { tipo_a: tipoA, id_a: Number(idA), tipo_b: tipoB, id_b: Number(idB), similaridad }
    })
}

// Primera sincronización: calcula el embedding de cualquier tarjeta que
// todavía no lo tenga guardado (arranque en frío puede tardar, una vez
// calculado queda cacheado en Postgres) y arma las conexiones de todas.
export async function sincronizarEmbeddingsYConexiones(recuerdos, citas, onProgreso) {
  const [cache, tagsEstadoTodos] = await Promise.all([asegurarCache(), obtenerTodosTagsEstado()])

  const items = [
    ...recuerdos.map((r) => ({
      tipo: 'recuerdo',
      id: r.id,
      texto: construirTextoRecuerdo(r, tagsEstadoTodos[r.id] || {}),
    })),
    ...citas.map((c) => ({ tipo: 'cita', id: c.id, texto: construirTextoCita(c) })),
  ]

  for (const item of items) {
    const clave = `${item.tipo}-${item.id}`
    if (cache.has(clave)) continue
    onProgreso?.(`Calculando embedding ${clave}...`)
    const vector = await calcularEmbedding(item.texto)
    cache.set(clave, vector)
    await guardarEmbedding(item.tipo, item.id, vector)
  }

  onProgreso?.('Calculando conexiones...')
  const conexionesPorPar = new Map()
  for (const clave of cache.keys()) {
    for (const con of conexionesDesde(clave, cache)) {
      const parOrdenado = [`${con.tipo_a}-${con.id_a}`, `${con.tipo_b}-${con.id_b}`].sort().join('|')
      const existente = conexionesPorPar.get(parOrdenado)
      if (!existente || existente.similaridad < con.similaridad) {
        conexionesPorPar.set(parOrdenado, con)
      }
    }
  }

  const conexiones = [...conexionesPorPar.values()]
  await guardarConexiones(conexiones)
  onProgreso?.(`Listo: ${conexiones.length} conexiones.`)
  return conexiones
}

// Cuando se subraya/tacha una palabra, sólo recalculamos el embedding de esa
// tarjeta puntual (no las 64) y sus conexiones.
export async function actualizarEmbeddingRecuerdo(recuerdo, tagsEstado) {
  const cache = await asegurarCache()
  const clave = `recuerdo-${recuerdo.id}`
  const texto = construirTextoRecuerdo(recuerdo, tagsEstado)
  const vector = await calcularEmbedding(texto)
  cache.set(clave, vector)
  await guardarEmbedding('recuerdo', recuerdo.id, vector)
  await guardarConexiones(conexionesDesde(clave, cache))
}
