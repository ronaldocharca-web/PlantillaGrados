# Contrato de plantillas PETAENG

## Referencias

- Defensa de Memoria Laboral: `C:\Users\ronal\OneDrive\Desktop\08. ACTA DE DEFENSA - Univ. Maribel Leon.docx`
  - SHA-256: `21c256084bcd5f38b2a41a3c04a7c2897e35ce34d4b669ef14e9147943ac959b`
  - 2 páginas, 1 sección, tamaño Carta vertical.
- Conformidad de Cursos: `C:\Users\ronal\OneDrive\Desktop\84. ACTA DE LECTURA - CURSOS - PETAENG  2026 - Univ. Valle Pusarico Vivian.docx`
  - SHA-256: `c7da710be6491df516a52e3b46c5d54bd8991a0d2e154e8f5e3ecbad740b9d7f`
  - 1 página, 1 sección, tamaño Carta vertical.

## Sistema de página

- Defensa: márgenes izquierdo/derecho/superior 0,98 pulgadas y margen inferior 0,79 pulgadas.
- Cursos: margen izquierdo 1,18 pulgadas; derecho/superior 0,98 pulgadas; inferior 0,79 pulgadas.
- Sin encabezados ni pies independientes; folio y libro forman parte del cuerpo.

## Apariencia que debe preservarse

- Times New Roman en todo el documento.
- Títulos institucionales centrados y en negrita.
- Texto jurídico justificado con el espaciado original.
- Campos variables resaltados en amarillo, tal como aparecen en las referencias.
- Firmas distribuidas en dos columnas mediante tabulaciones y espacios originales.
- Saltos de página y posiciones de firma sin cambios.

## Mapa de campos

### Defensa de Memoria Laboral

- `folio`, `folioSiguiente`, `libro`, `gestion`.
- `tema`, `postulante`, `tutor`, `tribunal1`, `tribunal2`, `presidente`.
- `hora`, `fechaLiteral`, `nota`, `notaLiteral`, `resultado`.

### Conformidad de Cursos

- `folio`, `libro`, `gestion`.
- `postulante`, `tribunal1`, `tribunal2`, `tribunal3`, `presidente`.
- `hora`, `fechaLiteral`, `nota`, `notaLiteral`, `resultado`.

## Fidelidad

- Los documentos fuente se conservan sin cambios.
- Solo se reemplaza el texto variable por marcadores `{{campo}}` dentro de los mismos runs de Word.
- Estilos, secciones, relaciones, propiedades, saltos, tabulaciones y elementos no variables se preservan byte por byte dentro del paquete.
