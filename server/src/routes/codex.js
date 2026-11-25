import { Router } from 'express';
import { prisma } from '../db.js';
import { HttpError, rota } from '../lib/http.js';
import { TECLAS, RARIDADES, normalizarTeclas } from '../lib/dominio.js';
import { includeJutsu, formatarJutsu } from '../lib/jutsus.js';

const r = Router();

function teclaFiltro(valor, nome) {
  if (valor === undefined || valor === '') return null;
  const t = String(valor).toUpperCase();
  if (!TECLAS.includes(t)) throw new HttpError(400, `Filtro "${nome}" deve ser W, A, S ou D.`);
  return t;
}

/**
 * UC05 – Consultar Codex
 * GET /codex?fonte=W&tipo=D&elemento=D&raridade=RARO&sequencia=W-D
 * Fonte, tipo e elemento são filtrados pela tecla do selo naquela posição.
 * "sequencia" encontra jutsus cuja frase começa com as teclas digitadas.
 */
r.get(
  '/',
  rota(async (req, res) => {
    const filtros = [
      teclaFiltro(req.query.fonte, 'fonte'),
      teclaFiltro(req.query.tipo, 'tipo'),
      teclaFiltro(req.query.elemento, 'elemento'),
    ];
    const where = {};
    if (req.query.raridade) {
      const raridade = String(req.query.raridade).toUpperCase();
      if (!RARIDADES.includes(raridade)) throw new HttpError(400, 'Raridade inválida.');
      where.raridade = raridade;
    }
    const teclas = normalizarTeclas(req.query.sequencia);
    const prefixo = teclas.join('-');
    if (prefixo) where.assinatura = { startsWith: prefixo };

    const jutsus = await prisma.jutsu.findMany({ where, include: includeJutsu, orderBy: { nome: 'asc' } });
    const resultado = jutsus
      .map(formatarJutsu)
      .filter((j) => filtros.every((tecla, i) => !tecla || j.sequencia[i]?.tecla === tecla))
      // um prefixo "W-D" não pode casar com "W-DD…": já garantido pois teclas são separadas por "-"
      .map((j) => ({ ...j, exato: prefixo ? j.assinatura === prefixo : undefined }))
      .sort((a, b) => (b.exato === true) - (a.exato === true));

    res.json({
      total: resultado.length,
      mensagem: resultado.length === 0 ? 'Nenhum jutsu encontrado.' : null,
      jutsus: resultado,
    });
  }),
);

export default r;
