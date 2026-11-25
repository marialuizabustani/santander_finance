/**
 * Serviço de roteamento configurável.
 *
 * - Modo "demonstrativo" (padrão): sem rede. Distância = linha reta × fator de sinuosidade.
 *   Os resultados aparecem marcados como ESTIMATIVA.
 * - Modo "osrm": consulta um servidor OSRM (por padrão, o servidor público de demonstração,
 *   que tem limite de uso e não serve para produção). Os resultados aparecem como ROTA REAL.
 */
import { FATOR_SINUOSIDADE } from '../engine/quilometragem';
import type { Local } from '../engine/tipos';

export type ModoRoteamento = 'demonstrativo' | 'osrm';

export const CONFIG_ROTEAMENTO = {
  urlOsrm: 'https://router.project-osrm.org',
  timeoutMs: 8000,
};

export interface RotaCalculada {
  km: number;
  /** pontos da linha da rota para desenhar no mapa [lat, lng] */
  geometria: [number, number][];
  origem: 'rota-real' | 'estimativa';
}

export function rotaEstimativa(pontos: Local[]): RotaCalculada {
  let km = 0;
  for (let i = 1; i < pontos.length; i++) {
    const a = pontos[i - 1];
    const b = pontos[i];
    const R = 6371;
    const rad = (g: number) => (g * Math.PI) / 180;
    const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
    km += 2 * R * Math.asin(Math.sqrt(h)) * FATOR_SINUOSIDADE;
  }
  return { km, geometria: pontos.map((p) => [p.lat, p.lng]), origem: 'estimativa' };
}

export async function rotaOsrm(pontos: Local[]): Promise<RotaCalculada> {
  const coords = pontos.map((p) => `${p.lng},${p.lat}`).join(';');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG_ROTEAMENTO.timeoutMs);
  try {
    const r = await fetch(`${CONFIG_ROTEAMENTO.urlOsrm}/route/v1/driving/${coords}?overview=simplified&geometries=geojson`, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`OSRM respondeu ${r.status}`);
    const j = await r.json();
    const rota = j.routes?.[0];
    if (!rota) throw new Error('OSRM não encontrou rota');
    return {
      km: rota.distance / 1000,
      geometria: (rota.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]),
      origem: 'rota-real',
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Calcula a rota no modo escolhido. Se o serviço real falhar, volta para a estimativa e avisa. */
export async function calcularRota(pontos: Local[], modo: ModoRoteamento): Promise<RotaCalculada & { aviso?: string }> {
  if (pontos.length < 2) return { km: 0, geometria: [], origem: 'estimativa' };
  if (modo === 'demonstrativo') return rotaEstimativa(pontos);
  try {
    return await rotaOsrm(pontos);
  } catch (e) {
    return { ...rotaEstimativa(pontos), aviso: 'Não foi possível consultar o serviço de rotas; usando estimativa.' };
  }
}
