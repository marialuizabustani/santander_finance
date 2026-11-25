# Santander Mobiliza · protótipo acadêmico (não oficial)

> “Sua rotina mostra o caminho. Nós ajudamos você a escolher como percorrê-lo.”

Protótipo navegável que parte da **rotina real de deslocamentos** da pessoa para compará-la, com números
transparentes, a alternativas de mobilidade (elétrico, híbrido, combustão) e formas de pagamento
(à vista, financiamento, leasing, assinatura).

**Projeto independente.** Não altera, não copia e não publica nada no simulador de referência
(`santander_finance`). Todos os veículos, preços, taxas, carregadores, pessoas e propostas são
**fictícios ou hipóteses editáveis**. Não há integração com sistemas do Santander.

---

**Link publicado:** https://marialuizabustani.github.io/santander_finance/mobiliza/
(o simulador original continua em https://marialuizabustani.github.io/santander_finance/).

## Novidades desta versão (feedbacks do Santander)

| Pedido | Onde está |
|---|---|
| Simulador por rotina real (casa → escola → trabalho) | Minha Rotina, que alimenta todas as telas |
| Comparação lado a lado: elétrico 100% × combustão × assinatura ou leasing | Quadro "Lado a lado" no topo do Comparador e resumido no Diagnóstico |
| Manutenção preventiva, IPVA isento/reduzido para elétricos e seguro incluso na assinatura | Linhas do quadro lado a lado, com seletor de IPVA do elétrico (isento, reduzido ou integral) |
| Aba de elétricos com o protagonismo do Santander (50–60% do mercado) | Mobilidade Elétrica: destaque com a fonte (feedback da banca) e catálogo de elétricos |
| Interface do lojista para o balcão (B2B) | Área do Lojista em modo balcão: painel do vendedor, tela do cliente, pacote e "Mostrar ao cliente" em tela cheia |
| Atalho de abertura de conta na jornada | Nova etapa "Conta e taxa", botões na Simulação e no balcão |
| Simulador de rating e taxa bonificada (conta + portabilidade de salário) | Conta e taxa: rating ilustrativo, taxa base × bonificada e parcela antes × depois, aplicado em todo o simulador |
| Modo de demonstração navegável | Botão "Demonstração ao vivo": carrega a persona e abre um roteiro de 10 passos pelas telas reais |
| Chatbot com IA (LLM) | Mobiliza IA híbrida: LLM via OpenRouter, com as regras locais como reserva |

## Mobiliza IA: como o LLM está ligado

```
Navegador (GitHub Pages) ──► Supabase Edge Function "mobiliza-ia" ──► OpenRouter (LLM)
                              chave no secret OPENROUTER_API_KEY
```

* A chave do OpenRouter **não está no código nem no GitHub**: fica só no secret `OPENROUTER_API_KEY` do projeto
  Supabase (Edge Functions → Secrets). Opcional: `OPENROUTER_MODEL` (padrão `openrouter/auto`).
* O site envia a pergunta e **apenas os números calculados pelo simulador**. As regras locais calculam a resposta
  de referência, e o LLM só a explica com outras palavras, com instruções para não inventar valores.
* **Modo híbrido:** sem chave, sem internet ou com erro, as regras locais respondem e a demonstração não trava.
  Cada resposta mostra se veio da IA generativa ou das regras.
* A função aceita só a origem do site (e `localhost`), limita o tamanho das mensagens e o número de pedidos por
  IP. Defina também um **limite de gasto** na chave do OpenRouter.
* Código da função: `supabase/functions/mobiliza-ia/index.ts`. A URL e a chave *publicável* do Supabase ficam em
  `src/assistant/llm.ts` (ambas são públicas por natureza).

## Como executar

Requisitos: Node.js 18 ou superior.

```bash
npm install
npm run dev          # abre em http://localhost:5173
```

Outros comandos:

```bash
npm test                     # testes do motor de cálculo (Vitest)
npm run build                # versão de produção em dist/
npm run build:arquivo-unico  # um único dist-arquivo-unico/index.html, que abre com duplo clique
npm run build:publicar       # atualiza a pasta ../mobiliza publicada pelo GitHub Pages
```

Para a apresentação ao vivo, clique em **“Demonstração ao vivo”** (canto superior direito): a persona fictícia é
carregada e um roteiro de 10 passos conduz pelas telas, com sugestões do que falar em cada uma.

> O fundo do mapa (OpenStreetMap) e o modo “Rotas reais” precisam de internet. Sem internet, pontos,
> trajetos e todos os cálculos continuam funcionando no modo de estimativa.

---

## Jornada principal

**Início → Minha Rotina → Diagnóstico → Comparação → Mobiliza IA → Simulação → Conta e taxa → Próximos passos**

Os dados de cada etapa alimentam as seguintes. Exemplo verificado em teste: 45 km/dia × 22 dias = **990 km/mês**,
usados no combustível, na energia, na manutenção e na franquia da assinatura. Mudou a rotina ou uma premissa,
tudo é recalculado.

## Funcionalidades implementadas

| Área | O que já funciona |
|---|---|
| **Início** | Nome, mensagem, explicação, botão “Descobrir minha mobilidade ideal”, atalhos e aviso de protótipo. |
| **Minha Rotina** | Mapa (Leaflet + OpenStreetMap), lugares (casa, trabalho, escola, mercado, outro) marcados no mapa ou por região, trajetos com várias paradas reordenáveis, dias da semana, km por trajeto com selo de origem (estimativa, rota real ou correção manual), viagens longas, km extras, recarga em casa e km mensal ao vivo. |
| **Roteamento** | Modo **estimativa** (sem rede: linha reta × 1,3) ou **rotas reais** via OSRM, com volta automática para a estimativa se o serviço falhar. |
| **Diagnóstico** | Faixa de uso, maior dia, km semanal, viagens, orçamento editável, aptidão ao elétrico e primeira indicação. |
| **Comparador** | 5 veículos fictícios × 4 modalidades no **mesmo horizonte**: custo médio mensal, custo total, custo por km, gasto mensal, valor inicial, se cabe no orçamento, composição do custo, gráfico de barras, gráfico “e se eu rodar mais?”, premissas editáveis e tabela completa. |
| **Mobiliza IA** | Chat com perguntas sugeridas. As respostas são montadas por regras, **só com números do motor**, com a fonte de cada número e botões de ação. Responde: qual opção combina, economia do elétrico, financiar ou assinar, “e se a km aumentar X%” (recalcula sem alterar seus dados), autonomia e viagens, orçamento, termos e encaminhamento a especialista. |
| **Simulação** | Ajuste de entrada, prazo, juros, IOF/tarifas, valor final do leasing, mensalidade e franquia da assinatura. Mostra como a dívida diminui e explica os termos. |
| **Próximos passos** | Resumo, exportação em `.txt`, impressão e caminhos sugeridos. |
| **Mobilidade Elétrica** | Simulador de autonomia (estrada, ar-condicionado, recarga em casa), compatibilidade com a rotina, recargas por semana, paradas nas viagens, gasto com recarga × gasolina, mapa de **carregadores fictícios** e limitações explicadas. Selos separam dado real, estimativa e dado fictício. |
| **Minha Conta** | Benefícios informativos e condicionais, exemplo **educativo** do efeito da taxa na parcela (sem prometer redução) e manifestação de interesse fictícia, sem CPF. |
| **Área do Lojista** | Atendimento em 6 etapas: loja e vendedor, veículo, necessidade (não sensível), comparação de modalidades, seguro demonstrativo e **proposta fictícia** (código `DEMO-…`) com QR code para o cliente continuar no celular. |
| **Premissas** | Todas as hipóteses editáveis por tecnologia, com botão para restaurar os padrões. |
| **Privacidade** | Não pede localização, CPF, senhas nem dados bancários. Persistência local **opcional** (“Lembrar meus dados”) e botão “Apagar meus dados”. |
| **Acessibilidade e Geração X** | Fonte de 17px, alto contraste, etapas numeradas, termos financeiros explicados ao toque, foco visível, navegação por teclado e layout responsivo (testado em 390px). |

## Arquitetura

```
src/
  engine/          Motor de cálculo PURO (sem React), testado
    tipos.ts         Tipos de rotina, veículos, premissas
    quilometragem.ts Km por trajeto/dia/mês, maior dia, viagens
    financas.ts      Price, saldo devedor, leasing com valor final, depreciação
    custos.ts        Energia, seguro/IPVA ano a ano, custo de cada modalidade, comparação
    eletrico.ts      Autonomia, compatibilidade com a rotina, recarga × combustível
    diagnostico.ts   Faixa de uso e recomendação (menor custo entre as que cabem)
    relacionamento.ts Rating ilustrativo e taxa bonificada
    motor.test.ts    testes do motor (29 no total com os da IA)
  data/            Dados demonstrativos: premissas, veículos e carregadores fictícios, cenário de apresentação
  services/        Roteamento (estimativa/OSRM), persistência local opcional, proposta via URL
  assistant/       Mobiliza IA: interface de provedor, regras (padrão) e integração futura com modelo de IA
  state/           Estado compartilhado (Context) e roteador por hash
  components/      Layout, mapa, QR code, componentes de interface
  pages/           Uma página por área
```

* **React 18 + TypeScript + Vite + Tailwind CSS**, **Leaflet/OpenStreetMap** para mapas, **Recharts** para gráficos
  e **qrcode-generator** para o QR.
* O estado guarda só o que a pessoa informa. Todos os resultados são **derivados** pelo motor a cada mudança.
* **IA preparada para produção** (`src/assistant/llm.ts`): o navegador chamaria um backend próprio, que envia ao
  modelo apenas o contexto estruturado do motor, com instruções para não inventar números. Nenhuma chave fica
  no navegador. Na demonstração, esse provedor fica desligado e não é preciso API paga.

## Como o custo é calculado

Para cada veículo × modalidade, no mesmo horizonte (padrão: 36 meses):

* **Custo total (líquido)** = tudo o que sai do bolso (entrada, parcelas ou mensalidades, valor final do leasing,
  combustível ou energia, seguro, IPVA, manutenção, km excedente) − **o que sobra no fim** (valor de mercado do
  carro menos o saldo devedor). A assinatura não deixa patrimônio.
* **Custo médio mensal** = custo total ÷ meses. **Custo por km** = custo total ÷ (km/mês × meses).
* **Gasto mensal** = parcela ou mensalidade + custos de uso do mês, comparado ao orçamento informado.
* **Recomendação** = menor custo total entre as opções que cabem no orçamento mensal e no valor disponível, e que
  combinam com a rotina (no caso dos elétricos). É determinística: nenhum número é aleatório.

### Hipóteses padrão (todas editáveis em “Premissas”)

| Hipótese | Valor |
|---|---|
| Horizonte | 36 meses |
| Dias no mês | dias da semana × 4,4 (5 dias = 22) |
| Gasolina | R$ 6,20/L |
| Energia em casa / pública | R$ 0,85 / R$ 2,20 por kWh; 90% das recargas em casa (10% sem tomada) |
| Seguro (% do valor ao ano) | elétrico 4,5% · híbrido 4% · combustão 4% |
| IPVA (% ao ano) | elétrico 2% (ou isento, conforme o estado) · híbrido 3% · combustão 4% |
| Manutenção (desgaste) | elétrico R$ 0,05/km · híbrido R$ 0,09/km · combustão R$ 0,12/km |
| Manutenção preventiva (revisões) | elétrico R$ 600/ano · híbrido R$ 900/ano · combustão R$ 1.200/ano |
| Taxa bonificada (ilustrativa) | conta −0,05 p.p. · portabilidade de salário −0,15 p.p. · débito automático −0,03 p.p. · seguro −0,02 p.p. ao mês |
| Depreciação ao ano | elétrico 15% · híbrido 12% · combustão 10% |
| Financiamento | entrada 20%, 1,79% a.m., 48 meses, +3% de IOF/tarifas |
| Leasing | entrada 10%, 1,59% a.m., valor final 30%, prazo = horizonte, sem IOF |
| Assinatura | 2,5% do preço por mês, franquia de 1.500 km, R$ 0,60 por km excedente |
| Elétrico | usa 90% da bateria; planeja com 20% de folga; estrada +20% e ar-condicionado +10% no consumo |
| Rotas estimadas | linha reta × 1,3 |

Simplificações assumidas: não considera rendimento do dinheiro da entrada (custo de oportunidade), inflação,
reajuste de mensalidade nem revenda antes do fim do período.

## Cenário de demonstração

Cláudia (persona fictícia), 48 anos. Casa → escola do filho → trabalho e trabalho → supermercado → casa, cerca de
**42 km/dia em 22 dias** (estimativa). Viagens à família (420 km, 6×/ano) e à praia (160 km, 4×/ano), mais 150 km
extras, somando **≈ 1.334 km/mês**. Tem recarga em casa, orçamento de R$ 3.800/mês e R$ 40.000 disponíveis. Está
em dúvida entre combustão e elétrico e quer comparar financiamento e assinatura.

## Integrações necessárias para uma versão de produção

1. **Serviço de rotas e geocodificação** próprios ou contratados (o OSRM público é só para demonstração), com busca de endereço.
2. **Base de carregadores** real (dados públicos ou parceiros), com potência, conector e disponibilidade.
3. **Catálogo de veículos e preços** (tabela de referência, montadoras e plataformas parceiras de venda).
4. **Motor de crédito e precificação do banco**: taxas, CET, análise e aprovação, via APIs internas.
5. **Cotação de seguro** com a seguradora parceira.
6. **Abertura de conta e onboarding** (KYC, LGPD, autenticação).
7. **Sistemas de concessionárias e marketplaces** para levar a jornada do lojista e continuar a proposta no celular com segurança (sem dados na URL).
8. **Modelo de IA** atrás de um backend próprio, com validação das respostas, registro e monitoramento.
9. **Consentimento, LGPD e segurança**: base legal, criptografia, retenção, auditoria e testes de acessibilidade com usuários reais.

## Feedbacks dos avaliadores e onde eles aparecem

| Feedback | Como foi incorporado |
|---|---|
| Simular pela rotina real (escola, trabalho) e comparar elétrico × combustão × leasing/assinatura com IPVA, seguro e manutenção | Minha Rotina, que alimenta o Comparador com todos esses custos no mesmo horizonte |
| “Opção A com elétrico”: aba ou foco específico para elétricos | Área **Mobilidade Elétrica**, também presente no diagnóstico e na IA |
| Prever abertura de conta; o relacionamento pode influenciar a análise | **Minha Conta**: educativa e condicional, sem prometer taxa |
| Centralidade do lojista (B2B) e da experiência na loja | **Área do Lojista**, com proposta e continuidade por QR code |
| Atendimento resolutivo com IA integrada aos dados | **Mobiliza IA** responde com os números da própria pessoa, sem repetir informações |
| Dores da Geração X: autonomia em estrada e falta de recarga | Paradas por viagem, autonomia segura com folga, mapa de carregadores e explicações |
| Valorizar o produto e demonstrar ao vivo | Botão “Carregar cenário demonstrativo” e jornada guiada em 6 etapas |
