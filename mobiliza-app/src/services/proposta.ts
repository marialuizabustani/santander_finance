import type { Modalidade } from '../engine';

/** Resumo de proposta FICTÍCIA, codificado na URL para "continuar no celular" sem servidor. */
export interface PropostaDemo {
  codigo: string;
  loja: string;
  vendedor: string;
  veiculoId: string;
  modalidade: Modalidade;
  kmMensal: number;
  entrada: number;
  parcela: number;
  gastoMensal: number;
  custoTotal: number;
  horizonteMeses: number;
  seguro: boolean;
  seguroMensal: number;
  criadaEm: string;
  /** itens do pacote montado no balcão */
  itens?: string[];
  /** taxa mensal usada (decimal), já bonificada se houver relacionamento */
  taxaMes?: number;
}

/** Código determinístico (mesmo conteúdo, mesmo código). Prefixo DEMO deixa claro que não é real. */
export function gerarCodigo(conteudo: string): string {
  let h = 2166136261;
  for (let i = 0; i < conteudo.length; i++) {
    h ^= conteudo.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `DEMO-${(h >>> 0).toString(36).toUpperCase().slice(0, 6).padStart(6, '0')}`;
}

export function codificarProposta(p: PropostaDemo): string {
  const json = JSON.stringify(p);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodificarProposta(d: string | null): PropostaDemo | null {
  if (!d) return null;
  try {
    const b64 = d.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b64)))) as PropostaDemo;
  } catch {
    return null;
  }
}

export function linkProposta(p: PropostaDemo): string {
  const base = window.location.href.split('#')[0];
  return `${base}#/proposta?d=${codificarProposta(p)}`;
}
