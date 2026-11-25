import { Router } from 'express';
import { prisma } from '../db.js';
import { HttpError, rota, idParam, texto } from '../lib/http.js';
import { ALINHAMENTOS } from '../lib/dominio.js';

const r = Router();

const include = {
  jutsus: {
    include: {
      jutsu: { include: { sequencia: { orderBy: { posicao: 'asc' }, include: { selo: true } } } },
    },
    orderBy: { dominio: 'desc' },
  },
};

function formatar(p) {
  return {
    id: p.id,
    nome: p.nome,
    alinhamento: p.alinhamento,
    vila: p.vila,
    desertor: p.desertor,
    jutsus: p.jutsus.map((pj) => ({
      id: pj.jutsu.id,
      nome: pj.jutsu.nome,
      raridade: pj.jutsu.raridade,
      assinatura: pj.jutsu.assinatura,
      elemento: pj.jutsu.sequencia[2]?.selo ?? null,
      dominio: pj.dominio,
    })),
  };
}

function lerPersonagem(body, parcial = false) {
  const dados = {};
  if (body.nome !== undefined || !parcial) {
    const nome = texto(body.nome);
    if (!nome) throw new HttpError(400, 'Informe o nome do personagem.');
    dados.nome = nome;
  }
  if (body.alinhamento !== undefined || !parcial) {
    const alinhamento = String(body.alinhamento ?? 'INDECISO').trim().toUpperCase();
    if (!ALINHAMENTOS.includes(alinhamento)) {
      throw new HttpError(400, 'O alinhamento deve ser PURO, MALIGNO ou INDECISO.');
    }
    dados.alinhamento = alinhamento;
  }
  if (body.vila !== undefined) dados.vila = texto(body.vila);
  if (body.desertor !== undefined) dados.desertor = body.desertor === true || body.desertor === 'true';
  return dados;
}

function lerDominio(valor) {
  const dominio = Number(valor);
  if (!Number.isInteger(dominio) || dominio < 1 || dominio > 5) {
    throw new HttpError(422, 'O domínio deve ser um número inteiro de 1 a 5.'); // RN06
  }
  return dominio;
}

async function buscar(id) {
  const p = await prisma.personagem.findUnique({ where: { id }, include });
  if (!p) throw new HttpError(404, 'Personagem não encontrado.');
  return formatar(p);
}

r.get(
  '/',
  rota(async (req, res) => {
    const lista = await prisma.personagem.findMany({ include, orderBy: { nome: 'asc' } });
    res.json(lista.map(formatar));
  }),
);

r.get(
  '/:id',
  rota(async (req, res) => {
    res.json(await buscar(idParam(req)));
  }),
);

r.post(
  '/',
  rota(async (req, res) => {
    const p = await prisma.personagem.create({ data: lerPersonagem(req.body) });
    res.status(201).json(await buscar(p.id));
  }),
);

r.put(
  '/:id',
  rota(async (req, res) => {
    const id = idParam(req);
    await buscar(id);
    await prisma.personagem.update({ where: { id }, data: lerPersonagem(req.body, true) });
    res.json(await buscar(id));
  }),
);

r.delete(
  '/:id',
  rota(async (req, res) => {
    const id = idParam(req);
    await buscar(id);
    await prisma.personagem.delete({ where: { id } });
    res.status(204).end();
  }),
);

// UC04 – vincular (ou atualizar o domínio de) um jutsu
r.post(
  '/:id/jutsus',
  rota(async (req, res) => {
    const personagemId = idParam(req);
    await buscar(personagemId);
    const jutsuId = Number(req.body?.jutsuId);
    if (!Number.isInteger(jutsuId)) throw new HttpError(400, 'Informe o jutsu.');
    const jutsu = await prisma.jutsu.findUnique({ where: { id: jutsuId } });
    if (!jutsu) throw new HttpError(404, 'Jutsu não encontrado.');
    const dominio = lerDominio(req.body?.dominio);
    await prisma.personagemJutsu.upsert({
      where: { personagemId_jutsuId: { personagemId, jutsuId } },
      create: { personagemId, jutsuId, dominio },
      update: { dominio },
    });
    res.status(201).json(await buscar(personagemId));
  }),
);

// UC04 – desvincular: DELETE /personagens/:id/jutsus/:jutsuId ou corpo { jutsuId }
async function desvincular(req, res) {
  const personagemId = idParam(req);
  const jutsuId = Number(req.params.jutsuId ?? req.body?.jutsuId ?? req.query.jutsuId);
  if (!Number.isInteger(jutsuId)) throw new HttpError(400, 'Informe o jutsu.');
  const { count } = await prisma.personagemJutsu.deleteMany({ where: { personagemId, jutsuId } });
  if (count === 0) throw new HttpError(404, 'Este personagem não conhece esse jutsu.');
  res.json(await buscar(personagemId));
}
r.delete('/:id/jutsus/:jutsuId', rota(desvincular));
r.delete('/:id/jutsus', rota(desvincular));

export default r;
