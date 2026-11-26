import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import Simulador from './simulador.js';
import Alternativas from './alternativas.js';

// Motores originais (CommonJS) do simulador na raiz do repositório
const require = createRequire(import.meta.url);
const original = require('../../../src/simulador.js');
const originalAlt = require('../../../src/alternativas.js');

const fin = { valorBem: 80000, entrada: 20000, prazoMeses: 48, taxa: 0.0179, sistema: 'PRICE', rendaMensal: 7000, tarifaCadastro: 850, registroContrato: 250 };

describe('simulador original dentro do Mobiliza', () => {
  it('financiamento Price e SAC: resultados idênticos ao original', () => {
    for (const sistema of ['PRICE', 'SAC']) {
      const a = Simulador.simular({ ...fin, sistema });
      const b = original.simular({ ...fin, sistema });
      expect(a.primeiraParcela).toBe(b.primeiraParcela);
      expect(a.custoTotal).toBe(b.custoTotal);
      expect(a.cetAnual).toBe(b.cetAnual);
      expect(a.tabela).toEqual(b.tabela);
    }
    expect(Simulador.tabelaPorPrazos(fin)).toEqual(original.tabelaPorPrazos(fin));
  });
  it('valores conhecidos do site original (48x de R$ 1.969,58)', () => {
    expect(Simulador.simular(fin).primeiraParcela).toBeCloseTo(1969.58, 2);
  });
  it('leasing e assinatura: resultados idênticos ao original', () => {
    const l = { valorBem: 80000, entrada: 16000, prazoMeses: 36, taxa: 0.0159, residualPct: 0.3, rendaMensal: 7000, tarifaCadastro: 850, registroContrato: 250 };
    expect(Alternativas.compararLeasingComFinanciamento(l).diferenca).toBe(originalAlt.compararLeasingComFinanciamento(l).diferenca);
    expect(Alternativas.leasingPorPrazos(l)).toEqual(originalAlt.leasingPorPrazos(l));
    const a = { valorBem: 80000, prazoMeses: 24, rendaMensal: 7000 };
    expect(Alternativas.simularAssinatura(a).comparacao.economiaAssinando).toBe(originalAlt.simularAssinatura(a).comparacao.economiaAssinando);
  });
});
