import type { Perfil, Rotina } from '../engine/tipos';

/**
 * Cenário demonstrativo para apresentação ao vivo. Pessoa, endereços e valores são FICTÍCIOS.
 * Os pontos ficam em São Paulo apenas para o mapa fazer sentido; não são endereços reais de ninguém.
 * Percurso: ~42 km por dia (estimativa), 5 dias por semana (22 dias no mês).
 */
export const PERFIL_DEMO: Perfil = {
  nome: 'Cláudia (persona fictícia)',
  idade: 48,
  orcamentoMensal: 3800,
  valorDisponivel: 40000,
  interesse: 'Quer trocar de carro e está em dúvida entre combustão e elétrico. Quer comparar financiamento e assinatura.',
};

export const ROTINA_DEMO: Rotina = {
  locais: [
    { id: 'casa', nome: 'Casa', tipo: 'casa', lat: -23.662, lng: -46.73, ficticio: true },
    { id: 'escola', nome: 'Escola do filho', tipo: 'escola', lat: -23.643, lng: -46.711, ficticio: true },
    { id: 'trabalho', nome: 'Trabalho', tipo: 'trabalho', lat: -23.548, lng: -46.633, ficticio: true },
    { id: 'mercado', nome: 'Supermercado', tipo: 'mercado', lat: -23.628, lng: -46.708, ficticio: true },
  ],
  trajetos: [
    { id: 'ida', nome: 'Ida: casa → escola → trabalho', paradas: ['casa', 'escola', 'trabalho'], dias: [1, 2, 3, 4, 5] },
    { id: 'volta', nome: 'Volta: trabalho → mercado → casa', paradas: ['trabalho', 'mercado', 'casa'], dias: [1, 2, 3, 4, 5] },
  ],
  viagens: [
    { id: 'familia', nome: 'Visita à família no interior', kmIdaEVolta: 420, vezesPorAno: 6, maiorTrechoKm: 210 },
    { id: 'praia', nome: 'Praia nas férias', kmIdaEVolta: 160, vezesPorAno: 4, maiorTrechoKm: 80 },
  ],
  kmExtrasMes: 150,
  recargaEmCasa: true,
};

export const ROTINA_VAZIA: Rotina = { locais: [], trajetos: [], viagens: [], kmExtrasMes: 0, recargaEmCasa: false };

export const PERFIL_VAZIO: Perfil = { nome: '', idade: null, orcamentoMensal: 3000, valorDisponivel: 20000, interesse: '' };

/** Bairros de referência para adicionar locais sem digitar endereço (coordenadas aproximadas, uso demonstrativo). */
export const PONTOS_SUGERIDOS = [
  { nome: 'Centro', lat: -23.5505, lng: -46.6333 },
  { nome: 'Zona Sul', lat: -23.65, lng: -46.71 },
  { nome: 'Zona Oeste', lat: -23.567, lng: -46.705 },
  { nome: 'Zona Norte', lat: -23.49, lng: -46.62 },
  { nome: 'Zona Leste', lat: -23.545, lng: -46.48 },
  { nome: 'ABC', lat: -23.664, lng: -46.538 },
];
