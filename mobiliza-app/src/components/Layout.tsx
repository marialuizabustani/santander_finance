import { useState, type ReactNode } from 'react';
import { Calculator, Home, Landmark, MapPin, Menu, MessageSquare, Play, Scale, Store, Zap, type LucideIcon } from 'lucide-react';
import { apagarTudo, definirLembrar, lembrarAtivado } from '../services/persistencia';
import { FaixaParceria, QrFlutuante } from './Extras';
import { RoteiroDemo } from './RoteiroDemo';
import { useEstado } from '../state/estado';
import { irPara, JORNADA, type IdPagina } from '../state/rotas';

const MENU: { id: IdPagina; titulo: string; icone: LucideIcon }[] = [
  { id: 'inicio', titulo: 'Início', icone: Home },
  { id: 'rotina', titulo: 'Minha Rotina', icone: MapPin },
  { id: 'comparador', titulo: 'Comparador', icone: Scale },
  { id: 'simulador', titulo: 'Simulador', icone: Calculator },
  { id: 'eletrico', titulo: 'Elétricos', icone: Zap },
  { id: 'conta', titulo: 'Conta e taxa', icone: Landmark },
  { id: 'lojista', titulo: 'Lojista', icone: Store },
  { id: 'assistente', titulo: 'Mobiliza IA', icone: MessageSquare },
];

/** Logotipo Santander (versão principal positiva, altura ≥ 25px) + nome do produto, com área de proteção. */
function Marca() {
  return (
    <button type="button" onClick={() => irPara('inicio')} className="flex shrink-0 items-center gap-3 py-1 text-left" aria-label="Santander Mobiliza, ir para o início">
      <img src="marca/santander-logo.png" alt="Santander" className="h-7 w-auto sm:h-8" width="183" height="32" />
      <span aria-hidden className="h-8 w-px bg-tinta-linha" />
      <span className="leading-tight">
        <span className="block whitespace-nowrap text-lg font-bold text-marca">Mobiliza</span>
        <span className="block whitespace-nowrap text-[11px] text-tinta-suave">Protótipo acadêmico</span>
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
            className={`w-full min-w-[92px] whitespace-nowrap border-t-4 pt-1.5 text-left ${i <= atual ? 'border-marca' : 'border-tinta-linha'} ${i === atual ? 'font-bold text-marca' : 'text-tinta-suave'}`}
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
          className="h-4 w-4 accent-white"
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
                className={
                  m.id === 'assistente'
                    ? `ml-1 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[15px] font-semibold ${pagina === m.id ? 'border-marca bg-marca text-white' : 'border-marca text-marca hover:bg-marca-claro'}`
                    : `whitespace-nowrap rounded-lg px-2 py-2 text-[15px] font-medium ${pagina === m.id ? 'bg-marca-claro text-marca' : 'text-tinta hover:bg-tinta-fundo'}`
                }
              >
                {m.id === 'assistente' && <MessageSquare className="mr-1 inline h-4 w-4 align-[-2px]" aria-hidden />}
                {m.titulo}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" className="botao-primario hidden whitespace-nowrap px-3 py-2 text-sm sm:inline-flex" onClick={iniciarDemonstracao} title="Carrega a persona fictícia e abre o roteiro passo a passo da apresentação">
              <Play className="h-3.5 w-3.5" fill="currentColor" aria-hidden /> <span className="xl:hidden 2xl:inline">Demonstração ao vivo</span><span className="hidden xl:inline 2xl:hidden">Demonstração</span>
            </button>
            <button type="button" className="botao-discreto xl:hidden" onClick={() => setMenuAberto(!menuAberto)} aria-expanded={menuAberto} aria-controls="menu-movel">
              <Menu className="h-6 w-6" aria-hidden /> <span className="sr-only">Menu</span>
            </button>
          </div>
        </div>
        {menuAberto && (
          <nav id="menu-movel" className="border-t border-tinta-linha bg-white px-4 pb-4 xl:hidden" aria-label="Menu">
            {MENU.map((m) => (
              <button key={m.id} type="button" onClick={() => ir(m.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-base font-medium hover:bg-tinta-fundo">
                <m.icone className="h-5 w-5 text-marca" aria-hidden />
                {m.titulo}
              </button>
            ))}
            <button type="button" className="botao-primario mt-2 w-full" onClick={() => { iniciarDemonstracao(); setMenuAberto(false); }}>
              <Play className="h-4 w-4" fill="currentColor" aria-hidden /> Demonstração ao vivo
            </button>
            <button type="button" className="botao-secundario mt-2 w-full" onClick={() => { carregarCenarioDemo(); setMenuAberto(false); }}>
              Só carregar o cenário demonstrativo
            </button>
          </nav>
        )}
        <Progresso pagina={pagina} />
      </header>

      {dados.cenarioDemoCarregado && (
        <div className="bg-marca-suave text-center text-sm text-marca-profundo">
          <p className="mx-auto max-w-6xl px-4 py-1.5">Cenário demonstrativo ativo: pessoa, endereços, veículos e valores são fictícios. Todos os campos podem ser editados.</p>
        </div>
      )}

      <RoteiroDemo />

      {pagina !== 'proposta' && <QrFlutuante />}

      {pagina !== 'assistente' && pagina !== 'proposta' && (
        <button
          type="button"
          onClick={() => ir('assistente')}
          className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-marca px-4 py-3 font-semibold text-white shadow-2xl ring-2 ring-white hover:bg-marca-escuro"
          aria-label="Abrir a Mobiliza IA"
        >
          <MessageSquare className="h-5 w-5" aria-hidden />
          <span className="hidden sm:inline">Pergunte à Mobiliza IA</span>
        </button>
      )}

      <main id="conteudo" className="entrar mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8" key={pagina}>
        {children}
      </main>

      <FaixaParceria />

      <footer className={`bg-marca text-sm text-white ${dados.roteiroDemo != null ? 'pb-44' : ''}`}>
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <img src="marca/santander-logo-branco.png" alt="Santander" className="h-7 w-auto" width="160" height="28" />
            <p className="font-semibold">Mobiliza · sua rotina mostra o caminho</p>
          </div>
          <p className="max-w-3xl text-white/90">
            <strong className="text-white">Protótipo acadêmico, não é um produto oficial.</strong> Veículos, preços, taxas, carregadores e propostas são fictícios ou
            hipóteses editáveis. Nenhum dado é enviado a sistemas bancários.
          </p>
          <ControleDados />
        </div>
      </footer>
    </div>
  );
}
