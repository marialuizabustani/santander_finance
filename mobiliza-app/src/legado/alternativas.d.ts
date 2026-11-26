/* Tipos mínimos do motor original de leasing e assinatura (alternativas.js). */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const Alternativas: {
  ASSINATURA_PCT_MES_ESTIMADA: number;
  simularLeasing(entrada: Record<string, unknown>): any;
  compararLeasingComFinanciamento(entrada: Record<string, unknown>): { leasing: any; financiamento: any; diferenca: number };
  leasingPorPrazos(entrada: Record<string, unknown>, prazos?: number[]): any[];
  simularAssinatura(entrada: Record<string, unknown>): any;
};
export default Alternativas;
