import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", proyecto: "rio-de-recuerdos" });
});

app.get("/health/db", async (req, res) => {
  try {
    const { rows } = await pool.query("select now()");
    res.json({ status: "ok", hora_db: rows[0].now });
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.get("/api/tags-estado", async (req, res) => {
  try {
    const { rows } = await pool.query("select recuerdo_id, palabra, estado from tags_estado");
    const porRecuerdo = {};
    for (const fila of rows) {
      if (!porRecuerdo[fila.recuerdo_id]) porRecuerdo[fila.recuerdo_id] = {};
      porRecuerdo[fila.recuerdo_id][fila.palabra] = fila.estado;
    }
    res.json(porRecuerdo);
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.get("/api/tags-estado/:recuerdoId", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "select palabra, estado from tags_estado where recuerdo_id = $1",
      [req.params.recuerdoId]
    );
    const estado = {};
    for (const fila of rows) estado[fila.palabra] = fila.estado;
    res.json(estado);
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.post("/api/tags-estado", async (req, res) => {
  const { recuerdo_id, palabra, estado } = req.body;
  if (!recuerdo_id || !palabra) {
    return res.status(400).json({ status: "error", mensaje: "Falta recuerdo_id o palabra" });
  }
  try {
    if (estado === null) {
      await pool.query(
        "delete from tags_estado where recuerdo_id = $1 and palabra = $2",
        [recuerdo_id, palabra]
      );
    } else {
      await pool.query(
        `insert into tags_estado (recuerdo_id, palabra, estado)
         values ($1, $2, $3)
         on conflict (recuerdo_id, palabra)
         do update set estado = $3, actualizado_en = now()`,
        [recuerdo_id, palabra, estado]
      );
    }
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.get("/api/embeddings", async (req, res) => {
  try {
    const { rows } = await pool.query("select tipo, item_id, vector from embeddings");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.post("/api/embeddings", async (req, res) => {
  const { tipo, item_id, vector } = req.body;
  if (!tipo || !item_id || !Array.isArray(vector)) {
    return res.status(400).json({ status: "error", mensaje: "Falta tipo, item_id o vector" });
  }
  try {
    await pool.query(
      `insert into embeddings (tipo, item_id, vector)
       values ($1, $2, $3)
       on conflict (tipo, item_id)
       do update set vector = $3, actualizado_en = now()`,
      [tipo, item_id, JSON.stringify(vector)]
    );
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.get("/api/conexiones", async (req, res) => {
  try {
    const { rows } = await pool.query("select * from conexiones");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.post("/api/conexiones", async (req, res) => {
  const { conexiones } = req.body;
  if (!Array.isArray(conexiones)) {
    return res.status(400).json({ status: "error", mensaje: "Falta el array de conexiones" });
  }
  try {
    for (const c of conexiones) {
      await pool.query(
        `insert into conexiones (tipo_a, id_a, tipo_b, id_b, similaridad)
         values ($1, $2, $3, $4, $5)
         on conflict (tipo_a, id_a, tipo_b, id_b)
         do update set similaridad = $5`,
        [c.tipo_a, c.id_a, c.tipo_b, c.id_b, c.similaridad]
      );
    }
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", mensaje: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend escuchando en el puerto ${port}`);
});
