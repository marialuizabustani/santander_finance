# Registro de prompts

## 2026-11-18: Etapa 0, preparação do ambiente
**Prompt:** preparar o ambiente e escrever as regras do projeto, sem analisar
dados. (1) Criar CLAUDE.md com as regras: entrada/ somente leitura; uma etapa,
um script analise/NN_nome.py executado com o Python da .venv, gravando em
saidas/; todo número citado vem de um script executado; regras de limpeza
independentes do resultado e iguais para A e B; registrar cada prompt em
prompts.md com data e arquivos gerados. (2) Verificar Python >= 3.10, criar
.venv e instalar pandas, numpy, scipy e matplotlib, sem instalar nada fora da
.venv. (3) Conferir entrada/experimento_agendamento.csv: esperado 14.392
linhas de dados, 8 colunas e SHA-256 iniciado por 3b6b13db; parar se divergir.
Mostrar o plano e esperar o ok antes de instalar.

**Arquivos gerados:** CLAUDE.md, .gitignore, .venv/, entrada/experimento_agendamento.csv
(cópia do upload, somente leitura), prompts.md.

## 2026-11-18: Etapa 1, plano do teste e tamanho amostral
**Prompt:** como estatístico de experimentos, registrar o plano do teste A/B
e calcular o tamanho amostral sem abrir a base. Criar saidas/plano.md (pergunta,
hipótese, unidade sorteada, métricas primária e secundária, efeito mínimo, alfa,
poder, duração) e analise/01_tamanho_amostral.py (duas proporções, bicaudal,
scipy.stats.norm, sem statsmodels, arredondar para cima), acrescentando o
resultado ao fim do plano. Dados: A = página atual, B = nova página; taxa
histórica de 40%; efeito mínimo de 3 p.p.; alfa de 5%; poder de 80%; 14 dias,
de 02 a 15/03/2026; métrica secundária: tempo até concluir, entre quem concluiu.
Esperado: 4.234 usuários por grupo. Não ler nada em entrada/.

**Arquivos gerados:** saidas/plano.md, analise/01_tamanho_amostral.py.

## 2026-11-18: Etapa 2, estudo exploratório da base bruta
**Prompt:** como analista de dados, fazer o estudo exploratório da base bruta,
descrevendo e medindo sem remover nem corrigir nada. Criar
analise/02_estudo_base.py, que lê entrada/experimento_agendamento.csv e grava
saidas/estudo_base.md com: (1) estrutura (linhas, colunas, tipos, período,
usuários distintos); (2) qualidade (nulos por coluna e em que situação
aparecem, linhas duplicadas, sessao_id repetido); (3) frequência e % de
variante, dispositivo e usuario_interno; (4) média, mediana, desvio, quartis,
mín, máx e assimetria de tempo_segundos e taxa geral de conclusão;
(5) sessões por usuário e por dia; (6) ameaças: sessões internas por variante
e usuários nas duas variantes. Gravar o histograma de tempo_segundos e o
gráfico de sessões por dia (uma linha por variante). Esperado: 14.392 linhas e
8 colunas; parar se divergir. Não comparar a conclusão de A e B; não ler o
README da pasta de dados; usar só números do script. Relatório com até 90
linhas, terminando na lista de achados (Achado / Evidência / Ameaça).

**Arquivos gerados:** analise/02_estudo_base.py, saidas/estudo_base.md,
saidas/hist_tempo_segundos.png, saidas/sessoes_por_dia.png.

## 2026-11-18: Etapa 3, limpeza
**Prompt:** aplicar as regras de limpeza do desenho, sem propor regras novas
nem mudar a ordem. Criar analise/03_limpeza.py, que lê o CSV bruto e aplica,
nesta ordem, mostrando as linhas antes e depois de cada regra: (1) remover
linhas duplicadas; (2) excluir sessões com usuario_interno = "sim";
(3) excluir todas as sessões de usuários nas duas variantes; (4) agregar uma
linha por usuario_id com variante, dispositivo, primeira_data, concluiu (máx.)
e tempo_segundos (máx.). Gravar saidas/regras_de_limpeza.csv e
saidas/usuarios.csv. Esperado: 14.152, 13.516 e 13.044 sessões e 10.400
usuários; se divergir, investigar o caminho, o filtro e a ordem, sem ajustar a
regra. Regras iguais para A e B; entrada/ não é alterada.
Decisão confirmada pela usuária: dispositivo = o da primeira sessão (por data
e, no empate, por sessao_id); regra 3 aplicada sobre a base após a regra 2.

**Arquivos gerados:** analise/03_limpeza.py, saidas/regras_de_limpeza.csv,
saidas/usuarios.csv.

## 2026-11-18: Etapa 4, checagem de SRM
**Prompt:** conferir se o sorteio foi respeitado antes de comparar resultados.
Criar analise/04_srm.py, que aplica scipy.stats.chisquare à contagem por
variante nas sessões da base bruta e nos usuários de saidas/usuarios.csv, com
divisão esperada de 50/50; gravar saidas/srm.csv (duas linhas) e mostrar as
contagens e os p-valores lado a lado, com as sessões internas por variante na
base bruta como evidência. Alarme de SRM com p < 0,01; se disparar na base
limpa, parar e não prosseguir para os testes das métricas. Não calcular taxas
de conclusão.

**Arquivos gerados:** analise/04_srm.py, saidas/srm.csv, saidas/srm_internos.csv.

## 2026-11-18: Etapa 5, métrica primária (taxa de conclusão)
**Prompt:** testar a métrica primária e relatar a evidência, sem recomendar.
Criar analise/05_conclusao.py, que usa saidas/usuarios.csv para: (1) taxa de
conclusão por variante e diferença B − A em p.p.; (2) tabela variante ×
concluiu com scipy.stats.chi2_contingency(correction=False); (3) IC 95% da
diferença pela aproximação normal; (4) para comparação, taxa por sessão na
base bruta sem limpeza. Gravar saidas/resultado_primario.csv. Esperado: 40,5%
em A, 42,8% em B, p ≈ 0,019. Sem Yates; comparar o IC com o efeito mínimo de
3 p.p. de saidas/plano.md; não dizer que B é melhor sem citar o IC.
Executado após ok da usuária, junto com a etapa 6.

**Arquivos gerados:** analise/05_conclusao.py, saidas/resultado_primario.csv.

## 2026-11-18: Etapa 6, métrica secundária (tempo até concluir)
**Prompt:** testar a métrica secundária. Criar analise/06_tempo.py, que filtra
em saidas/usuarios.csv quem concluiu e: (1) mostra n, média, mediana e desvio
padrão de tempo_segundos por variante; (2) aplica
scipy.stats.ttest_ind(B, A, equal_var=False); (3) grava o histograma
sobreposto em saidas/tempo_por_variante.png e a tabela em
saidas/resultado_tempo.csv. Esperado: média de 322,5 s em A e 292,6 s em B.
Não usar o teste t com variâncias iguais; lembrar que é a métrica secundária.

**Arquivos gerados:** analise/06_tempo.py, saidas/resultado_tempo.csv,
saidas/tempo_por_variante.png.

## 2026-11-18: Etapa 7, leitura diária do p-valor
**Prompt:** mostrar o risco de decidir um teste A/B olhando o p-valor todos os
dias. Criar analise/07_leitura_diaria.py com duas partes: (1) para cada dia,
recalcular o qui-quadrado da conclusão (correction=False) com os usuários cuja
primeira_data é até aquele dia; gravar saidas/p_valor_diario.csv e
saidas/p_valor_diario.png com uma linha horizontal em 0,05; (2) simular 2.000
testes A/A com numpy.random.default_rng(14) (40% nas duas páginas, 371
usuários por grupo por dia, 14 dias, teste z de duas proporções sobre o
acumulado) e calcular a proporção com p < 0,05 só no último dia e em pelo
menos um dos 14 dias. Esperado: p de 0,516 no 5º dia e 0,019 no 14º; ~5% no
último dia e ~22% em algum dia. Não alterar a duração nem o tamanho amostral.

**Arquivos gerados:** analise/07_leitura_diaria.py, saidas/p_valor_diario.csv,
saidas/p_valor_diario.png, saidas/simulacao_aa.csv.
