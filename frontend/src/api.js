const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

export async function obtenerTagsEstado(recuerdoId) {
  const res = await fetch(`${API_URL}/api/tags-estado/${recuerdoId}`)
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
