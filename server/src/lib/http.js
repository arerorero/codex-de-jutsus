import { Prisma } from '@prisma/client';

export class HttpError extends Error {
  constructor(status, mensagem, extra = {}) {
    super(mensagem);
    this.status = status;
    this.extra = extra;
  }
}

/** Envolve handlers async para encaminhar erros ao middleware. */
export const rota = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function idParam(req, nome = 'id') {
  const id = Number(req.params[nome]);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identificador inválido.');
  return id;
}

export function texto(valor) {
  if (valor === undefined) return undefined;
  if (valor === null) return null;
  const t = String(valor).trim();
  return t === '' ? null : t;
}

// eslint-disable-next-line no-unused-vars
export function tratarErros(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ erro: err.message, ...err.extra });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ erro: 'Registro duplicado.' });
    if (err.code === 'P2025') return res.status(404).json({ erro: 'Registro não encontrado.' });
    if (err.code === 'P2003') return res.status(409).json({ erro: 'Registro em uso por outro cadastro.' });
  }
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}
