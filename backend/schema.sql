-- Sedimento: post-its que se van sumando a un recuerdo puntual
create table if not exists post_its (
  id serial primary key,
  recuerdo_id integer not null,
  texto text not null,
  variante text not null default 'gris' check (variante in ('gris', 'beige')),
  creado_en timestamptz not null default now()
);

-- Citas teóricas nuevas, agregadas desde el menú operativo (distintas de las
-- 14 semilla de citas-teoricas.json)
create table if not exists citas_usuario (
  id serial primary key,
  texto text not null,
  autor text,
  fuente text,
  recuerdo_cercano_id integer,
  creado_en timestamptz not null default now()
);

-- Subrayado/tachado de palabras puntuales en la tabla de tags de un recuerdo
create table if not exists tags_estado (
  recuerdo_id integer not null,
  palabra text not null,
  estado text not null check (estado in ('subrayado', 'tachado')),
  actualizado_en timestamptz not null default now(),
  primary key (recuerdo_id, palabra)
);

-- Embeddings ya calculados (client-side) para cada tarjeta, para no tener
-- que recalcularlos en cada visita
create table if not exists embeddings (
  tipo text not null check (tipo in ('recuerdo', 'cita', 'cita_usuario')),
  item_id integer not null,
  vector jsonb not null,
  actualizado_en timestamptz not null default now(),
  primary key (tipo, item_id)
);

-- Conexiones formadas entre tarjetas (una vez formada, se guarda la fecha
-- de forma estable)
create table if not exists conexiones (
  tipo_a text not null,
  id_a integer not null,
  tipo_b text not null,
  id_b integer not null,
  similaridad real not null,
  formada_en timestamptz not null default now(),
  primary key (tipo_a, id_a, tipo_b, id_b)
);
