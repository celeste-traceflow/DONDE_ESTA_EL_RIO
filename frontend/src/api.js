const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

export async function obtenerTagsEstado(recuerdoId) {
  const res = await fetch(`${API_URL}/api/tags-estado/${recuerdoId}`)
  if (!res.ok) return {}
  return res.json()
}

export async function obtenerTodosTagsEstado() {
  const res = await fetch(`${API_URL}/api/tags-estado`)
  if (!res.ok) return {}
  return res.json()
}

export async function guardarTagEstado(recuerdoId, palabra, estado) {
  await fetch(`${API_URL}/api/tags-estado`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recuerdo_id: recuerdoId, palabra, estado }),
  })
}

export async function obtenerEmbeddings() {
  const res = await fetch(`${API_URL}/api/embeddings`)
  if (!res.ok) return []
  return res.json()
}

export async function guardarEmbedding(tipo, itemId, vector) {
  await fetch(`${API_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, item_id: itemId, vector }),
  })
}

export async function obtenerPostIts(recuerdoId) {
  const res = await fetch(`${API_URL}/api/post-its/${recuerdoId}`)
  if (!res.ok) return []
  return res.json()
}

export async function crearPostIt(recuerdoId, texto, variante) {
  const res = await fetch(`${API_URL}/api/post-its`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recuerdo_id: recuerdoId, texto, variante }),
  })
  return res.json()
}

export async function actualizarPostIt(id, cambios) {
  await fetch(`${API_URL}/api/post-its/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cambios),
  })
}

export async function borrarPostIt(id) {
  await fetch(`${API_URL}/api/post-its/${id}`, { method: "DELETE" })
}

export async function obtenerConexiones() {
  const res = await fetch(`${API_URL}/api/conexiones`)
  if (!res.ok) return []
  return res.json()
}

export async function guardarConexiones(conexiones) {
  await fetch(`${API_URL}/api/conexiones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conexiones }),
  })
}
