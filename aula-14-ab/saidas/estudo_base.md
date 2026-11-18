# Estudo da base bruta

Gerado por analise/02_estudo_base.py; nenhum registro foi alterado. Contagens por sessão (linha).

## 1. Estrutura

- Linhas: 14.392; colunas: 8; usuários distintos: 10.575
- Período: 02/03/2026 a 15/03/2026 (14 dias); datas inválidas: 0; fora de 02–15/03/2026: 0
- Tipos inferidos: sessao_id = str; usuario_id = str; data = str; variante = str; dispositivo = str; usuario_interno = str; concluiu = int64; tempo_segundos = float64

## 2. Qualidade

| Coluna | Nulos | Situação |
|---|---|---|
| tempo_segundos | 9.363 | concluiu = 0: 9.363 (de 9.363 com concluiu = 0) |
| demais (sessao_id, usuario_id, data, variante, dispositivo, usuario_interno, concluiu) | 0 | — |

- Linhas idênticas em todos os campos (excedentes): 240; sessao_id repetidos: 240 IDs em 480 linhas, 0 com conteúdo diferente
- Concluiu=1 sem tempo: 0; concluiu=0 com tempo: 0; tempo não numérico: 0; tempo ≤ 0: 0

## 3. Variáveis categóricas

| Variável | Valor | n | % |
|---|---|---|---|
| variante | B | 7.418 | 51,5% |
| variante | A | 6.974 | 48,5% |
| dispositivo | celular | 8.832 | 61,4% |
| dispositivo | computador | 5.560 | 38,6% |
| usuario_interno | nao | 13.750 | 95,5% |
| usuario_interno | sim | 642 | 4,5% |

## 4. Variáveis numéricas (tempo_segundos, sessões com tempo)

| n | média | mediana | desvio | Q1 | Q3 | mín | máx | assimetria |
|---|---|---|---|---|---|---|---|---|
| 5.029 | 279,2 | 257,0 | 156,7 | 176,0 | 359,0 | 14,0 | 1.512,0 | 1,16 |

- Taxa geral de conclusão (A e B juntos, por sessão): 5.029 / 14.392 = 34,9%

## 5. Sessões por usuário e por dia

- Sessões por usuário: média 1,36, mediana 1, máximo 50

| Sessões por usuário | 1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| Usuários | 8.130 (76,9%) | 1.757 (16,6%) | 588 (5,6%) | 100 (0,9%) |

| Data | A | B | Total |
|---|---|---|---|
| 02/03 | 402 | 468 | 870 |
| 03/03 | 414 | 464 | 878 |
| 04/03 | 444 | 453 | 897 |
| 05/03 | 485 | 558 | 1043 |
| 06/03 | 507 | 572 | 1079 |
| 07/03 | 498 | 508 | 1006 |
| 08/03 | 516 | 524 | 1040 |
| 09/03 | 532 | 506 | 1038 |
| 10/03 | 491 | 538 | 1029 |
| 11/03 | 502 | 523 | 1025 |
| 12/03 | 525 | 529 | 1054 |
| 13/03 | 469 | 498 | 967 |
| 14/03 | 499 | 508 | 1007 |
| 15/03 | 690 | 769 | 1459 |

## 6. Indícios que ameaçam o experimento

| Variante | Sessões internas | % das sessões da variante |
|---|---|---|
| A | 54 | 0,8% |
| B | 588 | 7,9% |

- Usuários nas duas variantes: 175 de 10.575 (1,7%), somando 1.122 sessões (7,8%)

## Achados

- Achado: 240 linhas idênticas em todos os campos.
  - Evidência: bruta.duplicated().sum() = 240.
  - Ameaça ao experimento: a mesma sessão contaria duas vezes.
- Achado: 642 sessões de usuários internos (4,5%).
  - Evidência: usuario_interno == 'sim' por variante: A = 54, B = 588.
  - Ameaça ao experimento: equipe interna não é paciente e pode pesar diferente em A e B.
- Achado: 175 usuários aparecem em A e em B.
  - Evidência: variante.nunique() > 1 por usuario_id = 175.
  - Ameaça ao experimento: a unidade sorteada é o usuário; exposição às duas páginas contamina a comparação.
- Achado: 2.445 usuários com mais de uma sessão (máx. 50).
  - Evidência: groupby('usuario_id').size() > 1.
  - Ameaça ao experimento: a base é por sessão e o plano é por usuário: é preciso agregar.
- Achado: pico de sessões em 15/03: 1.459 (mediana diária 1.027).
  - Evidência: total do dia > 1,3 × mediana diária.
  - Ameaça ao experimento: tráfego atípico (campanha, bot ou falha) pode distorcer o resultado.
