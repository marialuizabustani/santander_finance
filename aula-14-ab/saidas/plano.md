# Plano do teste A/B: página de agendamento

| Item | Definição |
|---|---|
| Variantes | A = página atual (controle); B = nova página (tratamento) |
| Pergunta de negócio | B aumenta a proporção de pacientes que concluem o agendamento? |
| Hipótese | H0: p_B = p_A; H1: p_B ≠ p_A (teste bicaudal) |
| Unidade sorteada | usuário |
| Métrica primária | proporção de usuários que concluíram o agendamento |
| Métrica secundária | tempo até concluir, entre quem concluiu |
| Taxa histórica (A) | 40% |
| Efeito mínimo | +3 pontos percentuais (de 40% para 43%) |
| Alfa | 5% |
| Poder | 80% |
| Duração | 14 dias, de 02/03/2026 a 15/03/2026 |

## Tamanho amostral

- z(1-α/2) = 1.9600; z(1-β) = 0.8416; p̄ = 0.415
- n exato = 4233.29 → **4.234 usuários por grupo** (8.468 no total)
