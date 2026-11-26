import { Copy, QrCode as IconeQr, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { QrCode } from './QrCode';

const URL_PUBLICA = 'https://marialuizabustani.github.io/santander_finance/mobiliza/';

/** Endereço do Mobiliza (sem a tela atual). Aberto como arquivo local, usa o endereço público. */
function urlDoSite(): string {
  if (location.protocol === 'http:' || location.protocol === 'https:') return location.origin + location.pathname.replace(/index\.html$/, '');
  return URL_PUBLICA;
}

/** QR code flutuante com o endereço do site, como no simulador original. */
export function QrFlutuante() {
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const url = urlDoSite();

  useEffect(() => {
    if (!aberto) return;
    const f = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        aria-controls="painel-qr"
        aria-label="Mostrar QR code do site"
        className="fixed bottom-[76px] right-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-white text-marca shadow-2xl ring-1 ring-tinta-linha hover:bg-marca-claro"
      >
        <IconeQr className="h-6 w-6" aria-hidden />
      </button>
      {aberto && (
        <div id="painel-qr" role="dialog" aria-label="QR code do site" className="fixed bottom-[136px] right-4 z-40 w-[260px] rounded-2xl border-t-4 border-marca bg-white p-5 text-center shadow-2xl">
          <button type="button" className="absolute right-2 top-2 rounded-lg p-1 text-tinta-suave hover:bg-tinta-fundo" onClick={() => setAberto(false)} aria-label="Fechar">
            <X className="h-4 w-4" aria-hidden />
          </button>
          <p className="font-bold">Abra no celular</p>
          <p className="mb-3 text-sm text-tinta-suave">Aponte a câmera do celular para o código.</p>
          <div className="mx-auto w-fit"><QrCode texto={url} tamanho={190} /></div>
          <p className="mt-2 break-all text-xs text-tinta-suave">{url.replace(/^https?:\/\//, '')}</p>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-marca underline underline-offset-2"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              } catch {
                /* sem permissão para copiar */
              }
            }}
          >
            <Copy className="h-4 w-4" aria-hidden /> {copiado ? 'Link copiado!' : 'Copiar link'}
          </button>
        </div>
      )}
    </>
  );
}

/**
 * Faixa de parceria Santander + Ensino Einstein, seguindo o lockup de cobranding do guia (p. 9):
 * logos com a mesma altura, 4 módulos entre eles e uma linha de 1pt no centro.
 * Computador: versão principal (5 módulos). Celular estreito: versão secundária (8 módulos).
 */
export function FaixaParceria() {
  return (
    <section className="border-t border-tinta-linha bg-white" aria-label="Parceria">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-tinta-suave">Em parceria com</p>
        {/* versão principal: 30px de altura (módulo = 6px) */}
        <div className="hidden items-center gap-[12px] min-[420px]:flex" role="img" aria-label="Santander em parceria com Ensino Einstein">
          <img src="marca/santander-logo.png" alt="" className="h-[30px] w-auto" width="171" height="30" />
          <span aria-hidden className="h-[30px] w-px bg-[#333]" />
          <img src="marca/parceiro-ensino-einstein-horizontal.png" alt="" className="h-[30px] w-auto" width="241" height="30" />
        </div>
        {/* versão secundária: 50px (mínimo do guia), módulo = 6,25px */}
        <div className="flex items-center gap-[12.5px] min-[420px]:hidden" role="img" aria-label="Santander em parceria com Ensino Einstein">
          <img src="marca/santander-logo-secundario.png" alt="" className="h-[50px] w-auto" width="93" height="50" />
          <span aria-hidden className="h-[50px] w-px bg-[#333]" />
          <img src="marca/parceiro-ensino-einstein-vertical.png" alt="" className="h-[50px] w-auto" width="59" height="50" />
        </div>
      </div>
    </section>
  );
}
