import type { ResultadoOpcao } from './custos';
import type { Adequacao } from './eletrico';
import type { ResumoQuilometragem } from './quilometragem';
import type { Rotina } from './tipos';

export type FaixaUso = 'baixo' | 'medio' | 'alto';

export interface Diagnostico {
  faixa: FaixaUso;
  titulo: string;
  resumo: string;
  pontos: string[];
}

/** Limites de faixa de uso (km/mês). Hipótese do protótipo. */
export const FAIXAS_KM = { baixo: 700, alto: 1800 };

export function classificarUso(kmMensal: number): FaixaUso {
  if (kmMensal < FAIXAS_KM.baixo) return 'baixo';
  if (kmMensal > FAIXAS_KM.alto) return 'alto';
  return 'medio';
}

export function diagnosticar(km: ResumoQuilometragem, rotina: Rotina): Diagnostico {
  const faixa = classificarUso(km.kmMensal);
  const titulo = { baixo: 'Uso leve', medio: 'Uso moderado e regular', alto: 'Uso intenso' }[faixa];
  const recorrente = km.kmMensal > 0 ? km.kmRecorrenteMes / km.kmMensal : 0;
  const pontos: string[] = [];
  pontos.push(`${Math.round(recorrente * 100)}% dos seus quilômetros vêm de deslocamentos que se repetem toda semana.`);
  if (rotina.viagens.length) pontos.push(`Você faz ${rotina.viagens.length} tipo(s) de viagem longa, que somam ${km.kmViagensMes.toFixed(0)} km por mês em média.`);
  pontos.push(rotina.recargaEmCasa ? 'Você tem onde carregar um carro elétrico em casa.' : 'Você não tem onde carregar um carro elétrico em casa.');
  if (faixa === 'alto') pontos.push('Quem roda muito costuma economizar mais com carros de menor custo por km, como os elétricos.');
  if (faixa === 'baixo') pontos.push('Rodando pouco, o peso maior é o custo de ter o carro (seguro, IPVA, perda de valor), não o combustível.');
  const resumo = `Você roda cerca de ${km.kmMensal.toFixed(0)} km por mês, em ${km.diasComDeslocamento} dia(s) da semana.`;
  return { faixa, titulo, resumo, pontos };
}

export interface Recomendacao {
  melhor: ResultadoOpcao | null;
  motivo: string;
  alternativas: ResultadoOpcao[];
  nenhumaCabe: boolean;
}

/**
 * Escolhe a opção de menor custo líquido entre as que cabem no orçamento mensal,
 * no valor disponível e (para elétricos) na rotina. Não usa números aleatórios.
 */
export function recomendar(opcoes: ResultadoOpcao[], adequacaoEletrico: Record<string, Adequacao>): Recomendacao {
  const viaveis = opcoes.filter(
    (o) => o.cabeNoOrcamento !== false && o.cabeNoDisponivel !== false && (o.tecnologia !== 'eletrico' || adequacaoEletrico[o.veiculoId] !== 'inadequado'),
  );
  const ordenar = (l: ResultadoOpcao[]) => [...l].sort((a, b) => a.custoLiquido - b.custoLiquido);
  if (viaveis.length) {
    const [melhor, ...resto] = ordenar(viaveis);
    return {
      melhor,
      motivo: 'É a opção de menor custo total no período entre as que cabem no seu orçamento mensal e no valor que você tem disponível.',
      alternativas: resto.slice(0, 3),
      nenhumaCabe: false,
    };
  }
  const [melhor, ...resto] = ordenar(opcoes);
  return {
    melhor: melhor ?? null,
    motivo: 'Nenhuma opção coube totalmente no orçamento informado. Mostramos a de menor custo total para você ajustar entrada, prazo ou veículo.',
    alternativas: resto.slice(0, 3),
    nenhumaCabe: true,
  };
}
