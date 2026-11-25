import { describe, expect, it } from 'vitest';
import { PREMISSAS_PADRAO as P } from '../data/premissas';
import { ROTINA_DEMO } from '../data/cenarioDemo';
import { veiculoPorId, VEICULOS } from '../data/veiculos';
import {
  analisarEletrico,
  calcularOpcao,
  calcularQuilometragem,
  classificarUso,
  compararTudo,
  energiaMensal,
  parcelaLeasing,
  parcelaPrice,
  recomendar,
  saldoDevedorPrice,
  somaComposicao,
  valorResidual,
} from './index';
import type { Rotina } from './tipos';

const perto = (a: number, b: number, tol = 0.01) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);

describe('quilometragem', () => {
  it('exemplo do enunciado: 45 km/dia em 22 dias = 990 km/mês', () => {
    const rotina: Rotina = {
      locais: [],
      trajetos: [{ id: 't', nome: 'Trabalho', paradas: [], dias: [1, 2, 3, 4, 5], kmManual: 45 }],
      viagens: [],
      kmExtrasMes: 0,
      recargaEmCasa: false,
    };
    const r = calcularQuilometragem(rotina, P);
    perto(r.trajetos[0].diasNoMes, 22);
    perto(r.kmMensal, 990);
    expect(r.trajetos[0].origem).toBe('manual');
  });

  it('cenário demonstrativo tem ~42 km por dia', () => {
    const r = calcularQuilometragem(ROTINA_DEMO, P);
    const porDia = r.trajetos.reduce((s, t) => s + t.kmPorDia, 0);
    expect(porDia).toBeGreaterThan(40);
    expect(porDia).toBeLessThan(44);
    perto(r.maiorDiaKm, porDia);
    // viagens: (420×6 + 160×4)/12
    perto(r.kmViagensMes, (420 * 6 + 160 * 4) / 12);
    perto(r.kmMensal, r.kmRecorrenteMes + r.kmViagensMes + 150);
  });

  it('rota real tem prioridade sobre a estimativa, e o valor manual sobre ambas', () => {
    const r = calcularQuilometragem(ROTINA_DEMO, P, { ida: 25 });
    expect(r.trajetos[0].origem).toBe('rota-real');
    perto(r.trajetos[0].kmPorDia, 25);
    expect(r.trajetos[1].origem).toBe('estimativa');
  });
});

describe('finanças', () => {
  it('parcela Price conhecida: 80.000 a 1% a.m. em 12x = 7.107,90', () => perto(parcelaPrice(80000, 0.01, 12), 7107.9));
  it('saldo devedor zera no fim e é coerente no meio', () => {
    perto(saldoDevedorPrice(80000, 0.01, 12, 12), 0);
    const s6 = saldoDevedorPrice(80000, 0.01, 12, 6);
    let saldo = 80000;
    for (let i = 0; i < 6; i++) saldo = saldo * 1.01 - parcelaPrice(80000, 0.01, 12);
    perto(s6, saldo);
  });
  it('leasing: após n parcelas sobra exatamente o valor final', () => {
    const pmt = parcelaLeasing(100000, 30000, 0.015, 36);
    let saldo = 100000;
    for (let i = 0; i < 36; i++) saldo = saldo * 1.015 - pmt;
    perto(saldo, 30000, 0.05);
  });
  it('valor residual: 10% ao ano por 2 anos', () => perto(valorResidual(100000, 0.1, 24), 81000));
});

describe('custos e comparação', () => {
  const ctx = { kmMensal: 1000, recargaEmCasa: true, premissas: P, perfil: { orcamentoMensal: 4000, valorDisponivel: 40000 } };

  it('energia: combustão 1000 km a 11 km/l e R$ 6,20', () => perto(energiaMensal(veiculoPorId('combustao-hatch'), 1000, true, P), (1000 / 11) * 6.2));
  it('energia: elétrico com recarga em casa é mais barata', () => {
    const ev = veiculoPorId('eletrico-compacto');
    expect(energiaMensal(ev, 1000, true, P)).toBeLessThan(energiaMensal(ev, 1000, false, P));
  });

  it('a composição sempre soma o custo líquido', () => {
    for (const o of compararTudo(VEICULOS, ctx)) perto(somaComposicao(o.composicao), o.custoLiquido, 0.5);
  });

  it('todas as opções usam o mesmo horizonte', () => {
    const hs = new Set(compararTudo(VEICULOS, ctx).map((o) => o.horizonteMeses));
    expect([...hs]).toEqual([36]);
  });

  it('assinatura não deixa patrimônio e cobra excedente de km', () => {
    const o = calcularOpcao(veiculoPorId('combustao-hatch'), 'assinatura', { ...ctx, kmMensal: 2000 });
    expect(o.patrimonioFinal).toBe(0);
    perto(o.composicao.excedenteKm, (2000 - 1500) * 0.6 * 36);
  });

  it('mais quilômetros aumentam o custo de todas as opções', () => {
    const a = compararTudo(VEICULOS, ctx);
    const b = compararTudo(VEICULOS, { ...ctx, kmMensal: 2000 });
    a.forEach((o, i) => expect(b[i].custoLiquido).toBeGreaterThan(o.custoLiquido));
  });

  it('orçamento: marca o que não cabe', () => {
    const o = calcularOpcao(veiculoPorId('eletrico-suv'), 'financiamento', { ...ctx, perfil: { orcamentoMensal: 1000, valorDisponivel: 100000 } });
    expect(o.cabeNoOrcamento).toBe(false);
  });
});

describe('elétrico e recomendação', () => {
  const km = calcularQuilometragem(ROTINA_DEMO, P);
  const ev = veiculoPorId('eletrico-compacto');
  const comb = veiculoPorId('combustao-hatch');

  it('autonomia e adequação ao cenário demonstrativo', () => {
    const a = analisarEletrico(ev, km, ROTINA_DEMO.viagens, true, { fracaoRodovia: 0, arCondicionado: false }, P, comb);
    perto(a.autonomiaEstimadaKm, ((44 * 0.9) / 14) * 100);
    expect(a.adequacao).not.toBe('inadequado');
    expect(a.economiaMes).toBeGreaterThan(0);
  });

  it('sem recarga em casa, o elétrico pede atenção', () => {
    const a = analisarEletrico(ev, km, [], false, { fracaoRodovia: 0, arCondicionado: false }, P, comb);
    expect(a.adequacao).not.toBe('adequado');
  });

  it('a recomendação respeita o orçamento e não é aleatória', () => {
    const ctx = { kmMensal: km.kmMensal, recargaEmCasa: true, premissas: P, perfil: { orcamentoMensal: 3800, valorDisponivel: 40000 } };
    const ops = compararTudo(VEICULOS, ctx);
    const r1 = recomendar(ops, {});
    const r2 = recomendar(ops, {});
    expect(r1.melhor).toEqual(r2.melhor);
    if (!r1.nenhumaCabe) expect(r1.melhor!.cabeNoOrcamento).toBe(true);
  });

  it('faixas de uso', () => {
    expect(classificarUso(500)).toBe('baixo');
    expect(classificarUso(1200)).toBe('medio');
    expect(classificarUso(2500)).toBe('alto');
  });
});

import { aplicarBonificacao, bonusTaxa, custosMensais, ratingRelacionamento, SEM_RELACIONAMENTO } from './index';

describe('manutenção preventiva e IPVA', () => {
  const ctx = { kmMensal: 1000, recargaEmCasa: true, premissas: P };
  it('manutenção = desgaste por km + revisão preventiva anual', () => {
    const o = calcularOpcao(veiculoPorId('combustao-hatch'), 'financiamento', ctx);
    perto(o.composicao.manutencao, (1000 * 0.12 + 1200 / 12) * 36, 0.5);
  });
  it('elétrico tem manutenção menor que combustão', () => {
    const ev = calcularOpcao(veiculoPorId('eletrico-compacto'), 'avista', ctx);
    const cb = calcularOpcao(veiculoPorId('combustao-hatch'), 'avista', ctx);
    expect(ev.composicao.manutencao).toBeLessThan(cb.composicao.manutencao);
  });
  it('IPVA isento zera o imposto do elétrico', () => {
    const isento = { ...P, ipvaPctAno: { ...P.ipvaPctAno, eletrico: 0 } };
    expect(calcularOpcao(veiculoPorId('eletrico-compacto'), 'avista', { ...ctx, premissas: isento }).composicao.ipva).toBe(0);
  });
  it('assinatura: seguro, IPVA e manutenção ficam dentro da mensalidade', () => {
    const m = custosMensais(calcularOpcao(veiculoPorId('combustao-hatch'), 'assinatura', ctx));
    expect(m.seguro + m.ipva + m.manutencao).toBe(0);
  });
});

describe('relacionamento e taxa bonificada', () => {
  const tudo = { abrirConta: true, portabilidadeSalario: true, debitoAutomatico: true, seguroSantander: true };
  it('sem relacionamento não há bônus', () => expect(bonusTaxa(SEM_RELACIONAMENTO, P)).toBe(0));
  it('portabilidade de salário só vale com conta aberta', () => {
    expect(bonusTaxa({ ...SEM_RELACIONAMENTO, portabilidadeSalario: true }, P)).toBe(0);
    perto(bonusTaxa({ ...SEM_RELACIONAMENTO, abrirConta: true, portabilidadeSalario: true }, P), 0.002, 1e-9);
  });
  it('taxa bonificada reduz a parcela do financiamento', () => {
    const ctx = { kmMensal: 1000, recargaEmCasa: true, premissas: P };
    const base = calcularOpcao(veiculoPorId('combustao-hatch'), 'financiamento', ctx);
    const bon = calcularOpcao(veiculoPorId('combustao-hatch'), 'financiamento', { ...ctx, premissas: aplicarBonificacao(P, tudo) });
    perto(aplicarBonificacao(P, tudo).financiamento.taxaMes, 0.0179 - 0.0025, 1e-9);
    expect(bon.parcelaMensal).toBeLessThan(base.parcelaMensal);
  });
  it('rating sobe com o relacionamento', () => {
    expect(ratingRelacionamento(SEM_RELACIONAMENTO).nivel).toBe('Inicial');
    expect(ratingRelacionamento(tudo).pontos).toBe(100);
    expect(ratingRelacionamento(tudo).nivel).toBe('Excelente');
  });
});
