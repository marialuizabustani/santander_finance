import qrcode from 'qrcode-generator';
import { useMemo } from 'react';

/** QR code gerado no navegador, como SVG (sem serviço externo). */
export function QrCode({ texto, tamanho = 180 }: { texto: string; tamanho?: number }) {
  const caminho = useMemo(() => {
    const qr = qrcode(0, 'L');
    qr.addData(texto);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) if (qr.isDark(l, c)) d += `M${c + 2} ${l + 2}h1v1h-1z`;
    return { d, lado: n + 4 };
  }, [texto]);
  return (
    <svg width={tamanho} height={tamanho} viewBox={`0 0 ${caminho.lado} ${caminho.lado}`} shapeRendering="crispEdges" role="img" aria-label="QR code para abrir a proposta no celular">
      <rect width="100%" height="100%" fill="#fff" />
      <path d={caminho.d} fill="#000" />
    </svg>
  );
}
