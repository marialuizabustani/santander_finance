import type { Local, Premissas, Rotina, Trajeto } from './tipos';

/** Fator que transforma distância em linha reta em distância aproximada pelas ruas (modo demonstrativo). */
export const FATOR_SINUOSIDADE = 1.3;

/** Distância em linha reta entre dois pontos (km), pela fórmula de haversine. */
export function distanciaLinhaRetaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Estimativa de distância por ruas de uma sequência de pontos (modo demonstrativo). */
export function estimativaPercursoKm(pontos: { lat: number; lng: number }[], fator = FATOR_SINUOSIDADE): number {
  let total = 0;
  for (let i = 1; i < pontos.length; i++) total += distanciaLinhaRetaKm(pontos[i - 1], pontos[i]) * fator;
  return total;
}

export type OrigemDistancia = 'manual' | 'rota-real' | 'estimativa';

export interface KmTrajeto {
  trajetoId: string;
  nome: string;
  kmPorDia: number;
  diasNoMes: number;
  kmNoMes: number;
  origem: OrigemDistancia;
}

export interface ResumoQuilometragem {
  trajetos: KmTrajeto[];
  kmRecorrenteMes: number;
  kmViagensMes: number;
  kmExtrasMes: number;
  kmMensal: number;
  /** maior distância percorrida num único dia da semana (para avaliar autonomia) */
  maiorDiaKm: number;
  diasComDeslocamento: number;
  kmSemanal: number;
}

/**
 * Km por dia de um trajeto. Prioridade: valor manual > rota real (serviço de roteamento) > estimativa.
 */
export function kmDoTrajeto(
  t: Trajeto,
  locais: Local[],
  rotasReais: Record<string, number> = {},
): { km: number; origem: OrigemDistancia } {
  if (t.kmManual != null && t.kmManual >= 0) return { km: t.kmManual, origem: 'manual' };
  if (rotasReais[t.id] != null) return { km: rotasReais[t.id], origem: 'rota-real' };
  const pontos = t.paradas.map((id) => locais.find((l) => l.id === id)).filter((l): l is Local => !!l);
  return { km: estimativaPercursoKm(pontos), origem: 'estimativa' };
}

/** Converte os dias da semana marcados em dias no mês (ex.: 5 dias × 4,4 = 22). */
export function diasNoMes(dias: number[], premissas: Pick<Premissas, 'diasPorSemanaParaMes'>): number {
  return dias.length * premissas.diasPorSemanaParaMes;
}

/** Quilometragem mensal a partir da rotina. Função pura e testável. */
export function calcularQuilometragem(
  rotina: Rotina,
  premissas: Pick<Premissas, 'diasPorSemanaParaMes'>,
  rotasReais: Record<string, number> = {},
): ResumoQuilometragem {
  const trajetos: KmTrajeto[] = rotina.trajetos.map((t) => {
    const { km, origem } = kmDoTrajeto(t, rotina.locais, rotasReais);
    const dm = diasNoMes(t.dias, premissas);
    return { trajetoId: t.id, nome: t.nome, kmPorDia: km, diasNoMes: dm, kmNoMes: km * dm, origem };
  });

  const kmPorDiaDaSemana = [0, 0, 0, 0, 0, 0, 0];
  rotina.trajetos.forEach((t, i) => t.dias.forEach((d) => (kmPorDiaDaSemana[d] += trajetos[i].kmPorDia)));

  const kmRecorrenteMes = trajetos.reduce((s, t) => s + t.kmNoMes, 0);
  const kmViagensMes = rotina.viagens.reduce((s, v) => s + (v.kmIdaEVolta * v.vezesPorAno) / 12, 0);
  const kmExtrasMes = Math.max(0, rotina.kmExtrasMes || 0);

  return {
    trajetos,
    kmRecorrenteMes,
    kmViagensMes,
    kmExtrasMes,
    kmMensal: kmRecorrenteMes + kmViagensMes + kmExtrasMes,
    maiorDiaKm: Math.max(...kmPorDiaDaSemana),
    diasComDeslocamento: kmPorDiaDaSemana.filter((k) => k > 0).length,
    kmSemanal: kmPorDiaDaSemana.reduce((a, b) => a + b, 0),
  };
}
