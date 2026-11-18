"""Etapa 06: métrica secundária, tempo até concluir (só quem concluiu), Welch."""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy.stats import ttest_ind

SAIDAS = Path(__file__).resolve().parent.parent / "saidas"
usuarios = pd.read_csv(SAIDAS / "usuarios.csv")

# Só quem concluiu: para os demais o tempo até concluir não existe
conc = usuarios[usuarios["concluiu"] == 1]
assert conc["tempo_segundos"].notna().all(), "há concluídos sem tempo"
A = conc.loc[conc["variante"] == "A", "tempo_segundos"]
B = conc.loc[conc["variante"] == "B", "tempo_segundos"]

# 1. Resumo por variante
resumo = pd.DataFrame([{"variante": v, "n": len(s), "media": s.mean(), "mediana": s.median(),
                        "desvio_padrao": s.std()} for v, s in [("A", A), ("B", B)]])

# 2. Welch (variâncias diferentes); ordem B, A => t < 0 se B for mais rápido
t = ttest_ind(B, A, equal_var=False)
testes = pd.DataFrame([{"variante": "B-A", "media": B.mean() - A.mean()},
                       {"variante": "welch", "t": t.statistic, "gl": t.df, "p_valor": t.pvalue}])
res = pd.concat([resumo, testes], ignore_index=True).astype({"n": "Int64"})
res.to_csv(SAIDAS / "resultado_tempo.csv", index=False, float_format="%.6g")
print(res.to_string(index=False, float_format=lambda x: f"{x:.4f}"))

# 3. Histograma sobreposto (mesmos bins, densidade porque os n diferem)
COR = {"A": "#2a78d6", "B": "#eb6834"}
plt.rcParams.update({"axes.spines.top": False, "axes.spines.right": False, "axes.edgecolor": "#8a8984",
                     "axes.labelcolor": "#52514e", "xtick.color": "#52514e", "ytick.color": "#52514e"})
bins = np.histogram_bin_edges(conc["tempo_segundos"], bins=40)
fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
for v, s in [("A", A), ("B", B)]:
    ax.hist(s, bins=bins, density=True, alpha=0.55, color=COR[v], edgecolor="#fcfcfb", linewidth=0.8,
            label=f"{v} (n = {len(s)}, média = {s.mean():.1f} s)".replace(".", ","))
    ax.axvline(s.mean(), color=COR[v], linewidth=2, linestyle="--")
ax.set(title="Tempo até concluir, por variante (métrica secundária; só quem concluiu)",
       xlabel="segundos", ylabel="densidade")
ax.legend(frameon=False); ax.grid(axis="y", color="#e4e3df", linewidth=0.8); ax.set_axisbelow(True)
fig.tight_layout(); fig.savefig(SAIDAS / "tempo_por_variante.png"); plt.close(fig)
