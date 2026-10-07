import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const SIN_ASIGNACION = "Sin asignación en el Plan 2026";

const plan = new Map([
  ["M. Sc. Lucas José Hidalgo Quezada", {
    area: "Turística; Administrativa Financiera",
    asignatura: "TUR 2629 - Planificación Turística; TUR 2623 - Economía Turística",
  }],
  ["M. Sc. Víctor Hugo Amurrio Tórrez", {
    area: "Administrativa Financiera",
    asignatura: "TUR 2630 - Administración Organizacional Turística",
  }],
  ["M. Sc. Luis Roberto Amusquivar Fernández", {
    area: "Metodológica",
    asignatura: "TUR 2604 - Lenguaje e Investigación Documental",
  }],
  ["Lic. Dorys Arias Pérez", {
    area: "Turística; Administrativa Financiera",
    asignatura: "TUR 2617 - Diseño de Productos Turísticos; TUR 2637 - Gestión y Normativa de la Calidad Turística; TUR 2620 - Administración Hotelera y de Alimentos y Bebidas",
  }],
  ["M. Sc. José Luis Barrios Rada", {
    area: "Sociocultural",
    asignatura: "TUR 2603 - Psicología Turística y Manejo de Conflictos",
  }],
  ["Lic. Yolanda Borrega Reyes", {
    area: "Sociocultural",
    asignatura: "TUR 2605 - Etnología y Etnoturismo",
  }],
  ["Dr. Raúl Javier Calderón Jemio", {
    area: "Sociocultural; Metodológica",
    asignatura: "TUR 2602 - Patrimonio Turístico Cultural de la Humanidad; TUR 2628 - Taller Integrador de TUS-Tesina",
  }],
  ["Ph.D. Susana Tania Díaz Cuentas", {
    area: "Turística; Metodológica",
    asignatura: "TUR 2615 - Patrimonio Turístico Natural y Ecoturismo; TUR 2643 - Taller Integrador de Proyecto de Grado Licenciatura",
  }],
  ["M. Sc. Mónica Chacón Delgado", {
    area: "Turística",
    asignatura: "TUR 2640 - Gestión Pública del Turismo",
  }],
  ["Lic. Deicy Clavijo Santander", {
    area: "Sociocultural",
    asignatura: "TUR 2619 - Eventos Turísticos y Anfitrionaje",
  }],
  ["Lic. Nelson Patricio Cruz Monroy", {
    area: "Administrativa Financiera",
    asignatura: "TUR 2633 - Gestión Financiera Aplicada al Turismo",
  }],
  ["Ph.D. Margot Juana Cavero Contreras", {
    area: "Turística; Administrativa Financiera",
    asignatura: "TUR 2614 - Técnicas de Guiado e Interpretación Turística; TUR 2627 - Administración de Museos y Centros de Interpretación Turística",
  }],
  ["M. Sc. Javier Fernando Escalante Moscoso", {
    area: "Sociocultural",
    asignatura: "TUR 2608 - Patrimonio Cultural, Histórico y Turístico de Bolivia; TUR 2622 - Patrimonio Turístico Inmaterial de La Paz",
  }],
  ["Mg. Tur. Edith Pamela Escobar Lima", {
    area: "Tecnológica Digital",
    asignatura: "TUR 2626 - Plataformas de Gestión y Reservas en Turismo",
  }],
  ["M. Sc. Adhemar Eduardo Goyzueta Cordero", {
    area: "Sociocultural",
    asignatura: "TUR 2612 - Legislación Turística Nacional e Internacional",
  }],
  ["Mg. Tur. Jorge Antonio Gutiérrez Adauto", {
    area: "Turística",
    asignatura: "TUR 2634 - Ordenamiento Turístico del Territorio; TUR 2641 - Gestión Turística Patrimonio Natural",
  }],
  ["Mg. Tur. Ilsen Mariel Gutiérrez Castellón", {
    area: "Metodológica; Administrativa Financiera",
    asignatura: "TUR 2616 - Metodología y Enfoques de Investigación Turística; TUR 2638 - Formulación y Evaluación de Proyectos Turísticos",
  }],
  ["M. Sc. Carlos Daniel Pérez Millares", {
    area: "Turística; Tecnológica Digital",
    asignatura: "TUR 2609 - Geografía Turística y Cartografía Aplicada; TUR 2621 - Aplicación de Herramientas Digitales para Turismo",
  }],
  ["Mg. Tur. Erick Rómulo Rodríguez Luján", {
    area: "Turística; Administrativa Financiera; Tecnológica Digital",
    asignatura: "TUR 2624 - Turismo Alternativo y de Naturaleza; TUR 2635 - Emprendimientos y Modelos de Negocios en Turismo; TUR 2636 - Educación Turística y Producción de Contenidos Digitales",
  }],
  ["Lic. Néstor Alejandro Tovar Pérez", {
    area: "Metodológica; Administrativa Financiera",
    asignatura: "TUR 2611 - Estadística y Análisis Cuantitativo del Turismo; TUR 2607 - Análisis de Costos y Presupuestos Aplicados al Turismo",
  }],
  ["M. Sc. Germán Prudencio Velásquez Flores", {
    area: "Metodológica",
    asignatura: "TUR 2642 - Taller Integrador de Tesis de Grado Licenciatura",
  }],
  ["Mg. Tur. Jenny Ivonne Vera Mendia", {
    area: "Administrativa Financiera",
    asignatura: "TUR 2613 - Agencias de Viaje y Operación de Servicios",
  }],
  ["Dr. Adalid Domingo Zamora Gutiérrez", {
    area: "Sociocultural",
    asignatura: "TUR 2625 - Primeros Auxilios y Gestión de Riesgos en Operaciones Turísticas",
  }],
  ["Mg. Tur. Dante Enrique Caero Miranda", {
    area: "Turística; Administrativa Financiera",
    asignatura: "TUR 2601 - Fundamentos e Impactos de la Actividad Turística; TUR 2606 - Turismo Sostenible y Regenerativo; TUR 2618 - Marketing Turístico; TUR 2631 - Estrategias de Marketing Turístico y Branding de Destino",
  }],
]);

const aplicar = process.argv.includes("--apply");
const { data: docentes, error } = await supabase
  .from("docentes")
  .select("id,nombre,activo,area,asignatura")
  .order("id");

if (error) throw error;

const nombresActuales = new Set(docentes.map(({ nombre }) => nombre.replace(/\s+/g, " ").trim()));
const nuevos = [...plan.entries()].filter(([nombre]) => !nombresActuales.has(nombre));
const actualizaciones = docentes.map((docente) => ({
  id: docente.id,
  nombre: docente.nombre,
  ...(plan.get(docente.nombre.replace(/\s+/g, " ").trim()) ?? {
    area: SIN_ASIGNACION,
    asignatura: SIN_ASIGNACION,
  }),
}));

console.log(JSON.stringify({
  modo: aplicar ? "aplicar" : "vista_previa",
  existentes: docentes.length,
  actualizaciones: actualizaciones.length,
  nuevos: nuevos.map(([nombre, datos]) => ({ nombre, ...datos })),
  sinAsignacion: actualizaciones.filter(({ area }) => area === SIN_ASIGNACION).map(({ id, nombre }) => ({ id, nombre })),
}, null, 2));

if (aplicar) {
  for (const { id, area, asignatura } of actualizaciones) {
    const { error: updateError } = await supabase.from("docentes").update({ area, asignatura }).eq("id", id);
    if (updateError) throw new Error(`No se pudo actualizar el docente ${id}: ${updateError.message}`);
  }

  if (nuevos.length) {
    const { error: insertError } = await supabase.from("docentes").insert(
      nuevos.map(([nombre, datos]) => ({ nombre, activo: true, ...datos })),
    );
    if (insertError) throw new Error(`No se pudieron agregar docentes: ${insertError.message}`);
  }

  console.log(`Completado: ${actualizaciones.length} docentes actualizados y ${nuevos.length} agregados.`);
}
