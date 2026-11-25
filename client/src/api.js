// Cliente da API REST (Quadro 11)
const BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(status, corpo) {
    super(corpo?.erro ?? `Erro ${status}`);
    this.status = status;
    this.corpo = corpo ?? {};
  }
}

async function req(metodo, caminho, corpo) {
  const resp = await fetch(BASE + caminho, {
    method: metodo,
    headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (resp.status === 204) return null;
  const dados = await resp.json().catch(() => null);
  if (!resp.ok) throw new ApiError(resp.status, dados);
  return dados;
}

export const api = {
  selos: {
    listar: () => req('GET', '/selos'),
    criar: (d) => req('POST', '/selos', d),
    editar: (id, d) => req('PUT', `/selos/${id}`, d),
    excluir: (id) => req('DELETE', `/selos/${id}`),
  },
  jutsus: {
    listar: () => req('GET', '/jutsus'),
    obter: (id) => req('GET', `/jutsus/${id}`),
    criar: (d) => req('POST', '/jutsus', d),
    editar: (id, d) => req('PUT', `/jutsus/${id}`, d),
    gravarSequencia: (id, selos) => req('PUT', `/jutsus/${id}/sequencia`, { selos }),
    excluir: (id) => req('DELETE', `/jutsus/${id}`),
  },
  personagens: {
    listar: () => req('GET', '/personagens'),
    obter: (id) => req('GET', `/personagens/${id}`),
    criar: (d) => req('POST', '/personagens', d),
    editar: (id, d) => req('PUT', `/personagens/${id}`, d),
    excluir: (id) => req('DELETE', `/personagens/${id}`),
    vincular: (id, jutsuId, dominio) => req('POST', `/personagens/${id}/jutsus`, { jutsuId, dominio }),
    desvincular: (id, jutsuId) => req('DELETE', `/personagens/${id}/jutsus/${jutsuId}`),
  },
  codex: (filtros) => {
    const q = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v !== '' && v != null));
    return req('GET', `/codex?${q}`);
  },
};

export const SLOTS = ['FONTE', 'TIPO', 'ELEMENTO', 'SIMBOLICO'];
export const TECLAS = ['W', 'A', 'S', 'D'];
export const NOME_SLOT = { FONTE: 'Fonte', TIPO: 'Tipo', ELEMENTO: 'Elemento', SIMBOLICO: 'Simbólico' };
export const RARIDADES = { COMUM: 'Comum', RARO: 'Raro', LENDARIO: 'Lendário' };
export const ALINHAMENTOS = { PURO: 'Puro', MALIGNO: 'Maligno', INDECISO: 'Indeciso' };
export const slotDaPosicao = (i) => (i < 3 ? SLOTS[i] : 'SIMBOLICO');
