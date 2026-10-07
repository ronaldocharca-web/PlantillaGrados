export type PantallaManual =
  | "inicio"
  | "proyecto-grado"
  | "tesis"
  | "examen-grado"
  | "excelencia"
  | "trab-dirigido"
  | "maestria"
  | "sorteo-docentes"
  | "admin";

type Detalle = { titulo: string; texto: string };
export type PasoManual = {
  titulo: string;
  descripcion: string;
  imagen?: string;
  pieImagen?: string;
  detalles: Detalle[];
};
type Manual = { titulo: string; resumen: string; pasos: PasoManual[] };

const activarPdf: PasoManual = {
  titulo: "Primero, activa el generador PDF",
  descripcion: "Al entrar al acta, comprueba el conversor antes de generar la vista previa. Puedes ir llenando los datos mientras se activa.",
  imagen: "/manuales/generador-listo.jpg",
  pieImagen: "Activador comprobado en Tesis. Este control funciona igual en todas las actas.",
  detalles: [
    { titulo: "1. Activar generador PDF", texto: "Pulsa el botón que está arriba del formulario. Se abre una ventanita con la página de carga del conversor y el estado de la conexión. Puedes cerrarla y seguir llenando los datos mientras se comprueba el servicio." },
    { titulo: "2. Espera la confirmación", texto: "Mientras diga «Activando generador…», espera. Cuando diga «Generador listo ✓» y «Ya puedes generar la vista previa», el conversor habrá confirmado que está disponible." },
    { titulo: "3. Si sigue iniciando", texto: "Pulsa «Reintentar activación» después de esperar un momento. El servicio gratuito puede tardar en iniciar. Si aparece un error 502 al generar, vuelve a comprobarlo y reintenta." },
    { titulo: "Reactivar", texto: "Después de 10 minutos, pulsa «Reactivar generador PDF» para volver a comprobar la conexión. «Reintentar activación» también abre y recarga la ventanita. Si la página no se muestra dentro, pulsa «Abrir página del conversor». La ventana flota sobre el formulario y se cierra con «Cerrar»." },
    { titulo: "Para descargar Word", texto: "El archivo Word se genera directamente. No necesitas activar el conversor PDF para descargarlo." },
  ],
};

const revisarPdf: PasoManual = {
  titulo: "Genera y revisa la vista previa",
  descripcion: "Pulsa «Generar vista previa PDF» al terminar de ingresar los datos que quieras incluir.",
  imagen: "/manuales/vista-previa.jpg",
  pieImagen: "Encabezado del panel de vista previa y botón Imprimir en Tesis. Los controles internos del visor dependen de tu navegador.",
  detalles: [
    { titulo: "Mientras se genera", texto: "El botón muestra «Generando PDF…». Espera a que el documento aparezca en el panel de vista previa." },
    { titulo: "Revisa el documento", texto: "Comprueba nombres, fecha, tema, nota y firmas. Usa el zoom del visor para leerlo y revisa todas las páginas." },
    { titulo: "Si modificas un dato", texto: "La vista previa no se actualiza sola. Vuelve a pulsar «Generar vista previa PDF» para que el PDF refleje los cambios." },
  ],
};

function guardar(word: string): PasoManual {
  return {
    titulo: "Descarga o imprime tu acta",
    descripcion: "Elige Word para continuar editando el acta, o PDF para guardar la versión que revisaste.",
    imagen: "/manuales/descargar-word.jpg",
    pieImagen: "Botones al final del formulario de Tesis. Todas las actas usan estos mismos nombres de botón.",
    detalles: [
      { titulo: "Descargar Word", texto: word },
      { titulo: "Descargar PDF", texto: "Después de generar la vista previa, usa el botón «Descargar PDF» de la pantalla. Ese botón guarda el archivo con el nombre CI-sigla, por ejemplo 12345678-T.pdf. La flecha interna del visor puede usar un nombre aleatorio del navegador." },
      { titulo: "Imprimir", texto: "Cuando haya una vista previa, usa «Imprimir» o el icono de impresora del propio visor. Revisa el tamaño del papel y la vista de impresión antes de confirmar." },
      { titulo: "Antes de salir", texto: "Descarga tu archivo antes de cambiar de pantalla o recargar. Los datos del formulario y la vista previa no se guardan como un borrador permanente." },
    ],
  };
}

function acta(titulo: string, pantalla: PantallaManual, detalles: Detalle[], word: string): Manual {
  return {
    titulo,
    resumen: "Sigue estos cuatro pasos para preparar y guardar el acta.",
    pasos: [activarPdf, {
      titulo: "Ingresa los datos del acta",
      descripcion: "Escribe la información que debe aparecer en el documento. Revisa los nombres y la selección de docentes.",
      imagen: `/manuales/${pantalla}.jpg`,
      pieImagen: `Pantalla de ${titulo}. Los campos en blanco no incluyen datos de ejemplo.`,
      detalles,
    }, revisarPdf, guardar(word)],
  };
}

const fechaPresidente: Detalle[] = [
  { titulo: "Número superior y Libro N.º", texto: "Escribe únicamente números en estos dos campos. El número superior se muestra arriba del acta y el Libro N.º aparece junto a la palabra «Libro». Cada pantalla conserva un valor inicial que puedes editar antes de generar el Word o el PDF." },
  { titulo: "Fecha y hora", texto: "Escribe la fecha en el campo o elígela con el icono de calendario. El orden de día y mes lo muestra tu navegador. Selecciona también la hora de la defensa." },
  { titulo: "Presidente del tribunal", texto: "Selecciona uno de los presidentes activos registrados en Administración. El nombre elegido se utilizará tanto en el PDF como en el Word." },
];
const nota: Detalle = { titulo: "Nota", texto: "Ingresa la calificación entre 0 y 100. Si dejas la nota vacía, el documento muestra __/100. Revisa el resultado en la vista previa." };
const carnet = (sigla: string): Detalle => ({
  titulo: "Carnet de identidad (obligatorio)",
  texto: `Ingresa el CI antes de generar la vista previa PDF o descargar Word. El CI no se inserta dentro del acta: solo se usa para nombrar los archivos descargados con la sigla ${sigla.replace(/[^A-Z]/gi, "")}, por ejemplo 12345678-${sigla.replace(/[^A-Z]/gi, "")}.pdf. Los demás campos pueden conservar las reglas de borrador de esta pantalla.`,
});

export const manuales: Record<PantallaManual, Manual> = {
  maestria: {
    titulo: "Tesis de postgrado de Maestría",
    resumen: "Prepara el acta y las firmas con la plantilla de Maestría.",
    pasos: [activarPdf, {
      titulo: "Completa los datos de Maestría",
      descripcion: "Todos los campos del formulario son obligatorios para generar el PDF o descargar Word.",
      detalles: [
        { titulo: "Postulante y CI", texto: "Escribe el nombre y elige el género. El documento ajustará Licenciado/Licenciada y aprobado/aprobada. El CI solo nombra las descargas: 12345678-M.docx o 12345678-M.pdf; no aparece dentro del acta." },
        { titulo: "Fecha, hora y número superior", texto: "Selecciona la fecha y hora de la defensa. El acta convierte la hora a a. m. o p. m. El número superior indica el folio inicial; las páginas siguientes continúan la numeración." },
        { titulo: "Tesis y grado", texto: "Escribe el título completo, el nombre de la maestría y las siglas del grado. Después de «versión» se conservan tres espacios, sin guiones bajos." },
        { titulo: "Tribunales", texto: "Selecciona dos tribunales docentes, un revisor y un presidente. Los docentes y presidentes activos se gestionan en Administración." },
        { titulo: "Nota", texto: "Ingresa un entero entre 0 y 100. El literal y el resultado se calculan automáticamente: 0–65 reprobado; 66–70 aprobado; 71–80 bueno; 81–90 muy bueno; 91–100 excelente." },
      ],
    }, revisarPdf, guardar("Descarga un Word editable con el nombre CI-M.docx. No necesitas activar el conversor para generar Word.")],
  },
  inicio: {
    titulo: "Inicio",
    resumen: "Conoce las opciones del sistema y elige el acta que necesitas.",
    pasos: [{
      titulo: "¿Para qué sirve cada tarjeta?",
      descripcion: "Pulsa una tarjeta del panel principal para abrir su formulario. También puedes entrar desde el menú lateral.",
      imagen: "/manuales/inicio.jpg",
      pieImagen: "Panel principal del Sistema de Actas.",
      detalles: [
        { titulo: "Proyecto de Grado", texto: "Prepara el acta de defensa pública de un Proyecto de Grado, con postulante, tribunales, tutor, tema y nota." },
        { titulo: "Tesis", texto: "Prepara el acta de defensa de Tesis. Permite uno o dos postulantes y ajusta el texto según su género." },
        { titulo: "Examen de Grado", texto: "Registra un examen con materia, área, aula, convocatoria, duración, tribunales y calificación." },
        { titulo: "Excelencia", texto: "Genera un acta de graduación por excelencia con uno, dos o tres tribunales evaluadores." },
        { titulo: "Trabajo Dirigido", texto: "Genera el acta de defensa de Trabajo Dirigido, con tutor y uno o dos miembros del tribunal." },
        { titulo: "Maestría", texto: "Prepara el acta de tesis de postgrado, con dos tribunales docentes, un revisor, presidente y valoración automática de la nota." },
        { titulo: "Sorteo de docentes", texto: "Asigna números aleatorios a los docentes de un área, controla cuántas áreas puede ocupar cada docente y descarga el resultado en PDF." },
        { titulo: "Administración", texto: "Permite agregar, editar, activar o desactivar docentes, y configurar al presidente del tribunal." },
      ],
    }, {
      titulo: "Conoce los botones de las actas",
      descripcion: "Cada formulario tiene los controles para crear y revisar su documento.",
      detalles: [
        { titulo: "Manual", texto: "Abre la guía de la pantalla actual. Cierra la guía para volver al formulario sin perder los datos que ya escribiste." },
        { titulo: "Activar generador PDF", texto: "Comprueba y despierta el conversor. Actívalo al comenzar a llenar el formulario y espera «Generador listo ✓» antes de crear el PDF." },
        { titulo: "Generar vista previa PDF", texto: "Crea el PDF con los datos actuales y lo muestra en el visor." },
        { titulo: "Descargar Word", texto: "Guarda un archivo .docx editable. No necesita el conversor PDF." },
        { titulo: "Descarga del visor e Imprimir", texto: "La flecha del visor guarda el PDF. «Imprimir» abre la impresión del documento generado." },
        { titulo: "Sistema activo", texto: "Identifica el panel principal; no comprueba el estado del conversor. Ese estado se consulta en «Activar generador PDF» dentro del acta." },
      ],
    }],
  },
  "proyecto-grado": acta("Proyecto de Grado", "proyecto-grado", [
    { titulo: "Postulante y género", texto: "Escribe el nombre completo y selecciona el género para ajustar el texto del acta." },
    carnet("P.G."),
    { titulo: "Tribunales y tutor", texto: "Selecciona los dos miembros del tribunal y al docente tutor. Para descargar Word, deben estar seleccionados; los tribunales deben ser distintos y el tutor no puede repetirse como tribunal." },
    ...fechaPresidente,
    { titulo: "Tema del Proyecto de Grado", texto: "Escribe el título completo del trabajo tal como debe aparecer en el documento." },
    nota,
  ], "Pulsa «Descargar Word». En Proyecto de Grado, el único dato obligatorio es el CI; los demás campos pueden quedar vacíos para preparar un borrador. La nota también puede quedar vacía."),
  tesis: acta("Tesis", "tesis", [
    { titulo: "Uno o dos postulantes", texto: "Ingresa el nombre y género del primer postulante. Si hay un segundo, completa su nombre en el campo opcional; aparecerá su selector de género. Si hay solo uno, deja vacío el segundo nombre." },
    carnet("T."),
    { titulo: "Tribunales y tutor", texto: "Selecciona los docentes que correspondan. Si seleccionas ambos tribunales, deben ser distintos. El tutor seleccionado no puede repetirse como tribunal." },
    ...fechaPresidente,
    { titulo: "Tema de la tesis", texto: "Escribe el título completo. Los nombres de los postulantes se presentan en mayúsculas en el texto de la defensa." },
    nota,
    { titulo: "Campos incompletos", texto: "Puedes generar una vista previa y descargar Word con los demás campos incompletos para trabajar con un borrador, pero el CI siempre debe estar escrito." },
  ], "Pulsa «Descargar Word» para obtener el documento con los datos actuales. El CI es obligatorio; los demás campos pueden quedar incompletos. Si ingresas una nota, debe estar entre 0 y 100; tampoco se permiten docentes repetidos entre tutor y tribunales."),
  "examen-grado": acta("Examen de Grado", "examen-grado", [
    { titulo: "Postulante, materia y área", texto: "Escribe el nombre completo, la materia del examen y el área correspondiente." },
    carnet("E.G."),
    { titulo: "Aula y convocatoria", texto: "Completa el lugar del examen, el número de convocatoria y la gestión. La gestión comienza con el año actual; puedes cambiarla." },
    { titulo: "Duración", texto: "Ingresa cuántos minutos duró el examen. El formulario comienza con 30 minutos; modifica ese valor si corresponde." },
    ...fechaPresidente,
    nota,
    { titulo: "Aprobado o reprobado", texto: "Coloca una X en «Texto de aprobado» o en «Texto de reprobado», y deja vacío el otro. El formulario empieza con aprobado marcado; verifica que corresponda al resultado. La nota no cambia estas marcas automáticamente." },
    { titulo: "Filtra los tribunales por área", texto: "Elige «Ninguno» para ver a todos los docentes o selecciona un área para mostrar únicamente los evaluadores asignados a ella. Los docentes multidisciplinarios aparecen en cada una de sus áreas." },
    { titulo: "Tribunales", texto: "Selecciona los evaluadores que correspondan. Si eliges los dos, deben ser distintos. Al cambiar de área se limpia cualquier tribunal que no pertenezca al nuevo filtro." },
  ], "Pulsa «Descargar Word». El CI es obligatorio; los demás campos pueden quedar vacíos o incompletos. También se comprueba que la nota ingresada esté entre 0 y 100 y que los dos tribunales no estén repetidos."),
  excelencia: acta("Excelencia", "excelencia", [
    { titulo: "Postulante y género", texto: "Ingresa el nombre y selecciona el género del postulante." },
    carnet("E."),
    ...fechaPresidente,
    { titulo: "Uno, dos o tres tribunales", texto: "Completa los evaluadores en orden: primero el tribunal 1, después el 2 y finalmente el 3, si corresponde. Deja vacíos los restantes. El sistema elige el formato de firmas según la cantidad seleccionada." },
    { titulo: "No repitas evaluadores", texto: "Cada tribunal seleccionado debe corresponder a un docente distinto." },
    { titulo: "Calificación de excelencia", texto: "Esta acta no tiene un campo de nota: la plantilla incluye 100 puntos (100 %) y aprobado con mención honorífica. Revisa que corresponda al caso." },
    { titulo: "Borrador", texto: "Puedes dejar incompletos los demás datos para generar la vista previa o descargar Word, pero el CI es obligatorio." },
  ], "Pulsa «Descargar Word». Se utiliza la plantilla de uno, dos o tres tribunales según los docentes seleccionados. El CI es obligatorio; los demás campos pueden quedar vacíos en un borrador."),
  "trab-dirigido": acta("Trabajo Dirigido", "trab-dirigido", [
    { titulo: "Postulante y género", texto: "Ingresa el nombre y selecciona el género del postulante." },
    carnet("T.D."),
    { titulo: "Uno o dos tribunales", texto: "Selecciona el primer tribunal y, si corresponde, el segundo. Deja el segundo vacío cuando haya un solo evaluador. La plantilla de firmas cambia automáticamente; esta pantalla no usa tres tribunales." },
    { titulo: "Docente tutor", texto: "Selecciona al tutor del trabajo entre los docentes disponibles." },
    ...fechaPresidente,
    { titulo: "Tema", texto: "Escribe el título completo del Trabajo Dirigido." },
    nota,
    { titulo: "Borrador", texto: "Puedes generar la vista previa y descargar Word sin completar los demás datos, pero el CI siempre es obligatorio. Comprueba el documento antes de usar el acta final." },
  ], "Pulsa «Descargar Word». El sistema elige la plantilla de uno o dos tribunales. El CI es obligatorio; los demás campos pueden quedar vacíos."),
  "sorteo-docentes": {
    titulo: "Sorteo de docentes",
    resumen: "Asigna números al azar por área y conserva un límite de participación entre sorteos.",
    pasos: [{
      titulo: "Selecciona el área",
      descripcion: "El módulo toma de Supabase los docentes activos y las áreas registradas en Administración.",
      detalles: [
        { titulo: "Docentes de varias áreas", texto: "Un docente asignado a dos o más áreas aparecerá en cada una de ellas. El sistema unifica registros con el mismo nombre para evitar que la misma persona reciba dos números dentro de un área." },
        { titulo: "Docentes disponibles", texto: "Después de seleccionar el área verás quiénes participarán y quiénes alcanzaron el límite configurado." },
      ],
    }, {
      titulo: "Configura intervalo y límite",
      descripcion: "Indica qué números pueden salir y en cuántas áreas diferentes puede participar cada docente.",
      detalles: [
        { titulo: "Intervalo", texto: "El valor inicial es 1 a 9. Puedes cambiarlo, por ejemplo a 1 a 4 o 10 a 25. Cada número se entrega una sola vez dentro del área." },
        { titulo: "Cantidad exacta", texto: "Con el interruptor activado, la cantidad de números debe ser exactamente igual a la cantidad de docentes. Si lo desactivas, un intervalo 1 a 4 puede sortearse entre cinco docentes: cuatro recibirán un número y uno quedará sin asignación; si sobran números, los adicionales no se utilizan." },
        { titulo: "Orden de resultados", texto: "Activa «Ordenar resultados por número» para presentar del menor al mayor. Desactívalo para conservar el orden exacto en que los docentes fueron seleccionados. La misma elección se utiliza en la pantalla y en el PDF." },
        { titulo: "Máximo de áreas", texto: "Con límite 2, un docente puede recibir número en dos áreas diferentes. Al llegar al límite quedará bloqueado en los siguientes sorteos." },
        { titulo: "Números únicos", texto: "Dentro de cada área, un número se entrega a una sola persona. El mismo número sí puede aparecer en otra área independiente." },
      ],
    }, {
      titulo: "Realiza y revisa el sorteo",
      descripcion: "Pulsa «Realizar sorteo» para mezclar docentes y números de manera aleatoria.",
      detalles: [
        { titulo: "Animación uno por uno", texto: "El sistema toma un número disponible y mueve un aura por las tarjetas de los docentes. El número actual también aparece junto al título de participantes. Al detenerse, ese docente recibe el número, su tarjeta queda gris, el número desaparece de los disponibles y comienza el siguiente turno." },
        { titulo: "Volver a sortear", texto: "Reemplaza únicamente el resultado del área seleccionada. Los resultados de otras áreas se conservan." },
        { titulo: "Limpiar", texto: "«Limpiar esta área» elimina solo el área visible. «Limpiar todo» reinicia todos los resultados de la sesión." },
      ],
    }, {
      titulo: "Descarga el PDF",
      descripcion: "Activa primero el generador PDF y descarga todos los resultados acumulados.",
      detalles: [
        { titulo: "Activar generador", texto: "Pulsa «Activar generador PDF» y espera la confirmación antes de descargar." },
        { titulo: "Contenido", texto: "El reporte incluye fecha, intervalo, límite, área, nombre del docente y número asignado." },
        { titulo: "Datos temporales", texto: "Descarga el PDF antes de recargar o salir de la página. Los resultados no se guardan permanentemente en la base de datos." },
      ],
    }],
  },
  admin: {
    titulo: "Administración",
    resumen: "Gestiona los docentes de los formularios y al presidente del tribunal.",
    pasos: [{
      titulo: "Agrega un docente",
      descripcion: "En «Gestión de docentes», escribe el nombre como debe aparecer en el acta.",
      imagen: "/manuales/admin.jpg",
      pieImagen: "Controles de Administración. No hace falta activar el generador PDF en esta pantalla.",
      detalles: [
        { titulo: "Agregar docente", texto: "Incluye el grado académico y el nombre completo, y pulsa «Agregar docente». Espera a que aparezca en la lista." },
        { titulo: "Antes de agregar", texto: "Comprueba si ya existe en la lista para evitar registros duplicados." },
      ],
    }, {
      titulo: "Edita o cambia el estado",
      descripcion: "Utiliza los botones de la fila del docente que quieres gestionar.",
      detalles: [
        { titulo: "Editar", texto: "Abre el nombre para corregirlo. Pulsa «Guardar» para registrar el cambio o «Cancelar» para salir sin guardarlo." },
        { titulo: "Desactivar", texto: "Oculta al docente de las opciones de las actas, sin eliminar su registro." },
        { titulo: "Activar", texto: "Vuelve a habilitar al docente para que se pueda seleccionar en los formularios." },
        { titulo: "Ver el cambio", texto: "Vuelve a abrir o recarga el acta para cargar la lista actualizada. Los archivos ya descargados no cambian." },
      ],
    }, {
      titulo: "Gestiona los presidentes del tribunal",
      descripcion: "Busca «Gestión de presidentes del tribunal» debajo de la lista de docentes. Funciona igual que la gestión de docentes.",
      detalles: [
        { titulo: "Agregar presidente", texto: "Escribe el nombre completo con su grado académico y pulsa «Agregar presidente». Aparecerá en la tabla con estado Activo." },
        { titulo: "Editar", texto: "Pulsa «Editar» para corregir el nombre; luego «Guardar» o «Cancelar»." },
        { titulo: "Activar o desactivar", texto: "«Desactivar» oculta al presidente de las opciones de las actas sin borrarlo. «Activar» vuelve a habilitarlo." },
        { titulo: "Usarlo en un acta", texto: "Abre o recarga cualquiera de las cinco pantallas y elige un presidente activo en el selector. Ese nombre se incluirá en los nuevos Word y PDF; los archivos descargados previamente no cambian." },
      ],
    }],
  },
};
