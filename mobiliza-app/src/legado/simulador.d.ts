/* Tipos mínimos do motor original de financiamento (simulador.js). */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const Simulador: {
  PRAZOS_PADRAO: number[];
  simular(entrada: Record<string, unknown>): any;
  tabelaPorPrazos(entrada: Record<string, unknown>, prazos?: number[]): any[];
  tabelaAmortizacao(principal: number, taxa: number, prazo: number, sistema: 'PRICE' | 'SAC'): any[];
  mensalParaAnual(taxaMensal: number): number;
};
export default Simulador;
