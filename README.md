# Simulador de Financiamento

Simulador web (HTML + JavaScript puro, sem dependências) para financiamento de carros, escrito em
linguagem simples para quem não entende de finanças,
com comparativo SAC × Price, IOF, tarifas, CET e análise de comprometimento de renda.

## Como usar

Abra `index.html` no navegador, ou sirva a pasta:

```bash
npm start   # http://localhost:3000
```

Testes do motor de cálculo:

```bash
npm test
```

## Abas

| Aba | O que simula |
|---|---|
| **Financiar** (`#financiar`) | Financiamento tradicional com SAC ou Price, IOF, tarifas e CET |
| **Alugar e comprar no final** (`#alugar-e-comprar`) | Leasing (arrendamento mercantil): parcelas + valor final para ficar com o carro, sem IOF, comparado com financiar |
| **Alugar sem comprar** (`#assinatura`) | Carro por assinatura / locação de longo prazo (12 a 36 meses), comparado com comprar financiado + seguro, IPVA, manutenção e desvalorização |

## Variáveis de entrada (aba Financiar)

| Grupo | Campo | Descrição |
|---|---|---|
| Bem e crédito | `valorBem` | Valor do veículo/imóvel |
| | `entrada` | Valor pago à vista |
| | `prazoMeses` | Número de parcelas (1–420) |
| | `taxa` + `taxaPeriodo` | Taxa de juros, ao mês ou ao ano (convertida por juros compostos) |
| | `sistema` | Tipo de amortização: `PRICE` (parcela fixa) ou `SAC` (amortização constante) |
| Renda | `rendaMensal` | Renda bruta mensal do proponente |
| | `rendaComplementar` | Renda de cônjuge/coobrigado, somada à principal |
| | `limiteComprometimento` | % máx. da renda que a maior parcela pode ocupar (padrão 30%) |
| | `entradaMinimaPct` | Entrada mínima exigida (padrão 20%) |
| Custos | `tarifaCadastro`, `registroContrato`, `seguro`, `outrasDespesas` | Custos da operação |
| | `cobrarIOF` | Aplica IOF de pessoa física (0,0082% ao dia, até 365 dias, + 0,38%) |
| | `financiarCustos` | Inclui IOF e tarifas no valor financiado (ou paga à vista) |

## Resultados

- 1ª, última e maior parcela; valor financiado; total de juros e total pago
- IOF calculado sobre cada amortização (quando financiado, o próprio IOF entra na base)
- **CET** mensal e anual (taxa interna de retorno considerando juros, IOF e tarifas)
- **Análise de renda**: % comprometido, parcela máxima permitida, renda mínima necessária e
  valor máximo financiável pela renda
- Situação (dentro dos critérios / pendências) e comparativo SAC × Price
- **Tabela de valores por prazo** (12 a 72x + o prazo escolhido): mensalidade, juros totais e valor total do carro, com exportação CSV
- Gráfico da evolução das parcelas e tabela de amortização completa

## Estrutura

```
index.html            interface
src/simulador.js      motor de cálculo do financiamento (navegador e Node)
src/alternativas.js   motor do leasing e da assinatura
src/app-alternativas.js  telas do leasing e da assinatura
src/abas.js           troca de abas
src/util.js           formatação compartilhada
src/app.js            ligação formulário ↔ motor, gráfico e tabelas
src/styles.css        estilos (tema claro/escuro)
tests/                testes com node:test
```

O motor pode ser usado sozinho:

```js
const { simular } = require('./src/simulador.js');
const r = simular({ valorBem: 80000, entrada: 20000, prazoMeses: 48, taxa: 0.0179,
                    sistema: 'SAC', rendaMensal: 7000 });
console.log(r.primeiraParcela, r.cetAnual, r.aprovado, r.pendencias);
```

> Simulação ilustrativa. Taxas, tarifas e aprovação de crédito reais dependem da análise da instituição financeira.

## QR code

O botão flutuante **Abrir no celular** (canto inferior direito) mostra um QR code com o endereço
do site, além de um botão para copiar o link. No celular, o mesmo botão serve para compartilhar o
simulador com outra pessoa. O QR é gerado no próprio navegador com a biblioteca
[qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), incluída em
`src/vendor/qrcode.js`. Se o repositório mudar de nome, atualize `URL_PUBLICA` em
`src/qrcode-flutuante.js` (usada quando a página é aberta como arquivo local).

## Identidade visual

A página segue o guia de marca Santander ("Basic guidelines"):

- **Cores:** paleta primária oficial em `src/styles.css`: Santander Red `#EC0000`, Boston `#CC0000`,
  London `#990000`, Madrid `#EA6F5D`, Rio `#F5DECF`, Lisbon `#FBF1EA`. Só White, Lisbon, Rio e
  Santander Red são usados como fundo, como o guia determina. O guia não define tema escuro, então a página é sempre clara.
- **Logo:** versão principal positiva no topo (32px; 25px no celular, que é o mínimo do guia) e
  símbolo como ícone da aba. Os arquivos em `assets/` foram extraídos do PDF do guia. Para qualidade
  máxima, substitua pelas artes-finais oficiais (`AF_SANTANDER_PV_POS_RGB.PNG` e
  `AF_SANTANDER_SY_POS_RGB.PNG`) mantendo os mesmos nomes de arquivo.
- **Destaques:** faixa do título e rodapé em Santander Red, com o logo negativo (branco) no rodapé.
- **Cobranding:** o topo já tem o lockup de parceria do guia (p. 9): os dois logos com a mesma
  altura (5 módulos), 4 módulos entre eles e uma linha de 1pt no centro. Para ativar, coloque o
  logo do parceiro em `assets/parceiro-ensino-einstein.png` (PNG com fundo transparente ou SVG),
  descomente a tag `<img class="logo-parceiro">` em `index.html` e remova a classe `sem-parceiro`
  da `div.lockup`.
- **Fonte:** o guia básico não especifica tipografia; a página usa a fonte do sistema.
