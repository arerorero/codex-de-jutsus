import { prisma } from '../db.js';
import { HttpError } from './http.js';
import {
  validarGramatica,
  gerarAssinatura,
  normalizarTeclas,
  slotEsperado,
  NOME_SLOT,
} from './dominio.js';

export const includeJutsu = {
  sequencia: { orderBy: { posicao: 'asc' }, include: { selo: true } },
  personagens: { include: { personagem: true }, orderBy: { dominio: 'desc' } },
};

/**
 * Formata um jutsu para a API. Fonte, tipo e elemento não ficam gravados:
 * são obtidos dos três primeiros selos da sequência (seção 2.7).
 */
export function formatarJutsu(j) {
  const selos = (j.sequencia ?? []).map((s) => s.selo);
  return {
    id: j.id,
    nome: j.nome,
    descricao: j.descricao,
    raridade: j.raridade,
    gestoFinalizacao: j.gestoFinalizacao,
    efeitoSegurar: j.efeitoSegurar,
    assinatura: j.assinatura,
    criadoEm: j.criadoEm,
    fonte: selos[0] ?? null,
    tipo: selos[1] ?? null,
    elemento: selos[2] ?? null,
    sequencia: selos,
    personagens: (j.personagens ?? []).map((pj) => ({
      id: pj.personagem.id,
      nome: pj.personagem.nome,
      dominio: pj.dominio,
    })),
  };
}

/**
 * Resolve a sequência enviada no corpo:
 *  - { selos: [id, id, ...] }   ids dos selos em ordem
 *  - { teclas: "W-D-D-W" }       teclas; cada posição usa o selo do slot esperado
 * Valida gramática (RN01/RN02) e retorna { selos, assinatura }.
 */
export async function resolverSequencia(body) {
  let selos;
  if (Array.isArray(body?.selos)) {
    const ids = body.selos.map(Number);
    if (ids.some((id) => !Number.isInteger(id))) throw new HttpError(400, 'Lista de selos inválida.');
    const encontrados = await prisma.selo.findMany({ where: { id: { in: ids } } });
    const porId = new Map(encontrados.map((s) => [s.id, s]));
    selos = ids.map((id, i) => {
      const s = porId.get(id);
      if (!s) throw new HttpError(422, `Selo da posição ${i + 1} não existe.`, { posicao: i });
      return s;
    });
  } else if (body?.teclas !== undefined) {
    const teclas = normalizarTeclas(body.teclas);
    const dicionario = await prisma.selo.findMany();
    selos = teclas.map((tecla, i) => {
      const slot = slotEsperado(i);
      const s = dicionario.find((d) => d.tecla === tecla && d.slot === slot);
      if (!s) {
        throw new HttpError(422, `Não há selo de ${NOME_SLOT[slot]} na tecla ${tecla} (posição ${i + 1}).`, {
          posicao: i,
        });
      }
      return s;
    });
  } else {
    throw new HttpError(400, 'Informe a sequência em "selos" (ids) ou "teclas" (ex.: W-D-D-W).');
  }

  const erro = validarGramatica(selos);
  if (erro) throw new HttpError(422, erro.mensagem, { posicao: erro.posicao });

  return { selos, assinatura: gerarAssinatura(selos) };
}

/** RN03: a assinatura deve ser única entre todos os jutsus. */
export async function garantirAssinaturaLivre(assinatura, jutsuId = null) {
  const existente = await prisma.jutsu.findUnique({ where: { assinatura } });
  if (existente && existente.id !== jutsuId) {
    throw new HttpError(409, `A sequência ${assinatura} já é usada pelo jutsu "${existente.nome}".`, {
      jutsu: { id: existente.id, nome: existente.nome },
    });
  }
}

/** Grava a sequência dentro de uma transação. */
export async function gravarSequencia(tx, jutsuId, { selos, assinatura }) {
  await tx.sequenciaSelo.deleteMany({ where: { jutsuId } });
  await tx.sequenciaSelo.createMany({
    data: selos.map((s, posicao) => ({ jutsuId, seloId: s.id, posicao })),
  });
  await tx.jutsu.update({ where: { id: jutsuId }, data: { assinatura } });
}
