import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CONFIG_IA, perguntarIA } from '../assistant/llm';
import { PERGUNTAS_SUGERIDAS, ProvedorRegras } from '../assistant/regras';
import type { Mensagem } from '../assistant/tipos';
import { CabecalhoPagina, NavegacaoJornada, Selo } from '../components/ui';
import { calcularDerivados, useEstado } from '../state/estado';
import { irPara, type IdPagina } from '../state/rotas';

/** Renderiza **negrito** e quebras de linha sem injetar HTML. */
function TextoRico({ texto }: { texto: string }) {
  return (
    <>
      {texto.split('\n').map((linha, i) => (
        <p key={i} className={i ? 'mt-1.5' : ''}>
          {linha.split(/(\*\*[^*]+\*\*)/).map((parte, j): ReactNode =>
            parte.startsWith('**') ? <strong key={j}>{parte.slice(2, -2)}</strong> : <span key={j}>{parte}</span>,
          )}
        </p>
      ))}
    </>
  );
}

let contador = 0;
const id = () => `m${++contador}`;

export function Assistente() {
  const { dados, derivados, rotas } = useEstado();
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: id(),
      autor: 'assistente',
      texto:
        'Olá! Eu sou a Mobiliza IA. Explico os resultados da sua simulação usando os números calculados a partir da sua rotina. Não invento valores: se algo for hipótese ou dado fictício, eu aviso. Escolha uma pergunta abaixo ou escreva a sua.',
    },
  ]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [usarIA, setUsarIA] = useState(!!CONFIG_IA.endpoint);
  const [iaStatus, setIaStatus] = useState<'nao-testada' | 'ok' | 'falhou'>('nao-testada');
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // chaves: scrollIntoView pode devolver uma Promise em navegadores recentes, e o efeito não pode retorná-la
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [mensagens]);

  const perguntar = async (pergunta: string) => {
    const q = pergunta.trim();
    if (!q || pensando) return;
    setTexto('');
    setMensagens((m) => [...m, { id: id(), autor: 'pessoa', texto: q }]);
    setPensando(true);
    const ctx = { dados, derivados, recalcular: (d: typeof dados) => calcularDerivados(d, rotas) };
    // 1) As regras sempre calculam a resposta (números do motor, fontes e ações)
    const regras = await ProvedorRegras.responder(q, ctx);
    let resposta: Omit<Mensagem, 'id' | 'autor'> = { ...regras, origem: 'regras' };
    // 2) Modo híbrido: se a IA generativa estiver ligada, ela explica esses números com as próprias palavras
    if (usarIA) {
      try {
        const ia = await perguntarIA(q, ctx, regras.texto, mensagens);
        resposta = { ...regras, texto: ia.texto, origem: 'ia', modelo: ia.modelo };
        setIaStatus('ok');
      } catch {
        setIaStatus('falhou');
      }
    } else {
      await new Promise((r) => setTimeout(r, 350)); // pequena pausa para a leitura ficar natural
    }
    setMensagens((m) => [...m, { id: id(), autor: 'assistente', ...resposta }]);
    setPensando(false);
  };

  return (
    <div>
      <CabecalhoPagina pagina="assistente" titulo="Mobiliza IA" descricao="Pergunte em linguagem simples. As respostas explicam os números do motor de cálculo, com base na sua rotina e no seu orçamento." />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="cartao flex h-[600px] flex-col p-0" aria-label="Conversa">
          <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
            {mensagens.map((m) => (
              <div key={m.id} className={`flex ${m.autor === 'pessoa' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.autor === 'pessoa' ? 'rounded-br-sm bg-marca text-white' : 'rounded-bl-sm bg-tinta-fundo'}`}>
                  <TextoRico texto={m.texto} />
                  {m.autor === 'assistente' && m.origem && (
                    <p className="mt-2 text-xs text-tinta-suave">{m.origem === 'ia' ? `✨ IA generativa${m.modelo ? ` (${m.modelo})` : ''}, explicando os números do simulador` : '⚙ Resposta pelas regras do simulador'}</p>
                  )}
                  {m.fontes && (
                    <p className="mt-2 border-t border-tinta-linha pt-2 text-xs text-tinta-suave">
                      Fonte dos números: {m.fontes.join(' · ')}
                    </p>
                  )}
                  {m.acoes && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.acoes.map((a) => (
                        <button key={a.rotulo} type="button" className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-marca shadow-sm" onClick={() => irPara(a.pagina as IdPagina)}>
                          {a.rotulo} →
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {pensando && <p className="text-sm text-tinta-suave">{usarIA ? 'Mobiliza IA está pensando…' : 'Mobiliza IA está calculando…'}</p>}
            <div ref={fimRef} />
          </div>
          <div className="border-t border-tinta-linha p-3">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {PERGUNTAS_SUGERIDAS.map((q) => (
                <button key={q} type="button" className="shrink-0 rounded-full border border-tinta-linha bg-white px-3 py-1.5 text-sm hover:border-marca" onClick={() => perguntar(q)}>
                  {q}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                perguntar(texto);
              }}
            >
              <label className="sr-only" htmlFor="pergunta">Sua pergunta</label>
              <input id="pergunta" className="campo" placeholder="Ex.: e se eu rodar 2.000 km por mês?" value={texto} onChange={(e) => setTexto(e.target.value)} />
              <button type="submit" className="botao-primario" disabled={pensando || !texto.trim()}>Enviar</button>
            </form>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="cartao text-sm">
            <h2 className="mb-2 font-bold">Como a Mobiliza IA funciona</h2>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-marca" checked={usarIA} disabled={!CONFIG_IA.endpoint} onChange={(e) => setUsarIA(e.target.checked)} />
              <span><strong>Usar IA generativa</strong> (LLM via OpenRouter)</span>
            </label>
            <p className="mt-2 text-tinta-suave">
              O simulador calcula os números; a IA só explica, sem inventar valores. Se a IA não responder, as regras do simulador respondem no lugar.
            </p>
            {iaStatus === 'ok' && <p className="mt-2 font-semibold text-emerald-700">● IA generativa conectada</p>}
            {iaStatus === 'falhou' && <p className="mt-2 font-semibold text-amber-700">● IA indisponível agora; respondendo pelas regras</p>}
            <p className="mt-2 text-xs text-tinta-suave">A pergunta e os números da simulação são enviados a um servidor intermediário e ao OpenRouter. Não envie dados pessoais.</p>
            <p className="mt-2"><Selo tipo="demonstrativo" /></p>
          </div>
          <div className="cartao text-sm">
            <h2 className="mb-2 font-bold">O que ela sabe agora</h2>
            <ul className="space-y-1 text-tinta-suave">
              <li>• Quilometragem: {Math.round(derivados.km.kmMensal)} km/mês</li>
              <li>• Orçamento: R$ {dados.perfil.orcamentoMensal.toLocaleString('pt-BR')}/mês</li>
              <li>• Opções comparadas: {derivados.opcoes.length}</li>
              <li>• Recarga em casa: {dados.rotina.recargaEmCasa ? 'sim' : 'não'}</li>
            </ul>
          </div>
        </aside>
      </div>

      <NavegacaoJornada pagina="assistente" rotuloContinuar="Simular a opção escolhida" />
    </div>
  );
}
