import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PERFIL_DEMO, PERFIL_VAZIO, ROTINA_DEMO, ROTINA_VAZIA } from '../data/cenarioDemo';
import { PREMISSAS_PADRAO } from '../data/premissas';
import { VEICULOS, veiculoPorId } from '../data/veiculos';
import {
  aplicarBonificacao,
  analisarEletrico,
  SEM_RELACIONAMENTO,
  type Relacionamento,
  calcularQuilometragem,
  compararTudo,
  diagnosticar,
  recomendar,
  type Adequacao,
  type CompatibilidadeEletrico,
  type CondicoesUso,
  type Diagnostico,
  type Modalidade,
  type Perfil,
  type Premissas,
  type Recomendacao,
  type ResultadoOpcao,
  type ResumoQuilometragem,
  type Rotina,
} from '../engine';
import { carregar, salvar } from '../services/persistencia';
import type { ModoRoteamento, RotaCalculada } from '../services/roteamento';

/** Dados que a pessoa informa (e que podem ser lembrados no aparelho, se ela quiser). */
export interface DadosSessao {
  perfil: Perfil;
  rotina: Rotina;
  premissas: Premissas;
  veiculosComparados: string[];
  escolha: { veiculoId: string; modalidade: Modalidade };
  condicoesEletrico: CondicoesUso;
  veiculoEletricoId: string;
  veiculoReferenciaCombustaoId: string;
  modoRoteamento: ModoRoteamento;
  cenarioDemoCarregado: boolean;
  relacionamento: Relacionamento;
  /** Etapa do roteiro de demonstração ao vivo (null = desligado) */
  roteiroDemo: number | null;
}

const INICIAL: DadosSessao = {
  perfil: PERFIL_VAZIO,
  rotina: ROTINA_VAZIA,
  premissas: PREMISSAS_PADRAO,
  veiculosComparados: ['eletrico-compacto', 'hibrido-sedan', 'combustao-hatch'],
  escolha: { veiculoId: 'combustao-hatch', modalidade: 'financiamento' },
  condicoesEletrico: { fracaoRodovia: 0.2, arCondicionado: true },
  veiculoEletricoId: 'eletrico-compacto',
  veiculoReferenciaCombustaoId: 'combustao-hatch',
  modoRoteamento: 'demonstrativo',
  cenarioDemoCarregado: false,
  relacionamento: SEM_RELACIONAMENTO,
  roteiroDemo: null,
};

/** Resultados derivados: sempre recalculados a partir dos dados (nunca digitados). */
export interface Derivados {
  /** premissas com a taxa bonificada pelo relacionamento já aplicada */
  premissasEfetivas: Premissas;
  km: ResumoQuilometragem;
  diagnostico: Diagnostico;
  opcoes: ResultadoOpcao[];
  eletrico: Record<string, CompatibilidadeEletrico>;
  recomendacao: Recomendacao;
  escolhida: ResultadoOpcao;
}

interface ValorContexto {
  dados: DadosSessao;
  derivados: Derivados;
  rotas: Record<string, RotaCalculada>;
  definirRotas: (r: Record<string, RotaCalculada>) => void;
  atualizar: (f: (d: DadosSessao) => DadosSessao) => void;
  carregarCenarioDemo: () => void;
  iniciarDemonstracao: () => void;
  limparSessao: () => void;
}

const Contexto = createContext<ValorContexto | null>(null);

export function calcularDerivados(d: DadosSessao, rotas: Record<string, RotaCalculada>): Derivados {
  const rotasReais: Record<string, number> = {};
  for (const [id, r] of Object.entries(rotas)) if (r.origem === 'rota-real') rotasReais[id] = r.km;
  const premissasEfetivas = aplicarBonificacao(d.premissas, d.relacionamento ?? SEM_RELACIONAMENTO);
  const km = calcularQuilometragem(d.rotina, d.premissas, rotasReais);
  const ctx = { kmMensal: km.kmMensal, recargaEmCasa: d.rotina.recargaEmCasa, premissas: premissasEfetivas, perfil: d.perfil };
  const veiculos = VEICULOS.filter((v) => d.veiculosComparados.includes(v.id));
  const opcoes = compararTudo(veiculos, ctx);
  const referencia = veiculoPorId(d.veiculoReferenciaCombustaoId);
  const eletrico: Record<string, CompatibilidadeEletrico> = {};
  const adequacao: Record<string, Adequacao> = {};
  for (const v of VEICULOS.filter((x) => x.tecnologia === 'eletrico')) {
    eletrico[v.id] = analisarEletrico(v, km, d.rotina.viagens, d.rotina.recargaEmCasa, d.condicoesEletrico, d.premissas, referencia);
    adequacao[v.id] = eletrico[v.id].adequacao;
  }
  const escolhida =
    opcoes.find((o) => o.veiculoId === d.escolha.veiculoId && o.modalidade === d.escolha.modalidade) ??
    compararTudo([veiculoPorId(d.escolha.veiculoId)], ctx, [d.escolha.modalidade])[0];
  return { premissasEfetivas, km, diagnostico: diagnosticar(km, d.rotina), opcoes, eletrico, recomendacao: recomendar(opcoes, adequacao), escolhida };
}

export function ProvedorEstado({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<DadosSessao>(() => {
    const salvo = carregar<DadosSessao>();
    return salvo ? { ...INICIAL, ...salvo, premissas: { ...PREMISSAS_PADRAO, ...salvo.premissas } } : INICIAL;
  });
  const [rotas, definirRotas] = useState<Record<string, RotaCalculada>>({});

  useEffect(() => {
    salvar(dados);
  }, [dados]);

  const atualizar = useCallback((f: (d: DadosSessao) => DadosSessao) => setDados((d) => f(d)), []);
  const carregarCenarioDemo = useCallback(() => {
    definirRotas({});
    setDados((d) => ({
      ...d,
      perfil: PERFIL_DEMO,
      rotina: ROTINA_DEMO,
      premissas: PREMISSAS_PADRAO,
      relacionamento: SEM_RELACIONAMENTO,
      cenarioDemoCarregado: true,
      escolha: { veiculoId: 'eletrico-compacto', modalidade: 'financiamento' },
    }));
  }, []);
  const iniciarDemonstracao = useCallback(() => {
    definirRotas({});
    setDados((d) => ({
      ...d,
      perfil: PERFIL_DEMO,
      rotina: ROTINA_DEMO,
      premissas: PREMISSAS_PADRAO,
      relacionamento: SEM_RELACIONAMENTO,
      cenarioDemoCarregado: true,
      escolha: { veiculoId: 'eletrico-compacto', modalidade: 'financiamento' },
      roteiroDemo: 0,
    }));
  }, []);
  const limparSessao = useCallback(() => {
    definirRotas({});
    setDados(INICIAL);
  }, []);

  const derivados = useMemo(() => calcularDerivados(dados, rotas), [dados, rotas]);
  const valor = useMemo(
    () => ({ dados, derivados, rotas, definirRotas, atualizar, carregarCenarioDemo, iniciarDemonstracao, limparSessao }),
    [dados, derivados, rotas, atualizar, carregarCenarioDemo, iniciarDemonstracao, limparSessao],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useEstado(): ValorContexto {
  const c = useContext(Contexto);
  if (!c) throw new Error('useEstado fora do ProvedorEstado');
  return c;
}
