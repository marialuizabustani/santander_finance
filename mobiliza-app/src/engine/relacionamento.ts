import type { Premissas, Relacionamento } from './tipos';

/**
 * Simulador ILUSTRATIVO de rating de relacionamento e taxa bonificada.
 * As reduções vêm das premissas (editáveis) e não representam política de crédito real:
 * na prática, taxa e aprovação dependem de análise individual.
 */

export const SEM_RELACIONAMENTO: Relacionamento = { abrirConta: false, portabilidadeSalario: false, debitoAutomatico: false, seguroSantander: false };

/** Redução total da taxa mensal (decimal). Portabilidade de salário só conta com conta aberta. */
export function bonusTaxa(r: Relacionamento, p: Pick<Premissas, 'bonificacao'>): number {
  const b = p.bonificacao;
  let total = 0;
  if (r.abrirConta) total += b.conta;
  if (r.abrirConta && r.portabilidadeSalario) total += b.salario;
  if (r.abrirConta && r.debitoAutomatico) total += b.debito;
  if (r.seguroSantander) total += b.seguro;
  return total;
}

/** Premissas com as taxas de financiamento e leasing já bonificadas (nunca abaixo de zero). */
export function aplicarBonificacao(p: Premissas, r: Relacionamento): Premissas {
  const bonus = bonusTaxa(r, p);
  if (!bonus) return p;
  return {
    ...p,
    financiamento: { ...p.financiamento, taxaMes: Math.max(0, p.financiamento.taxaMes - bonus) },
    leasing: { ...p.leasing, taxaMes: Math.max(0, p.leasing.taxaMes - bonus) },
  };
}

export interface Rating {
  pontos: number; // 0 a 100
  nivel: 'Inicial' | 'Bom' | 'Muito bom' | 'Excelente';
  itens: { rotulo: string; pontos: number; ativo: boolean }[];
}

/** Pontuação ilustrativa de relacionamento (escala do protótipo, não é score de crédito). */
export function ratingRelacionamento(r: Relacionamento): Rating {
  const itens = [
    { rotulo: 'Cliente sem relacionamento', pontos: 35, ativo: true },
    { rotulo: 'Conta Santander aberta', pontos: 20, ativo: r.abrirConta },
    { rotulo: 'Salário na conta (portabilidade)', pontos: 25, ativo: r.abrirConta && r.portabilidadeSalario },
    { rotulo: 'Parcelas em débito automático', pontos: 10, ativo: r.abrirConta && r.debitoAutomatico },
    { rotulo: 'Seguro auto com o banco', pontos: 10, ativo: r.seguroSantander },
  ];
  const pontos = itens.filter((i) => i.ativo).reduce((s, i) => s + i.pontos, 0);
  const nivel = pontos >= 90 ? 'Excelente' : pontos >= 70 ? 'Muito bom' : pontos >= 55 ? 'Bom' : 'Inicial';
  return { pontos, nivel, itens };
}
