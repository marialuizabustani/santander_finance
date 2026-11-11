/**
 * Motor de cálculo do simulador de financiamento.
 * Funciona no navegador (window.Simulador) e no Node (module.exports).
 *
 * Convenções:
 *  - Taxas em forma decimal (1,5% a.m. => 0.015).
 *  - Mês comercial de 30 dias para o cálculo do IOF.
 *  - Parcelas postecipadas (1ª parcela 30 dias após a contratação).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Simulador = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // IOF para pessoa física (Decreto 6.306/2007, alíquotas vigentes)
  const IOF_DIARIO_PF = 0.000082; // 0,0082% ao dia
  const IOF_ADICIONAL = 0.0038; // 0,38% sobre o valor da operação
  const IOF_DIAS_MAX = 365;

  const SISTEMAS = { PRICE: 'PRICE', SAC: 'SAC' };

  /** Converte taxa anual efetiva em mensal equivalente (juros compostos). */
  function anualParaMensal(taxaAnual) {
    return Math.pow(1 + taxaAnual, 1 / 12) - 1;
  }

  /** Converte taxa mensal em anual efetiva equivalente. */
  function mensalParaAnual(taxaMensal) {
    return Math.pow(1 + taxaMensal, 12) - 1;
  }

  /** Parcela fixa do sistema Price. */
  function parcelaPrice(principal, taxa, prazo) {
    if (taxa === 0) return principal / prazo;
    return (principal * taxa) / (1 - Math.pow(1 + taxa, -prazo));
  }

  /**
   * Gera a tabela de amortização.
   * @returns {Array<{mes, parcela, juros, amortizacao, saldo}>}
   */
  function tabelaAmortizacao(principal, taxa, prazo, sistema) {
    const linhas = [];
    let saldo = principal;
    const pmt = parcelaPrice(principal, taxa, prazo);
    const amortSac = principal / prazo;

    for (let mes = 1; mes <= prazo; mes++) {
      const juros = saldo * taxa;
      let amortizacao = sistema === SISTEMAS.SAC ? amortSac : pmt - juros;
      if (mes === prazo) amortizacao = saldo; // elimina resíduo de arredondamento
      const parcela = amortizacao + juros;
      saldo = Math.max(0, saldo - amortizacao);
      linhas.push({ mes, parcela, juros, amortizacao, saldo });
    }
    return linhas;
  }

  /**
   * IOF de pessoa física sobre uma operação: alíquota diária sobre cada
   * amortização (pelo prazo em dias até o vencimento, limitado a 365) +
   * alíquota adicional sobre o principal.
   */
  function calcularIOF(principal, taxa, prazo, sistema) {
    const tabela = tabelaAmortizacao(principal, taxa, prazo, sistema);
    let diario = 0;
    for (const l of tabela) {
      const dias = Math.min(l.mes * 30, IOF_DIAS_MAX);
      diario += l.amortizacao * dias * IOF_DIARIO_PF;
    }
    return diario + principal * IOF_ADICIONAL;
  }

  /**
   * Taxa interna de retorno mensal (usada para o CET).
   * Resolve: valorLiberado = Σ fluxo_k / (1 + r)^k, por bisseção.
   */
  function taxaInterna(valorLiberado, fluxos) {
    const vp = (r) => fluxos.reduce((s, f, k) => s + f / Math.pow(1 + r, k + 1), 0);
    let lo = 0;
    let hi = 1;
    if (vp(lo) <= valorLiberado) return 0;
    while (vp(hi) > valorLiberado && hi < 1e3) hi *= 2;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (vp(mid) > valorLiberado) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /**
   * Valor máximo financiável para que a MAIOR parcela caiba no limite de renda
   * (sem considerar IOF/tarifas financiados).
   */
  function principalMaximoPorRenda(parcelaMaxima, taxa, prazo, sistema) {
    if (sistema === SISTEMAS.SAC) {
      // 1ª parcela SAC = P/n + P*i
      return parcelaMaxima / (1 / prazo + taxa);
    }
    if (taxa === 0) return parcelaMaxima * prazo;
    return (parcelaMaxima * (1 - Math.pow(1 + taxa, -prazo))) / taxa;
  }

  function validar(p) {
    const erros = [];
    const num = (v) => typeof v === 'number' && Number.isFinite(v);
    if (!num(p.valorBem) || p.valorBem <= 0) erros.push('Valor do bem deve ser maior que zero.');
    if (!num(p.entrada) || p.entrada < 0) erros.push('Entrada não pode ser negativa.');
    if (num(p.valorBem) && num(p.entrada) && p.entrada >= p.valorBem)
      erros.push('Entrada deve ser menor que o valor do bem.');
    if (!Number.isInteger(p.prazoMeses) || p.prazoMeses < 1 || p.prazoMeses > 420)
      erros.push('Prazo deve ser um número inteiro entre 1 e 420 meses.');
    if (!num(p.taxa) || p.taxa < 0 || p.taxa > 1) erros.push('Taxa de juros inválida.');
    if (!Object.values(SISTEMAS).includes(p.sistema))
      erros.push('Tipo de amortização deve ser PRICE ou SAC.');
    if (!num(p.rendaMensal) || p.rendaMensal <= 0) erros.push('Renda mensal deve ser maior que zero.');
    if (!num(p.limiteComprometimento) || p.limiteComprometimento <= 0 || p.limiteComprometimento > 1)
      erros.push('Limite de comprometimento de renda deve estar entre 0% e 100%.');
    if (!num(p.entradaMinimaPct) || p.entradaMinimaPct < 0 || p.entradaMinimaPct >= 1)
      erros.push('Entrada mínima deve estar entre 0% e 100%.');
    for (const campo of ['tarifaCadastro', 'registroContrato', 'seguro', 'outrasDespesas']) {
      if (!num(p[campo]) || p[campo] < 0) erros.push(`Campo "${campo}" não pode ser negativo.`);
    }
    return erros;
  }

  const PADROES = {
    entrada: 0,
    taxaPeriodo: 'mensal', // 'mensal' | 'anual'
    sistema: SISTEMAS.PRICE,
    rendaComplementar: 0,
    limiteComprometimento: 0.3,
    entradaMinimaPct: 0.2,
    tarifaCadastro: 0,
    registroContrato: 0,
    seguro: 0,
    outrasDespesas: 0,
    cobrarIOF: true,
    financiarCustos: true,
  };

  /**
   * Executa a simulação completa.
   *
   * @param {object} entrada
   * @param {number} entrada.valorBem            Valor do veículo/imóvel.
   * @param {number} [entrada.entrada]           Valor de entrada.
   * @param {number} entrada.prazoMeses          Prazo em meses.
   * @param {number} entrada.taxa                Taxa de juros (decimal).
   * @param {'mensal'|'anual'} [entrada.taxaPeriodo]
   * @param {'PRICE'|'SAC'} [entrada.sistema]    Tipo de amortização.
   * @param {number} entrada.rendaMensal         Renda bruta mensal do proponente.
   * @param {number} [entrada.rendaComplementar] Renda de cônjuge/coobrigado.
   * @param {number} [entrada.limiteComprometimento] % máx. da renda (padrão 30%).
   * @param {number} [entrada.entradaMinimaPct]  Entrada mínima exigida (padrão 20%).
   * @param {number} [entrada.tarifaCadastro]
   * @param {number} [entrada.registroContrato]
   * @param {number} [entrada.seguro]            Seguro prestamista (valor único).
   * @param {number} [entrada.outrasDespesas]
   * @param {boolean} [entrada.cobrarIOF]
   * @param {boolean} [entrada.financiarCustos]  Incluir IOF/tarifas no financiamento.
   */
  function simular(entrada) {
    const p = Object.assign({}, PADROES, entrada);
    const erros = validar(p);
    if (erros.length) {
      const e = new Error(erros.join(' '));
      e.erros = erros;
      throw e;
    }

    const taxaMensal = p.taxaPeriodo === 'anual' ? anualParaMensal(p.taxa) : p.taxa;
    const n = p.prazoMeses;
    const valorLiquido = p.valorBem - p.entrada; // crédito para o bem
    const tarifas = p.tarifaCadastro + p.registroContrato + p.seguro + p.outrasDespesas;

    // IOF é linear no principal: IOF(P) = P * aliquotaEfetiva.
    const aliquotaIOF = p.cobrarIOF ? calcularIOF(1, taxaMensal, n, p.sistema) : 0;

    let principal;
    let iof;
    let custosAVista;
    if (p.financiarCustos) {
      // P = valorLiquido + tarifas + IOF(P)  =>  P = (base) / (1 - aliquota)
      principal = (valorLiquido + tarifas) / (1 - aliquotaIOF);
      iof = principal * aliquotaIOF;
      custosAVista = 0;
    } else {
      principal = valorLiquido;
      iof = principal * aliquotaIOF;
      custosAVista = tarifas + iof;
    }

    const tabela = tabelaAmortizacao(principal, taxaMensal, n, p.sistema);
    const parcelas = tabela.map((l) => l.parcela);
    const totalParcelas = parcelas.reduce((a, b) => a + b, 0);
    const totalJuros = tabela.reduce((a, l) => a + l.juros, 0);
    const primeiraParcela = parcelas[0];
    const ultimaParcela = parcelas[parcelas.length - 1];
    const maiorParcela = Math.max.apply(null, parcelas);

    // CET: o cliente efetivamente recebe o valor do bem financiado menos
    // o que pagou de custos à vista, e devolve as parcelas.
    const cetMensal = taxaInterna(valorLiquido - custosAVista, parcelas);
    const cetAnual = mensalParaAnual(cetMensal);

    // Análise de renda
    const rendaTotal = p.rendaMensal + p.rendaComplementar;
    const parcelaMaximaPermitida = rendaTotal * p.limiteComprometimento;
    const comprometimento = maiorParcela / rendaTotal;
    const rendaMinimaNecessaria = maiorParcela / p.limiteComprometimento;
    const valorMaximoFinanciavel = principalMaximoPorRenda(
      parcelaMaximaPermitida,
      taxaMensal,
      n,
      p.sistema
    );

    const entradaPct = p.entrada / p.valorBem;
    const entradaMinima = p.valorBem * p.entradaMinimaPct;

    const pendencias = [];
    if (comprometimento > p.limiteComprometimento) {
      pendencias.push(
        `A maior parcela compromete ${(comprometimento * 100).toFixed(1)}% da renda ` +
          `(limite ${(p.limiteComprometimento * 100).toFixed(0)}%).`
      );
    }
    if (entradaPct + 1e-9 < p.entradaMinimaPct) {
      pendencias.push(
        `Entrada de ${(entradaPct * 100).toFixed(1)}% abaixo do mínimo de ` +
          `${(p.entradaMinimaPct * 100).toFixed(0)}%.`
      );
    }

    return {
      parametros: p,
      taxaMensal,
      taxaAnual: mensalParaAnual(taxaMensal),
      valorLiquido,
      tarifas,
      iof,
      custosAVista,
      valorFinanciado: principal,
      primeiraParcela,
      ultimaParcela,
      maiorParcela,
      totalParcelas,
      totalJuros,
      custoTotal: p.entrada + custosAVista + totalParcelas,
      cetMensal,
      cetAnual,
      renda: {
        rendaTotal,
        parcelaMaximaPermitida,
        comprometimento,
        rendaMinimaNecessaria,
        valorMaximoFinanciavel,
      },
      entradaPct,
      entradaMinima,
      aprovado: pendencias.length === 0,
      pendencias,
      tabela,
    };
  }

  return {
    SISTEMAS,
    IOF_DIARIO_PF,
    IOF_ADICIONAL,
    anualParaMensal,
    mensalParaAnual,
    parcelaPrice,
    tabelaAmortizacao,
    calcularIOF,
    taxaInterna,
    principalMaximoPorRenda,
    validar,
    simular,
  };
});
