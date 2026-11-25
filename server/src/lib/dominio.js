// Constantes e regras do domínio (seção 2.3 – Regras de Negócio)

export const TECLAS = ['W', 'A', 'S', 'D'];
export const SLOTS = ['FONTE', 'TIPO', 'ELEMENTO', 'SIMBOLICO'];
export const RARIDADES = ['COMUM', 'RARO', 'LENDARIO'];
export const ALINHAMENTOS = ['PURO', 'MALIGNO', 'INDECISO'];

export const NOME_SLOT = {
  FONTE: 'fonte',
  TIPO: 'tipo',
  ELEMENTO: 'elemento',
  SIMBOLICO: 'simbólico',
};

/** Slot esperado para cada posição da frase (RN01 e RN02). */
export function slotEsperado(posicao) {
  return posicao < 3 ? SLOTS[posicao] : 'SIMBOLICO';
}

/**
 * Valida a gramática da sequência (RN01, RN02).
 * @param {{slot: string}[]} selos selos em ordem
 * @returns {null | {posicao: number, mensagem: string}} null se válida
 */
export function validarGramatica(selos) {
  if (!Array.isArray(selos) || selos.length < 3) {
    return {
      posicao: selos?.length ?? 0,
      mensagem: 'A sequência precisa ter ao menos fonte, tipo e elemento (3 selos).',
    };
  }
  for (let i = 0; i < selos.length; i++) {
    const esperado = slotEsperado(i);
    if (selos[i].slot !== esperado) {
      return {
        posicao: i,
        mensagem: `Selo fora de ordem na posição ${i + 1}: esperado um selo de ${NOME_SLOT[esperado]}, recebido um selo de ${NOME_SLOT[selos[i].slot] ?? selos[i].slot}.`,
      };
    }
  }
  return null;
}

/** Gera a assinatura da frase (RN03), ex.: "W-D-D-W". */
export function gerarAssinatura(selos) {
  return selos.map((s) => s.tecla).join('-');
}

/** Normaliza uma sequência digitada ("wdd w", "W-D-D-W", ["W","D"]) para ["W","D",...]. */
export function normalizarTeclas(entrada) {
  const texto = Array.isArray(entrada) ? entrada.join('') : String(entrada ?? '');
  return texto.toUpperCase().replace(/[^WASD]/g, '').split('').filter(Boolean);
}
