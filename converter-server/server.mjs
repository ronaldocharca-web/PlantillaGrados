import http from "node:http";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const port = Number(process.env.PORT || 8000);
const libreOfficeCommand = process.env.LIBREOFFICE_PATH || [
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  "soffice",
].find((command) => command === "soffice" || existsSync(command));
const maxUploadBytes = 20 * 1024 * 1024;
let conversionQueue = Promise.resolve();

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Access-Control-Allow-Origin": "*",
  });
  response.end(payload);
}

function runLibreOffice(inputPath, outputDirectory, profileDirectory) {
  return new Promise((resolve, reject) => {
    const profileUrl = pathToFileURL(profileDirectory).href;
    const child = spawn(libreOfficeCommand, [
      "--headless",
      "--norestore",
      "--nofirststartwizard",
      "--nodefault",
      `-env:UserInstallation=${profileUrl}`,
      "--convert-to",
      "pdf:writer_pdf_Export",
      "--outdir",
      outputDirectory,
      inputPath,
    ], { windowsHide: true });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      reject(new Error(`No se pudo iniciar LibreOffice (${libreOfficeCommand}): ${error.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`LibreOffice terminó con código ${code}: ${stderr}`));
    });
  });
}

async function convertirDocx(body) {
  const workDirectory = await mkdtemp(path.join(os.tmpdir(), "actas-convert-"));
  const inputPath = path.join(workDirectory, "acta.docx");
  const outputPath = path.join(workDirectory, "acta.pdf");
  const profileDirectory = path.join(workDirectory, "profile");

  try {
    await writeFile(inputPath, body);
    await runLibreOffice(inputPath, workDirectory, profileDirectory);
    return await readFile(outputPath);
  } finally {
    await rm(workDirectory, { recursive: true, force: true });
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxUploadBytes) {
        reject(new Error("El documento supera el límite de 20 MB."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }
  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, { ok: true, service: "docx-to-pdf" });
    return;
  }
  if (request.method !== "POST" || request.url !== "/convert") {
    sendJson(response, 404, { error: "Ruta no encontrada" });
    return;
  }
  try {
    const body = await readRequestBody(request);
    if (!body.length) throw new Error("No se recibió ningún documento Word.");
    const currentConversion = conversionQueue.then(() => convertirDocx(body));
    conversionQueue = currentConversion.catch(() => undefined);
    const pdf = await currentConversion;
    response.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=acta.pdf",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Content-Length": pdf.length,
    });
    response.end(pdf);
  } catch (error) {
    console.error("Error convirtiendo DOCX a PDF:", error);
    sendJson(response, 500, { error: error instanceof Error ? error.message : "Error desconocido" });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Servidor DOCX → PDF escuchando en http://0.0.0.0:${port}`);
});
