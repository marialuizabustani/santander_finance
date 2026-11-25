/**
 * Persistência local OPCIONAL. Só grava se a pessoa ativar "Lembrar meus dados neste aparelho".
 * Os dados ficam apenas no navegador (localStorage) e podem ser apagados a qualquer momento.
 */
const CHAVE = 'santander-mobiliza:sessao:v1';
const CHAVE_CONSENTIMENTO = 'santander-mobiliza:lembrar';

export function lembrarAtivado(): boolean {
  try {
    return localStorage.getItem(CHAVE_CONSENTIMENTO) === 'sim';
  } catch {
    return false;
  }
}

export function definirLembrar(ativo: boolean): void {
  try {
    if (ativo) localStorage.setItem(CHAVE_CONSENTIMENTO, 'sim');
    else {
      localStorage.removeItem(CHAVE_CONSENTIMENTO);
      localStorage.removeItem(CHAVE);
    }
  } catch {
    /* navegador sem armazenamento: segue só na sessão */
  }
}

export function salvar<T>(dados: T): void {
  if (!lembrarAtivado()) return;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    /* ignora */
  }
}

export function carregar<T>(): T | null {
  if (!lembrarAtivado()) return null;
  try {
    const t = localStorage.getItem(CHAVE);
    return t ? (JSON.parse(t) as T) : null;
  } catch {
    return null;
  }
}

export function apagarTudo(): void {
  try {
    localStorage.removeItem(CHAVE);
    localStorage.removeItem(CHAVE_CONSENTIMENTO);
  } catch {
    /* ignora */
  }
}
