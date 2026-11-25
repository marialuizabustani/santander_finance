import { energiaMensal } from './custos';
import type { ResumoQuilometragem } from './quilometragem';
import type { Premissas, Veiculo, ViagemLonga } from './tipos';

export interface CondicoesUso {
  /** fração do uso em rodovia (0 a 1): velocidade maior aumenta o consumo */
  fracaoRodovia: number;
  arCondicionado: boolean;
}

/** Hipóteses de impacto no consumo (estimativas genéricas, editáveis no código). */
export const IMPACTO_CONSUMO = { rodovia: 0.2, arCondicionado: 0.1 };

export function consumoEfetivoKwh100(v: Veiculo, c: CondicoesUso): number {
  const base = v.kwhPor100Km ?? 0;
  return base * (1 + IMPACTO_CONSUMO.rodovia * c.fracaoRodovia + (c.arCondicionado ? IMPACTO_CONSUMO.arCondicionado : 0));
}

/** Autonomia estimada e autonomia "para planejar" (com margem de segurança). */
export function autonomia(v: Veiculo, c: CondicoesUso, p: Premissas): { estimadaKm: number; planejadaKm: number } {
  const consumo = consumoEfetivoKwh100(v, c);
  if (!consumo || !v.bateriaKwh) return { estimadaKm: 0, planejadaKm: 0 };
  const estimadaKm = ((v.bateriaKwh * p.eletrico.bateriaUtilPct) / consumo) * 100;
  return { estimadaKm, planejadaKm: estimadaKm * (1 - p.eletrico.margemSegurancaPct) };
}

export type Adequacao = 'adequado' | 'atencao' | 'inadequado';

export interface AnaliseViagem {
  viagem: ViagemLonga;
  paradasNaIda: number;
  trechoCabe: boolean;
}

export interface CompatibilidadeEletrico {
  adequacao: Adequacao;
  motivos: string[];
  autonomiaEstimadaKm: number;
  autonomiaPlanejadaKm: number;
  recargasPorSemana: number;
  diasEntreRecargas: number;
  viagens: AnaliseViagem[];
  custoRecargaMes: number;
  custoCombustivelMes: number;
  economiaMes: number;
}

/** Compara a rotina com a autonomia de um elétrico e estima recargas e gastos. */
export function analisarEletrico(
  v: Veiculo,
  km: ResumoQuilometragem,
  viagens: ViagemLonga[],
  recargaEmCasa: boolean,
  c: CondicoesUso,
  p: Premissas,
  comparadoCom: Veiculo,
): CompatibilidadeEletrico {
  const { estimadaKm, planejadaKm } = autonomia(v, c, p);
  const motivos: string[] = [];
  let adequacao: Adequacao = 'adequado';
  const pior = (a: Adequacao) => {
    const ordem = { adequado: 0, atencao: 1, inadequado: 2 };
    if (ordem[a] > ordem[adequacao]) adequacao = a;
  };

  const recargasPorSemana = planejadaKm > 0 ? km.kmSemanal / planejadaKm : 0;
  const mediaDia = km.diasComDeslocamento ? km.kmSemanal / km.diasComDeslocamento : 0;
  const diasEntreRecargas = mediaDia > 0 ? planejadaKm / mediaDia : 0;

  if (km.maiorDiaKm > planejadaKm) {
    pior('inadequado');
    motivos.push(`No seu dia mais longo você roda ${km.maiorDiaKm.toFixed(0)} km, mais que a autonomia segura de ${planejadaKm.toFixed(0)} km.`);
  } else {
    motivos.push(`O dia mais longo da rotina (${km.maiorDiaKm.toFixed(0)} km) cabe com folga na autonomia segura (${planejadaKm.toFixed(0)} km).`);
  }
  if (!recargaEmCasa) {
    pior(recargasPorSemana > 2 ? 'inadequado' : 'atencao');
    motivos.push('Sem recarga em casa, você depende de carregadores públicos, que são mais caros e exigem planejamento.');
  } else {
    motivos.push('Com recarga em casa, dá para sair todo dia com a bateria cheia, pagando a tarifa residencial.');
  }

  const analiseViagens = viagens.map((vi) => {
    const ida = vi.kmIdaEVolta / 2;
    const paradasNaIda = planejadaKm > 0 ? Math.max(0, Math.ceil(ida / planejadaKm) - 1) : 0;
    const trechoCabe = vi.maiorTrechoKm <= planejadaKm;
    if (!trechoCabe) {
      pior('atencao');
      motivos.push(`Na viagem "${vi.nome}", há um trecho de ${vi.maiorTrechoKm} km sem parada, maior que a autonomia segura. Planeje carregadores no caminho.`);
    } else if (paradasNaIda > 0) {
      motivos.push(`Na viagem "${vi.nome}", planeje ${paradasNaIda} parada(s) para recarga na ida.`);
    }
    return { viagem: vi, paradasNaIda, trechoCabe };
  });

  const custoRecargaMes = energiaMensal(v, km.kmMensal, recargaEmCasa, p);
  const custoCombustivelMes = energiaMensal(comparadoCom, km.kmMensal, recargaEmCasa, p);
  return {
    adequacao,
    motivos,
    autonomiaEstimadaKm: estimadaKm,
    autonomiaPlanejadaKm: planejadaKm,
    recargasPorSemana,
    diasEntreRecargas,
    viagens: analiseViagens,
    custoRecargaMes,
    custoCombustivelMes,
    economiaMes: custoCombustivelMes - custoRecargaMes,
  };
}
