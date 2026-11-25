import type { DadosSessao, Derivados } from '../state/estado';

export interface Mensagem {
  id: string;
  autor: 'pessoa' | 'assistente';
  texto: string;
  /** Números citados na resposta e de onde vieram (transparência). */
  fontes?: string[];
  /** Ações sugeridas (ex.: abrir uma tela). */
  acoes?: { rotulo: string; pagina: string }[];
}

/** Contexto estruturado entregue ao assistente: SÓ dados do motor de cálculo. */
export interface ContextoAssistente {
  dados: DadosSessao;
  derivados: Derivados;
  /** Recalcula os resultados com dados alterados (usado em perguntas "e se..."). */
  recalcular: (d: DadosSessao) => Derivados;
}

/**
 * Interface comum dos provedores de resposta.
 * - ProvedorRegras: demonstrativo, sem rede e sem custo (padrão).
 * - ProvedorModeloIA: ponto de integração futuro com um modelo de IA real (ver llm.ts).
 */
export interface ProvedorAssistente {
  nome: string;
  responder(pergunta: string, contexto: ContextoAssistente): Promise<Omit<Mensagem, 'id' | 'autor'>>;
}
