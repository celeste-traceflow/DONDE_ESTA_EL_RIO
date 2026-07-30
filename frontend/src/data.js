export async function cargarDataset() {
  const [recuerdos, citas] = await Promise.all([
    fetch('/data/dataset-lectura-afectiva.json').then((r) => r.json()),
    fetch('/data/citas-teoricas.json').then((r) => r.json()),
  ])
  return { recuerdos, citas }
}
