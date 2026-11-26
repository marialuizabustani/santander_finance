import { useEffect, useState } from 'react';

/** Roteador mínimo por hash (#/rotina), compatível com abrir o index.html direto do disco. */
export type IdPagina =
  | 'inicio'
  | 'rotina'
  | 'diagnostico'
  | 'comparador'
  | 'assistente'
  | 'simulacao'
  | 'proximos-passos'
  | 'eletrico'
  | 'conta'
  | 'lojista'
  | 'proposta'
  | 'premissas'
  | 'simulador';

export const JORNADA: { id: IdPagina; titulo: string }[] = [
  { id: 'rotina', titulo: 'Minha Rotina' },
  { id: 'diagnostico', titulo: 'Diagnóstico' },
  { id: 'comparador', titulo: 'Comparação' },
  { id: 'simulacao', titulo: 'Simulação' },
  { id: 'conta', titulo: 'Conta e taxa' },
  { id: 'proximos-passos', titulo: 'Próximos passos' },
];

export function lerRota(): { pagina: IdPagina; params: URLSearchParams } {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [caminho, query = ''] = h.split('?');
  const pagina = (caminho || 'inicio') as IdPagina;
  return { pagina, params: new URLSearchParams(query) };
}

export function irPara(pagina: IdPagina, params?: Record<string, string>): void {
  const q = params ? '?' + new URLSearchParams(params).toString() : '';
  window.location.hash = `/${pagina}${q}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function useRota() {
  const [rota, setRota] = useState(lerRota);
  useEffect(() => {
    const f = () => setRota(lerRota());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return rota;
}
