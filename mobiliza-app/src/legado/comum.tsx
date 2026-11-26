import { ChevronDown, Download } from 'lucide-react';
import type { ReactNode } from 'react';

/** Seção recolhível (mesma organização do simulador original). */
export function Secao({ titulo, resumo, aberta = false, children }: { titulo: string; resumo: string; aberta?: boolean; children: ReactNode }) {
  return (
    <details className="group border-b border-tinta-linha" open={aberta}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-1 py-4 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-semibold group-hover:text-marca">{titulo}</span>
          <span className="block text-sm text-tinta-suave">{resumo}</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-marca transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="px-1 pb-5">{children}</div>
    </details>
  );
}

/** Baixa linhas como CSV (separador ";", abre direto no Excel), como no simulador original. */
export function baixarCSV(nomeArquivo: string, linhas: (string | number)[][]) {
  const csv = '﻿' + linhas.map((r) => r.join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function BotaoCSV({ aoClicar }: { aoClicar: () => void }) {
  return (
    <button type="button" onClick={aoClicar} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-marca underline underline-offset-2">
      <Download className="h-4 w-4" aria-hidden /> Baixar esta tabela
    </button>
  );
}

/** Selo discreto "cabe" / "acima do ideal" usado nas tabelas por prazo. */
export function SeloCabe({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="chip ml-2 bg-ok-fundo text-ok">✓ cabe</span>
  ) : (
    <span className="chip ml-2 bg-tinta-fundo text-tinta-suave">acima do ideal</span>
  );
}

export const n2 = (v: number) => v.toFixed(2).replace('.', ',');

export function anos(meses: number): string {
  const a = Math.floor(meses / 12);
  const m = meses % 12;
  const p: string[] = [];
  if (a) p.push(`${a} ${a === 1 ? 'ano' : 'anos'}`);
  if (m) p.push(`${m} ${m === 1 ? 'mês' : 'meses'}`);
  return p.join(' e ');
}
