/** Botão flutuante com o QR code do endereço do site. */
(function () {
  'use strict';
  const { $ } = window.Util;
  const URL_PUBLICA = 'https://marialuizabustani.github.io/santander_finance/';

  /** Endereço do site (sem a aba e sem parâmetros). */
  function urlDoSite() {
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      return location.origin + location.pathname.replace(/index\.html$/, '');
    }
    return URL_PUBLICA; // aberto como arquivo local
  }

  /** Gera o QR code como SVG nítido em qualquer tamanho. */
  function svgQr(texto) {
    const qr = window.qrcode(0, 'M');
    qr.addData(texto);
    qr.make();
    const n = qr.getModuleCount();
    const borda = 2;
    const lado = n + borda * 2;
    let d = '';
    for (let l = 0; l < n; l++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(l, c)) d += `M${c + borda} ${l + borda}h1v1h-1z`;
      }
    }
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" shape-rendering="crispEdges" role="img" aria-label="QR code do endereço ${texto}">` +
      `<rect width="${lado}" height="${lado}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`
    );
  }

  const botao = $('qr-botao');
  const painel = $('qr-painel');
  const url = urlDoSite();

  $('qr-imagem').innerHTML = svgQr(url);
  $('qr-url').textContent = url.replace(/^https?:\/\//, '');
  $('qr-url').href = url;

  // No celular, o QR serve para compartilhar com outra pessoa
  function ajustarTextos() {
    const celular = window.matchMedia('(max-width: 620px)').matches;
    $('qr-titulo').textContent = celular ? 'Compartilhe o simulador' : 'Abra no celular';
    $('qr-texto').textContent = celular
      ? 'Mostre este código para outra pessoa apontar a câmera.'
      : 'Aponte a câmera do celular para o código.';
  }

  function abrir(sim) {
    if (sim) ajustarTextos();
    painel.hidden = !sim;
    botao.setAttribute('aria-expanded', String(sim));
    if (sim) $('qr-fechar').focus();
  }

  botao.addEventListener('click', () => abrir(painel.hidden));
  $('qr-fechar').addEventListener('click', () => {
    abrir(false);
    botao.focus();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !painel.hidden) {
      abrir(false);
      botao.focus();
    }
  });
  document.addEventListener('click', (ev) => {
    if (!painel.hidden && !painel.contains(ev.target) && !botao.contains(ev.target)) abrir(false);
  });

  $('qr-copiar').addEventListener('click', async () => {
    const aviso = $('qr-copiar');
    try {
      await navigator.clipboard.writeText(url);
      aviso.textContent = 'Link copiado!';
    } catch (e) {
      aviso.textContent = 'Não foi possível copiar';
    }
    setTimeout(() => (aviso.textContent = 'Copiar link'), 2000);
  });
})();
