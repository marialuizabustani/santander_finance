import type { DadosSessao, Derivados } from '../state/estado';

export interface Mensagem {
  id: string;
  autor: 'pessoa' | 'assistente';
  texto: string;
  /** Números citados na resposta e de onde vieram (transparência). */
  fontes?: string[];
  /** Ações sugeridas (ex.: abrir uma tela). */
  acoes?: { rotulo: string; pagina: string }[];
  /** quem respondeu: IA generativa (LLM) ou regras locais */
  origem?: 'ia' | 'regras';
  modelo?: string | null;
}

/** Contexto estruturado entregue ao assistente: SÓ dados do motor de cálculo. */
export interface ContextoAssistente {
  dados: DadosSessao;
  derivados: Derivados;
  /** Recalcula os resultados com dados alterados (usado em perguntas "e se..."). */
  recalcular: (d: DadosSessao) => Derivados;
}

/** Interface do provedor de regras locais (sem rede). A IA generativa fica em llm.ts. */
export interface ProvedorAssistente {
  nome: string;
  responder(pergunta: string, contexto: ContextoAssistente): Promise<Omit<Mensagem, 'id' | 'autor'>>;
}
