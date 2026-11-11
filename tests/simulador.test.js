const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/simulador.js');

const perto = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

const base = {
  valorBem: 100000,
  entrada: 20000,
  prazoMeses: 12,
  taxa: 0.01,
  sistema: 'PRICE',
  rendaMensal: 10000,
  cobrarIOF: false,
};

test('Price: parcela fixa conhecida', () => {
  // 80.000 a 1% a.m. em 12x => 7.107,90
  const r = S.simular(base);
  perto(r.primeiraParcela, 7107.90);
  perto(r.ultimaParcela, 7107.90);
  perto(r.tabela.at(-1).saldo, 0);
  perto(r.cetMensal, 0.01, 1e-6);
});

test('SAC: amortização constante e parcelas decrescentes', () => {
  const r = S.simular({ ...base, sistema: 'SAC' });
  perto(r.tabela[0].amortizacao, 80000 / 12);
  perto(r.primeiraParcela, 80000 / 12 + 800);
  assert.ok(r.ultimaParcela < r.primeiraParcela);
  perto(r.tabela.at(-1).saldo, 0);
});

test('SAC paga menos juros que Price', () => {
  const price = S.simular(base);
  const sac = S.simular({ ...base, sistema: 'SAC' });
  assert.ok(sac.totalJuros < price.totalJuros);
});

test('taxa anual é convertida para mensal equivalente', () => {
  const r = S.simular({ ...base, taxa: 0.126825, taxaPeriodo: 'anual' });
  perto(r.taxaMensal, 0.01, 1e-6);
});

test('taxa zero divide o principal', () => {
  const r = S.simular({ ...base, taxa: 0 });
  perto(r.primeiraParcela, 80000 / 12);
  perto(r.totalJuros, 0);
});

test('IOF financiado entra no principal e eleva o CET', () => {
  const r = S.simular({ ...base, cobrarIOF: true, tarifaCadastro: 1000 });
  perto(r.valorFinanciado, 80000 + 1000 + r.iof);
  assert.ok(r.iof > 0);
  assert.ok(r.cetMensal > r.taxaMensal);
  // IOF máximo PF: 0,38% + 0,0082% * 365 ≈ 3,37% do principal
  assert.ok(r.iof / r.valorFinanciado < 0.0338);
});

test('custos à vista não alteram o principal mas elevam o CET', () => {
  const r = S.simular({ ...base, cobrarIOF: true, tarifaCadastro: 1000, financiarCustos: false });
  perto(r.valorFinanciado, 80000);
  perto(r.custosAVista, 1000 + r.iof);
  assert.ok(r.cetMensal > r.taxaMensal);
});

test('análise de renda: reprova quando parcela passa do limite', () => {
  const r = S.simular({ ...base, rendaMensal: 5000 });
  assert.equal(r.aprovado, false);
  perto(r.renda.rendaMinimaNecessaria, r.maiorParcela / 0.3);
  assert.ok(r.pendencias[0].includes('da sua renda'));
});

test('renda complementar é somada', () => {
  const r = S.simular({ ...base, rendaMensal: 15000, rendaComplementar: 10000 });
  perto(r.renda.rendaTotal, 25000);
  assert.equal(r.aprovado, true);
});

test('valor máximo financiável gera parcela igual ao limite', () => {
  for (const sistema of ['PRICE', 'SAC']) {
    const r = S.simular({ ...base, sistema });
    const pmax = r.renda.valorMaximoFinanciavel;
    const tab = S.tabelaAmortizacao(pmax, r.taxaMensal, 12, sistema);
    perto(tab[0].parcela, r.renda.parcelaMaximaPermitida);
  }
});

test('entrada abaixo do mínimo gera pendência', () => {
  const r = S.simular({ ...base, entrada: 5000, rendaMensal: 50000 });
  assert.equal(r.aprovado, false);
  assert.ok(r.pendencias.some((p) => p.includes('entrada')));
});

test('validação de entradas', () => {
  assert.throws(() => S.simular({ ...base, entrada: 200000 }), /Entrada deve ser menor/);
  assert.throws(() => S.simular({ ...base, sistema: 'XYZ' }), /PRICE ou SAC/);
  assert.throws(() => S.simular({ ...base, rendaMensal: 0 }), /Renda/);
  assert.throws(() => S.simular({ ...base, prazoMeses: 1.5 }), /Prazo/);
});

test('tabela de valores por prazo', () => {
  const linhas = S.tabelaPorPrazos({ ...base, prazoMeses: 30 });
  assert.deepEqual(linhas.map((l) => l.prazoMeses), [12, 18, 24, 30, 36, 48, 60, 72]);
  const l12 = linhas[0];
  perto(l12.primeiraParcela, 7107.90);
  perto(l12.totalJuros, 7107.90 * 12 - 80000, 0.1);
  perto(l12.valorTotal, 20000 + 7107.90 * 12, 0.1);
  // prazos maiores: mensalidade menor, juros e valor total maiores
  for (let i = 1; i < linhas.length; i++) {
    assert.ok(linhas[i].primeiraParcela < linhas[i - 1].primeiraParcela);
    assert.ok(linhas[i].totalJuros > linhas[i - 1].totalJuros);
    assert.ok(linhas[i].valorTotal > linhas[i - 1].valorTotal);
  }
});
