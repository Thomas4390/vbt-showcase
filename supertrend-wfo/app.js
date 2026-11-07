// Explorateur des 9 797 backtests SuperTrend. Aucune dépendance.
const meta = await (await fetch("data/meta.json")).json();
const P = meta.periods, M = meta.multipliers, NP = P.length, NM = M.length, NW = meta.windows.length;
const DAYS = meta.days.map((d) => new Date(d + "T00:00:00"));
const [LO, HI] = meta.eq_range;
const spyEq = meta.spy_equity_x1e4.map((v) => v / 1e4);
const $ = (id) => document.getElementById(id);
const fmt = (x, d = 2) => x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const sgn = (x, d = 2) => (x >= 0 ? "+" : "−") + fmt(Math.abs(x), d);
const pct = (x, d = 1) => sgn(x * 100, d) + " %";
const dateFr = (d) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

const state = { w: -1, p: 10, m: 3.0 };
const cache = new Map();

// ------------------------------------------------------------- couleurs (palette validée)
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const NEG = hex("#e97c48"), MID = hex("#494e52"), POS = hex("#00c896");
function color(s, zmax) {
  const u = Math.max(-1, Math.min(1, s / zmax));
  const [a, b, t] = u >= 0 ? [MID, POS, Math.pow(u, 0.75)] : [MID, NEG, Math.pow(-u, 0.75)];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}

// ------------------------------------------------------------- données
const idx = (pi, mi) => pi * NM + mi;
function values(w) {
  return w < 0 ? meta.sharpe_full_x1000.map((v) => v / 1000)
    : meta.window_sharpe_x1000.slice(w * NP * NM, (w + 1) * NP * NM).map((v) => v / 1000);
}
function zmaxOf(vals) {
  const s = [...vals].map(Math.abs).sort((a, b) => a - b);
  return Math.max(0.5, Math.ceil(s[Math.floor(s.length * 0.98)] * 2) / 2);
}
async function curve(p, mi) {
  if (!cache.has(p)) {
    const buf = await (await fetch(`data/eq/p${p}.bin`)).arrayBuffer();
    cache.set(p, new Uint16Array(buf));
  }
  const q = cache.get(p), n = DAYS.length;
  return Array.from(q.subarray(mi * n, (mi + 1) * n), (v) => Math.exp((v / 65535) * (HI - LO) + LO));
}

// ------------------------------------------------------------- canvas utilitaire
function setup(canvas, h) {
  const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// ------------------------------------------------------------- carte de chaleur
const PAD = { l: 44, r: 8, t: 8, b: 34 };
let mapGeom = null;
function drawMap() {
  const canvas = $("map");
  const w = canvas.clientWidth;
  const { ctx, h } = setup(canvas, Math.round((w - PAD.l - PAD.r) * 0.82) + PAD.t + PAD.b);
  const cw = (w - PAD.l - PAD.r) / NP, ch = (h - PAD.t - PAD.b) / NM;
  mapGeom = { cw, ch };
  const vals = values(state.w), zmax = zmaxOf(vals);
  for (let pi = 0; pi < NP; pi++) for (let mi = 0; mi < NM; mi++) {
    ctx.fillStyle = color(vals[idx(pi, mi)], zmax);
    ctx.fillRect(PAD.l + pi * cw, PAD.t + (NM - 1 - mi) * ch, cw + 0.6, ch + 0.6);
  }
  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillStyle = css("--fg-3");
  ctx.textAlign = "center";
  for (const p of [4, 25, 50, 75, 100]) ctx.fillText(p, PAD.l + (P.indexOf(p) + 0.5) * cw, h - PAD.b + 16);
  ctx.fillText("période ATR", PAD.l + (w - PAD.l - PAD.r) / 2, h - 2);
  ctx.textAlign = "right";
  for (const m of [1, 2, 3, 4, 5, 6]) {
    const mi = M.findIndex((v) => Math.abs(v - m) < 1e-9);
    ctx.fillText(m, PAD.l - 8, PAD.t + (NM - 1 - mi + 0.5) * ch + 4);
  }
  ctx.save();
  ctx.translate(12, PAD.t + (h - PAD.t - PAD.b) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("multiplicateur", 0, 0);
  ctx.restore();

  const best = vals.indexOf(Math.max(...vals));
  outline(ctx, Math.floor(best / NM), best % NM, css("--fg"), cw, ch);
  outline(ctx, P.indexOf(state.p), M.findIndex((v) => Math.abs(v - state.m) < 1e-9), css("--emerald"), cw, ch, 3);
  $("leg-lo").textContent = sgn(-zmax, 1);
  $("leg-hi").textContent = sgn(zmax, 1);
  $("map-sub").textContent = state.w < 0 ? "Toute la période, de janvier 2019 à février 2026" : `Trimestre ${meta.windows[state.w]}`;
}
function outline(ctx, pi, mi, col, cw, ch, pad = 2) {
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  const s = Math.max(cw, ch) + 2 * pad;
  ctx.strokeRect(PAD.l + (pi + 0.5) * cw - s / 2, PAD.t + (NM - 1 - mi + 0.5) * ch - s / 2, s, s);
}
function cellAt(ev) {
  const r = $("map").getBoundingClientRect();
  const pi = Math.floor((ev.clientX - r.left - PAD.l) / mapGeom.cw);
  const mi = NM - 1 - Math.floor((ev.clientY - r.top - PAD.t) / mapGeom.ch);
  return pi >= 0 && pi < NP && mi >= 0 && mi < NM ? { pi, mi, x: ev.clientX - r.left, y: ev.clientY - r.top } : null;
}

// ------------------------------------------------------------- détail et courbe
let chartData = null;
async function drawDetail() {
  const pi = P.indexOf(state.p), mi = M.findIndex((v) => Math.abs(v - state.m) < 1e-9), k = idx(pi, mi);
  $("sel-name").textContent = `période ${state.p}  multiplicateur ${fmt(state.m)}`;
  const items = [
    ["Sharpe, toute la période", sgn(meta.sharpe_full_x1000[k] / 1000)],
    ["Rendement total", pct(meta.total_return_x1e4[k] / 1e4)],
    ["Perte maximale", pct(meta.max_dd_x1e4[k] / 1e4)],
    ["Ordres exécutés", meta.orders[k].toLocaleString("fr-FR")],
  ];
  if (state.w >= 0) {
    const vals = values(state.w), v = vals[k];
    const rank = vals.filter((x) => x < v).length / vals.length * 100;
    items.push([`Sharpe en ${meta.windows[state.w]}`, sgn(v)], [`Rang en ${meta.windows[state.w]}`, `${fmt(rank, 0)}e centile`]);
  } else {
    items.push(["Sharpe de SPY", sgn(meta.spy_sharpe)], ["Jours de bourse", DAYS.length.toLocaleString("fr-FR")]);
  }
  $("metrics").innerHTML = items.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join("");
  chartData = await curve(state.p, mi);
  drawChart();
}
const CP = { l: 46, r: 10, t: 12, b: 26 };
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
  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillStyle = css("--fg-3");
  ctx.strokeStyle = css("--line");
  ctx.lineWidth = 1;
  ctx.textAlign = "right";
  for (const v of [0.5, 0.75, 1, 1.5, 2, 3, 4]) {
    if (v < lo || v > hi) continue;
    ctx.beginPath(); ctx.moveTo(CP.l, Y(v)); ctx.lineTo(w - CP.r, Y(v)); ctx.stroke();
    ctx.fillText(`x${fmt(v, v % 1 ? 2 : 0)}`, CP.l - 6, Y(v) + 4);
  }
  ctx.textAlign = "center";
  for (let y = 2019; y <= 2026; y++) {
    const i = meta.days.findIndex((d) => d.startsWith(String(y)));
    if (i >= 0) ctx.fillText(y, X(i), h - 6);
  }
  const line = (arr, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineJoin = "round";
    ctx.beginPath();
    arr.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
    ctx.stroke();
  };
  line(spyEq, css("--fg-3"));
  line(chartData, css("--emerald"));
  const tip = $("chart-tip");
  if (hover !== null) {
    const i = Math.max(0, Math.min(n - 1, Math.round(((hover - CP.l) / (w - CP.l - CP.r)) * (n - 1))));
    ctx.strokeStyle = css("--fg-3"); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(i), CP.t); ctx.lineTo(X(i), h - CP.b); ctx.stroke();
    for (const [v, c] of [[spyEq[i], css("--fg-3")], [chartData[i], css("--emerald")]]) {
      ctx.fillStyle = c; ctx.strokeStyle = css("--surface"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(X(i), Y(v), 4.5, 0, 7); ctx.fill(); ctx.stroke();
    }
    tip.hidden = false;
    tip.innerHTML = `${dateFr(DAYS[i])}<br>Stratégie ${pct(chartData[i] - 1)}<br>SPY ${pct(spyEq[i] - 1)}`;
    tip.style.left = `${Math.min(X(i) + 12, w - 170)}px`;
    tip.style.top = "12px";
  } else tip.hidden = true;
}

// ------------------------------------------------------------- interactions
function select(p, m) {
  state.p = p; state.m = m;
  history.replaceState(null, "", `#p=${p}&m=${m.toFixed(2)}&w=${state.w}`);
  drawMap(); drawDetail();
}
function setWindow(w) {
  state.w = Math.max(-1, Math.min(NW - 1, w));
  $("window").value = state.w;
  history.replaceState(null, "", `#p=${state.p}&m=${state.m.toFixed(2)}&w=${state.w}`);
  drawMap(); drawDetail();
}
const sel = $("window");
sel.innerHTML = `<option value="-1">Toute la période</option>` + meta.windows.map((w, i) => `<option value="${i}">${w}</option>`).join("");
sel.addEventListener("change", () => setWindow(Number(sel.value)));
$("prev").addEventListener("click", () => setWindow(state.w - 1));
$("next").addEventListener("click", () => setWindow(state.w + 1));
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "SELECT") return;
  if (e.key === "ArrowLeft") setWindow(state.w - 1);
  if (e.key === "ArrowRight") setWindow(state.w + 1);
});
$("map").addEventListener("mousemove", (ev) => {
  const c = cellAt(ev), tip = $("map-tip");
  if (!c) { tip.hidden = true; return; }
  const v = values(state.w)[idx(c.pi, c.mi)];
  tip.hidden = false;
  tip.innerHTML = `période ${P[c.pi]}<br>multiplicateur ${fmt(M[c.mi])}<br>Sharpe ${sgn(v)}`;
  tip.style.left = `${Math.min(c.x + 14, $("map").clientWidth - 150)}px`;
  tip.style.top = `${Math.max(c.y - 70, 0)}px`;
});
$("map").addEventListener("mouseleave", () => ($("map-tip").hidden = true));
$("map").addEventListener("click", (ev) => { const c = cellAt(ev); if (c) select(P[c.pi], M[c.mi]); });
$("chart").addEventListener("mousemove", (ev) => drawChart(ev.clientX - $("chart").getBoundingClientRect().left));
$("chart").addEventListener("mouseleave", () => drawChart());
let rt;
window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { drawMap(); drawChart(); }, 120); });

// ------------------------------------------------------------- chiffres clés
const st = meta.stats;
$("n-bt").textContent = st.n_backtests.toLocaleString("fr-FR");
$("stats").innerHTML = [
  [`${st.distinct_winners}/${st.n_windows}`, "trimestres ont un gagnant différent"],
  [`${Math.round(st.rank_median)}e`, "centile médian du gagnant au trimestre suivant. Le hasard donne le 50e."],
  [`${Math.round(st.top_decile_share * (st.n_windows - 1))}/${st.n_windows - 1}`, "gagnants restent dans les 10 % meilleurs au trimestre suivant"],
  [`${fmt(st.grid_seconds)} s`, `pour calculer les ${st.n_backtests.toLocaleString("fr-FR")} backtests (médiane de 7 exécutions)`],
].map(([n, t]) => `<div class="stat"><div class="num mono">${n}</div><div class="txt">${t}</div></div>`).join("");
$("method-speed").textContent =
  `Temps de calcul de la grille : ${fmt(st.grid_seconds, 3)} s, médiane de 7 exécutions après compilation, ` +
  `${st.threads} threads, ${st.cpu}, VectorBT PRO ${st.vectorbtpro}.`;

const h = new URLSearchParams(location.hash.slice(1));
if (h.has("p") && P.includes(Number(h.get("p")))) state.p = Number(h.get("p"));
if (h.has("m") && M.some((v) => Math.abs(v - Number(h.get("m"))) < 1e-9)) state.m = M.find((v) => Math.abs(v - Number(h.get("m"))) < 1e-9);
if (h.has("w")) state.w = Math.max(-1, Math.min(NW - 1, Number(h.get("w")) || -1));
sel.value = state.w;
await document.fonts.ready;
drawMap();
drawDetail();
