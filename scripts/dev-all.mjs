import { spawn } from "node:child_process";
import net from "node:net";

function puertoEnUso(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

const converterYaActivo = await puertoEnUso(8000);

const procesos = [
  spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev"], {
    stdio: "inherit",
    env: process.env,
  }),
  ...(converterYaActivo
    ? []
    : [spawn(process.execPath, ["--watch", "converter-server/server.mjs"], {
        stdio: "inherit",
        env: process.env,
      })]),
];

if (converterYaActivo) {
  console.log("Conversor DOCX → PDF ya está activo en http://localhost:8000");
}

let cerrando = false;

function cerrarProcesos() {
  if (cerrando) return;
  cerrando = true;
  for (const proceso of procesos) {
    if (!proceso.killed) proceso.kill();
  }
}

process.on("SIGINT", () => {
  cerrarProcesos();
  process.exit(0);
});

process.on("SIGTERM", () => {
  cerrarProcesos();
  process.exit(0);
});

for (const proceso of procesos) {
  proceso.on("exit", (codigo) => {
    if (!cerrando && codigo && codigo !== 0) {
      cerrarProcesos();
      process.exit(codigo);
    }
  });
}
