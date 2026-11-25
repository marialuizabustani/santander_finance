import { useState, type ReactNode } from 'react';
import { apagarTudo, definirLembrar, lembrarAtivado } from '../services/persistencia';
import { RoteiroDemo } from './RoteiroDemo';
import { useEstado } from '../state/estado';
import { irPara, JORNADA, type IdPagina } from '../state/rotas';

const MENU: { id: IdPagina; titulo: string; icone: string }[] = [
  { id: 'inicio', titulo: 'Início', icone: '⌂' },
  { id: 'rotina', titulo: 'Minha Rotina', icone: '📍' },
  { id: 'comparador', titulo: 'Comparador', icone: '⚖' },
  { id: 'eletrico', titulo: 'Mobilidade Elétrica', icone: '⚡' },
  { id: 'assistente', titulo: 'Mobiliza IA', icone: '💬' },
  { id: 'conta', titulo: 'Conta e taxa', icone: '🏦' },
  { id: 'lojista', titulo: 'Área do Lojista', icone: '🏪' },
];

function Marca() {
  return (
    <button type="button" onClick={() => irPara('inicio')} className="flex items-center gap-2 text-left" aria-label="Santander Mobiliza, ir para o início">
      <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-marca text-white">
        {/* ícone genérico de rota (não é o logotipo do banco) */}
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="6" cy="18" r="2.2" />
          <circle cx="18" cy="6" r="2.2" />
          <path d="M8 18h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block whitespace-nowrap text-lg font-bold">
          Santander <span className="text-marca">Mobiliza</span>
        </span>
        <span className="block whitespace-nowrap text-xs text-tinta-suave">Protótipo acadêmico não oficial</span>
      </span>
    </button>
  );
}

function Progresso({ pagina }: { pagina: IdPagina }) {
  const atual = JORNADA.findIndex((j) => j.id === pagina);
  if (atual < 0) return null;
  return (
    <ol className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 text-sm" aria-label="Jornada">
      {JORNADA.map((j, i) => (
        <li key={j.id} className="flex-1">
          <button
            type="button"
            onClick={() => irPara(j.id)}
            aria-current={i === atual ? 'step' : undefined}
            className={`w-full min-w-[92px] border-t-4 pt-1.5 text-left ${i <= atual ? 'border-marca' : 'border-tinta-linha'} ${i === atual ? 'font-bold text-marca' : 'text-tinta-suave'}`}
          >
            <span className="mr-1">{i + 1}.</span>
            {j.titulo}
          </button>
        </li>
      ))}
    </ol>
  );
}

function ControleDados() {
  const { limparSessao } = useEstado();
  const [lembrar, setLembrar] = useState(lembrarAtivado());
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 accent-marca"
          checked={lembrar}
          onChange={(e) => {
            definirLembrar(e.target.checked);
            setLembrar(e.target.checked);
          }}
        />
        Lembrar meus dados neste aparelho
      </label>
      <button
        type="button"
        className="underline underline-offset-2"
        onClick={() => {
          apagarTudo();
          setLembrar(false);
          limparSessao();
          irPara('inicio');
        }}
      >
        Apagar meus dados
      </button>
    </div>
  );
}

export function Layout({ pagina, children }: { pagina: IdPagina; children: ReactNode }) {
  const { carregarCenarioDemo, iniciarDemonstracao, dados } = useEstado();
  const [menuAberto, setMenuAberto] = useState(false);
  const ir = (p: IdPagina) => {
    setMenuAberto(false);
    irPara(p);
  };
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-30 border-b border-tinta-linha bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Marca />
          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Menu principal">
            {MENU.slice(1).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => ir(m.id)}
                aria-current={pagina === m.id ? 'page' : undefined}
                className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-[15px] font-medium ${pagina === m.id ? 'bg-marca-claro text-marca' : 'text-tinta hover:bg-tinta-fundo'}`}
              >
                {m.titulo}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" className="botao-primario hidden whitespace-nowrap px-3 py-2 text-sm sm:inline-flex" onClick={iniciarDemonstracao} title="Carrega a persona fictícia e abre o roteiro passo a passo da apresentação">
              ▶ Demonstração ao vivo
            </button>
            <button type="button" className="botao-discreto xl:hidden" onClick={() => setMenuAberto(!menuAberto)} aria-expanded={menuAberto} aria-controls="menu-movel">
              ☰ <span className="sr-only">Menu</span>
            </button>
          </div>
        </div>
        {menuAberto && (
          <nav id="menu-movel" className="border-t border-tinta-linha bg-white px-4 pb-4 xl:hidden" aria-label="Menu">
            {MENU.map((m) => (
              <button key={m.id} type="button" onClick={() => ir(m.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-base font-medium hover:bg-tinta-fundo">
                <span aria-hidden className="w-6 text-center">{m.icone}</span>
                {m.titulo}
              </button>
            ))}
            <button type="button" className="botao-primario mt-2 w-full" onClick={() => { iniciarDemonstracao(); setMenuAberto(false); }}>
              ▶ Demonstração ao vivo
            </button>
            <button type="button" className="botao-secundario mt-2 w-full" onClick={() => { carregarCenarioDemo(); setMenuAberto(false); }}>
              Só carregar o cenário demonstrativo
            </button>
          </nav>
        )}
        <Progresso pagina={pagina} />
      </header>

      {dados.cenarioDemoCarregado && (
        <div className="bg-violet-50 text-center text-sm text-violet-900">
          <p className="mx-auto max-w-6xl px-4 py-1.5">Cenário demonstrativo ativo: pessoa, endereços, veículos e valores são fictícios. Todos os campos podem ser editados.</p>
        </div>
      )}

      <RoteiroDemo />

      <main id="conteudo" className="entrar mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8" key={pagina}>
        {children}
      </main>

      <footer className={`border-t border-tinta-linha bg-white text-sm text-tinta-suave ${dados.roteiroDemo != null ? 'pb-44' : ''}`}>
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-5">
          <p>
            <strong className="text-tinta">Protótipo acadêmico não oficial.</strong> Não é um produto do Santander. Veículos, preços, taxas, carregadores e
            propostas são fictícios ou hipóteses editáveis. Nenhum dado é enviado a sistemas bancários.
          </p>
          <ControleDados />
        </div>
      </footer>
    </div>
  );
}
