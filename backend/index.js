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

app.listen(port, () => {
  console.log(`Backend escuchando en el puerto ${port}`);
});
