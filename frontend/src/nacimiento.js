import { aplicarBordeEstampilla } from './estampilla.js'

export function renderNacimiento(container) {
  container.innerHTML = `
    <div class="nacimiento-pagina">
      <div class="nacimiento-tarjeta">
        <p class="nacimiento-aclaracion">Diplomatura de inteligencia artificial aplicada al arte multimedial de la UNA Multimediales.</p>
        <p class="nacimiento-texto">"Donde está el río" es un archivo personal navegable donde una cartografía afectiva —mis propios recuerdos, relatos y vínculos— dialoga con una cartografía algorítmica generada por inteligencia artificial. Parto de una frase de mi abuela, "donde está el río, están mis hijos", para pensar la memoria no como un archivo fijo sino como una materia viva que erosiona, sedimenta y cambia de cauce. Construyo un dataset afectivo con fotografías e ilustraciones de mi historia familiar, leído dos veces: una vez por mí, otra por un modelo de inteligencia artificial (Qwen-VL vía ComfyUI) que propone lecturas visuales y semánticas sin interpretar ni narrar. Cada vez que recorro el archivo puedo subrayar o tachar esas lecturas, o dejar un post-it nuevo, y ese gesto sedimenta: las conexiones entre recuerdos se recalculan y el cauce vuelve a cambiar. El resultado es un sitio web interactivo, de acceso local y privado, pensado como un santuario de vida interior: un territorio donde mi memoria permanece abierta a la transformación sin quedar expuesta a la lógica extractiva de los sistemas de vigilancia algorítmica.</p>
      </div>
    </div>
  `

  // Radio bien más grande que en la tarjeta de recuerdo (7px): esta tarjeta
  // es mucho más ancha, así que el festoneado necesita ondas grandes y
  // visibles en vez de una textura fina.
  const RADIO_ESTAMPILLA = 40

  const tarjeta = container.querySelector('.nacimiento-tarjeta')
  aplicarBordeEstampilla(tarjeta, RADIO_ESTAMPILLA)

  // Igual que en la tarjeta de recuerdo: el alto real puede seguir
  // moviéndose (fuente cargando) después de la primera medición.
  const observador = new ResizeObserver(() => aplicarBordeEstampilla(tarjeta, RADIO_ESTAMPILLA))
  observador.observe(tarjeta)

  return {
    destruir() {
      observador.disconnect()
    },
  }
}
