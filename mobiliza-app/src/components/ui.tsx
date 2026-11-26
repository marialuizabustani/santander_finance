import { useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { irPara, JORNADA, type IdPagina } from '../state/rotas';

/** Selo que diferencia a natureza de cada dado: real, estimativa, hipótese ou fictício. */
export function Selo({ tipo }: { tipo: 'real' | 'estimativa' | 'hipotese' | 'ficticio' | 'demonstrativo' }) {
  const estilos = {
    real: 'bg-ok-fundo text-ok',
    estimativa: 'bg-marca-suave text-marca-profundo',
    hipotese: 'bg-marca-suave text-marca-profundo',
    ficticio: 'bg-marca-claro text-tinta-suave',
    demonstrativo: 'bg-tinta-fundo text-tinta-suave',
  };
  const texto = { real: 'Rota real', estimativa: 'Estimativa', hipotese: 'Hipótese editável', ficticio: 'Dado fictício', demonstrativo: 'Demonstrativo' };
  return <span className={`chip ${estilos[tipo]}`}>{texto[tipo]}</span>;
}

export function Cartao({ titulo, subtitulo, acao, children, className = '' }: { titulo?: ReactNode; subtitulo?: ReactNode; acao?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`cartao ${className}`}>
      {(titulo || acao) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {titulo && <h2 className="text-lg font-bold">{titulo}</h2>}
            {subtitulo && <p className="text-sm text-tinta-suave">{subtitulo}</p>}
          </div>
          {acao}
        </div>
      )}
      {children}
    </section>
  );
}

export function Indicador({ rotulo, valor, detalhe, destaque = false }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${destaque ? 'bg-marca text-white' : 'bg-white shadow-cartao'}`}>
      <p className={`text-sm ${destaque ? 'text-white/85' : 'text-tinta-suave'}`}>{rotulo}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valor}</p>
      {detalhe && <p className={`mt-1 text-sm ${destaque ? 'text-white/85' : 'text-tinta-suave'}`}>{detalhe}</p>}
    </div>
  );
}

/** Termo financeiro com explicação em linguagem simples (abre ao tocar). */
export function Termo({ termo, children }: { termo: string; children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  return (
    <span className="relative inline-block">
      <button type="button" onClick={() => setAberto(!aberto)} className="border-b border-dotted border-tinta-suave font-medium" aria-expanded={aberto}>
        {termo} <Info className="inline h-3.5 w-3.5 align-[-2px] text-marca" aria-hidden />
      </button>
      {aberto && (
        <span role="note" className="absolute left-0 top-full z-20 mt-1 block w-64 rounded-xl border border-tinta-linha border-t-4 border-t-marca bg-white p-3 text-sm font-normal text-tinta shadow-lg">
          {children}
        </span>
      )}
    </span>
  );
}

export function CampoNumero({
  rotulo,
  valor,
  aoMudar,
  ajuda,
  sufixo,
  prefixo,
  min = 0,
  max,
  passo = 1,
}: {
  rotulo: string;
  valor: number;
  aoMudar: (v: number) => void;
  ajuda?: string;
  sufixo?: string;
  prefixo?: string;
  min?: number;
  max?: number;
  passo?: number;
}) {
  return (
    <label className="block">
      <span className="rotulo">{rotulo}</span>
      <span className="flex items-center gap-2">
        {prefixo && <span className="text-tinta-suave">{prefixo}</span>}
        <input
          type="number"
          inputMode="decimal"
          className="campo"
          value={Number.isFinite(valor) ? valor : ''}
          min={min}
          max={max}
          step={passo}
          onChange={(e) => aoMudar(e.target.value === '' ? 0 : Number(e.target.value))}
        />
        {sufixo && <span className="whitespace-nowrap text-tinta-suave">{sufixo}</span>}
      </span>
      {ajuda && <span className="ajuda">{ajuda}</span>}
    </label>
  );
}

export function Interruptor({ rotulo, ligado, aoMudar, ajuda }: { rotulo: string; ligado: boolean; aoMudar: (v: boolean) => void; ajuda?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        onClick={() => aoMudar(!ligado)}
        className={`mt-0.5 h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${ligado ? 'bg-marca' : 'bg-tinta-linha'}`}
      >
        <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${ligado ? 'translate-x-5' : ''}`} />
      </button>
      <span>
        <span className="font-semibold">{rotulo}</span>
        {ajuda && <span className="ajuda">{ajuda}</span>}
      </span>
    </label>
  );
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'atencao' | 'ok'; children: ReactNode }) {
  const e = { info: 'bg-marca-claro border-marca-suave', atencao: 'bg-marca-suave border-marca-mexico', ok: 'bg-ok-fundo border-ok/20' }[tipo];
  return <div className={`rounded-xl border px-4 py-3 text-sm ${e}`}>{children}</div>;
}

/** Cabeçalho de página com título, explicação curta e indicador de etapa da jornada. */
export function CabecalhoPagina({ pagina, titulo, descricao, children }: { pagina?: IdPagina; titulo: string; descricao: string; children?: ReactNode }) {
  const i = JORNADA.findIndex((j) => j.id === pagina);
  return (
    <header className="mb-6">
      {i >= 0 && <p className="mb-1 text-sm font-semibold text-marca">Etapa {i + 1} de {JORNADA.length}</p>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold sm:text-3xl">{titulo}</h1>
          <p className="mt-1 text-tinta-suave">{descricao}</p>
        </div>
        {children}
      </div>
    </header>
  );
}

/** Botões Voltar / Continuar da jornada principal. */
export function NavegacaoJornada({ pagina, rotuloContinuar }: { pagina: IdPagina; rotuloContinuar?: string }) {
  const i = JORNADA.findIndex((j) => j.id === pagina);
  const anterior = i > 0 ? JORNADA[i - 1] : null;
  const proxima = i >= 0 && i < JORNADA.length - 1 ? JORNADA[i + 1] : null;
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-tinta-linha pt-6" aria-label="Etapas">
      <button type="button" className="botao-discreto" onClick={() => irPara(anterior ? anterior.id : 'inicio')}>
        ← {anterior ? anterior.titulo : 'Início'}
      </button>
      {proxima && (
        <button type="button" className="botao-primario" onClick={() => irPara(proxima.id)}>
          {rotuloContinuar ?? `Continuar: ${proxima.titulo}`} →
        </button>
      )}
    </nav>
  );
}
