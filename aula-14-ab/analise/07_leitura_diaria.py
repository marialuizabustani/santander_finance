"""Etapa 07: risco de olhar o p-valor todo dia (dados reais + simulação A/A)."""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy.stats import chi2_contingency, norm

SAIDAS = Path(__file__).resolve().parent.parent / "saidas"
ALFA = 0.05

# Parte 1: qui-quadrado sobre o acumulado por primeira_data
usuarios = pd.read_csv(SAIDAS / "usuarios.csv", parse_dates=["primeira_data"])
linhas = []
for dia in sorted(usuarios["primeira_data"].unique()):
    acum = usuarios[usuarios["primeira_data"] <= dia]
    tab = pd.crosstab(acum["variante"], acum["concluiu"]).reindex(index=["A", "B"], columns=[0, 1], fill_value=0)
    p = chi2_contingency(tab, correction=False)[1]
    linhas.append({"dia": pd.Timestamp(dia).date(), "usuarios": len(acum), "usuarios_A": tab.loc["A"].sum(),
                   "usuarios_B": tab.loc["B"].sum(), "p_valor": p})
diario = pd.DataFrame(linhas)
diario.to_csv(SAIDAS / "p_valor_diario.csv", index=False, float_format="%.6g")
print(diario.to_string(index=False, float_format=lambda x: f"{x:.4f}"))

plt.rcParams.update({"axes.spines.top": False, "axes.spines.right": False, "axes.edgecolor": "#8a8984",
                     "axes.labelcolor": "#52514e", "xtick.color": "#52514e", "ytick.color": "#52514e"})
fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
ax.plot(pd.to_datetime(diario["dia"]), diario["p_valor"], color="#2a78d6", linewidth=2, marker="o", markersize=5)
ax.axhline(ALFA, color="#52514e", linewidth=1.2, linestyle="--")
ax.annotate("p = 0,05", (pd.to_datetime(diario["dia"]).iloc[7], ALFA), xytext=(0, 5),
            textcoords="offset points", color="#52514e", fontsize=9, ha="center")
ax.set(title="p-valor da conclusão (B vs A) sobre os usuários acumulados", ylabel="p-valor", ylim=(0, 1))
ax.xaxis.set_major_formatter(matplotlib.dates.DateFormatter("%d/%m"))
ax.grid(axis="y", color="#e4e3df", linewidth=0.8); ax.set_axisbelow(True)
fig.tight_layout(); fig.savefig(SAIDAS / "p_valor_diario.png"); plt.close(fig)

# Parte 2: 2.000 testes A/A, 40% nas duas páginas, 371 usuários/grupo/dia, 14 dias
rng = np.random.default_rng(14)
N_SIM, DIAS, N_DIA, P = 2000, 14, 371, 0.40
conc = rng.binomial(N_DIA, P, size=(N_SIM, DIAS, 2)).cumsum(axis=1)  # concluídos acumulados
n = N_DIA * np.arange(1, DIAS + 1)[None, :]                           # n acumulado por grupo
pa, pb = conc[..., 0] / n, conc[..., 1] / n
pbar = (conc[..., 0] + conc[..., 1]) / (2 * n)
z = (pb - pa) / np.sqrt(pbar * (1 - pbar) * (2 / n))                # teste z com proporção combinada
pval = 2 * norm.sf(np.abs(z))
ultimo = (pval[:, -1] < ALFA).mean()
algum = (pval < ALFA).any(axis=1).mean()
pd.DataFrame([{"criterio": "p<0,05 no último dia", "proporcao": ultimo},
              {"criterio": "p<0,05 em pelo menos um dos 14 dias", "proporcao": algum}]).to_csv(
    SAIDAS / "simulacao_aa.csv", index=False, float_format="%.4f")
print(f"\nA/A ({N_SIM} simulações): último dia = {ultimo:.2%}; algum dia = {algum:.2%}")
print(f"Usuários por grupo ao fim da simulação: {N_DIA * DIAS} (plano: 4234)")
