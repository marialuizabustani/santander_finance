/**
 * Carregadores FICTÍCIOS para o mapa demonstrativo. Não representam pontos reais de recarga.
 * Em produção, viriam de uma base pública ou de parceiros (ver README: integrações necessárias).
 */
export interface Carregador {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  potenciaKw: number;
  tipo: 'rapido' | 'lento';
  rodovia?: boolean;
}

export const CARREGADORES_FICTICIOS: Carregador[] = [
  { id: 'c1', nome: 'Shopping (fictício)', lat: -23.632, lng: -46.722, potenciaKw: 22, tipo: 'lento' },
  { id: 'c2', nome: 'Posto (fictício)', lat: -23.59, lng: -46.68, potenciaKw: 60, tipo: 'rapido' },
  { id: 'c3', nome: 'Estacionamento (fictício)', lat: -23.556, lng: -46.64, potenciaKw: 22, tipo: 'lento' },
  { id: 'c4', nome: 'Supermercado (fictício)', lat: -23.625, lng: -46.7, potenciaKw: 50, tipo: 'rapido' },
  { id: 'c5', nome: 'Centro comercial (fictício)', lat: -23.6, lng: -46.74, potenciaKw: 11, tipo: 'lento' },
  { id: 'c6', nome: 'Rodovia km 60 (fictício)', lat: -23.43, lng: -47.06, potenciaKw: 120, tipo: 'rapido', rodovia: true },
  { id: 'c7', nome: 'Rodovia km 110 (fictício)', lat: -23.3, lng: -47.45, potenciaKw: 120, tipo: 'rapido', rodovia: true },
];
