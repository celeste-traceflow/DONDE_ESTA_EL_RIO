// Contorno tipo estampilla postal: perforaciones semicirculares a lo largo de
// todo el perímetro, calculadas según el ancho/alto real del elemento (se
// adapta solo al largo de cada texto). Compartido entre la tarjeta de
// recuerdo y cualquier otra tarjeta que use el mismo tratamiento visual.
function pathEstampilla(w, h, radio) {
  const nTop = Math.max(3, Math.round(w / (2 * radio)))
  const nLado = Math.max(3, Math.round(h / (2 * radio)))
  const stepX = w / nTop
  const stepY = h / nLado

  let d = `M 0 0`
  for (let i = 1; i <= nTop; i++) d += ` A ${stepX / 2} ${stepX / 2} 0 0 0 ${i * stepX} 0`
  for (let i = 1; i <= nLado; i++) d += ` A ${stepY / 2} ${stepY / 2} 0 0 0 ${w} ${i * stepY}`
  for (let i = 1; i <= nTop; i++) d += ` A ${stepX / 2} ${stepX / 2} 0 0 0 ${w - i * stepX} ${h}`
  for (let i = 1; i <= nLado; i++) d += ` A ${stepY / 2} ${stepY / 2} 0 0 0 0 ${h - i * stepY}`
  return d + ' Z'
}

export function aplicarBordeEstampilla(el, radio = 7) {
  const w = el.offsetWidth
  const h = el.offsetHeight
  if (!w || !h) return
  el.style.clipPath = `path('${pathEstampilla(w, h, radio)}')`
}
