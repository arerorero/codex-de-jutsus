import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarGramatica, gerarAssinatura, normalizarTeclas } from '../src/lib/dominio.js';

const s = (tecla, slot) => ({ tecla, slot });

test('RN01: aceita fonte, tipo e elemento em ordem', () => {
  assert.equal(validarGramatica([s('W', 'FONTE'), s('D', 'TIPO'), s('D', 'ELEMENTO')]), null);
});

test('RN02: aceita selos simbólicos repetidos depois do elemento', () => {
  const seq = [s('W', 'FONTE'), s('D', 'TIPO'), s('D', 'ELEMENTO'), s('W', 'SIMBOLICO'), s('W', 'SIMBOLICO')];
  assert.equal(validarGramatica(seq), null);
});

test('RN01: rejeita sequência curta', () => {
  assert.equal(validarGramatica([s('W', 'FONTE'), s('D', 'TIPO')]).posicao, 2);
});

test('RN01: indica o selo fora de ordem', () => {
  const erro = validarGramatica([s('W', 'FONTE'), s('D', 'ELEMENTO'), s('D', 'TIPO')]);
  assert.equal(erro.posicao, 1);
  assert.match(erro.mensagem, /tipo/);
});

test('RN02: rejeita selo não simbólico após o elemento', () => {
  const erro = validarGramatica([s('W', 'FONTE'), s('D', 'TIPO'), s('D', 'ELEMENTO'), s('A', 'FONTE')]);
  assert.equal(erro.posicao, 3);
});

test('RN03: gera assinatura e normaliza entrada digitada', () => {
  assert.equal(gerarAssinatura([s('W'), s('D'), s('D'), s('W')]), 'W-D-D-W');
  assert.deepEqual(normalizarTeclas('w-d d,w'), ['W', 'D', 'D', 'W']);
});
