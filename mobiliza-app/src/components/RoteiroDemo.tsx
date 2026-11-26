import { useEffect, useState } from 'react';
import { Minus, Play, X } from 'lucide-react';
import { SEM_RELACIONAMENTO } from '../engine';
import { useEstado, type DadosSessao } from '../state/estado';
import { irPara, type IdPagina } from '../state/rotas';

interface Passo {
  pagina: IdPagina;
  titulo: string;
  fala: string;
  /** ajuste opcional aplicado ao chegar no passo */
  ajuste?: (d: DadosSessao) => DadosSessao;
}

/** Roteiro da apresentação ao vivo (substitui os fluxogramas estáticos pela navegação real). */
export const ROTEIRO: Passo[] = [
  { pagina: 'inicio', titulo: 'Abertura', fala: 'Apresente a proposta: a rotina real do cliente orienta a escolha entre elétrico, combustão, assinatura ou leasing, com números claros para a Geração X.' },
  { pagina: 'rotina', titulo: 'Rotina real', fala: 'Cláudia, 48 anos: casa → escola do filho → trabalho → supermercado. São 42 km por dia em 22 dias, mais viagens: 1.334 km por mês, calculados pelo mapa.' },
  { pagina: 'diagnostico', titulo: 'Diagnóstico', fala: 'Uso moderado e regular. O elétrico cabe no dia a dia; a viagem ao interior pede uma parada de recarga. Veja o lado a lado já resumido.' },
  { pagina: 'comparador', titulo: 'Três frentes lado a lado', fala: 'Elétrico × combustão × assinatura: além da parcela, entram recarga ou combustível, manutenção preventiva, IPVA reduzido do elétrico e seguro incluso na assinatura.' },
  { pagina: 'eletrico', titulo: 'Foco em elétricos', fala: 'Aba dedicada a elétricos, onde o Santander é protagonista (50–60% do mercado, segundo a banca). Catálogo, autonomia, recarga e carregadores.' },
  { pagina: 'assistente', titulo: 'Mobiliza IA', fala: 'Pergunte ao vivo: "Vale mais a pena financiar ou assinar?". A IA responde com os números do simulador, sem fila e sem repetir informações.' },
  { pagina: 'simulacao', titulo: 'Simulação', fala: 'Financiamento do elétrico: entrada, parcela e como a dívida diminui. Note o atalho para abrir conta.' },
  {
    pagina: 'conta',
    titulo: 'Conta e taxa bonificada',
    fala: 'Ligamos abertura de conta, portabilidade de salário e débito automático: o rating sobe e a taxa cai de 1,79% para 1,56% ao mês (hipótese). A parcela cai junto.',
    ajuste: (d) => ({ ...d, relacionamento: { abrirConta: true, portabilidadeSalario: true, debitoAutomatico: true, seguroSantander: false } }),
  },
  { pagina: 'lojista', titulo: 'Balcão da concessionária (B2B)', fala: 'A mesma inteligência no balcão: o vendedor monta o pacote (veículo, seguro, conta, carregador) e o cliente acompanha na tela. A proposta segue para o celular por QR code.' },
  { pagina: 'proximos-passos', titulo: 'Fechamento', fala: 'Resumo exportável e próximos passos. Tudo navegável, com dados fictícios identificados.' },
];

export function RoteiroDemo() {
  const { dados, atualizar } = useEstado();
  const i = dados.roteiroDemo;
  const [minimizado, setMinimizado] = useState(false);

  useEffect(() => {
    if (i == null) return;
    const passo = ROTEIRO[i];
    if (passo.ajuste) atualizar(passo.ajuste);
    irPara(passo.pagina);
  }, [i, atualizar]);

  if (i == null) return null;
  const passo = ROTEIRO[i];
  const ir = (n: number) => atualizar((d) => ({ ...d, roteiroDemo: Math.max(0, Math.min(ROTEIRO.length - 1, n)) }));

  if (minimizado) {
    return (
      <button type="button" onClick={() => setMinimizado(false)} className="fixed bottom-3 left-3 z-40 rounded-full bg-marca px-4 py-2.5 text-sm font-semibold text-white shadow-2xl">
        <Play className="mr-1 inline h-3.5 w-3.5 align-[-2px]" fill="currentColor" aria-hidden /> Roteiro · passo {i + 1} de {ROTEIRO.length}
      </button>
    );
  }

  return (
    <aside className="fixed bottom-3 left-3 right-3 z-40 mx-auto max-w-xl rounded-2xl border-t-4 border-marca bg-white p-4 text-tinta shadow-2xl sm:left-4 sm:right-auto" aria-label="Roteiro da demonstração" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-marca">Modo demonstração · passo {i + 1} de {ROTEIRO.length}</p>
          <p className="text-lg font-bold">{passo.titulo}</p>
        </div>
        <div className="flex shrink-0 gap-1">
        <button type="button" className="rounded-lg px-2 py-1 text-tinta-suave hover:bg-tinta-fundo" onClick={() => setMinimizado(true)} aria-label="Minimizar roteiro"><Minus className="h-4 w-4" aria-hidden /></button>
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-tinta-suave hover:bg-tinta-fundo"
          onClick={() => atualizar((d) => ({ ...d, roteiroDemo: null, relacionamento: SEM_RELACIONAMENTO }))}
          aria-label="Sair do modo demonstração"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        </div>
      </div>
      <p className="mt-1 text-[15px] text-tinta-suave">{passo.fala}</p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <div className="mr-auto hidden gap-1 sm:flex" aria-hidden>
          {ROTEIRO.map((_, n) => <span key={n} className={`h-1.5 w-4 rounded-full ${n <= i ? 'bg-marca' : 'bg-tinta-linha'}`} />)}
        </div>
        <button type="button" className="rounded-xl px-3 py-2 text-sm font-semibold text-tinta hover:bg-tinta-fundo disabled:opacity-40" disabled={i === 0} onClick={() => ir(i - 1)}>← Anterior</button>
        {i < ROTEIRO.length - 1 ? (
          <button type="button" className="rounded-xl bg-marca px-4 py-2 text-sm font-semibold text-white hover:bg-marca-escuro" onClick={() => ir(i + 1)}>Próximo →</button>
        ) : (
          <button type="button" className="rounded-xl bg-marca px-4 py-2 text-sm font-semibold text-white" onClick={() => atualizar((d) => ({ ...d, roteiroDemo: null }))}>Concluir</button>
        )}
      </div>
    </aside>
  );
}
