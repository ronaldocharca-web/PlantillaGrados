# Servidor local DOCX → PDF

Este servicio recibe un archivo `.docx` por `POST /convert` y devuelve el PDF generado por LibreOffice.

## Ejecutar en Windows

Instalar LibreOffice y arrancar:

```powershell
$env:LIBREOFFICE_PATH = "C:\Program Files\LibreOffice\program\soffice.exe"
npm run converter:dev
```

El servicio queda en `http://localhost:8000`.

## Ejecutar con Docker

```bash
docker build -t actas-converter ./converter-server
docker run --rm -p 8000:8000 actas-converter
```

La aplicación Next.js usa `CONVERTER_SERVICE_URL` para localizarlo. En desarrollo puede omitirse porque usa `http://127.0.0.1:8000/convert`.
