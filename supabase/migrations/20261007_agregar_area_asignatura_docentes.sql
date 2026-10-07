-- Datos informativos visibles y editables únicamente desde Administración.
-- Son opcionales para conservar todos los docentes existentes.
alter table public.docentes
  add column if not exists area text,
  add column if not exists asignatura text;

comment on column public.docentes.area is
  'Área académica del docente, administrada desde el panel de Administración.';

comment on column public.docentes.asignatura is
  'Asignatura del docente, administrada desde el panel de Administración.';
