import { describe, expect, it } from 'vitest';
import { PERFIL_DEMO, ROTINA_DEMO } from '../data/cenarioDemo';
import { PREMISSAS_PADRAO } from '../data/premissas';
import { SEM_RELACIONAMENTO } from '../engine';
import { calcularDerivados, type DadosSessao } from '../state/estado';
import { identificarIntencao, ProvedorRegras } from './regras';

const dados: DadosSessao = {
  perfil: PERFIL_DEMO,
  rotina: ROTINA_DEMO,
  premissas: PREMISSAS_PADRAO,
  veiculosComparados: ['eletrico-compacto', 'hibrido-sedan', 'combustao-hatch'],
  escolha: { veiculoId: 'eletrico-compacto', modalidade: 'financiamento' },
  condicoesEletrico: { fracaoRodovia: 0.2, arCondicionado: true },
  veiculoEletricoId: 'eletrico-compacto',
  veiculoReferenciaCombustaoId: 'combustao-hatch',
  modoRoteamento: 'demonstrativo',
  cenarioDemoCarregado: true,
  relacionamento: SEM_RELACIONAMENTO,
  roteiroDemo: null,
};
const ctx = { dados, derivados: calcularDerivados(dados, {}), recalcular: (d: DadosSessao) => calcularDerivados(d, {}) };

describe('Mobiliza IA por regras', () => {
  it('identifica as novas intenções', () => {
    expect(identificarIntencao('Como abrir conta e trazer o salário reduz a taxa?')).toBe('taxa-bonificada');
    expect(identificarIntencao('Quanto pago de IPVA, seguro e manutenção?')).toBe('custos-extra');
    expect(identificarIntencao('Compare elétrico, combustão e assinatura lado a lado')).toBe('tres-frentes');
    expect(identificarIntencao('Vale mais a pena financiar ou assinar?')).toBe('financiar-ou-assinar');
  });
  it('taxa bonificada: cita taxa menor e economia', async () => {
    const r = await ProvedorRegras.responder('Como abrir conta e trazer o salário reduz a taxa?', ctx);
    expect(r.texto).toContain('1,79%');
    expect(r.texto).toContain('1,56%');
    expect(r.texto).toMatch(/a menos por mês/);
  });
  it('lado a lado e custos extras respondem com números', async () => {
    const a = await ProvedorRegras.responder('Compare elétrico, combustão e assinatura lado a lado', ctx);
    expect(a.texto).toContain('Elétrico por assinatura');
    expect(a.texto.split('\n').length).toBeGreaterThan(3);
    const b = await ProvedorRegras.responder('Quanto pago de IPVA, seguro e manutenção?', ctx);
    expect(b.texto).toContain('incluídos na mensalidade');
  });
});
