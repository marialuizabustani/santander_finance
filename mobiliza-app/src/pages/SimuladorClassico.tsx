import { Banknote, CalendarDays, KeyRound, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { CabecalhoPagina } from '../components/ui';
import { AbaAssinatura, ASSINATURA_PADRAO, type FormAssinatura } from '../legado/AbaAssinatura';
import { AbaFinanciar, FINANCIAR_PADRAO, type FormFinanciar } from '../legado/AbaFinanciar';
import { AbaLeasing, LEASING_PADRAO, type FormLeasing } from '../legado/AbaLeasing';
import { lerRota } from '../state/rotas';

type AbaSimulador = 'financiar' | 'alugar-e-comprar' | 'assinatura';

const ABAS: { id: AbaSimulador; titulo: string; detalhe: string; icone: LucideIcon }[] = [
  { id: 'financiar', titulo: 'Financiar', detalhe: 'o carro é seu', icone: Banknote },
  { id: 'alugar-e-comprar', titulo: 'Alugar e comprar no final', detalhe: 'leasing', icone: KeyRound },
  { id: 'assinatura', titulo: 'Alugar sem comprar', detalhe: 'carro por assinatura', icone: CalendarDays },
];

/** Valores digitados ficam guardados ao trocar de aba ou de tela (somente nesta sessão). */
const memoria: { financiar: FormFinanciar; leasing: FormLeasing; assinatura: FormAssinatura } = {
  financiar: FINANCIAR_PADRAO,
  leasing: LEASING_PADRAO,
  assinatura: ASSINATURA_PADRAO,
};

function abaInicial(): AbaSimulador {
  const a = lerRota().params.get('aba');
  return ABAS.some((x) => x.id === a) ? (a as AbaSimulador) : 'financiar';
}

/**
 * Simulador completo: as mesmas funcionalidades e o mesmo motor de cálculo do simulador original
 * (financiar com SAC/Price, IOF e CET; leasing; assinatura), agora dentro do Mobiliza.
 */
export function SimuladorClassico() {
  const [aba, setAbaEstado] = useState<AbaSimulador>(abaInicial);
  const [financiar, setFinanciar] = useState(memoria.financiar);
  const [leasing, setLeasing] = useState(memoria.leasing);
  const [assinatura, setAssinatura] = useState(memoria.assinatura);

  const setAba = (a: AbaSimulador) => {
    setAbaEstado(a);
    history.replaceState(null, '', `#/simulador?aba=${a}`);
  };

  return (
    <div>
      <CabecalhoPagina
        titulo="Simulador completo"
        descricao="Simule por conta própria, com todos os detalhes: parcelas iguais ou decrescentes, IOF, custo efetivo total, tabela por prazos e parcela por parcela."
      />

      <div className="mb-6 grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Formas de ter um carro">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            id={`simulador-aba-${a.id}`}
            aria-selected={aba === a.id}
            aria-controls="simulador-painel"
            onClick={() => setAba(a.id)}
            className={`flex items-center gap-3 rounded-2xl border-t-4 bg-white px-4 py-3 text-left shadow-cartao transition-colors ${
              aba === a.id ? 'border-marca' : 'border-transparent hover:border-marca-suave'
            }`}
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${aba === a.id ? 'bg-marca text-white' : 'bg-marca-claro text-marca'}`}>
              <a.icone className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className={`block font-bold ${aba === a.id ? 'text-marca' : ''}`}>{a.titulo}</span>
              <span className="block text-sm text-tinta-suave">{a.detalhe}</span>
            </span>
          </button>
        ))}
      </div>

      <div id="simulador-painel" role="tabpanel" aria-labelledby={`simulador-aba-${aba}`}>
        {aba === 'financiar' && <AbaFinanciar f={financiar} set={(f) => { memoria.financiar = f; setFinanciar(f); }} />}
        {aba === 'alugar-e-comprar' && <AbaLeasing f={leasing} set={(f) => { memoria.leasing = f; setLeasing(f); }} />}
        {aba === 'assinatura' && <AbaAssinatura f={assinatura} set={(f) => { memoria.assinatura = f; setAssinatura(f); }} />}
      </div>
    </div>
  );
}
