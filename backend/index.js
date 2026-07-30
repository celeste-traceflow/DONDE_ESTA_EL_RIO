import express from "express";
import { pool } from "./db.js";

const app = express();
const port = process.env.PORT || 3000;

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

app.listen(port, () => {
  console.log(`Backend escuchando en el puerto ${port}`);
});
