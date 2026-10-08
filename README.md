# Sistema de Actas — Carrera de Turismo

Aplicación web para generar actas académicas en Word y PDF usando plantillas `.docx`.

## Tecnologías y ejecución

- Next.js 16, React 19 y TypeScript.
- Tailwind CSS 4.
- Docxtemplater y PizZip para completar Word.
- LibreOffice para convertir DOCX a PDF.
- Supabase para docentes y configuración.
- Render para publicar la aplicación y el conversor.

Instalar y ejecutar:

```bash
npm install
npm run dev
```

Direcciones locales:

```text
Aplicación: http://localhost:3000
Conversor:  http://localhost:8000
```

Otros comandos: `npm run next:dev`, `npm run converter:dev`, `npm run build`, `npm run start` y `npm run lint`.

## Variables de entorno

Crear `.env.local` en la raíz y no publicarlo:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
CONVERTER_SERVICE_URL=http://127.0.0.1:8000/convert
```

En producción, `CONVERTER_SERVICE_URL` debe apuntar al servicio conversor de Render.

## Flujo general

1. El usuario llena el formulario.
2. La pantalla envía los datos a una API de Next.js.
3. La API carga una plantilla de `templates/`.
4. Docxtemplater reemplaza etiquetas como `{{postulante}}` y `{{fechaTexto}}`.
5. Para PDF, el DOCX se envía al conversor LibreOffice.
6. El PDF vuelve al navegador y se muestra dentro de un `iframe`.
7. El visor permite imprimir o descargar el PDF.
8. `Descargar Word` devuelve el DOCX rellenado.

Ejemplo:

```ts
const zip = new PizZip(contenido);
const documento = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  delimiters: { start: "{{", end: "}}" },
});
documento.render(datos);
```

## Pantalla de inicio

```text
/                 app/page.tsx
Menú lateral      components/Sidebar.tsx
Estilos globales  app/globals.css
```

Desde el inicio se accede a las seis actas, Sorteo de docentes y Administración.

## Pantallas y APIs

### Proyecto de Grado

```text
Pantalla:  app/actas/proyecto-grado/FormularioProyectoGrado.tsx
Word:      app/api/actas/proyecto-grado/docx/route.ts
PDF:       app/api/actas/proyecto-grado/pdf/route.ts
Plantilla: templates/proyecto-grado.docx
```

La nota es opcional: sin nota se muestra `__/100`; con nota se muestra, por ejemplo, `90/100`.

### Tesis

```text
Pantalla:  app/actas/tesis/FormularioTesis.tsx
Word:      app/api/actas/tesis/docx/route.ts
PDF:       app/api/actas/tesis/pdf/route.ts
Plantilla: templates/tesis_word_actualizada.docx
Datos:     lib/acta-data.ts
```

Controla uno o dos postulantes, género, artículos, verbos, nombres en mayúscula, `UNIV.` y nota en negrita. Genera `el/la postulante`, `los/las postulantes` y las formas correctas de `misma/mismas`.

### Examen de Grado

```text
Pantalla:  app/actas/examen-grado/FormularioExamenGrado.tsx
Word:      app/api/actas/examen-grado/docx/route.ts
PDF:       app/api/actas/examen-grado/pdf/route.ts
Plantilla: templates/examen-grado.docx
Datos:     lib/examen-grado-data.ts
```

La nota aparece en negrita como `__/100` o `10/100`. Los campos pueden quedar vacíos durante las pruebas.

### Excelencia

```text
Pantalla: app/actas/excelencia/FormularioExcelencia.tsx
Word/PDF: app/api/actas/excelencia/
Selector: lib/excelencia-template.ts
```

Plantillas: `excelencia-1-tribunal.docx`, `excelencia-2-tribunales.docx` y `excelencia.docx`, según la cantidad de tribunales.

### Trabajo Dirigido

```text
Pantalla: app/actas/trab-dirigido/FormularioTrabajoDirigido.tsx
Word/PDF: app/api/actas/trab-dirigido/
Selector: lib/trab-dirigido-template.ts
Datos:    lib/trab-dirigido-data.ts
```

Usa `trab-dirigido-1-tribunal.docx` o `trab-dirigido-2-tribunales.docx`. La nota usa `__/100` cuando está vacía.

### Administración

```text
Página:        app/admin/page.tsx
Docentes:      app/api/admin/docentes/route.ts
Docente ID:    app/api/admin/docentes/[id]/route.ts
Configuración: app/api/admin/configuracion/route.ts
Supabase:      lib/supabase.ts y lib/supabase-admin.ts
```

### Sorteo de docentes

```text
Pantalla:     app/sorteo-docentes/SorteoDocentes.tsx
Datos:        lib/sorteo-data.ts
Documento:    lib/sorteo-documento.ts
PDF:          app/api/sorteo-docentes/pdf/route.ts
```

La pantalla reúne los docentes por área, limita cuántas áreas puede sortear cada uno y muestra las asignaciones. El servidor valida el reporte antes de convertirlo a PDF.

## Plantillas Word

Las plantillas están en `templates/` y usan etiquetas como:

```text
{{postulante}}
{{fechaTexto}}
{{hora}}
{{tema}}
{{tribunal1}}
{{tribunal2}}
{{presidente}}
{{notaTexto}}
```

Para modificar una plantilla: abrir el `.docx`, conservar el diseño, cambiar las etiquetas, guardar dentro de `templates/` y probar Word y PDF. El formato principal del PDF proviene del Word, no de HTML.

## Conversor DOCX → PDF

```text
converter-server/server.mjs
converter-server/Dockerfile
converter-server/README.md
```

Endpoints: `POST /convert` recibe un DOCX y `GET /health` comprueba el servicio. LibreOffice se ejecuta en modo invisible.

En Windows:

```powershell
$env:LIBREOFFICE_PATH = "C:\Program Files\LibreOffice\program\soffice.exe"
npm run converter:dev
```

En Docker:

```bash
docker build -t actas-converter ./converter-server
docker run --rm -p 8000:8000 actas-converter
```

Ruta de salud desde Next.js: `/api/converter/health`.

## Estructura principal

```text
app/                 Pantallas, layout y APIs
components/          Componentes compartidos
lib/                 Reglas de actas, sorteo, documentos y Supabase
templates/           Plantillas Word
converter-server/    Servicio LibreOffice
scripts/dev-all.mjs  Arranca Next.js y el conversor
```

Los formularios de `app/actas/` manejan la interacción; los archivos `lib/*-data.ts` preparan y validan datos. Las rutas de `app/api/` generan el Word o envían el documento al conversor PDF. Las plantillas conservan el diseño de las actas.

## Manuales de uso dentro de la aplicación

Inicio, las seis actas, Sorteo de docentes y Administración tienen un botón **Manual** en su encabezado.
Abre una guía propia de la pantalla, con pasos, capturas reales e instrucciones de
los botones. El usuario puede avanzar, retroceder o elegir un paso, y cerrar con
la X, la tecla Escape o el botón final **Entendido**. Abrir la guía conserva los
datos del formulario.

- `components/ManualUsuario.tsx`: botón y ventana del manual, compartidos por las siete pantallas.
- `lib/manuales.ts`: textos, pasos y reglas específicas de cada pantalla.
- `public/manuales/`: capturas de los formularios, Inicio, Administración, el conversor listo y la vista previa.
- `app/globals.css`: estilos del manual y su adaptación a celulares.

Los manuales de las actas comienzan con la activación del conversor y explican
la vista previa, la descarga desde el visor PDF, la impresión y la descarga Word.
Describen las validaciones actuales de cada formulario; el Word no requiere
activar el conversor. Si se cambia la interfaz o una regla, actualizar el texto
en `lib/manuales.ts` y sustituir la captura correspondiente.

## Problemas frecuentes

- `spawn soffice ENOENT`: instalar LibreOffice o configurar `LIBREOFFICE_PATH`.
- `EADDRINUSE: port 8000`: el conversor ya está activo; `dev-all.mjs` lo detecta.
- Error `502` en Render: el servicio gratuito puede estar dormido. Revisar su URL `/health` y volver a intentar.
- Word funciona pero PDF no: revisar `CONVERTER_SERVICE_URL`, `/health` y los logs del conversor.

### Word muestra contenido no legible

Las plantillas deben conservar las declaraciones XML referenciadas por `mc:Ignorable`.
Al editar el XML con herramientas que cambian los prefijos, pueden desaparecer
declaraciones como `xmlns:w14` aunque `Ignorable` siga mencionando `w14`.
Microsoft Word rechaza ese archivo; que se genere un PDF no garantiza que el DOCX sea válido.

Para comprobar todas las plantillas con Python 3, sin dependencias adicionales:

```bash
python scripts/check-docx-templates.py
```

Si se detectan declaraciones faltantes, se pueden restaurar desde las declaraciones
existentes en otras partes del mismo DOCX:

```bash
python scripts/check-docx-templates.py --fix
```

La reparación agrega únicamente declaraciones de espacios de nombres y comprueba
que los elementos, atributos, texto y formato permanezcan iguales. Después de
reparar una plantilla, volver a descargar el Word y comprobar que abre sin reparación
en Microsoft Word. Los archivos descargados anteriormente conservan el defecto.

## Publicar cambios

```bash
git add .
git commit -m "actualiza sistema de actas"
git push origin main
```

Después de publicar, probar cada pantalla, descargar un Word, generar un PDF y revisar `/health`.

## Recomendaciones

### Acta de Maestría

La pantalla `/actas/maestria` genera el acta de defensa de tesis de postgrado.
La página carga docentes y presidentes activos de la configuración existente en
Supabase. El formulario requiere postulante, CI, folio inicial, género, fecha,
hora, título, maestría, siglas del grado, dos tribunales docentes, revisor,
presidente y nota entera de 0 a 100.

- `app/actas/maestria/page.tsx`: carga los catálogos.
- `app/actas/maestria/FormularioMaestria.tsx`: formulario, validación, vista previa y descargas.
- `lib/maestria-data.ts`: validación compartida, género, hora a. m./p. m., nota literal y valoración.
- `lib/maestria-documento.ts`: rellena `templates/acta-defensa-maestria.docx` con Docxtemplater.
- `app/api/actas/maestria/docx/route.ts`: descarga Word, sin requerir conversor.
- `app/api/actas/maestria/pdf/route.ts`: convierte el mismo Word mediante el conversor configurado.

Ambos endpoints son POST y validan todos los campos en el servidor. El CI solo
se utiliza en el nombre `CI-M.docx` / `CI-M.pdf`: no se pasa a los marcadores
del documento. El folio inicial determina la numeración consecutiva. Después
de «versión» hay exactamente tres espacios, sin guiones ni variable de versión.

La valoración se calcula con la regla confirmada por el usuario: **0–65 reprobado**,
66–70 aprobado, 71–80 bueno, 81–90 muy bueno y 91–100 excelente. El resultado
concuerda con el género (aprobado/aprobada) y la nota literal se genera automáticamente.

Pruebas: `node --test scripts/maestria.test.mjs`. El script
`scripts/preparar-plantilla-maestria.py` convierte de forma idempotente la
transcripción original a marcadores manteniendo los estilos. El script
`scripts/fijar-numero-maestria.py` convierte el encabezado automático PAGE en
el marcador fijo `{{pagina}}`, por lo que el mismo número aparece en la primera
y segunda hoja. No ejecutar el antiguo generador de transcripción sobre la
plantilla variable.

### Cuidados generales

- No publicar `.env.local` ni claves secretas.
- Mantener copias de las plantillas Word originales.
- Probar Word y PDF después de cada cambio de plantilla.
- No renombrar plantillas sin actualizar las rutas o selectores.
- Mantener separado el servidor conversor porque Render no convierte DOCX a PDF por sí solo.
