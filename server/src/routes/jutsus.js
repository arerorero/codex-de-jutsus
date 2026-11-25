import { Router } from 'express';
import { prisma } from '../db.js';
import { HttpError, rota, idParam, texto } from '../lib/http.js';
import { RARIDADES } from '../lib/dominio.js';
import {
  includeJutsu,
  formatarJutsu,
  resolverSequencia,
  garantirAssinaturaLivre,
  gravarSequencia,
} from '../lib/jutsus.js';

const r = Router();

function temSequencia(body) {
  return Array.isArray(body?.selos) || body?.teclas !== undefined;
}

function lerJutsu(body, parcial = false) {
  const dados = {};
  if (body.nome !== undefined || !parcial) {
    const nome = texto(body.nome);
    if (!nome) throw new HttpError(400, 'Informe o nome do jutsu.');
    dados.nome = nome;
  }
  if (body.raridade !== undefined || !parcial) {
    const raridade = String(body.raridade ?? 'COMUM').trim().toUpperCase();
    if (!RARIDADES.includes(raridade)) throw new HttpError(400, 'A raridade deve ser COMUM, RARO ou LENDARIO.');
    dados.raridade = raridade;
  }
  for (const campo of ['descricao', 'gestoFinalizacao', 'efeitoSegurar']) {
    if (body[campo] !== undefined) dados[campo] = texto(body[campo]);
  }
  return dados;
}

async function garantirNomeLivre(nome, ignorarId = null) {
  if (!nome) return;
  const existente = await prisma.jutsu.findUnique({ where: { nome } });
  if (existente && existente.id !== ignorarId) throw new HttpError(409, `Já existe um jutsu chamado "${nome}".`);
}

async function buscar(id) {
  const j = await prisma.jutsu.findUnique({ where: { id }, include: includeJutsu });
  if (!j) throw new HttpError(404, 'Jutsu não encontrado.');
  return formatarJutsu(j);
}

r.get(
  '/',
  rota(async (req, res) => {
    const jutsus = await prisma.jutsu.findMany({ include: includeJutsu, orderBy: { nome: 'asc' } });
    res.json(jutsus.map(formatarJutsu));
  }),
);

r.get(
  '/:id',
  rota(async (req, res) => {
    res.json(await buscar(idParam(req)));
  }),
);

// Cadastra o jutsu; a sequência pode vir junto (fluxo do diagrama de atividade).
r.post(
  '/',
  rota(async (req, res) => {
    const dados = lerJutsu(req.body);
    await garantirNomeLivre(dados.nome);
    const seq = temSequencia(req.body) ? await resolverSequencia(req.body) : null;
    if (seq) await garantirAssinaturaLivre(seq.assinatura);

    const id = await prisma.$transaction(async (tx) => {
      const j = await tx.jutsu.create({ data: dados });
      if (seq) await gravarSequencia(tx, j.id, seq);
      return j.id;
    });
    res.status(201).json(await buscar(id));
  }),
);

r.put(
  '/:id',
  rota(async (req, res) => {
    const id = idParam(req);
    await buscar(id);
    const dados = lerJutsu(req.body, true);
    await garantirNomeLivre(dados.nome, id);
    const seq = temSequencia(req.body) ? await resolverSequencia(req.body) : null;
    if (seq) await garantirAssinaturaLivre(seq.assinatura, id);

    await prisma.$transaction(async (tx) => {
      await tx.jutsu.update({ where: { id }, data: dados });
      if (seq) await gravarSequencia(tx, id, seq);
    });
    res.json(await buscar(id));
  }),
);

// UC03 – Montar Sequência de Selos
r.put(
  '/:id/sequencia',
  rota(async (req, res) => {
    const id = idParam(req);
    await buscar(id);
    const seq = await resolverSequencia(req.body);
    await garantirAssinaturaLivre(seq.assinatura, id);
    await prisma.$transaction((tx) => gravarSequencia(tx, id, seq));
    res.json(await buscar(id));
  }),
);

r.delete(
  '/:id',
  rota(async (req, res) => {
    const id = idParam(req);
    await buscar(id);
    await prisma.jutsu.delete({ where: { id } });
    res.status(204).end();
  }),
);

export default r;
