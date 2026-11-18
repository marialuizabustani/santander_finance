"""Etapa 02: estudo exploratório da base bruta. Só descreve; não remove nada."""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from scipy.stats import skew

RAIZ = Path(__file__).resolve().parent.parent
SAIDAS = RAIZ / "saidas"
bruta = pd.read_csv(RAIZ / "entrada" / "experimento_agendamento.csv", dtype=str, keep_default_na=False)

# Conferência de forma: para se divergir do esperado
if bruta.shape != (14392, 8):
    raise SystemExit(f"Forma inesperada: {bruta.shape}; esperado (14392, 8). Parei.")

vazio = bruta == ""  # nulo = campo vazio no CSV
tempo = pd.to_numeric(bruta["tempo_segundos"], errors="coerce")
data = pd.to_datetime(bruta["data"], errors="coerce")
tipos = pd.read_csv(RAIZ / "entrada" / "experimento_agendamento.csv").dtypes  # tipo inferido
L = []  # linhas do relatório
fmt = lambda x: f"{x:,.0f}".replace(",", ".")
pct = lambda a, b: f"{100 * a / b:.1f}%".replace(".", ",")
n = len(bruta)

# 1. Estrutura
L += ["# Estudo da base bruta", "", "Gerado por analise/02_estudo_base.py; nenhum registro foi alterado. Contagens por sessão (linha).", "",
      "## 1. Estrutura", "",
      f"- Linhas: {fmt(n)}; colunas: {bruta.shape[1]}; usuários distintos: {fmt(bruta['usuario_id'].nunique())}",
      f"- Período: {data.min():%d/%m/%Y} a {data.max():%d/%m/%Y} ({data.dt.date.nunique()} dias); "
      f"datas inválidas: {data.isna().sum()}; fora de 02–15/03/2026: "
      f"{((data < '2026-03-02') | (data > '2026-03-15')).sum()}",
      "- Tipos inferidos: " + "; ".join(f"{c} = {tipos[c]}" for c in bruta.columns)]

# 2. Qualidade
nulos = vazio.sum()
conc = bruta["concluiu"]
L += ["", "## 2. Qualidade", "", "| Coluna | Nulos | Situação |", "|---|---|---|"]
for c in bruta.columns[nulos > 0]:
        por_conc = bruta.loc[vazio[c], "concluiu"].value_counts()
        sit = "; ".join(f"concluiu = {k}: {fmt(v)}" for k, v in por_conc.items())
        L.append(f"| {c} | {fmt(nulos[c])} | {sit} (de {fmt((conc == k).sum())} com concluiu = {k}) |"
                 if len(por_conc) == 1 and (k := por_conc.index[0]) else f"| {c} | {fmt(nulos[c])} | {sit} |")
L.append(f"| demais ({', '.join(bruta.columns[nulos == 0])}) | 0 | — |")
dup = bruta.duplicated().sum()
sess_rep = bruta["sessao_id"].duplicated(keep=False)
ids_rep = bruta.loc[sess_rep, "sessao_id"].nunique()
rep_nao_ident = bruta[sess_rep].drop_duplicates()["sessao_id"].duplicated().sum()
tempo_sem_conc = ((conc == "0") & ~vazio["tempo_segundos"]).sum()
conc_sem_tempo = ((conc == "1") & vazio["tempo_segundos"]).sum()
L += ["", f"- Linhas idênticas em todos os campos (excedentes): {fmt(dup)}; sessao_id repetidos: "
      f"{fmt(ids_rep)} IDs em {fmt(sess_rep.sum())} linhas, {rep_nao_ident} com conteúdo diferente",
      f"- Concluiu=1 sem tempo: {conc_sem_tempo}; concluiu=0 com tempo: {tempo_sem_conc}; "
      f"tempo não numérico: {(tempo.isna() & ~vazio['tempo_segundos']).sum()}; tempo ≤ 0: {(tempo <= 0).sum()}"]

# 3. Categóricas
L += ["", "## 3. Variáveis categóricas", "", "| Variável | Valor | n | % |", "|---|---|---|---|"]
for c in ["variante", "dispositivo", "usuario_interno"]:
    for v, k in bruta[c].replace("", "(vazio)").value_counts().items():
        L.append(f"| {c} | {v} | {fmt(k)} | {pct(k, n)} |")

# 4. Numéricas
t = tempo.dropna()
d = t.describe()
br = lambda v, k=1: f"{v:,.{k}f}".replace(",", "X").replace(".", ",").replace("X", ".")
L += ["", "## 4. Variáveis numéricas (tempo_segundos, sessões com tempo)", "",
      "| n | média | mediana | desvio | Q1 | Q3 | mín | máx | assimetria |", "|---|---|---|---|---|---|---|---|---|",
      "| " + " | ".join([fmt(d["count"])] + [br(d[k]) for k in ["mean", "50%", "std", "25%", "75%", "min", "max"]]
                       + [br(skew(t), 2)]) + " |"]
taxa = (conc == "1").sum()
L += ["", f"- Taxa geral de conclusão (A e B juntos, por sessão): {fmt(taxa)} / {fmt(n)} = {pct(taxa, n)}"]

# 5. Distribuições
spu = bruta.groupby("usuario_id").size()
faixa = spu.clip(upper=4).value_counts().sort_index()
L += ["", "## 5. Sessões por usuário e por dia", "",
      f"- Sessões por usuário: média {spu.mean():.2f}, mediana {spu.median():.0f}, máximo {spu.max()}".replace(".", ","),
      "", "| Sessões por usuário | " + " | ".join("4+" if k == 4 else str(k) for k in faixa.index) + " |",
      "|---" * (len(faixa) + 1) + "|",
      "| Usuários | " + " | ".join(f"{fmt(v)} ({pct(v, len(spu))})" for v in faixa) + " |"]
dia = pd.crosstab(bruta["data"], bruta["variante"])
L += ["", "| Data | A | B | Total |", "|---|---|---|---|"]
L += [f"| {pd.Timestamp(i):%d/%m} | {r['A']} | {r['B']} | {r.sum()} |" for i, r in dia.iterrows()]

# 6. Ameaças
interno = bruta["usuario_interno"] == "sim"
int_var = bruta[interno]["variante"].value_counts()
var_por_user = bruta.groupby("usuario_id")["variante"].nunique()
ambos = var_por_user[var_por_user > 1].index
sess_ambos = bruta["usuario_id"].isin(ambos).sum()
L += ["", "## 6. Indícios que ameaçam o experimento", "", "| Variante | Sessões internas | % das sessões da variante |",
      "|---|---|---|"]
L += [f"| {v} | {fmt(int_var.get(v, 0))} | {pct(int_var.get(v, 0), (bruta['variante'] == v).sum())} |" for v in ["A", "B"]]
L += ["", f"- Usuários nas duas variantes: {fmt(len(ambos))} de {fmt(len(spu))} ({pct(len(ambos), len(spu))}), "
      f"somando {fmt(sess_ambos)} sessões ({pct(sess_ambos, n)})"]

# Achados (só entram se o número indicar problema)
A = []
if dup:
    A.append((f"{fmt(dup)} linhas idênticas em todos os campos.", f"bruta.duplicated().sum() = {dup}.",
              "a mesma sessão contaria duas vezes."))
if rep_nao_ident:
    A.append((f"{rep_nao_ident} sessao_id repetidos com conteúdo diferente.", "drop_duplicates + sessao_id.duplicated.",
              "não se sabe qual registro da sessão vale."))
if int_var.sum():
    A.append((f"{fmt(int_var.sum())} sessões de usuários internos ({pct(int_var.sum(), n)}).",
              f"usuario_interno == 'sim' por variante: A = {int_var.get('A', 0)}, B = {int_var.get('B', 0)}.",
              "equipe interna não é paciente e pode pesar diferente em A e B."))
if len(ambos):
    A.append((f"{fmt(len(ambos))} usuários aparecem em A e em B.", f"variante.nunique() > 1 por usuario_id = {len(ambos)}.",
              "a unidade sorteada é o usuário; exposição às duas páginas contamina a comparação."))
if spu.max() > 1:
    A.append((f"{fmt((spu > 1).sum())} usuários com mais de uma sessão (máx. {spu.max()}).",
              "groupby('usuario_id').size() > 1.", "a base é por sessão e o plano é por usuário: é preciso agregar."))
if conc_sem_tempo or tempo_sem_conc:
    A.append(("tempo_segundos inconsistente com concluiu.", f"concluiu=1 sem tempo = {conc_sem_tempo}; "
              f"concluiu=0 com tempo = {tempo_sem_conc}.", "a métrica secundária ficaria enviesada."))
tot_dia = dia.sum(axis=1)
picos = tot_dia[tot_dia > 1.3 * tot_dia.median()]
for i, v in picos.items():
    A.append((f"pico de sessões em {pd.Timestamp(i):%d/%m}: {fmt(v)} (mediana diária {fmt(tot_dia.median())}).",
              "total do dia > 1,3 × mediana diária.", "tráfego atípico (campanha, bot ou falha) pode distorcer o resultado."))
if (data.isna() | (data < "2026-03-02") | (data > "2026-03-15")).any():
    A.append(("datas inválidas ou fora do período.", "pd.to_datetime + filtro 02–15/03.", "sessões fora do desenho."))
L += ["", "## Achados", ""]
for a, e, m in A:
    L += [f"- Achado: {a}", f"  - Evidência: {e}", f"  - Ameaça ao experimento: {m}"]
(SAIDAS / "estudo_base.md").write_text("\n".join(L) + "\n", encoding="utf-8")
print("\n".join(L)); print(f"\n[{len(L)} linhas]")

# Gráficos (paleta de referência: A = azul, B = laranja)
COR = {"A": "#2a78d6", "B": "#eb6834"}
plt.rcParams.update({"axes.spines.top": False, "axes.spines.right": False, "axes.edgecolor": "#8a8984",
                     "axes.labelcolor": "#52514e", "xtick.color": "#52514e", "ytick.color": "#52514e"})
fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
ax.hist(t, bins=40, color=COR["A"], edgecolor="#fcfcfb", linewidth=1)
ax.set(title="Distribuição de tempo_segundos (A e B juntos)", xlabel="segundos", ylabel="sessões")
ax.grid(axis="y", color="#e4e3df", linewidth=0.8); ax.set_axisbelow(True)
fig.tight_layout(); fig.savefig(SAIDAS / "hist_tempo_segundos.png"); plt.close(fig)

fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
x = pd.to_datetime(dia.index)
for v in ["A", "B"]:
    ax.plot(x, dia[v], color=COR[v], linewidth=2, marker="o", markersize=5, label=v)
    ax.annotate(v, (x[-1], dia[v].iloc[-1]), xytext=(6, 0), textcoords="offset points", va="center", color="#52514e")
ax.set(title="Sessões por dia, por variante", ylabel="sessões", ylim=(0, None))
ax.xaxis.set_major_formatter(matplotlib.dates.DateFormatter("%d/%m"))
ax.legend(frameon=False, loc="lower left"); ax.grid(axis="y", color="#e4e3df", linewidth=0.8)
fig.tight_layout(); fig.savefig(SAIDAS / "sessoes_por_dia.png"); plt.close(fig)
