import test from 'node:test';
import assert from 'node:assert/strict';
import { leerPresidentes, modificarPresidentes } from '../lib/presidentes.ts';

test('conserva los nombres antiguos y al presidente previamente configurado', () => {
  const lista = leerPresidentes('["Ana", "Luis"]', 'Marta');
  assert.deepEqual(lista.map(p => p.nombre), ['Ana', 'Luis', 'Marta']);
  assert.ok(lista.every(p => p.activo));
});

test('agregar, editar, desactivar y activar conservan identidad y persistencia', () => {
  let lista = modificarPresidentes([], 'agregar', { nombre: ' Ana  Pérez ' }, '1');
  lista = modificarPresidentes(lista, 'editar', { id: '1', nombre: 'Ana Gómez' }, 'ignorado');
  lista = modificarPresidentes(lista, 'editar', { id: '1', activo: false }, 'ignorado');
  lista = leerPresidentes(JSON.stringify(lista), 'Ana Pérez');
  assert.deepEqual(lista, [{ id: '1', nombre: 'Ana Gómez', activo: false }]);
  lista = modificarPresidentes(lista, 'editar', { id: '1', activo: true }, 'ignorado');
  assert.equal(lista[0].activo, true);
});

test('rechaza nombres vacíos, duplicados e IDs inexistentes sin modificar registros', () => {
  const lista = leerPresidentes('["Ana Pérez"]');
  for (const nombre of ['', '   ', ' ana   pérez ']) {
    assert.throws(() => modificarPresidentes(lista, 'agregar', { nombre }, '2'));
  }
  assert.throws(() => modificarPresidentes(lista, 'editar', { id: 'otro', activo: false }, '2'));
  assert.throws(() => modificarPresidentes(lista, 'editar', { id: lista[0].id, activo: 'false' }, '2'));
  assert.equal(lista[0].activo, true);
});
