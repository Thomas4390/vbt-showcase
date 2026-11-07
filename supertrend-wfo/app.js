// Explorateur bilingue des 9 797 backtests SuperTrend. Aucune dépendance.
const meta = await (await fetch("data/meta.json")).json();
const ins = meta.insights;
const P = meta.periods, M = meta.multipliers, NP = P.length, NM = M.length, NW = meta.windows.length;
const DAYS = meta.days.map((d) => new Date(d + "T00:00:00"));
const [LO, HI] = meta.eq_range;
const spyEq = meta.spy_equity_x1e4.map((v) => v / 1e4);
const $ = (id) => document.getElementById(id);
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

// ------------------------------------------------------------- langue
const I18N = {
  fr: {
    nav_all: "Toutes les démonstrations",
    h1: "9 797 backtests SuperTrend. <em>La meilleure combinaison change à chaque trimestre.</em>",
    lead: "Chaque case de la carte est un backtest complet sur SPY, de 2019 à 2026. Choisissez un trimestre, cliquez sur une case, puis descendez : quatre analyses montrent pourquoi optimiser sur le passé ne suffit pas.",
    s1_title: "Explorez chaque backtest",
    s1_text: "La carte montre le Sharpe de chaque combinaison période et multiplicateur. Changez de trimestre avec les flèches du clavier ou le menu. Le carré blanc marque le meilleur réglage de la vue.",
    map_title: "Sharpe de chaque combinaison", prev: "Trimestre précédent", next: "Trimestre suivant", window: "Période affichée",
    leg_sharpe: "Sharpe annualisé", leg_best: "meilleure case de la vue", selected: "Combinaison sélectionnée",
    lg_strategy: "Stratégie", lg_spy: "SPY acheté et conservé", lg_window: "Trimestre affiché",
    s2_title: "Le gagnant d'un trimestre ne tient pas au suivant",
    s2_text: "Pour chaque trimestre, prenez la meilleure combinaison, puis regardez son classement au trimestre suivant. Un réglage tiré au hasard finit en moyenne au 50e centile.",
    rank_title: "Rang du gagnant au trimestre suivant", rank_sub: "Centile parmi les 9 797 combinaisons. 100 = encore le meilleur.",
    path_title: "Trajectoire des gagnants", path_sub: "Position du meilleur réglage, trimestre après trimestre.",
    table_title: "Les 28 gagnants. Cliquez sur une ligne pour l'ouvrir dans la carte.",
    s3_title: "Rejouer l'optimisation",
    s3_text: "Cinq façons de choisir le réglage, sur la même période (T2 2019 à T4 2025). Seule la courbe émeraude est réalisable en temps réel : elle tient le gagnant du trimestre précédent.",
    s4_title: "Aucune case n'est robuste",
    freq_title: "Fréquence dans les 10 % meilleurs", freq_sub: "Part des 28 trimestres où chaque combinaison est dans le premier décile.",
    disp_title: "Dispersion des Sharpe par trimestre", disp_sub: "Le même réglage peut gagner ou perdre selon le régime du marché.",
    lg_band: "10e à 90e centile", lg_median: "médiane", lg_max: "meilleure combinaison",
    method_title: "Méthode",
    warn: "Illustration pédagogique. Pas un conseil en placement. Pas un rendement de Synerqo. Les performances passées ne préjugent pas des performances futures.",
    all_period: "Toute la période", all_period_long: "Toute la période, de janvier 2019 à février 2026", quarter: "Trimestre",
    period: "période", mult: "multiplicateur", period_atr: "période ATR",
    m_full: "Sharpe, toute la période", m_ret: "Rendement total", m_dd: "Perte maximale", m_orders: "Ordres exécutés",
    m_spy: "Sharpe de SPY", m_days: "Jours de bourse", m_qsharpe: (w) => `Sharpe en ${w}`, m_qrank: (w) => `Rang en ${w}`,
    centile: (x) => `${x}e centile`, strategy: "Stratégie",
    stats: (s, f) => [
      [`${s.winner_changes}/${s.n_windows - 1}`, `changements de gagnant d'un trimestre au suivant (${s.distinct_winners} gagnants distincts en ${s.n_windows} trimestres)`],
      [`${Math.round(s.rank_median)}e`, "centile médian du gagnant au trimestre suivant. Le hasard donne le 50e."],
      [f(ins.summary.walk_forward.sharpe), `Sharpe réel de « tenir le gagnant du trimestre précédent », contre ${f(ins.summary.oracle.sharpe)} pour l'oracle`],
      [`${f(s.grid_seconds)} s`, `pour calculer les ${s.n_backtests.toLocaleString("fr-FR")} backtests (médiane de 7 exécutions)`],
    ],
    th: ["Trimestre", "Période", "Multiplicateur", "Sharpe", "Sharpe au suivant", "Rang au suivant"],
    rth: ["Choix du réglage", "Réglage", "Sharpe", "Rendement total", "Perte maximale"],
    curves: {
      oracle: ["Oracle", "gagnant de chaque trimestre connu d'avance (impossible)"],
      hindsight: ["Après coup", "meilleur réglage sur toute la période, choisi à la fin"],
      spy: ["SPY", "acheté et conservé"],
      walk_forward: ["Walk-forward", "gagnant du trimestre précédent (réalisable)"],
      median: ["Médiane", "combinaison au Sharpe médian"],
    },
    varies: "change chaque trimestre", random: "hasard", top10: "10 % meilleurs",
    s4_text: (f, p) => `Aucune combinaison n'entre dans le premier décile plus de ${f} des trimestres. La plus régulière (${p}) échoue donc au moins deux trimestres sur trois.`,
    method: (s) => [
      "Données SPY à la minute, heures de marché, regroupées en barres de 1 h, du 2 janvier 2019 au 13 février 2026 (12 485 barres).",
      "SuperTrend du tutoriel « SuperFast SuperTrend » de VectorBT PRO, simulateur Numba sur mesure. Long seulement, frais de 0,5 point de base par ordre, ordre exécuté à la clôture de la barre qui suit le signal.",
      "Grille : période de 4 à 100 par pas de 1, multiplicateur de 1 à 6 par pas de 0,05. Soit 97 x 101 = 9 797 backtests continus, découpés ensuite en 28 trimestres (T1 2019 à T4 2025).",
      "Sharpe trimestriel annualisé sur 252 jours. Le rang d'un gagnant au trimestre suivant est la part des combinaisons strictement moins bonnes.",
      "Contrôles : l'équité du simulateur égale celle de vbt.Portfolio.from_signals (tolérance relative 1e-9), et un test vérifie l'absence de biais d'anticipation.",
      `Temps de calcul de la grille : ${s.grid_seconds.toLocaleString("fr-FR")} s, médiane de 7 exécutions après compilation, ${s.threads} threads, ${s.cpu}, VectorBT PRO ${s.vectorbtpro}.`,
    ],
  },
  en: {
    nav_all: "All demos",
    h1: "9,797 SuperTrend backtests. <em>The best parameter set changes every quarter.</em>",
    lead: "Each cell of the map is a full backtest on SPY, from 2019 to 2026. Pick a quarter, click a cell, then scroll down: four analyses show why optimizing on the past is not enough.",
    s1_title: "Explore every backtest",
    s1_text: "The map shows the Sharpe ratio of every period and multiplier combination. Change the quarter with the arrow keys or the menu. The white square marks the best setting in view.",
    map_title: "Sharpe ratio of every combination", prev: "Previous quarter", next: "Next quarter", window: "Displayed period",
    leg_sharpe: "Annualized Sharpe ratio", leg_best: "best cell in view", selected: "Selected combination",
    lg_strategy: "Strategy", lg_spy: "SPY buy and hold", lg_window: "Displayed quarter",
    s2_title: "A quarter's winner does not hold the next quarter",
    s2_text: "For each quarter, take the best combination, then look at its rank the following quarter. A setting picked at random lands on the 50th percentile on average.",
    rank_title: "Winner's rank the next quarter", rank_sub: "Percentile among the 9,797 combinations. 100 = still the best.",
    path_title: "Path of the winners", path_sub: "Location of the best setting, quarter after quarter.",
    table_title: "The 28 winners. Click a row to open it in the map.",
    s3_title: "Replay the optimization",
    s3_text: "Five ways to pick the setting, over the same period (Q2 2019 to Q4 2025). Only the emerald curve is achievable in real time: it holds the previous quarter's winner.",
    s4_title: "No cell is robust",
    freq_title: "Frequency in the top 10%", freq_sub: "Share of the 28 quarters in which each combination ranks in the top decile.",
    disp_title: "Sharpe dispersion per quarter", disp_sub: "The same setting can win or lose depending on the market regime.",
    lg_band: "10th to 90th percentile", lg_median: "median", lg_max: "best combination",
    method_title: "Method",
    warn: "Educational illustration. Not investment advice. Not a Synerqo return. Past performance does not guarantee future results.",
    all_period: "Full period", all_period_long: "Full period, January 2019 to February 2026", quarter: "Quarter",
    period: "period", mult: "multiplier", period_atr: "ATR period",
    m_full: "Sharpe, full period", m_ret: "Total return", m_dd: "Max drawdown", m_orders: "Orders filled",
    m_spy: "SPY Sharpe", m_days: "Trading days", m_qsharpe: (w) => `Sharpe in ${w}`, m_qrank: (w) => `Rank in ${w}`,
    centile: (x) => `${x}${ordinal(x)} percentile`, strategy: "Strategy",
    stats: (s, f) => [
      [`${s.winner_changes}/${s.n_windows - 1}`, `quarter-to-quarter changes of winner (${s.distinct_winners} distinct winners in ${s.n_windows} quarters)`],
      [`${Math.round(s.rank_median)}${ordinal(Math.round(s.rank_median))}`, "median percentile of the winner the next quarter. Chance gives the 50th."],
      [f(ins.summary.walk_forward.sharpe), `real Sharpe of "hold last quarter's winner", against ${f(ins.summary.oracle.sharpe)} for the oracle`],
      [`${f(s.grid_seconds)} s`, `to compute the ${s.n_backtests.toLocaleString("en-US")} backtests (median of 7 runs)`],
    ],
    th: ["Quarter", "Period", "Multiplier", "Sharpe", "Next Sharpe", "Next rank"],
    rth: ["How the setting is picked", "Setting", "Sharpe", "Total return", "Max drawdown"],
    curves: {
      oracle: ["Oracle", "each quarter's winner known in advance (impossible)"],
      hindsight: ["Hindsight", "best setting over the whole period, picked at the end"],
      spy: ["SPY", "buy and hold"],
      walk_forward: ["Walk-forward", "previous quarter's winner (achievable)"],
      median: ["Median", "combination with the median Sharpe"],
    },
    varies: "changes every quarter", random: "chance", top10: "top 10%",
    s4_text: (f, p) => `No combination ranks in the top decile in more than ${f} of quarters. The most consistent one (${p}) therefore fails at least two quarters out of three.`,
    method: (s) => [
      "SPY minute data, regular trading hours, grouped into 1-hour bars, from January 2, 2019 to February 13, 2026 (12,485 bars).",
      "SuperTrend from the VectorBT PRO \"SuperFast SuperTrend\" tutorial, custom Numba simulator. Long only, 0.5 basis point fee per order, order filled at the close of the bar after the signal.",
      "Grid: period from 4 to 100 in steps of 1, multiplier from 1 to 6 in steps of 0.05. That is 97 x 101 = 9,797 continuous backtests, then split into 28 quarters (Q1 2019 to Q4 2025).",
      "Quarterly Sharpe annualized over 252 days. A winner's next-quarter rank is the share of combinations that are strictly worse.",
      "Checks: the simulator equity matches vbt.Portfolio.from_signals (relative tolerance 1e-9), and a test rules out look-ahead bias.",
      `Grid compute time: ${s.grid_seconds} s, median of 7 runs after compilation, ${s.threads} threads, ${s.cpu}, VectorBT PRO ${s.vectorbtpro}.`,
    ],
  },
};
const ordinal = (n) => (n % 100 >= 11 && n % 100 <= 13 ? "th" : { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
const qs = new URLSearchParams(location.search);
let LANG = qs.get("lang") || localStorage.getItem("lang") || (navigator.language.startsWith("fr") ? "fr" : "en");
if (!I18N[LANG]) LANG = "fr";
let T = I18N[LANG], LOCALE = LANG === "fr" ? "fr-FR" : "en-US";
const fmt = (x, d = 2) => x.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });
const sgn = (x, d = 2) => (x >= 0 ? "+" : "−") + fmt(Math.abs(x), d);
const pct = (x, d = 1) => sgn(x * 100, d) + (LANG === "fr" ? " %" : "%");
const qlabel = (w) => (LANG === "en" ? w.replace("T", "Q") : w);
const dateL = (d) => d.toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// ------------------------------------------------------------- couleurs (palette validée)
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const NEG = hex("#e97c48"), MID = hex("#494e52"), POS = hex("#00c896");
const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
function diverging(s, zmax) {
  const u = Math.max(-1, Math.min(1, s / zmax));
  return u >= 0 ? mix(MID, POS, Math.pow(u, 0.75)) : mix(MID, NEG, Math.pow(-u, 0.75));
}
const sequential = (u) => mix(hex("#24282c"), POS, Math.max(0, Math.min(1, u)));

// ------------------------------------------------------------- données
const state = { w: -1, p: 10, m: 3.0 };
const cache = new Map();
const idx = (pi, mi) => pi * NM + mi;
const miOf = (m) => M.findIndex((v) => Math.abs(v - m) < 1e-9);
function values(w) {
  return w < 0 ? meta.sharpe_full_x1000.map((v) => v / 1000)
    : meta.window_sharpe_x1000.slice(w * NP * NM, (w + 1) * NP * NM).map((v) => v / 1000);
}
function zmaxOf(vals) {
  const s = [...vals].map(Math.abs).sort((a, b) => a - b);
  return Math.max(0.5, Math.ceil(s[Math.floor(s.length * 0.98)] * 2) / 2);
}
async function curve(p, mi) {
  if (!cache.has(p)) cache.set(p, new Uint16Array(await (await fetch(`data/eq/p${p}.bin`)).arrayBuffer()));
  const q = cache.get(p), n = DAYS.length;
  return Array.from(q.subarray(mi * n, (mi + 1) * n), (v) => Math.exp((v / 65535) * (HI - LO) + LO));
}

// ------------------------------------------------------------- canvas utilitaires
function setup(canvas, h) {
  const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = "11px 'JetBrains Mono', monospace";
  return { ctx, w, h };
}
function showTip(id, html, x, y, w) {
  const tip = $(id);
  tip.hidden = false;
  tip.innerHTML = html;
  tip.style.left = `${Math.min(x + 14, w - 190)}px`;
  tip.style.top = `${Math.max(y - 70, 0)}px`;
}
const hideTip = (id) => ($(id).hidden = true);

// ------------------------------------------------------------- carte générique période x multiplicateur
const PAD = { l: 44, r: 8, t: 8, b: 34 };
function drawGrid(canvas, colorOf, marks = []) {
  const w = canvas.clientWidth;
  const { ctx, h } = setup(canvas, Math.round((w - PAD.l - PAD.r) * 0.82) + PAD.t + PAD.b);
  const cw = (w - PAD.l - PAD.r) / NP, ch = (h - PAD.t - PAD.b) / NM;
  for (let pi = 0; pi < NP; pi++) for (let mi = 0; mi < NM; mi++) {
    ctx.fillStyle = colorOf(idx(pi, mi));
    ctx.fillRect(PAD.l + pi * cw, PAD.t + (NM - 1 - mi) * ch, cw + 0.6, ch + 0.6);
  }
  ctx.fillStyle = css("--fg-3");
  ctx.textAlign = "center";
  for (const p of [4, 25, 50, 75, 100]) ctx.fillText(p, PAD.l + (P.indexOf(p) + 0.5) * cw, h - PAD.b + 16);
  ctx.fillText(T.period_atr, PAD.l + (w - PAD.l - PAD.r) / 2, h - 2);
  ctx.textAlign = "right";
  for (const m of [1, 2, 3, 4, 5, 6]) ctx.fillText(m, PAD.l - 8, PAD.t + (NM - 1 - miOf(m) + 0.5) * ch + 4);
  ctx.save();
  ctx.translate(12, PAD.t + (h - PAD.t - PAD.b) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText(T.mult, 0, 0);
  ctx.restore();
  for (const [pi, mi, col, pad] of marks) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    const s = Math.max(cw, ch) + 2 * pad;
    ctx.strokeRect(PAD.l + (pi + 0.5) * cw - s / 2, PAD.t + (NM - 1 - mi + 0.5) * ch - s / 2, s, s);
  }
  canvas._geom = { cw, ch };
}
function cellAt(canvas, ev) {
  const r = canvas.getBoundingClientRect(), g = canvas._geom;
  const pi = Math.floor((ev.clientX - r.left - PAD.l) / g.cw);
  const mi = NM - 1 - Math.floor((ev.clientY - r.top - PAD.t) / g.ch);
  return pi >= 0 && pi < NP && mi >= 0 && mi < NM ? { pi, mi, x: ev.clientX - r.left, y: ev.clientY - r.top } : null;
}

// ------------------------------------------------------------- 1. carte et détail
function drawMap() {
  const vals = values(state.w), zmax = zmaxOf(vals);
  const best = vals.indexOf(Math.max(...vals));
  drawGrid($("map"), (k) => diverging(vals[k], zmax), [
    [Math.floor(best / NM), best % NM, css("--fg"), 2],
    [P.indexOf(state.p), miOf(state.m), css("--emerald"), 3],
  ]);
  $("leg-lo").textContent = sgn(-zmax, 1);
  $("leg-hi").textContent = sgn(zmax, 1);
  $("map-sub").textContent = state.w < 0 ? T.all_period_long : `${T.quarter} ${qlabel(meta.windows[state.w])}`;
}
let chartData = null;
async function drawDetail() {
  const mi = miOf(state.m), k = idx(P.indexOf(state.p), mi);
  $("sel-name").textContent = `${T.period} ${state.p}  ${T.mult} ${fmt(state.m)}`;
  const items = [
    [T.m_full, sgn(meta.sharpe_full_x1000[k] / 1000)],
    [T.m_ret, pct(meta.total_return_x1e4[k] / 1e4)],
    [T.m_dd, pct(meta.max_dd_x1e4[k] / 1e4)],
    [T.m_orders, meta.orders[k].toLocaleString(LOCALE)],
  ];
  if (state.w >= 0) {
    const vals = values(state.w), v = vals[k], wl = qlabel(meta.windows[state.w]);
    const rank = Math.round((vals.filter((x) => x < v).length / vals.length) * 100);
    items.push([T.m_qsharpe(wl), sgn(v)], [T.m_qrank(wl), T.centile(rank)]);
  } else items.push([T.m_spy, sgn(meta.spy_sharpe)], [T.m_days, DAYS.length.toLocaleString(LOCALE)]);
  $("metrics").innerHTML = items.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("");
  chartData = await curve(state.p, mi);
  drawChart();
}
const CP = { l: 46, r: 10, t: 12, b: 26 };
function yearTicks(ctx, X, h, dayStrs) {
  ctx.fillStyle = css("--fg-3");
  ctx.textAlign = "center";
  let last = -1e9;
  for (let y = 2019; y <= 2026; y++) {
    const i = dayStrs.findIndex((d) => d.startsWith(String(y)));
    if (i >= 0 && X(i) - last >= 40) { ctx.fillText(y, X(i), h - 6); last = X(i); }
  }
}
function logAxis(ctx, Y, lo, hi, w) {
  ctx.fillStyle = css("--fg-3");
  ctx.strokeStyle = css("--line");
  ctx.lineWidth = 1;
  ctx.textAlign = "right";
  for (const v of [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8]) {
    if (v < lo || v > hi) continue;
    ctx.beginPath(); ctx.moveTo(CP.l, Y(v)); ctx.lineTo(w - CP.r, Y(v)); ctx.stroke();
    ctx.fillText(`x${fmt(v, v % 1 ? 2 : 0)}`, CP.l - 6, Y(v) + 4);
  }
}
function line(ctx, arr, X, Y, col, width = 2, dash = []) {
  ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineJoin = "round"; ctx.setLineDash(dash);
  ctx.beginPath();
  arr.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
  ctx.stroke();
  ctx.setLineDash([]);
}
function dot(ctx, x, y, col) {
  ctx.fillStyle = col; ctx.strokeStyle = css("--surface"); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill(); ctx.stroke();
}
function drawChart(hover = null) {
  if (!chartData) return;
  const { ctx, w, h } = setup($("chart"), 280);
  const n = DAYS.length, lo = Math.min(...chartData, ...spyEq) * 0.95, hi = Math.max(...chartData, ...spyEq) * 1.03;
  const X = (i) => CP.l + (i / (n - 1)) * (w - CP.l - CP.r);
  const Y = (v) => CP.t + (1 - Math.log(v / lo) / Math.log(hi / lo)) * (h - CP.t - CP.b);
  if (state.w >= 0) {
    const a = meta.window_first_day[state.w], b = meta.window_last_day[state.w];
    ctx.fillStyle = "rgba(239,243,248,0.07)";
    ctx.fillRect(X(a), CP.t, X(b) - X(a), h - CP.t - CP.b);
  }
  logAxis(ctx, Y, lo, hi, w);
  yearTicks(ctx, X, h, meta.days);
  line(ctx, spyEq, X, Y, css("--fg-3"));
  line(ctx, chartData, X, Y, css("--emerald"));
  if (hover === null) return hideTip("chart-tip");
  const i = Math.max(0, Math.min(n - 1, Math.round(((hover - CP.l) / (w - CP.l - CP.r)) * (n - 1))));
  ctx.strokeStyle = css("--fg-3"); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(X(i), CP.t); ctx.lineTo(X(i), h - CP.b); ctx.stroke();
  dot(ctx, X(i), Y(spyEq[i]), css("--fg-3"));
  dot(ctx, X(i), Y(chartData[i]), css("--emerald"));
  showTip("chart-tip", `${dateL(DAYS[i])}<br>${T.strategy} ${pct(chartData[i] - 1)}<br>SPY ${pct(spyEq[i] - 1)}`, X(i), 82, w);
}

// ------------------------------------------------------------- 2. rangs et trajectoire
const BP = { l: 36, r: 10, t: 14, b: 30 };
function drawRanks(hover = null) {
  const wins = ins.winners.slice(0, -1);
  const { ctx, w, h } = setup($("ranks"), 300);
  const n = wins.length, bw = (w - BP.l - BP.r) / n;
  const Y = (v) => BP.t + (1 - v / 100) * (h - BP.t - BP.b);
  ctx.strokeStyle = css("--line"); ctx.fillStyle = css("--fg-3"); ctx.textAlign = "right"; ctx.lineWidth = 1;
  for (const v of [0, 25, 50, 75, 100]) {
    ctx.beginPath(); ctx.moveTo(BP.l, Y(v)); ctx.lineTo(w - BP.r, Y(v)); ctx.stroke();
    ctx.fillText(v, BP.l - 6, Y(v) + 4);
  }
  wins.forEach((r, i) => {
    ctx.fillStyle = i === hover ? css("--fg") : r.next_rank >= 90 ? css("--emerald") : css("--fg-3");
    const x = BP.l + i * bw + 1, y = Y(r.next_rank);
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(1, bw - 2), Y(0) - y, [3, 3, 0, 0]);
    ctx.fill();
  });
  for (const [v, label] of [[50, T.random], [90, T.top10]]) {
    ctx.strokeStyle = v === 50 ? css("--fg-2") : css("--emerald"); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(BP.l, Y(v)); ctx.lineTo(w - BP.r, Y(v)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = v === 50 ? css("--fg-2") : css("--emerald"); ctx.textAlign = "right";
    ctx.fillText(label, w - BP.r - 2, Y(v) - 5);
  }
  ctx.fillStyle = css("--fg-3"); ctx.textAlign = "center";
  wins.forEach((r, i) => { if (r.window.startsWith("T1")) ctx.fillText(r.window.slice(3), BP.l + (i + 0.5) * bw, h - 8); });
  $("ranks")._bw = bw;
  if (hover === null) return hideTip("ranks-tip");
  const r = wins[hover];
  showTip("ranks-tip", `${qlabel(r.window)} → ${qlabel(ins.winners[hover + 1].window)}<br>${T.period} ${r.period}, ${T.mult} ${fmt(r.multiplier)}<br>Sharpe ${sgn(r.sharpe)} → ${sgn(r.next_sharpe)}<br>${T.centile(Math.round(r.next_rank))}`, BP.l + hover * bw, Y(r.next_rank) + 60, w);
}
function drawPath(hover = null) {
  const wins = ins.winners;
  const canvas = $("path");
  const { ctx, w, h } = setup(canvas, 300);
  const X = (p) => BP.l + 8 + ((p - 4) / 96) * (w - BP.l - BP.r - 16);
  const Y = (m) => BP.t + (1 - (m - 1) / 5) * (h - BP.t - BP.b);
  ctx.strokeStyle = css("--line"); ctx.fillStyle = css("--fg-3"); ctx.lineWidth = 1;
  ctx.textAlign = "right";
  for (const m of [1, 2, 3, 4, 5, 6]) { ctx.beginPath(); ctx.moveTo(BP.l, Y(m)); ctx.lineTo(w - BP.r, Y(m)); ctx.stroke(); ctx.fillText(m, BP.l - 6, Y(m) + 4); }
  ctx.textAlign = "center";
  for (const p of [4, 25, 50, 75, 100]) ctx.fillText(p, X(p), h - 8);
  for (let i = 1; i < wins.length; i++) {
    ctx.strokeStyle = `rgba(0,200,150,${0.12 + (0.5 * i) / wins.length})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(X(wins[i - 1].period), Y(wins[i - 1].multiplier)); ctx.lineTo(X(wins[i].period), Y(wins[i].multiplier)); ctx.stroke();
  }
  wins.forEach((r, i) => {
    ctx.fillStyle = i === hover ? css("--fg") : `rgba(0,200,150,${0.35 + (0.65 * i) / wins.length})`;
    ctx.beginPath(); ctx.arc(X(r.period), Y(r.multiplier), i === hover ? 7 : 5, 0, 7); ctx.fill();
  });
  canvas._pts = wins.map((r) => [X(r.period), Y(r.multiplier)]);
  if (hover === null) return hideTip("path-tip");
  const r = wins[hover];
  showTip("path-tip", `${qlabel(r.window)}<br>${T.period} ${r.period}, ${T.mult} ${fmt(r.multiplier)}<br>Sharpe ${sgn(r.sharpe)}`, X(r.period), Y(r.multiplier), w);
}
function drawWinnersTable() {
  const head = `<tr>${T.th.map((t, i) => `<th class="${i ? "r" : ""}">${esc(t)}</th>`).join("")}</tr>`;
  const cls = (v) => (v >= 0 ? "pos" : "neg");
  const rows = ins.winners.map((r, i) => `<tr data-i="${i}"><td>${esc(qlabel(r.window))}</td><td class="r">${r.period}</td>
    <td class="r">${fmt(r.multiplier)}</td><td class="r"><span class="${cls(r.sharpe)}">${sgn(r.sharpe)}</span></td>
    <td class="r">${r.next_sharpe === undefined ? "" : `<span class="${cls(r.next_sharpe)}">${sgn(r.next_sharpe)}</span>`}</td>
    <td class="r">${r.next_rank === undefined ? "" : esc(T.centile(Math.round(r.next_rank)))}</td></tr>`).join("");
  $("winners").innerHTML = `<thead>${head}</thead><tbody>${rows}</tbody>`;
}

// ------------------------------------------------------------- 3. rejouer l'optimisation
const ORDER = ["oracle", "hindsight", "spy", "walk_forward", "median"];
const STYLE = () => ({
  oracle: [css("--fg"), 1.5, [5, 4]], hindsight: [css("--fg-2"), 1.5, []], spy: [css("--fg-3"), 1.5, [2, 3]],
  walk_forward: [css("--emerald"), 3, []], median: ["#5d6368", 1.5, []],
});
function drawReplay(hover = null) {
  const c = ins.curves, st = STYLE();
  const { ctx, w, h } = setup($("replay"), 380);
  const n = ins.days.length, all = ORDER.flatMap((k) => c[k]);
  const lo = Math.min(...all) * 0.95, hi = Math.max(...all) * 1.08, R = w < 500 ? 132 : 118;
  const X = (i) => CP.l + (i / (n - 1)) * (w - CP.l - CP.r - R);
  const Y = (v) => CP.t + (1 - Math.log(v / lo) / Math.log(hi / lo)) * (h - CP.t - CP.b);
  logAxis(ctx, Y, lo, hi, w - R);
  yearTicks(ctx, X, h, ins.days);
  for (const k of ORDER) line(ctx, c[k], X, Y, st[k][0], st[k][1], st[k][2]);
  // étiquettes directes, écartées pour éviter les chevauchements
  const ends = ORDER.map((k) => ({ k, y: Y(c[k][n - 1]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 15);
  ctx.textAlign = "left";
  for (const { k, y } of ends) {
    ctx.fillStyle = k === "walk_forward" ? css("--emerald") : css("--fg-2");
    const fs = w < 500 ? 11 : 12;
    ctx.font = k === "walk_forward" ? `500 ${fs}px 'DM Sans', sans-serif` : `${fs}px 'DM Sans', sans-serif`;
    ctx.fillText(`${T.curves[k][0]} ${pct(c[k][n - 1] - 1, 0)}`, X(n - 1) + 8, y + 4);
  }
  if (hover === null) return hideTip("replay-tip");
  const i = Math.max(0, Math.min(n - 1, Math.round(((hover - CP.l) / (w - CP.l - CP.r - R)) * (n - 1))));
  ctx.strokeStyle = css("--fg-3"); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(X(i), CP.t); ctx.lineTo(X(i), h - CP.b); ctx.stroke();
  for (const k of ORDER) dot(ctx, X(i), Y(c[k][i]), st[k][0]);
  showTip("replay-tip", `${dateL(new Date(ins.days[i] + "T00:00:00"))}<br>` + ORDER.map((k) => `${T.curves[k][0]} ${pct(c[k][i] - 1)}`).join("<br>"), X(i), 120, w);
}
function drawReplayTable() {
  const s = ins.summary;
  const param = { hindsight: ins.hindsight_params, median: ins.median_params };
  const head = `<tr>${T.rth.map((t, i) => `<th class="${i > 1 ? "r" : ""}">${esc(t)}</th>`).join("")}</tr>`;
  const rows = ORDER.map((k) => {
    const p = param[k];
    const setting = p ? `${p.period} / ${fmt(p.multiplier)}` : k === "spy" ? "" : T.varies;
    return `<tr class="${k === "walk_forward" ? "focus" : ""}"><td><b>${esc(T.curves[k][0])}</b>, ${esc(T.curves[k][1])}</td>
      <td>${esc(setting)}</td><td class="r">${sgn(s[k].sharpe)}</td><td class="r">${pct(s[k].total_return)}</td><td class="r">${pct(s[k].max_dd)}</td></tr>`;
  }).join("");
  $("replay-table").innerHTML = `<thead>${head}</thead><tbody>${rows}</tbody>`;
}

// ------------------------------------------------------------- 4. robustesse et dispersion
const freq = ins.top_decile_freq_x1000.map((v) => v / 1000);
function drawFreq() {
  const fmax = ins.top_decile_freq_max;
  const b = ins.top_decile_freq_best;
  drawGrid($("freq"), (k) => sequential(freq[k]), [[P.indexOf(b.period), miOf(b.multiplier), css("--fg"), 2]]);
  $("freq-hi").textContent = pct(1, 0).replace("+", "");
}
function drawDisp(hover = null) {
  const q = ins.quantiles, n = q.p50.length;
  const { ctx, w, h } = setup($("disp"), 300);
  const lo = Math.floor(Math.min(...q.p10)) - 0.5, hi = Math.ceil(Math.max(...q.max)) + 0.5;
  const X = (i) => BP.l + ((i + 0.5) / n) * (w - BP.l - BP.r);
  const Y = (v) => BP.t + (1 - (v - lo) / (hi - lo)) * (h - BP.t - BP.b);
  ctx.strokeStyle = css("--line"); ctx.fillStyle = css("--fg-3"); ctx.lineWidth = 1; ctx.textAlign = "right";
  for (let v = Math.ceil(lo); v <= hi; v += 2) { ctx.beginPath(); ctx.moveTo(BP.l, Y(v)); ctx.lineTo(w - BP.r, Y(v)); ctx.stroke(); ctx.fillText(sgn(v, 0).replace("+0", "0").replace("−0", "0"), BP.l - 6, Y(v) + 4); }
  ctx.strokeStyle = css("--fg-3"); ctx.beginPath(); ctx.moveTo(BP.l, Y(0)); ctx.lineTo(w - BP.r, Y(0)); ctx.stroke();
  ctx.fillStyle = "rgba(0,200,150,0.22)";
  ctx.beginPath();
  q.p90.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(X(i), Y(q.p10[i]));
  ctx.closePath(); ctx.fill();
  line(ctx, q.p50, (i) => X(i), Y, css("--fg-2"), 2);
  q.max.forEach((v, i) => { ctx.fillStyle = i === hover ? css("--fg") : css("--emerald"); ctx.beginPath(); ctx.arc(X(i), Y(v), i === hover ? 6 : 4, 0, 7); ctx.fill(); });
  ctx.fillStyle = css("--fg-3"); ctx.textAlign = "center";
  meta.windows.forEach((wl, i) => { if (wl.startsWith("T1")) ctx.fillText(wl.slice(3), X(i), h - 8); });
  $("disp")._x = X;
  if (hover === null) return hideTip("disp-tip");
  showTip("disp-tip", `${qlabel(meta.windows[hover])}<br>max ${sgn(q.max[hover])}<br>p90 ${sgn(q.p90[hover])}<br>${T.lg_median} ${sgn(q.p50[hover])}<br>p10 ${sgn(q.p10[hover])}`, X(hover), Y(q.max[hover]) + 60, w);
}

// ------------------------------------------------------------- textes et rendu global
function applyLang() {
  T = I18N[LANG];
  LOCALE = LANG === "fr" ? "fr-FR" : "en-US";
  document.documentElement.lang = LANG;
  localStorage.setItem("lang", LANG);
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = T[el.dataset.i18n];
  for (const el of document.querySelectorAll("[data-i18n-html]")) el.innerHTML = T[el.dataset.i18nHtml];
  for (const el of document.querySelectorAll("[data-i18n-aria]")) el.setAttribute("aria-label", T[el.dataset.i18nAria]);
  for (const b of document.querySelectorAll(".lang button")) b.setAttribute("aria-pressed", String(b.dataset.lang === LANG));
  document.title = LANG === "fr" ? "9 797 backtests SuperTrend | Synerqo" : "9,797 SuperTrend backtests | Synerqo";
  const st = meta.stats;
  $("stats").innerHTML = T.stats(st, (x) => fmt(x)).map(([n, t]) => `<div class="stat"><div class="num mono">${esc(n)}</div><div class="txt">${esc(t)}</div></div>`).join("");
  $("method").innerHTML = T.method(st).map((t) => `<li>${esc(t)}</li>`).join("");
  const b = ins.top_decile_freq_best;
  $("s4-text").textContent = T.s4_text(pct(ins.top_decile_freq_max, 0).replace("+", ""), `${T.period} ${b.period}, ${T.mult} ${fmt(b.multiplier)}`);
  const sel = $("window");
  sel.innerHTML = `<option value="-1">${esc(T.all_period)}</option>` + meta.windows.map((wl, i) => `<option value="${i}">${esc(qlabel(wl))}</option>`).join("");
  sel.value = state.w;
  drawAll();
}
function drawAll() {
  drawMap(); drawDetail(); drawRanks(); drawPath(); drawWinnersTable(); drawReplay(); drawReplayTable(); drawFreq(); drawDisp();
}

// ------------------------------------------------------------- interactions
function syncHash() { history.replaceState(null, "", `${location.search}#p=${state.p}&m=${state.m.toFixed(2)}&w=${state.w}`); }
function select(p, m) { state.p = p; state.m = m; syncHash(); drawMap(); drawDetail(); }
function setWindow(w) { state.w = Math.max(-1, Math.min(NW - 1, w)); $("window").value = state.w; syncHash(); drawMap(); drawDetail(); }
$("window").addEventListener("change", (e) => setWindow(Number(e.target.value)));
$("prev").addEventListener("click", () => setWindow(state.w - 1));
$("next").addEventListener("click", () => setWindow(state.w + 1));
document.addEventListener("keydown", (e) => {
  if (["SELECT", "INPUT"].includes(e.target.tagName)) return;
  if (e.key === "ArrowLeft") setWindow(state.w - 1);
  if (e.key === "ArrowRight") setWindow(state.w + 1);
});
for (const b of document.querySelectorAll(".lang button")) b.addEventListener("click", () => { LANG = b.dataset.lang; applyLang(); });
const rel = (canvas, ev) => { const r = canvas.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
$("map").addEventListener("mousemove", (ev) => {
  const c = cellAt($("map"), ev);
  if (!c) return hideTip("map-tip");
  showTip("map-tip", `${T.period} ${P[c.pi]}<br>${T.mult} ${fmt(M[c.mi])}<br>Sharpe ${sgn(values(state.w)[idx(c.pi, c.mi)])}`, c.x, c.y, $("map").clientWidth);
});
$("map").addEventListener("mouseleave", () => hideTip("map-tip"));
$("map").addEventListener("click", (ev) => { const c = cellAt($("map"), ev); if (c) select(P[c.pi], M[c.mi]); });
$("freq").addEventListener("mousemove", (ev) => {
  const c = cellAt($("freq"), ev);
  if (!c) return hideTip("freq-tip");
  showTip("freq-tip", `${T.period} ${P[c.pi]}<br>${T.mult} ${fmt(M[c.mi])}<br>${pct(freq[idx(c.pi, c.mi)], 0).replace("+", "")}`, c.x, c.y, $("freq").clientWidth);
});
$("freq").addEventListener("mouseleave", () => hideTip("freq-tip"));
$("chart").addEventListener("mousemove", (ev) => drawChart(rel($("chart"), ev)[0]));
$("chart").addEventListener("mouseleave", () => drawChart());
$("replay").addEventListener("mousemove", (ev) => drawReplay(rel($("replay"), ev)[0]));
$("replay").addEventListener("mouseleave", () => drawReplay());
$("ranks").addEventListener("mousemove", (ev) => {
  const i = Math.floor((rel($("ranks"), ev)[0] - BP.l) / $("ranks")._bw);
  drawRanks(i >= 0 && i < ins.winners.length - 1 ? i : null);
});
$("ranks").addEventListener("mouseleave", () => drawRanks());
$("path").addEventListener("mousemove", (ev) => {
  const [x, y] = rel($("path"), ev);
  let best = null, dmin = 14;
  $("path")._pts.forEach(([px, py], i) => { const d = Math.hypot(px - x, py - y); if (d < dmin) { dmin = d; best = i; } });
  drawPath(best);
});
$("path").addEventListener("mouseleave", () => drawPath());
$("disp").addEventListener("mousemove", (ev) => {
  const x = rel($("disp"), ev)[0], n = ins.quantiles.p50.length;
  const i = Math.round(((x - BP.l) / ($("disp").clientWidth - BP.l - BP.r)) * n - 0.5);
  drawDisp(i >= 0 && i < n ? i : null);
});
$("disp").addEventListener("mouseleave", () => drawDisp());
$("winners").addEventListener("click", (ev) => {
  const tr = ev.target.closest("tr[data-i]");
  if (!tr) return;
  const r = ins.winners[Number(tr.dataset.i)];
  state.p = r.period; state.m = r.multiplier;
  setWindow(Number(tr.dataset.i));
  $("map").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
});
let rt;
window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(drawAll, 120); });

const hs = new URLSearchParams(location.hash.slice(1));
if (P.includes(Number(hs.get("p")))) state.p = Number(hs.get("p"));
if (miOf(Number(hs.get("m"))) >= 0) state.m = M[miOf(Number(hs.get("m")))];
if (hs.has("w")) state.w = Math.max(-1, Math.min(NW - 1, Number.isFinite(Number(hs.get("w"))) ? Number(hs.get("w")) : -1));
await document.fonts.ready;
applyLang();
