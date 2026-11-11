/** Troca entre as abas e guarda a aba escolhida no endereço (#financiar, #alugar-e-comprar, #assinatura). */
(function () {
  'use strict';
  const abas = Array.from(document.querySelectorAll('.abas [role=tab]'));

  function mostrar(aba, focar) {
    abas.forEach((b) => {
      const ativa = b === aba;
      b.setAttribute('aria-selected', String(ativa));
      b.tabIndex = ativa ? 0 : -1;
      document.getElementById(b.getAttribute('aria-controls')).hidden = !ativa;
    });
    if (focar) aba.focus();
    if (location.hash.slice(1) !== aba.dataset.hash) history.replaceState(null, '', '#' + aba.dataset.hash);
    // recalcula para desenhar gráficos que estavam escondidos
    const form = document.getElementById(aba.getAttribute('aria-controls')).querySelector('form');
    if (form) form.requestSubmit();
  }

  abas.forEach((b, i) => {
    b.addEventListener('click', () => mostrar(b));
    b.addEventListener('keydown', (ev) => {
      const passo = { ArrowRight: 1, ArrowLeft: -1 }[ev.key];
      if (passo) mostrar(abas[(i + passo + abas.length) % abas.length], true);
    });
  });

  const inicial = abas.find((b) => b.dataset.hash === location.hash.slice(1)) || abas[0];
  mostrar(inicial);
  window.addEventListener('hashchange', () => {
    const b = abas.find((x) => x.dataset.hash === location.hash.slice(1));
    if (b) mostrar(b);
  });
})();
