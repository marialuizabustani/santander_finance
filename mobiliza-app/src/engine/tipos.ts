// Tipos compartilhados do motor de cálculo. Nenhuma função do motor depende da interface.

export type TipoLocal = 'casa' | 'trabalho' | 'escola' | 'mercado' | 'outro';

export interface Local {
  id: string;
  nome: string;
  tipo: TipoLocal;
  lat: number;
  lng: number;
  /** true = endereço fictício do cenário demonstrativo */
  ficticio?: boolean;
}

/** Dia da semana: 0 = domingo ... 6 = sábado */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Um deslocamento recorrente: sequência de paradas percorrida em certos dias da semana. */
export interface Trajeto {
  id: string;
  nome: string;
  paradas: string[]; // ids de Local, na ordem
  dias: DiaSemana[];
  /** Distância informada à mão (km). Se definida, substitui a calculada pelo mapa. */
  kmManual?: number | null;
}

export interface ViagemLonga {
  id: string;
  nome: string;
  kmIdaEVolta: number;
  vezesPorAno: number;
  /** maior trecho sem parada planejada (km), usado para avaliar autonomia */
  maiorTrechoKm: number;
}

export interface Rotina {
  locais: Local[];
  trajetos: Trajeto[];
  viagens: ViagemLonga[];
  kmExtrasMes: number;
  recargaEmCasa: boolean;
}

export interface Perfil {
  nome: string;
  idade: number | null;
  orcamentoMensal: number; // quanto pode gastar por mês com o carro (parcela + uso)
  valorDisponivel: number; // dinheiro disponível para entrada / compra à vista
  interesse: string;
}

export type Tecnologia = 'eletrico' | 'hibrido' | 'combustao';
export type Modalidade = 'avista' | 'financiamento' | 'leasing' | 'assinatura';

export interface Veiculo {
  id: string;
  nome: string;
  tecnologia: Tecnologia;
  categoria: string;
  preco: number;
  /** km por litro (combustão e híbrido) */
  kmPorLitro?: number;
  /** kWh por 100 km (elétrico) */
  kwhPor100Km?: number;
  /** capacidade da bateria em kWh (elétrico) */
  bateriaKwh?: number;
  ficticio: true;
}

export type PorTecnologia<T> = Record<Tecnologia, T>;

/** Todas as hipóteses do cálculo. Valores padrão são ilustrativos e editáveis. */
export interface Premissas {
  horizonteMeses: number;
  diasPorSemanaParaMes: number; // fator para converter dias da semana em dias no mês
  precoGasolinaLitro: number;
  precoEnergiaCasaKwh: number;
  precoEnergiaPublicaKwh: number;
  seguroPctAno: PorTecnologia<number>;
  ipvaPctAno: PorTecnologia<number>;
  /** desgaste por km rodado (pneus, freios, peças) */
  manutencaoPorKm: PorTecnologia<number>;
  /** revisões preventivas programadas, por ano (R$) */
  manutencaoPreventivaAno: PorTecnologia<number>;
  depreciacaoPctAno: PorTecnologia<number>;
  financiamento: { entradaPct: number; taxaMes: number; prazoMeses: number; custosContratacaoPct: number };
  leasing: { entradaPct: number; taxaMes: number; residualPct: number };
  assinatura: { mensalidadePctPreco: number; franquiaKmMes: number; excedentePorKm: number };
  /** Redução HIPOTÉTICA da taxa mensal (em pontos decimais, ex.: 0.0015 = 0,15 p.p. a.m.) por relacionamento */
  bonificacao: { conta: number; salario: number; debito: number; seguro: number };
  eletrico: { fracaoRecargaCasaComTomada: number; fracaoRecargaCasaSemTomada: number; bateriaUtilPct: number; margemSegurancaPct: number };
}

/** Relacionamento bancário simulado (jornada de conta e taxa bonificada). */
export interface Relacionamento {
  abrirConta: boolean;
  portabilidadeSalario: boolean;
  debitoAutomatico: boolean;
  seguroSantander: boolean;
}
