/** Fórmulas financeiras puras (taxas em decimal: 1,79% a.m. = 0.0179). */

/** Parcela fixa (tabela Price). */
export function parcelaPrice(principal: number, taxaMes: number, prazoMeses: number): number {
  if (prazoMeses <= 0) return 0;
  if (taxaMes === 0) return principal / prazoMeses;
  return (principal * taxaMes) / (1 - Math.pow(1 + taxaMes, -prazoMeses));
}

/** Saldo devedor após `pagas` parcelas da tabela Price. */
export function saldoDevedorPrice(principal: number, taxaMes: number, prazoMeses: number, pagas: number): number {
  if (pagas >= prazoMeses) return 0;
  const pmt = parcelaPrice(principal, taxaMes, prazoMeses);
  if (taxaMes === 0) return principal - pmt * pagas;
  const f = Math.pow(1 + taxaMes, pagas);
  return principal * f - pmt * ((f - 1) / taxaMes);
}

/** Parcela de leasing com valor residual pago no final (parcela "balão"). */
export function parcelaLeasing(valorArrendado: number, residual: number, taxaMes: number, prazoMeses: number): number {
  if (prazoMeses <= 0) return 0;
  if (taxaMes === 0) return (valorArrendado - residual) / prazoMeses;
  const vpResidual = residual / Math.pow(1 + taxaMes, prazoMeses);
  return ((valorArrendado - vpResidual) * taxaMes) / (1 - Math.pow(1 + taxaMes, -prazoMeses));
}

/** Valor de mercado estimado após `meses`, com depreciação anual composta. */
export function valorResidual(preco: number, depreciacaoPctAno: number, meses: number): number {
  return preco * Math.pow(1 - depreciacaoPctAno, meses / 12);
}

/** Converte taxa mensal em anual equivalente. */
export function taxaAnual(taxaMes: number): number {
  return Math.pow(1 + taxaMes, 12) - 1;
}
