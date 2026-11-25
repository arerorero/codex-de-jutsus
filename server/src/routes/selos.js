import { Router } from 'express';
import { prisma } from '../db.js';
import { HttpError, rota, idParam, texto } from '../lib/http.js';
import { TECLAS, SLOTS } from '../lib/dominio.js';

const r = Router();
const ORDEM_SLOT = Object.fromEntries(SLOTS.map((s, i) => [s, i]));

function lerSelo(body, parcial = false) {
  const dados = {};
  if (body.tecla !== undefined || !parcial) {
    const tecla = String(body.tecla ?? '').trim().toUpperCase();
    if (!TECLAS.includes(tecla)) throw new HttpError(400, 'A tecla deve ser W, A, S ou D.');
    dados.tecla = tecla;
  }
  if (body.slot !== undefined || !parcial) {
    const slot = String(body.slot ?? '').trim().toUpperCase();
    if (!SLOTS.includes(slot)) throw new HttpError(400, 'O slot deve ser FONTE, TIPO, ELEMENTO ou SIMBOLICO.');
    dados.slot = slot;
  }
  if (body.significado !== undefined || !parcial) {
    const significado = texto(body.significado);
    if (!significado) throw new HttpError(400, 'Informe o significado do selo.');
    dados.significado = significado;
  }
  if (body.descricao !== undefined) dados.descricao = texto(body.descricao);
  return dados;
}

async function garantirCombinacaoLivre(tecla, slot, ignorarId = null) {
  const existente = await prisma.selo.findUnique({ where: { tecla_slot: { tecla, slot } } });
  if (existente && existente.id !== ignorarId) {
    throw new HttpError(409, `Já existe selo na tecla ${tecla} para o slot ${slot}: "${existente.significado}".`); // RN04
  }
}

r.get(
  '/',
  rota(async (req, res) => {
    const selos = await prisma.selo.findMany({ include: { _count: { select: { sequencias: true } } } });
    selos.sort(
      (a, b) => ORDEM_SLOT[a.slot] - ORDEM_SLOT[b.slot] || TECLAS.indexOf(a.tecla) - TECLAS.indexOf(b.tecla),
    );
    res.json(selos.map(({ _count, ...s }) => ({ ...s, usos: _count.sequencias })));
  }),
);

r.post(
  '/',
  rota(async (req, res) => {
    const dados = lerSelo(req.body);
    await garantirCombinacaoLivre(dados.tecla, dados.slot);
    const selo = await prisma.selo.create({ data: dados });
    res.status(201).json(selo);
  }),
);

r.put(
  '/:id',
  rota(async (req, res) => {
    const id = idParam(req);
    const atual = await prisma.selo.findUnique({
      where: { id },
      include: { _count: { select: { sequencias: true } } },
    });
    if (!atual) throw new HttpError(404, 'Selo não encontrado.');
    const dados = lerSelo(req.body, true);
    const tecla = dados.tecla ?? atual.tecla;
    const slot = dados.slot ?? atual.slot;
    if ((tecla !== atual.tecla || slot !== atual.slot) && atual._count.sequencias > 0) {
      throw new HttpError(
        409,
        'Este selo está em uso em sequências; só o significado e a descrição podem ser alterados.',
      );
    }
    await garantirCombinacaoLivre(tecla, slot, id);
    const selo = await prisma.selo.update({ where: { id }, data: dados });
    res.json(selo);
  }),
);

r.delete(
  '/:id',
  rota(async (req, res) => {
    const id = idParam(req);
    const selo = await prisma.selo.findUnique({ where: { id } });
    if (!selo) throw new HttpError(404, 'Selo não encontrado.');
    const usos = await prisma.sequenciaSelo.findMany({
      where: { seloId: id },
      select: { jutsu: { select: { id: true, nome: true } } },
      distinct: ['jutsuId'],
    });
    if (usos.length > 0) {
      // RN05
      throw new HttpError(409, `Selo em uso por ${usos.length} jutsu(s); não pode ser excluído.`, {
        jutsus: usos.map((u) => u.jutsu),
      });
    }
    await prisma.selo.delete({ where: { id } });
    res.status(204).end();
  }),
);

export default r;
