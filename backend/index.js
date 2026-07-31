import express from "express";
import cors from "cors";
import { db } from "./db.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", proyecto: "rio-de-recuerdos" });
});

app.get("/health/db", (req, res) => {
  try {
    const fila = db.prepare("select datetime('now') as ahora").get();
    res.json({ status: "ok", hora_db: fila.ahora });
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.get("/api/tags-estado", (req, res) => {
  try {
    const filas = db.prepare("select recuerdo_id, palabra, estado from tags_estado").all();
    const porRecuerdo = {};
    for (const fila of filas) {
      if (!porRecuerdo[fila.recuerdo_id]) porRecuerdo[fila.recuerdo_id] = {};
      porRecuerdo[fila.recuerdo_id][fila.palabra] = fila.estado;
    }
    res.json(porRecuerdo);
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.get("/api/tags-estado/:recuerdoId", (req, res) => {
  try {
    const filas = db
      .prepare("select palabra, estado from tags_estado where recuerdo_id = ?")
      .all(req.params.recuerdoId);
    const estado = {};
    for (const fila of filas) estado[fila.palabra] = fila.estado;
    res.json(estado);
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.post("/api/tags-estado", (req, res) => {
  const { recuerdo_id, palabra, estado } = req.body;
  if (!recuerdo_id || !palabra) {
    return res.status(400).json({ status: "error", mensaje: "Falta recuerdo_id o palabra" });
  }
  try {
    if (estado === null) {
      db.prepare("delete from tags_estado where recuerdo_id = ? and palabra = ?").run(recuerdo_id, palabra);
    } else {
      db.prepare(
        `insert into tags_estado (recuerdo_id, palabra, estado)
         values (?, ?, ?)
         on conflict (recuerdo_id, palabra)
         do update set estado = excluded.estado, actualizado_en = datetime('now')`
      ).run(recuerdo_id, palabra, estado);
    }
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.get("/api/embeddings", (req, res) => {
  try {
    const filas = db.prepare("select tipo, item_id, vector from embeddings").all();
    res.json(filas.map((f) => ({ ...f, vector: JSON.parse(f.vector) })));
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.post("/api/embeddings", (req, res) => {
  const { tipo, item_id, vector } = req.body;
  if (!tipo || !item_id || !Array.isArray(vector)) {
    return res.status(400).json({ status: "error", mensaje: "Falta tipo, item_id o vector" });
  }
  try {
    db.prepare(
      `insert into embeddings (tipo, item_id, vector)
       values (?, ?, ?)
       on conflict (tipo, item_id)
       do update set vector = excluded.vector, actualizado_en = datetime('now')`
    ).run(tipo, item_id, JSON.stringify(vector));
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.get("/api/conexiones", (req, res) => {
  try {
    const filas = db.prepare("select * from conexiones").all();
    res.json(filas);
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.post("/api/conexiones", (req, res) => {
  const { conexiones } = req.body;
  if (!Array.isArray(conexiones)) {
    return res.status(400).json({ status: "error", mensaje: "Falta el array de conexiones" });
  }
  try {
    const upsert = db.prepare(
      `insert into conexiones (tipo_a, id_a, tipo_b, id_b, similaridad)
       values (?, ?, ?, ?, ?)
       on conflict (tipo_a, id_a, tipo_b, id_b)
       do update set similaridad = excluded.similaridad`
    );
    const insertarTodas = db.transaction((lista) => {
      for (const c of lista) upsert.run(c.tipo_a, c.id_a, c.tipo_b, c.id_b, c.similaridad);
    });
    insertarTodas(conexiones);
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.get("/api/post-its/:recuerdoId", (req, res) => {
  try {
    const filas = db
      .prepare(
        "select id, texto, variante, lugar_fecha, pos_x, pos_y, creado_en from post_its where recuerdo_id = ? order by creado_en asc"
      )
      .all(req.params.recuerdoId);
    res.json(filas);
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.post("/api/post-its", (req, res) => {
  const { recuerdo_id, texto, variante, lugar_fecha, pos_x, pos_y } = req.body;
  if (!recuerdo_id) {
    return res.status(400).json({ status: "error", mensaje: "Falta recuerdo_id" });
  }
  try {
    const fila = db
      .prepare(
        `insert into post_its (recuerdo_id, texto, variante, lugar_fecha, pos_x, pos_y)
         values (?, ?, ?, ?, ?, ?)
         returning id, texto, variante, lugar_fecha, pos_x, pos_y, creado_en`
      )
      .get(recuerdo_id, texto || "", variante || "gris", lugar_fecha || null, pos_x ?? 0, pos_y ?? 0);
    res.json(fila);
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.put("/api/post-its/:id", (req, res) => {
  const { texto = null, variante = null, lugar_fecha = null, pos_x = null, pos_y = null } = req.body;
  try {
    db.prepare(
      `update post_its set
         texto = coalesce(?, texto),
         variante = coalesce(?, variante),
         lugar_fecha = coalesce(?, lugar_fecha),
         pos_x = coalesce(?, pos_x),
         pos_y = coalesce(?, pos_y)
       where id = ?`
    ).run(texto, variante, lugar_fecha, pos_x, pos_y, req.params.id);
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.delete("/api/post-its/:id", (req, res) => {
  try {
    db.prepare("delete from post_its where id = ?").run(req.params.id);
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend escuchando en el puerto ${port}`);
});
