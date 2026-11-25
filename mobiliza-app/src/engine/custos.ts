import { parcelaLeasing, parcelaPrice, saldoDevedorPrice, valorResidual } from './financas';
import type { Modalidade, Perfil, Premissas, Veiculo } from './tipos';

export interface ContextoCalculo {
  kmMensal: number;
  recargaEmCasa: boolean;
  premissas: Premissas;
  perfil?: Pick<Perfil, 'orcamentoMensal' | 'valorDisponivel'>;
}

/** Preço médio do kWh considerando onde a pessoa recarrega. */
export function precoMedioKwh(recargaEmCasa: boolean, p: Premissas): number {
  const f = recargaEmCasa ? p.eletrico.fracaoRecargaCasaComTomada : p.eletrico.fracaoRecargaCasaSemTomada;
  return f * p.precoEnergiaCasaKwh + (1 - f) * p.precoEnergiaPublicaKwh;
}

/** Gasto mensal com combustível ou eletricidade. */
export function energiaMensal(v: Veiculo, kmMensal: number, recargaEmCasa: boolean, p: Premissas): number {
  if (v.tecnologia === 'eletrico') {
    const kwh = (kmMensal * (v.kwhPor100Km ?? 0)) / 100;
    return kwh * precoMedioKwh(recargaEmCasa, p);
  }
  return (kmMensal / (v.kmPorLitro ?? 1)) * p.precoGasolinaLitro;
}

/**
 * Seguro e IPVA no período, calculados ano a ano sobre o valor já desvalorizado.
 * Anos incompletos são proporcionais.
 */
export function seguroEIpvaNoPeriodo(v: Veiculo, meses: number, p: Premissas): { seguro: number; ipva: number } {
  let seguro = 0;
  let ipva = 0;
  for (let inicio = 0; inicio < meses; inicio += 12) {
    const fracao = Math.min(12, meses - inicio) / 12;
    const valorNoAno = valorResidual(v.preco, p.depreciacaoPctAno[v.tecnologia], inicio);
    seguro += valorNoAno * p.seguroPctAno[v.tecnologia] * fracao;
    ipva += valorNoAno * p.ipvaPctAno[v.tecnologia] * fracao;
  }
  return { seguro, ipva };
}

/** Partes que somam o custo líquido no período (todas em R$). */
export interface Composicao {
  depreciacao: number; // quanto o carro perde de valor (para quem fica com o carro)
  juros: number; // juros e custos de contratação
  mensalidades: number; // assinatura (já inclui seguro, IPVA, manutenção)
  energia: number;
  seguro: number;
  ipva: number;
  manutencao: number;
  excedenteKm: number;
}

export interface ResultadoOpcao {
  veiculoId: string;
  tecnologia: Veiculo['tecnologia'];
  modalidade: Modalidade;
  horizonteMeses: number;
  desembolsoInicial: number;
  parcelaMensal: number;
  operacaoMensal: number;
  desembolsoMensal: number;
  saidasTotais: number;
  patrimonioFinal: number; // valor do carro menos o que ainda deve, ao fim do período
  custoLiquido: number; // saídas − patrimônio final
  custoMensalMedio: number;
  custoPorKm: number;
  composicao: Composicao;
  cabeNoOrcamento: boolean | null;
  cabeNoDisponivel: boolean | null;
  observacoes: string[];
}

/** Calcula uma combinação veículo × modalidade no horizonte das premissas. */
export function calcularOpcao(v: Veiculo, modalidade: Modalidade, ctx: ContextoCalculo): ResultadoOpcao {
  const p = ctx.premissas;
  const H = p.horizonteMeses;
  const km = Math.max(0, ctx.kmMensal);
  const energiaMes = energiaMensal(v, km, ctx.recargaEmCasa, p);
  const { seguro, ipva } = seguroEIpvaNoPeriodo(v, H, p);
  const manutencaoMes = km * p.manutencaoPorKm[v.tecnologia] + p.manutencaoPreventivaAno[v.tecnologia] / 12;
  const valorFinal = valorResidual(v.preco, p.depreciacaoPctAno[v.tecnologia], H);
  const observacoes: string[] = [];

  const comp: Composicao = {
    depreciacao: 0,
    juros: 0,
    mensalidades: 0,
    energia: energiaMes * H,
    seguro: 0,
    ipva: 0,
    manutencao: 0,
    excedenteKm: 0,
  };
  let desembolsoInicial = 0;
  let parcelaMensal = 0;
  let saidas = 0;
  let patrimonio = 0;

  const custosDeDono = () => {
    comp.seguro = seguro;
    comp.ipva = ipva;
    comp.manutencao = manutencaoMes * H;
    comp.depreciacao = v.preco - valorFinal;
  };

  if (modalidade === 'avista') {
    custosDeDono();
    desembolsoInicial = v.preco;
    saidas = v.preco;
    patrimonio = valorFinal;
  } else if (modalidade === 'financiamento') {
    custosDeDono();
    const f = p.financiamento;
    const entrada = v.preco * f.entradaPct;
    const principal = (v.preco - entrada) * (1 + f.custosContratacaoPct);
    parcelaMensal = parcelaPrice(principal, f.taxaMes, f.prazoMeses);
    const pagas = Math.min(f.prazoMeses, H);
    const saldo = saldoDevedorPrice(principal, f.taxaMes, f.prazoMeses, pagas);
    desembolsoInicial = entrada;
    saidas = entrada + parcelaMensal * pagas;
    patrimonio = valorFinal - saldo;
    comp.juros = entrada + parcelaMensal * pagas + saldo - v.preco;
    if (f.prazoMeses > H) observacoes.push(`O financiamento de ${f.prazoMeses} meses passa do período comparado; o saldo que ainda falta pagar foi descontado do valor do carro.`);
    if (f.prazoMeses < H) observacoes.push(`As parcelas terminam no mês ${f.prazoMeses}; depois disso restam só os custos de uso.`);
  } else if (modalidade === 'leasing') {
    custosDeDono();
    const l = p.leasing;
    const entrada = v.preco * l.entradaPct;
    const residual = v.preco * l.residualPct;
    parcelaMensal = parcelaLeasing(v.preco - entrada, residual, l.taxaMes, H);
    desembolsoInicial = entrada;
    saidas = entrada + parcelaMensal * H + residual;
    patrimonio = valorFinal;
    comp.juros = saidas - v.preco;
    observacoes.push(`Considera que, ao fim de ${H} meses, você paga o valor final de ${formatarReais(residual)} e fica com o carro.`);
  } else {
    const a = p.assinatura;
    parcelaMensal = v.preco * a.mensalidadePctPreco;
    const excedenteMes = Math.max(0, km - a.franquiaKmMes) * a.excedentePorKm;
    comp.mensalidades = parcelaMensal * H;
    comp.excedenteKm = excedenteMes * H;
    saidas = comp.mensalidades + comp.excedenteKm;
    patrimonio = 0;
    if (excedenteMes > 0) observacoes.push(`Você roda mais que a franquia de ${a.franquiaKmMes} km/mês; o excedente custa ${formatarReais(excedenteMes)} por mês.`);
    observacoes.push('Na assinatura, seguro, IPVA e manutenção já estão na mensalidade. O carro é devolvido no final.');
  }

  const operacaoMensal =
    modalidade === 'assinatura'
      ? energiaMes + comp.excedenteKm / H
      : energiaMes + (seguro + ipva) / H + manutencaoMes;
  saidas += comp.energia + comp.seguro + comp.ipva + comp.manutencao;
  const custoLiquido = saidas - patrimonio;

  const perfil = ctx.perfil;
  const desembolsoMensal = parcelaMensal + operacaoMensal;
  return {
    veiculoId: v.id,
    tecnologia: v.tecnologia,
    modalidade,
    horizonteMeses: H,
    desembolsoInicial,
    parcelaMensal,
    operacaoMensal,
    desembolsoMensal,
    saidasTotais: saidas,
    patrimonioFinal: patrimonio,
    custoLiquido,
    custoMensalMedio: custoLiquido / H,
    custoPorKm: km > 0 ? custoLiquido / (km * H) : 0,
    composicao: comp,
    cabeNoOrcamento: perfil ? desembolsoMensal <= perfil.orcamentoMensal : null,
    cabeNoDisponivel: perfil ? desembolsoInicial <= perfil.valorDisponivel : null,
    observacoes,
  };
}

export const MODALIDADES: Modalidade[] = ['avista', 'financiamento', 'leasing', 'assinatura'];

/** Compara todos os veículos em todas as modalidades, no mesmo horizonte. */
export function compararTudo(veiculos: Veiculo[], ctx: ContextoCalculo, modalidades = MODALIDADES): ResultadoOpcao[] {
  return veiculos.flatMap((v) => modalidades.map((m) => calcularOpcao(v, m, ctx)));
}

/** Soma da composição (deve ser igual ao custo líquido; usado nos testes). */
export function somaComposicao(c: Composicao): number {
  return c.depreciacao + c.juros + c.mensalidades + c.energia + c.seguro + c.ipva + c.manutencao + c.excedenteKm;
}

export function formatarReais(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

/** Quanto cada parte custa, em média, por mês (para os quadros lado a lado). */
export function custosMensais(o: ResultadoOpcao) {
  const H = o.horizonteMeses;
  const c = o.composicao;
  return {
    parcela: o.parcelaMensal,
    energia: c.energia / H,
    manutencao: c.manutencao / H,
    ipva: c.ipva / H,
    seguro: c.seguro / H,
    excedenteKm: c.excedenteKm / H,
    total: o.desembolsoMensal,
  };
}
