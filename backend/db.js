import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aquí = path.dirname(fileURLToPath(import.meta.url));
const carpetaData = path.join(aquí, "data");
fs.mkdirSync(carpetaData, { recursive: true });

const rutaDb = process.env.DB_PATH || path.join(carpetaData, "rio.db");

export const db = new Database(rutaDb);
db.pragma("journal_mode = WAL");

// La base es un solo archivo local: si no existe (primera vez que se levanta
// el proyecto en esta compu) o le falta alguna tabla, se crea sola acá mismo,
// sin ningún paso manual de setup.
const schema = fs.readFileSync(path.join(aquí, "schema.sql"), "utf-8");
db.exec(schema);
