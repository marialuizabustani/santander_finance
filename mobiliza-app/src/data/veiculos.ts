import type { Veiculo } from '../engine/tipos';

/**
 * Veículos FICTÍCIOS. Nomes genéricos e especificações aproximadas, apenas para demonstração.
 * Não representam modelos, preços nem ofertas reais.
 */
export const VEICULOS: Veiculo[] = [
  {
    id: 'eletrico-compacto',
    nome: 'Elétrico Compacto (fictício)',
    tecnologia: 'eletrico',
    categoria: 'Hatch compacto',
    preco: 150000,
    kwhPor100Km: 14,
    bateriaKwh: 44,
    ficticio: true,
  },
  {
    id: 'eletrico-suv',
    nome: 'Elétrico SUV (fictício)',
    tecnologia: 'eletrico',
    categoria: 'SUV médio',
    preco: 230000,
    kwhPor100Km: 17,
    bateriaKwh: 60,
    ficticio: true,
  },
  {
    id: 'eletrico-seda',
    nome: 'Elétrico Sedã (fictício)',
    tecnologia: 'eletrico',
    categoria: 'Sedã médio',
    preco: 190000,
    kwhPor100Km: 15,
    bateriaKwh: 60,
    ficticio: true,
  },
  {
    id: 'hibrido-sedan',
    nome: 'Híbrido Sedã (fictício)',
    tecnologia: 'hibrido',
    categoria: 'Sedã médio',
    preco: 175000,
    kmPorLitro: 17,
    ficticio: true,
  },
  {
    id: 'combustao-hatch',
    nome: 'Combustão Hatch (fictício)',
    tecnologia: 'combustao',
    categoria: 'Hatch compacto',
    preco: 105000,
    kmPorLitro: 11,
    ficticio: true,
  },
  {
    id: 'combustao-suv',
    nome: 'Combustão SUV (fictício)',
    tecnologia: 'combustao',
    categoria: 'SUV médio',
    preco: 160000,
    kmPorLitro: 9.5,
    ficticio: true,
  },
];

export const NOME_TECNOLOGIA = { eletrico: 'Elétrico', hibrido: 'Híbrido', combustao: 'Combustão' } as const;
export const NOME_MODALIDADE = {
  avista: 'Compra à vista',
  financiamento: 'Financiamento',
  leasing: 'Leasing',
  assinatura: 'Assinatura',
} as const;

export function veiculoPorId(id: string): Veiculo {
  const v = VEICULOS.find((x) => x.id === id);
  if (!v) throw new Error(`Veículo não encontrado: ${id}`);
  return v;
}
