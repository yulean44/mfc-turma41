import { CRIATURAS, DECOS, EFEITOS, RARIDADE, JORNADA, CONQUISTAS, DIARIAS, nivelXP } from "./data.js";
import { ic, ICONES_MATERIA } from "./icons.js";
import { FIG } from "./figuras.js";

/* =========================================================
   utilidades
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const diaDe = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoje = () => diaDe(new Date());
const uid6 = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
const fmtMin = m => m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? pad(m % 60) : ""}`;
const textoDe = html => { const d = document.createElement("div"); d.innerHTML = html; return d.textContent || ""; };
const LS = {
  get(k, d) { try { const v = localStorage.getItem("pe:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("pe:" + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem("pe:" + k); } catch {} },
};
const ICONE_EFEITO = { broto: "broto", agua: "gota", nuvens: "nuvem", borboletas: "borboleta", lua: "lua", anel: "anel", aurora: "aurora" };
const TEMAS = [["noite", "Noite estelar", "linear-gradient(160deg,#1e2d48,#0c1220)"], ["meianoite", "Meia-noite", "linear-gradient(160deg,#121a2c,#000)"], ["cristal", "Cristal", "linear-gradient(160deg,#1d4357,#08141f)"], ["aurora", "Aurora", "linear-gradient(160deg,#3a8f6a,#2a2350 55%,#5a3f9a)"], ["floresta", "Floresta", "linear-gradient(160deg,#1f4a33,#07120c)"], ["amanhecer", "Amanhecer", "linear-gradient(160deg,#ffffff,#cfe2ef)"]];
let tema = LS.get("tema2", "noite"), estiloIcone = LS.get("icones", "3d");
function aplicaTema() {
  if (tema === "noite") document.documentElement.removeAttribute("data-tema"); else document.documentElement.setAttribute("data-tema", tema);
  temaMundo();
}
let temaMundo = () => {};
aplicaTema();
/* ícone 3D (imagem) quando o estilo permite; senão, traço fino */
const fig = (n, cls = "s") => estiloIcone === "3d" && FIG[n] ? `<img class="fig" src="${FIG[n]}" alt="">` : ic(n, cls);
const icoBox = (n, extra = "") => `<div class="ico ${estiloIcone === "3d" && FIG[n] ? "fig-on" : ""} ${extra}">${fig(n, "")}</div>`;
function escolheTema() {
  const m = modal(`<h3>Aparência</h3><p class="muted" style="font-weight:300;margin:0 0 14px">Escolha o tema e o estilo dos ícones.</p>
    <div class="temas">${TEMAS.map(([k, n, g]) => `<button class="tema ${tema === k ? "on" : ""}" data-t="${k}"><i style="background:${g}"></i>${n}</button>`).join("")}</div>
    <label class="lb">Ícones</label><div class="tabs"><button class="${estiloIcone === "3d" ? "on" : ""}" data-e="3d">3D low-poly</button><button class="${estiloIcone === "linha" ? "on" : ""}" data-e="linha">Traço fino</button></div>
    <div class="acts"><button class="btn pri" data-fecha>Pronto</button></div>`);
  $$("[data-t]", m.el).forEach(b => b.addEventListener("click", () => { tema = b.dataset.t; LS.set("tema2", tema); aplicaTema(); $$("[data-t]", m.el).forEach(x => x.classList.toggle("on", x === b)); }));
  $$("[data-e]", m.el).forEach(b => b.addEventListener("click", () => { estiloIcone = b.dataset.e; LS.set("icones", estiloIcone); $$("[data-e]", m.el).forEach(x => x.classList.toggle("on", x === b)); render(); }));
}
const iconeMat = m => m.icone || (m.id === "mfc" ? "estetoscopio" : "livro");

/* =========================================================
   estado do jogador
   ========================================================= */
function novoEstado() {
  return { v: 2, upd: 0, xp: 0, nivel: 1, totMin: 0, totCards: 0, totOk: 0, totErr: 0, rev: 0, criados: 0,
    dias: {}, cards: {}, lidas: {}, premLidas: {}, checks: {}, decos: [], criaturas: [], efeitos: {}, verde: 0,
    jornada: 0, conq: {}, diarias: null, diasCompletos: 0, log: [], maxSess: 0, meus: {}, mats: {}, ultimo: null, timer: null };
}
let S = Object.assign(novoEstado(), LS.get("estado", {}));
if (S.inv) { for (const [k, n] of Object.entries(S.inv)) for (let i = 0; i < n; i++) S.decos.push({ id: uid6(), k, d: [0, 1, 0], r: Math.random() * 6.28, s: Math.floor(Math.random() * 1e6) }); delete S.inv; }

let db = null, user = null, uid = null, souDono = !!LS.get("debugDono", false), nuvem = "local";
let tSalvar = null, salvando = false, pendente = false;
const modoTeste = () => !!LS.get("backupReal", null);
const modoConta = !(window.claude && typeof window.claude.use === "function");
let conta = null, contaMod = null, tConta = null, contaOk = false;
const chaveEstado = () => conta ? "estado:" + conta.uid : "estado";
function salvar() {
  S.upd = Date.now();
  LS.set(chaveEstado(), S);
  if (conta && contaOk && !modoTeste()) { clearTimeout(tConta); tConta = setTimeout(async () => { try { await contaMod.salva(conta.uid, JSON.parse(JSON.stringify(S))); nuvem = "ok"; } catch (e) { console.warn(e); nuvem = "erro"; } renderTopo(); }, 1200); }
  if (db && uid && nuvem !== "so-local" && !modoTeste()) { clearTimeout(tSalvar); tSalvar = setTimeout(enviaNuvem, 1200); }
}
async function enviaNuvem() {
  if (salvando) { pendente = true; return; }
  salvando = true;
  try { await db.doc(`data/users/${uid}/estado`).set(JSON.parse(JSON.stringify(S))); nuvem = "ok"; }
  catch (e) { if (e && e.code === "invalid_argument") nuvem = "so-local"; else if (e && e.code === "quota_exceeded") toast("Não deu para salvar na conta (limite de espaço)."); }
  salvando = false; renderTopo();
  if (pendente) { pendente = false; enviaNuvem(); }
}

/* =========================================================
   conteúdo das matérias
   ========================================================= */
let FABRICA = [];
const CONT = { indice: null, secoes: {}, cards: {} };
function materias() {
  if (CONT.indice && Array.isArray(CONT.indice.materias)) return CONT.indice.materias;
  return FABRICA.map(m => ({ id: m.id, nome: m.nome, sigla: m.sigla, icone: m.icone, cor: m.cor, sub: m.sub, secoes: m.secoes.map(s => ({ id: s.id, titulo: s.titulo, grupo: s.grupo })) }));
}
const materia = id => materias().find(m => m.id === id);
function htmlSecao(mat, sid) {
  const o = CONT.secoes[`${mat}--${sid}`]; if (o && typeof o.html === "string") return o.html;
  const f = FABRICA.find(m => m.id === mat); const s = f && f.secoes.find(x => x.id === sid);
  return s ? s.html : "";
}
function cardsCompartilhados(mat) {
  const o = CONT.cards[mat]; if (o && Array.isArray(o.lista)) return o.lista;
  const f = FABRICA.find(m => m.id === mat); return f ? f.cards : [];
}
function todosCards(mat) {
  const out = [];
  for (const m of materias()) {
    if (mat && mat !== "todas" && m.id !== mat) continue;
    cardsCompartilhados(m.id).forEach(c => out.push({ ...c, mat: m.id }));
    (S.meus[m.id] || []).forEach(c => out.push({ ...c, mat: m.id, meu: true }));
  }
  return out;
}
async function salvaIndice(lista) {
  CONT.indice = { materias: lista }; render();
  if (db) try { await db.doc("conteudo/indice").set({ materias: lista }); } catch { toast("Não consegui salvar a alteração."); }
}
async function salvaSecao(mat, sid, html) {
  CONT.secoes[`${mat}--${sid}`] = { html };
  if (db) try { await db.doc(`secoes/${mat}--${sid}`).set({ html, mat, sid }); } catch { toast("Não consegui salvar o texto."); }
}
async function salvaCards(mat, lista) {
  CONT.cards[mat] = { lista };
  if (db) try { await db.doc(`cards/${mat}`).set({ lista }); } catch { toast("Não consegui salvar os cards."); }
}

/* =========================================================
   métricas e recompensas
   ========================================================= */
function diaObj(k = hoje()) { return (S.dias[k] ||= { min: 0, cards: 0, ok: 0, err: 0, sess: 0, lidas: 0, rev: 0 }); }
const ativo = k => { const x = S.dias[k]; return !!x && (x.min > 0 || x.cards >= 5 || x.lidas > 0); };
function sequencia() {
  let n = 0; const d = new Date();
  if (!ativo(diaDe(d))) d.setDate(d.getDate() - 1);
  while (ativo(diaDe(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function metricas() {
  return { min: S.totMin, cards: S.totCards, ok: S.totOk, lidas: Object.keys(S.lidas).length, streak: sequencia(),
    dominados: Object.values(S.cards).filter(c => c.b >= 3).length, criados: S.criados, maxSess: S.maxSess };
}
const verdor = () => S.efeitos.broto ? Math.min(1, .6 + S.verde + S.totMin / 400 + S.xp / 3000) : 0;
const matStat = id => (S.mats[id] ||= { min: 0, cards: 0, ok: 0, err: 0 });
let sorteioP = null;
const novaDeco = k => ({ id: uid6(), k, d: sorteioP ? sorteioP(!!S.efeitos.agua) : [Math.random() - .5, Math.random(), Math.random() - .5], r: Math.random() * 6.28, s: Math.floor(Math.random() * 1e6) });

/* o planeta cresce sozinho: cada 20 XP faz surgir algo novo */
function cresce() {
  if (!S.efeitos.broto) return false;
  const alvo = Math.min(280, 4 + Math.floor(S.xp / 12));
  let n = 0;
  const conta = k => S.decos.filter(d => d.k === k).length;
  while (S.decos.length < alvo && n < 40) {
    const v = verdor(), pool = [["flores", 3], ["girassois", 2], ["arbusto", 3], ["pedra", 1.4], ["arvore", 4], ["toco", .6]];
    if (v > .5) pool.push(["pinheiro", 3.2], ["cogumelos", 1.1], ["bambu", .6]);
    if (S.nivel >= 3) pool.push(["cristal", .8], ["lanterna", .5]);
    if (S.nivel >= 5 && conta("cabana") < 3) pool.push(["cabana", .35]);
    if (S.nivel >= 6 && conta("bau") < 2) pool.push(["bau", .25]);
    let tot = pool.reduce((a, b) => a + b[1], 0), x = Math.random() * tot, k = "flores";
    for (const [kk, p] of pool) if ((x -= p) < 0) { k = kk; break; }
    S.decos.push(novaDeco(k)); n++;
  }
  return n > 0;
}

let filaFesta = [];
function festa(f) { filaFesta.push(f); proximaFesta(); }
function ganhaXP(n) {
  S.xp += n;
  while (S.xp >= nivelXP(S.nivel + 1)) { S.nivel++; choca(`Nível ${S.nivel}`); }
}
function descrevePremio(p) {
  const c = [];
  (p.efeitos || []).forEach(e => c.push(EFEITOS[e].nome));
  (p.criaturas || []).forEach(k => c.push(CRIATURAS[k].nome));
  Object.entries(p.decos || {}).forEach(([k, n]) => c.push(`${n > 1 ? n + " × " : ""}${DECOS[k].nome}`));
  if (p.verde) c.push("Mais verde");
  if (p.xp) c.push(`+${p.xp} XP`);
  return c;
}
function dar(p) {
  (p.efeitos || []).forEach(e => S.efeitos[e] = true);
  (p.criaturas || []).forEach(k => { if (!S.criaturas.includes(k)) S.criaturas.push(k); });
  Object.entries(p.decos || {}).forEach(([k, n]) => { for (let i = 0; i < n; i++) S.decos.push(novaDeco(k)); });
  if (p.verde) S.verde = Math.min(.9, S.verde + p.verde);
  if (p.xp) ganhaXP(p.xp);
}
/* ovo surpresa: choca na hora e a criatura já aparece no planeta */
function choca(motivo) {
  const pesos = Object.entries(RARIDADE).map(([k, v]) => [k, v.peso]);
  let x = Math.random() * pesos.reduce((a, b) => a + b[1], 0), rar = "comum";
  for (const [k, p] of pesos) { if ((x -= p) < 0) { rar = k; break; } }
  const ordem = ["lendario", "raro", "incomum", "comum"], livres = r => Object.keys(CRIATURAS).filter(k => CRIATURAS[k].r === r && !CRIATURAS[k].ex && !S.criaturas.includes(k) && (CRIATURAS[k].modo !== "nada" || S.efeitos.agua));
  let op = [];
  for (let i = ordem.indexOf(rar); i < ordem.length && !op.length; i++) op = livres(ordem[i]);
  for (let i = ordem.indexOf(rar) - 1; i >= 0 && !op.length; i--) op = livres(ordem[i]);
  if (!op.length) { S.verde = Math.min(.9, S.verde + .05); festa({ icone: "brilho", titulo: motivo, texto: "Você já tem todas as criaturas disponíveis. Seu planeta ficou um pouco mais verde." }); return; }
  const k = op[Math.floor(Math.random() * op.length)], c = CRIATURAS[k];
  S.criaturas.push(k);
  festa({ cria: k, titulo: motivo, texto: `${c.nome} nasceu no seu planeta.`, chips: [RARIDADE[c.r].nome] });
}

function diarias() {
  const d = hoje();
  if (!S.diarias || S.diarias.data !== d) {
    let h = 0; for (const c of d) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const pool = DIARIAS.filter(q => q.id !== "d_rev5" || S.totErr > 0), ids = [], tipos = new Set();
    while (ids.length < 3 && pool.length) {
      h = (h * 1103515245 + 12345) >>> 0; const m = pool.splice(h % pool.length, 1)[0];
      const tipo = m.id.replace(/\d+$/, ""); if (tipos.has(tipo)) continue; tipos.add(tipo); ids.push(m.id);
    }
    S.diarias = { data: d, ids, pegas: {}, bonus: false };
  }
  return S.diarias;
}

/* presente de boas-vindas: o planeta já começa vivo */
function presenteInicial() {
  if (S.presente) return false;
  S.presente = 1;
  S.efeitos.broto = true; S.efeitos.agua = true;
  if (!S.criaturas.includes("pintinho")) S.criaturas.push("pintinho");
  ["fogueira", "arvore", "arvore", "pinheiro", "flores", "girassois", "arbusto", "pedra", "cogumelos"].forEach(k => S.decos.push(novaDeco(k)));
  if (S.jornada === 0) S.jornada = 0;
  toast("Presente de boas-vindas: vida, lagos, fogueira e um pintinho");
  return true;
}
/* prêmio por entrar no dia: pequeno, sem enrolação */
function premioDiario() {
  const d = hoje(); if (S.ultLogin === d) return false;
  const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
  S.loginSeq = S.ultLogin === diaDe(ontem) ? (S.loginSeq || 0) + 1 : 1;
  S.ultLogin = d;
  const pool = ["arvore", "flores", "girassois", "arbusto", "pinheiro", "cogumelos", "fogueira", "lanterna", "cristal"];
  const k1 = pool[Math.floor(Math.random() * pool.length)], k2 = pool[Math.floor(Math.random() * pool.length)];
  S.decos.push(novaDeco(k1), novaDeco(k2)); ganhaXP(10);
  if (S.loginSeq % 3 === 0) choca(`${S.loginSeq} dias seguidos entrando`);
  else toast(`Prêmio do dia · +10 XP · ${DECOS[k1].nome} e ${DECOS[k2].nome} no planeta`);
  return true;
}

function checaTudo() {
  let mudou = presenteInicial(), m = metricas();
  if (premioDiario()) mudou = true;
  while (S.jornada < JORNADA.length) {
    const j = JORNADA[S.jornada];
    if (j.meta(m) < j.alvo) break;
    S.jornada++; dar(j.premio); mudou = true;
    festa({ cria: j.premio.criaturas?.[0], icone: j.premio.efeitos?.[0] ? ICONE_EFEITO[j.premio.efeitos[0]] : "bau", titulo: j.titulo, texto: j.historia, chips: descrevePremio(j.premio) });
    m = metricas();
  }
  const D = diarias(), h = diaObj();
  D.ids.forEach(id => {
    const q = DIARIAS.find(x => x.id === id); if (!q || D.pegas[id]) return;
    if (q.meta(h) >= q.alvo) { D.pegas[id] = 1; ganhaXP(q.sem); toast(`Missão do dia concluída · +${q.sem} XP`); mudou = true; }
  });
  if (!D.bonus && D.ids.every(id => D.pegas[id])) { D.bonus = true; S.diasCompletos++; mudou = true; choca("Todas as missões do dia"); }
  const cond = {
    persistente: S.rev >= 15, explorador: Object.values(S.mats).filter(x => x.min > 0 || x.cards > 0).length >= 3,
    colecionador: S.criaturas.length >= 8, jardineiro: S.decos.length >= 40, diarias10: S.diasCompletos >= 5, nivel10: S.nivel >= 8,
    fds: Object.keys(S.dias).some(k => { const d = new Date(k + "T12:00"); if (d.getDay() !== 6 || !ativo(k)) return false; d.setDate(d.getDate() + 1); return ativo(diaDe(d)); }),
  };
  for (const [id, ok] of Object.entries(cond)) if (ok) mudou = conquista(id) || mudou;
  if (cresce()) mudou = true;
  if (mudou) { salvar(); aplicaMundo(); }
  return mudou;
}
function conquista(id) {
  if (S.conq[id]) return false;
  const c = CONQUISTAS.find(x => x.id === id); if (!c) return false;
  S.conq[id] = Date.now(); dar(c.premio);
  festa({ cria: c.premio.criaturas?.[0], icone: "trofeu", titulo: `Conquista · ${c.titulo}`, texto: c.desc, chips: descrevePremio(c.premio) });
  return true;
}

function registraFoco(min, mat) {
  if (min < 1) return;
  const h = diaObj(); h.min += min; h.sess++;
  S.totMin += min; S.maxSess = Math.max(S.maxSess, min);
  if (mat) matStat(mat).min += min;
  S.log.unshift({ t: Date.now(), m: min, mat }); S.log = S.log.slice(0, 80);
  ganhaXP(min * 2 + (min >= 25 ? 10 : 0));
  const hr = new Date().getHours();
  if (hr >= 22) conquista("coruja");
  if (hr >= 4 && hr < 7) conquista("madrugador");
  if (min >= 60) conquista("maratona");
  toast(`Sessão registrada · ${fmtMin(min)} · +${min * 2 + (min >= 25 ? 10 : 0)} XP`);
  checaTudo(); salvar(); atualiza();
}
function registraCard(card, acertou) {
  const c = (S.cards[card.id] ||= { b: 0, ok: 0, err: 0 });
  const eraErrado = c.err > 0 && c.b === 0, h = diaObj(), ms = matStat(card.mat);
  if (acertou) { c.b = Math.min(5, c.b + 1); c.ok++; S.totOk++; h.ok++; ms.ok++; if (eraErrado) { S.rev++; h.rev++; } }
  else { c.b = 0; c.err++; S.totErr++; h.err++; ms.err++; }
  c.t = Date.now(); S.totCards++; h.cards++; ms.cards++;
  ganhaXP(acertou ? 2 : 1); checaTudo(); salvar();
}
function marcaLida(mat, sid, sim = true) {
  const k = `${mat}--${sid}`;
  if (sim) { S.lidas[k] = Date.now(); if (!S.premLidas[k]) { S.premLidas[k] = 1; diaObj().lidas++; ganhaXP(20); toast("Seção concluída · +20 XP"); } }
  else delete S.lidas[k];
  checaTudo(); salvar(); atualiza();
}

/* =========================================================
   toasts, modais, festa
   ========================================================= */
function toast(t) { const el = document.createElement("div"); el.className = "toast"; el.textContent = t; $("#toasts").appendChild(el); setTimeout(() => el.remove(), 3600); }
let modalAberto = false;
function modal(html, { onClose } = {}) {
  const root = $("#modalRoot");
  root.innerHTML = `<div class="modal-bg"><div class="modal vidro" role="dialog">${html}</div></div>`;
  modalAberto = true;
  const bg = root.firstChild, fecha = () => { root.innerHTML = ""; modalAberto = false; onClose?.(); setTimeout(proximaFesta, 60); };
  bg.addEventListener("click", e => { if (e.target === bg) fecha(); });
  $$("[data-fecha]", bg).forEach(b => b.addEventListener("click", fecha));
  return { el: bg.firstChild, fecha };
}
function confirma(titulo, texto, ok = "Confirmar", perigo = false) {
  return new Promise(res => {
    const m = modal(`<h3>${esc(titulo)}</h3><p class="muted">${esc(texto)}</p><div class="acts"><button class="btn" data-fecha>Cancelar</button><button class="btn ${perigo ? "bad" : "pri"}" id="mOk">${esc(ok)}</button></div>`, { onClose: () => res(false) });
    $("#mOk", m.el).addEventListener("click", () => { res(true); m.fecha(); });
  });
}
function formulario(titulo, campos, ok = "Salvar") {
  return new Promise(res => {
    const html = campos.map(c => `<label class="lb" for="ff_${c.k}">${esc(c.label)}</label>` + (c.tipo === "select"
      ? `<select class="f" id="ff_${c.k}">${c.opcoes.map(o => `<option value="${esc(o[0])}" ${o[0] === c.valor ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`
      : c.tipo === "area" ? `<textarea class="f" id="ff_${c.k}" rows="3">${esc(c.valor || "")}</textarea>`
      : `<input class="f" id="ff_${c.k}" ${c.lista ? `list="dl_${c.k}"` : ""} value="${esc(c.valor || "")}" placeholder="${esc(c.ph || "")}">${c.lista ? `<datalist id="dl_${c.k}">${c.lista.map(o => `<option value="${esc(o)}">`).join("")}</datalist>` : ""}`)).join("");
    let feito = false;
    const m = modal(`<h3>${esc(titulo)}</h3>${html}<div class="acts"><button class="btn" data-fecha>Cancelar</button><button class="btn pri" id="mOk">${esc(ok)}</button></div>`, { onClose: () => { if (!feito) res(null); } });
    $("input,textarea", m.el)?.focus();
    const go = () => { const o = {}; campos.forEach(c => o[c.k] = $("#ff_" + c.k, m.el).value.trim()); if (campos.some(c => c.obrig && !o[c.k])) { toast("Preencha os campos obrigatórios."); return; } feito = true; res(o); m.fecha(); };
    $("#mOk", m.el).addEventListener("click", go);
    m.el.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.tagName === "INPUT") go(); });
  });
}
async function proximaFesta() {
  if (modalAberto || !filaFesta.length) return;
  const f = filaFesta.shift();
  const m = modal(`<div class="festa"><div class="im" id="fIm">${estiloIcone === "3d" && FIG[f.icone] ? `<img class="fig" src="${FIG[f.icone]}" alt="">` : ic(f.icone || "estrela")}</div><div class="kicker">${f.cria ? "Nova criatura" : "Recompensa"}</div><h3 style="margin-top:6px">${esc(f.titulo)}</h3><p class="muted" style="margin:6px 0 10px;font-weight:300">${esc(f.texto || "")}</p>
    <div class="premios" style="justify-content:center">${(f.chips || []).map(c => `<span>${esc(c)}</span>`).join("")}</div></div>
    <div class="acts" style="justify-content:center"><button class="btn" id="mVer">Ver no planeta</button><button class="btn pri" data-fecha>Continuar</button></div>`);
  $("#mVer", m.el).addEventListener("click", () => { m.fecha(); show("mundo"); if (f.cria) setTimeout(() => mundo?.foco(f.cria), 900); });
  if (f.cria) { await garanteMod(); const url = await mundoMod?.miniatura(f.cria); const im = $("#fIm"); if (url && im) im.innerHTML = `<img src="${url}" alt="">`; }
}

/* =========================================================
   navegação
   ========================================================= */
const VIEWS = [["inicio", "casa", "Início"], ["mundo", "planeta", "Meu mundo"], ["foco", "relogio", "Foco"], ["materias", "livro", "Matérias"], ["revisao", "cards", "Flashcards"], ["missoes", "bandeira", "Missões"], ["progresso", "grafico", "Progresso"]];
$("#nav").innerHTML = VIEWS.map(([k, i, t]) => `<button class="navbtn" data-view="${k}" aria-label="${t}">${ic(i)}<span class="tip">${t}</span></button>`).join("");
let atual = null, sub = LS.get("sub", { tela: "lista" }), editando = false;
function show(v, opts = {}) {
  if (!VIEWS.some(x => x[0] === v)) v = "inicio";
  if (editando && v !== "materias") editando = false;
  atual = v; LS.set("view", v);
  VIEWS.forEach(([k]) => { $("#view-" + k).hidden = k !== v; });
  $$(".navbtn[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === v));
  layoutMundo(); render();
  if (!opts.manterScroll) window.scrollTo(0, 0);
}
function layoutMundo() {
  if (!mundo) return;
  const leitura = atual === "materias" && sub.tela === "sec";
  mundo.layout(atual === "inicio" ? "centro" : atual === "mundo" ? "mundo" : leitura || atual === "revisao" ? "fundo" : "lado");
}
function render() {
  renderTopo();
  ({ inicio: renderInicio, mundo: renderMundo, foco: renderFoco, materias: renderMaterias, revisao: renderRevisao, missoes: renderMissoes, progresso: renderProgresso })[atual]?.();
}
function atualiza() {
  renderTopo();
  if (atual === "inicio") renderInicio();
  else if (atual === "mundo" || atual === "missoes" || atual === "progresso") render();
  else if (atual === "materias" && !editando) render();
}
document.addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g) { e.preventDefault(); show(g.dataset.go); } });
$$(".navbtn[data-view]").forEach(b => b.addEventListener("click", () => { if (b.dataset.view === "materias" && atual === "materias") { sub = { tela: "lista" }; LS.set("sub", sub); } show(b.dataset.view); }));

function renderTopo() {
  const n = S.nivel, a = nivelXP(n), b = nivelXP(n + 1), pct = Math.round((S.xp - a) / (b - a) * 100);
  const st = conta ? (nuvem === "erro" ? ["", "Erro ao salvar", "Não consegui salvar agora; vou tentar de novo na próxima ação"] : ["on", esc(conta.nome || "Conta"), "Progresso salvo na sua conta"]) : nuvem === "ok" ? ["on", "Na conta", "Progresso salvo na sua conta"] : nuvem === "so-local" ? ["", "Local", "Progresso salvo só neste navegador"] : db ? ["", "Sincronizando", ""] : ["", "Local", "Progresso salvo neste navegador"];
  $("#topo").innerHTML = `
    ${modoTeste() ? `<span class="chipi" style="border-color:rgba(242,196,110,.5);color:var(--gold)">Modo teste</span>` : ""}
    <span class="chipi" title="${S.xp} XP no total">${fig("estrela")} Nível ${n}<span class="lbar"><i style="width:${pct}%"></i></span></span>
    <span class="chipi" title="Dias seguidos estudando">${fig("chama")} ${sequencia()}</span>
    <button class="chipi" style="cursor:pointer" id="btTema" title="Aparência">${ic("brilho", "s")} Tema</button>
    ${modoConta ? `<button class="chipi" style="cursor:pointer" id="btConta" title="${esc(st[2])}">${conta?.foto ? `<img src="${esc(conta.foto)}" alt="" style="width:20px;height:20px;border-radius:50%;margin:-3px 0" referrerpolicy="no-referrer">` : `<span class="dot ${st[0]}"></span>`}${conta ? st[1] : "Entrar"}</button>` : `<span class="chipi" title="${esc(st[2])}"><span class="dot ${st[0]}"></span>${st[1]}</span>`}
    ${souDono || modoTeste() ? `<button class="chipi" style="cursor:pointer" id="btAdmin" title="Painel de administrador">${ic("lapis", "s")} Admin</button>` : ""}`;
  $("#btAdmin")?.addEventListener("click", painelAdmin);
  $("#btTema")?.addEventListener("click", escolheTema);
  $("#btConta")?.addEventListener("click", () => conta ? menuConta() : telaLogin(true));
}

/* =========================================================
   planeta
   ========================================================= */
let mundo = null, mundoMod = null;
temaMundo = () => mundo?.tema?.(tema);
const estadoMundo = () => ({ verdor: verdor(), efeitos: S.efeitos, decos: S.decos, criaturas: S.criaturas });
async function garanteMod() {
  if (mundoMod) return mundoMod;
  try { mundoMod = await import("./world.js"); sorteioP = mundoMod.sorteiaPonto; } catch (e) { console.warn(e); }
  return mundoMod;
}
let tExplora = null;
function explorando() {
  if (atual !== "inicio" && atual !== "mundo") return;
  document.body.classList.add("explorando");
  clearTimeout(tExplora); tExplora = setTimeout(() => document.body.classList.remove("explorando"), 2500);
}
async function iniciaMundo() {
  const m = await garanteMod(); if (!m) return;
  mundo = m.criaMundo($("#espaco"));
  ["pointerdown", "pointermove", "wheel", "touchmove"].forEach(ev => $("#espaco").addEventListener(ev, e => { if (ev === "pointermove" && !e.buttons) return; explorando(); }, { passive: true }));
  // reposiciona itens antigos que estavam sem lugar
  S.decos.forEach(d => { if (d.d[0] === 0 && d.d[1] === 1 && d.d[2] === 0) d.d = sorteioP(!!S.efeitos.agua); });
  layoutMundo(); aplicaTema(); aplicaMundo();
}
function aplicaMundo() { if (mundo) mundo.aplica(estadoMundo()); document.body.classList.toggle("aurora", !!S.efeitos.aurora); }

/* =========================================================
   início
   ========================================================= */
function saudacao() { const h = new Date().getHours(); return h < 5 ? "Boa madrugada" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"; }
function renderInicio() {
  const h = diaObj(), D = diarias(), j = JORNADA[S.jornada], m = metricas();
  const ult = S.ultimo && materia(S.ultimo.mat) && materia(S.ultimo.mat).secoes.find(s => s.id === S.ultimo.sid);
  const fase = !S.efeitos.broto ? "Um planeta de cristal, ainda sem vida" : verdor() < .4 ? "A vida está começando" : verdor() < .8 ? "Um mundo em crescimento" : "Um mundo cheio de vida";
  $("#view-inicio").innerHTML = `
    <div class="home">
      <div class="esq">
        <div class="some-ao-girar">
          <h1 class="titulo">${saudacao()}</h1>
          <p class="sub">${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} · ${fase}</p>
        </div>
        <div class="some-ao-girar">
          <div class="stats">
            <div class="stat"><b>${fmtMin(h.min)}</b><span>hoje</span></div>
            <div class="stat"><b>${h.cards}</b><span>cards hoje</span></div>
            <div class="stat"><b>${S.criaturas.length}</b><span>criaturas</span></div>
            <div class="stat"><b>${S.decos.length}</b><span>elementos</span></div>
          </div>
          <p class="dica-mundo" style="margin-top:14px">Arraste para girar o planeta</p>
        </div>
      </div>
      <div class="dir">
        <div class="vidro card acao">
          <div class="ico">${ic(S.timer ? "relogio" : "play")}</div>
          <div class="t"><b>${S.timer ? "Sessão em andamento" : "Começar a estudar"}</b><span>${S.timer ? "Continue de onde parou" : "Cada minuto faz seu planeta crescer"}</span></div>
          <button class="btn pri" data-go="foco">${S.timer ? "Abrir" : "Foco"}</button>
        </div>
        ${ult ? `<div class="vidro card acao">${icoBox(iconeMat(materia(S.ultimo.mat)))}<div class="t"><b>${esc(ult.titulo)}</b><span>Continuar lendo · ${esc(materia(S.ultimo.mat).sigla || materia(S.ultimo.mat).nome)}</span></div><button class="btn" id="btCont">${ic("setad", "s")}</button></div>` : ""}
        <div class="vidro card">
          <h2 class="h-sec">Missões de hoje<span class="grow"></span>${D.bonus ? "completas" : "3 = criatura nova"}</h2>
          ${D.ids.map(id => { const q = DIARIAS.find(x => x.id === id); if (!q) return ""; const v = Math.min(q.alvo, q.meta(h)), ok = !!D.pegas[id];
            return `<div class="miss ${ok ? "done" : ""}"><div class="ico ${ok ? "ok" : ""}">${ic(ok ? "check" : "alvo", "s")}</div><div class="t"><b>${esc(q.txt)}</b><small>${v} de ${q.alvo}</small><div class="bar"><i style="width:${v / q.alvo * 100}%"></i></div></div><span class="rw">+${q.sem} XP</span></div>`; }).join("")}
        </div>
        ${j ? `<div class="vidro card"><h2 class="h-sec">Próximo na jornada</h2>
          <div class="miss" style="border:0;padding:0">${icoBox("bau")}<div class="t"><b>${esc(j.titulo)}</b><small>${esc(j.desc)} · ${Math.min(j.alvo, j.meta(m))} de ${j.alvo}${j.un ? " " + j.un : ""}</small><div class="bar"><i style="width:${Math.min(100, j.meta(m) / j.alvo * 100)}%"></i></div>
          <div class="premios">${descrevePremio(j.premio).map(c => `<span>${esc(c)}</span>`).join("")}</div></div></div></div>` : `<div class="vidro card">Você completou toda a jornada.</div>`}
        <div class="vidro card acao"><div class="ico">${ic("cards")}</div><div class="t"><b>Flashcards</b><span>${todosCards().filter(c => (S.cards[c.id]?.b || 0) < 3).length} para dominar</span></div><button class="btn" data-go="revisao">Revisar</button></div>
      </div>
    </div>`;
  $("#btCont")?.addEventListener("click", () => abreSecao(S.ultimo.mat, S.ultimo.sid));
}

/* =========================================================
   meu mundo
   ========================================================= */
const RARO_ORDEM = ["comum", "incomum", "raro", "lendario"];
function comoGanhar(k) {
  const j = JORNADA.find(x => x.premio.criaturas?.includes(k)); if (j) return `Jornada · ${j.titulo}`;
  const c = CONQUISTAS.find(x => x.premio.criaturas?.includes(k)); if (c) return `Conquista · ${c.titulo}`;
  return "Ovo surpresa";
}
let colAberta = LS.get("colAberta", false);
function renderMundo() {
  const ks = Object.keys(CRIATURAS).sort((a, b) => (S.criaturas.includes(b) - S.criaturas.includes(a)) || RARO_ORDEM.indexOf(CRIATURAS[a].r) - RARO_ORDEM.indexOf(CRIATURAS[b].r));
  $("#view-mundo").innerHTML = `
    <div class="mundo-ui">
      <div class="some-ao-girar">
        <h1 class="titulo p">Meu mundo</h1>
        <p class="sub">Nível ${S.nivel} · ${Math.round(verdor() * 100)}% de vida · ${plural(S.criaturas.length, "criatura", "criaturas")} · ${S.decos.length} elementos</p>
        <p class="intro" style="max-width:420px">Tudo aqui surgiu do seu estudo. Gire e aproxime com o mouse ou os dedos.</p>
      </div>
      <div class="vidro painel-mundo">
        <div class="efeitos">${Object.entries(EFEITOS).map(([k, e]) => `<span class="efe ${S.efeitos[k] ? "on" : ""}" title="${S.efeitos[k] ? "Ativo" : esc((JORNADA.find(x => x.premio.efeitos?.includes(k)) || {}).titulo || "")}">${S.efeitos[k] ? fig(ICONE_EFEITO[k]) : ic("cadeado", "s")}${e.nome}</span>`).join("")}</div>
        <h2 class="h-sec" style="margin-top:10px;cursor:pointer" id="togCol">Coleção · ${S.criaturas.length} de ${ks.length}<span class="grow"></span>${ic(colAberta ? "baixo" : "cima", "s")}</h2>
        <div class="colecao" ${colAberta ? "" : "hidden"}>${ks.map(k => { const c = CRIATURAS[k], tem = S.criaturas.includes(k);
          return `<div class="cria ${tem ? "" : "lock"}" ${tem ? `data-foco="${k}"` : ""} title="${esc(tem ? c.nome : comoGanhar(k))}"><div class="im" data-mini="${tem ? k : ""}">${ic(tem ? "ovo" : "cadeado")}</div><div class="nm">${tem ? esc(c.nome) : "???"}</div><div class="rr">${tem ? RARIDADE[c.r].nome : esc(comoGanhar(k).split(" · ")[0])}</div></div>`; }).join("")}</div>
      </div>
    </div>`;
  $$("[data-foco]").forEach(b => b.addEventListener("click", () => { mundo?.foco(b.dataset.foco); explorando(); }));
  $("#togCol").addEventListener("click", () => { colAberta = !colAberta; LS.set("colAberta", colAberta); renderMundo(); });
  garanteMod().then(mod => { if (!mod) return; $$("[data-mini]").forEach(async el => { const k = el.dataset.mini; if (!k) return; const u = await mod.miniatura(k); if (u && el.isConnected) el.innerHTML = `<img src="${u}" alt="">`; }); });
}

/* =========================================================
   foco
   ========================================================= */
let focoDur = LS.get("focoDur", 25), focoMat = LS.get("focoMat", "");
const decorrido = () => !S.timer ? 0 : S.timer.acc + (S.timer.pausa ? 0 : Date.now() - S.timer.ini);
function iniciaFoco() { S.timer = { mat: focoMat, dur: focoDur, ini: Date.now(), acc: 0, pausa: false }; salvar(); render(); tick(); }
function pausaFoco() { if (!S.timer) return; if (S.timer.pausa) { S.timer.pausa = false; S.timer.ini = Date.now(); } else { S.timer.acc = decorrido(); S.timer.pausa = true; } salvar(); render(); }
function encerraFoco(salva = true) {
  if (!S.timer) return; const min = Math.floor(decorrido() / 60000), mat = S.timer.mat; S.timer = null; salvar(); document.title = "Planeta de Estudos";
  if (salva && min >= 1) registraFoco(min, mat); else if (salva) toast("Menos de 1 minuto: não foi registrado.");
  render();
}
function tick() {
  const pill = $("#timerPill");
  if (!S.timer) { pill.hidden = true; return; }
  const ms = decorrido(), dur = S.timer.dur * 60000, falta = dur ? Math.max(0, dur - ms) : ms;
  const t = `${pad(Math.floor(falta / 60000))}:${pad(Math.floor(falta / 1000) % 60)}`;
  pill.hidden = atual === "foco";
  pill.innerHTML = `${ic(S.timer.pausa ? "pausa" : "relogio", "s")}<b>${t}</b>`;
  const el = $("#focoTempo"); if (el) el.textContent = t;
  const br = $("#focoBar"); if (br && dur) br.style.width = Math.min(100, ms / dur * 100) + "%";
  document.title = S.timer.pausa ? "Pausado · Planeta de Estudos" : `${t} · Foco`;
  if (dur && ms >= dur && !S.timer.pausa) { encerraFoco(true); festa({ icone: "relogio", titulo: "Sessão concluída", texto: "Ótimo trabalho. Que tal uma pausa de 5 minutos?" }); }
}
$("#timerPill").addEventListener("click", () => show("foco"));
setInterval(tick, 1000);
function renderFoco() {
  const T = S.timer, ms = decorrido(), dur = T ? T.dur * 60000 : 0;
  const hojeLog = S.log.filter(l => diaDe(new Date(l.t)) === hoje());
  $("#view-foco").innerHTML = `
    <div class="foco-wrap">
      <div class="kicker">${T ? (T.pausa ? "Pausado" : T.dur ? "Tempo restante" : "Cronômetro livre") : "Sessão de foco"}</div>
      <div class="tempo-big" id="focoTempo">${T ? "" : focoDur ? pad(focoDur) + ":00" : "00:00"}</div>
      ${T ? `<div style="width:min(420px,80vw)" class="bar"><i id="focoBar" style="width:${dur ? Math.min(100, ms / dur * 100) : 0}%"></i></div>
          <p class="sub">${T.mat && materia(T.mat) ? esc(materia(T.mat).nome) : "Estudo livre"}</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
            <button class="btn" id="fPausa">${ic(T.pausa ? "play" : "pausa", "s")}${T.pausa ? "Continuar" : "Pausar"}</button>
            <button class="btn pri" id="fFim">${ic("check", "s")}Concluir</button>
            <button class="btn" id="fDesc">${ic("x", "s")}Descartar</button></div>`
      : `<div class="durs">${[15, 25, 45, 60, 90, 0].map(d => `<button class="${focoDur === d ? "on" : ""}" data-dur="${d}">${d ? d + " min" : "Livre"}</button>`).join("")}</div>
         <select class="f" id="fMat" style="max-width:340px"><option value="">Estudo livre</option>${materias().map(m => `<option value="${esc(m.id)}" ${focoMat === m.id ? "selected" : ""}>${esc(m.nome)}</option>`).join("")}</select>
         <button class="btn pri" id="fIni" style="padding:14px 40px">${ic("play", "s")}Começar</button>
         <p class="muted" style="font-weight:300;max-width:440px;margin:0">Cada minuto vale 2 XP. Sessões de 25 minutos ou mais dão +10 XP de bônus.</p>`}
      <div class="vidro card" style="width:min(520px,100%);text-align:left;margin-top:10px">
        <h2 class="h-sec">Hoje<span class="grow"></span>${fmtMin(diaObj().min)} · ${plural(diaObj().sess, "sessão", "sessões")}</h2>
        ${hojeLog.length ? `<div class="secs">${hojeLog.map(l => `<div class="sec" style="cursor:default"><span class="t">${new Date(l.t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · ${l.mat && materia(l.mat) ? esc(materia(l.mat).sigla || materia(l.mat).nome) : "Livre"}</span><span class="n">${fmtMin(l.m)}</span></div>`).join("")}</div>` : `<p class="muted" style="margin:0;font-weight:300">Nenhuma sessão ainda hoje.</p>`}
      </div>
    </div>`;
  $$("[data-dur]").forEach(b => b.addEventListener("click", () => { focoDur = +b.dataset.dur; LS.set("focoDur", focoDur); renderFoco(); }));
  $("#fMat")?.addEventListener("change", e => { focoMat = e.target.value; LS.set("focoMat", focoMat); });
  $("#fIni")?.addEventListener("click", iniciaFoco);
  $("#fPausa")?.addEventListener("click", pausaFoco);
  $("#fFim")?.addEventListener("click", () => encerraFoco(true));
  $("#fDesc")?.addEventListener("click", async () => { if (await confirma("Descartar sessão?", "O tempo desta sessão não será contado.", "Descartar", true)) encerraFoco(false); });
  tick();
}

/* =========================================================
   matérias e leitura
   ========================================================= */
function abreSecao(mat, sid) { sub = { tela: "sec", mat, sid }; LS.set("sub", sub); editando = false; S.ultimo = { mat, sid }; salvar(); show("materias"); }
function abreMateria(mat) { sub = { tela: "mat", mat }; LS.set("sub", sub); editando = false; show("materias"); }
let buscaMat = "", destacar = "";
function renderMaterias() {
  const v = $("#view-materias");
  layoutMundo();
  if (sub.tela === "sec" && materia(sub.mat)) return renderLeitura(v);
  if (sub.tela === "mat" && materia(sub.mat)) return renderMateria(v);
  const ms = materias();
  v.innerHTML = `<div class="pagina">
    <h1 class="titulo p">Matérias</h1>
    <p class="intro">Seus conteúdos, organizados em seções. Cada seção concluída vale 20 XP.</p>
    <label class="f" style="display:flex;align-items:center;gap:10px;max-width:520px;margin-bottom:22px;color:var(--muted)">${ic("lupa", "s")}<input id="busca" style="border:0;background:none;outline:0;flex:1;font:400 14.5px var(--font);color:var(--ink)" placeholder="Buscar em todas as seções" value="${esc(buscaMat)}"></label>
    <div id="resBusca"></div>
    <div class="mats">${ms.map(m => { const tot = m.secoes.length, li = m.secoes.filter(s => S.lidas[`${m.id}--${s.id}`]).length, st = S.mats[m.id];
      return `<div class="mat vidro" data-mat="${esc(m.id)}"><div class="hd">${icoBox(iconeMat(m))}<div><b>${esc(m.nome)}</b><br><small>${esc(m.sub || "")}</small></div></div>
        <div class="bar"><i style="width:${tot ? li / tot * 100 : 0}%"></i></div>
        <small>${li} de ${tot} seções · ${cardsCompartilhados(m.id).length + (S.meus[m.id] || []).length} cards${st?.min ? " · " + fmtMin(st.min) : ""}</small></div>`; }).join("")}
      ${souDono ? `<div class="mat vidro add" id="novaMat">${ic("mais")} Nova matéria</div>` : ""}</div></div>`;
  $$("[data-mat]", v).forEach(b => b.addEventListener("click", () => abreMateria(b.dataset.mat)));
  $("#novaMat", v)?.addEventListener("click", novaMateria);
  const inp = $("#busca", v); inp.addEventListener("input", () => { buscaMat = inp.value; mostraBusca(); }); mostraBusca();
}
function mostraBusca() {
  const box = $("#resBusca"); if (!box) return;
  const q = buscaMat.trim().toLowerCase(); if (q.length < 2) { box.innerHTML = ""; return; }
  const res = [];
  for (const m of materias()) for (const s of m.secoes) {
    const t = textoDe(htmlSecao(m.id, s.id)), i = t.toLowerCase().indexOf(q);
    if (i >= 0 || s.titulo.toLowerCase().includes(q)) res.push({ m, s, trecho: i >= 0 ? "…" + t.slice(Math.max(0, i - 60), i + 90).replace(/\s+/g, " ") + "…" : "" });
  }
  box.innerHTML = `<div class="vidro card" style="margin-bottom:22px"><div class="secs">${res.slice(0, 12).map((r, i) => `<div class="sec" data-r="${i}"><span class="t">${esc(r.s.titulo)}<br><small class="muted" style="font-weight:300">${esc(r.m.sigla || r.m.nome)} · ${esc(r.trecho)}</small></span></div>`).join("") || '<div class="empty">Nada encontrado.</div>'}</div></div>`;
  $$("[data-r]", box).forEach(b => b.addEventListener("click", () => { const r = res[+b.dataset.r]; destacar = buscaMat.trim(); abreSecao(r.m.id, r.s.id); }));
}
const camposMateria = m => [{ k: "nome", label: "Nome", obrig: 1, valor: m?.nome, ph: "Ex.: Cirurgia" }, { k: "sigla", label: "Sigla curta", valor: m?.sigla, ph: "Ex.: CIR" },
  { k: "icone", label: "Ícone", tipo: "select", valor: m ? iconeMat(m) : "livro", opcoes: ICONES_MATERIA.map(i => [i, { livro: "Livro", estetoscopio: "Estetoscópio", bisturi: "Bisturi", microscopio: "Microscópio", coracao: "Coração", cerebro: "Cérebro", dna: "DNA", pilula: "Pílula", osso: "Osso" }[i]]) },
  { k: "sub", label: "Subtítulo", valor: m?.sub, ph: "Ex.: Liga · prova de dezembro" }];
async function novaMateria() {
  const o = await formulario("Nova matéria", camposMateria(null), "Criar"); if (!o) return;
  const id = (o.nome.normalize("NFD").replace(/[^\w]+/g, "").toLowerCase().slice(0, 10) || "mat") + uid6().slice(0, 3);
  await salvaIndice([...materias().map(x => ({ ...x })), { id, nome: o.nome, sigla: o.sigla, icone: o.icone, sub: o.sub, secoes: [] }]); abreMateria(id);
}
async function editaMateria(m) { const o = await formulario("Editar matéria", camposMateria(m)); if (o) await salvaIndice(materias().map(x => x.id === m.id ? { ...x, ...o } : x)); }
const alteraSecoes = (matId, fn) => salvaIndice(materias().map(x => x.id === matId ? { ...x, secoes: fn(x.secoes.map(s => ({ ...s }))) } : x));

let abaMat = "secoes";
function renderMateria(v) {
  const m = materia(sub.mat);
  const grupos = []; m.secoes.forEach(s => { const g = s.grupo || ""; let G = grupos.find(x => x.g === g); if (!G) grupos.push(G = { g, l: [] }); G.l.push(s); });
  const nCards = cardsCompartilhados(m.id).length + (S.meus[m.id] || []).length;
  v.innerHTML = `<div class="pagina">
    <button class="backlink" id="voltar">${ic("seta", "s")} Matérias</button>
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      ${icoBox(iconeMat(m))}
      <div style="flex:1;min-width:200px"><h1 class="titulo p" style="font-size:clamp(20px,2.4vw,30px)">${esc(m.nome)}</h1><p class="sub" style="margin-top:6px">${esc(m.sub || "")}</p></div>
      ${souDono ? `<button class="btn sm" id="edMat">${ic("lapis", "s")}Editar</button><button class="btn sm bad" id="apMat">${ic("lixo", "s")}</button>` : ""}
    </div>
    <div style="margin:22px 0 16px"><div class="tabs"><button class="${abaMat === "secoes" ? "on" : ""}" data-am="secoes">Seções · ${m.secoes.length}</button><button class="${abaMat === "cards" ? "on" : ""}" data-am="cards">Flashcards · ${nCards}</button></div></div>
    <div class="vidro card" id="matCorpo"></div></div>`;
  $("#voltar").addEventListener("click", () => { sub = { tela: "lista" }; LS.set("sub", sub); render(); });
  $$("[data-am]", v).forEach(b => b.addEventListener("click", () => { abaMat = b.dataset.am; renderMateria(v); }));
  $("#edMat", v)?.addEventListener("click", () => editaMateria(m));
  $("#apMat", v)?.addEventListener("click", async () => { if (await confirma(`Apagar ${m.nome}?`, "A matéria some do site. O progresso das pessoas não é apagado.", "Apagar", true)) { await salvaIndice(materias().filter(x => x.id !== m.id)); sub = { tela: "lista" }; render(); } });
  const corpo = $("#matCorpo");
  if (abaMat !== "secoes") return renderCardsMateria(corpo, m);
  corpo.innerHTML = (grupos.map((G, gi) => `${G.g ? `<div class="grupo" ${gi ? "" : 'style="margin-top:4px"'}>${esc(G.g)}</div>` : ""}<div class="secs">${G.l.map(s => { const lida = !!S.lidas[`${m.id}--${s.id}`];
    return `<div class="sec ${lida ? "lida" : ""}" data-sec="${esc(s.id)}"><span class="ck">${lida ? ic("check", "s") : ""}</span><span class="t">${esc(s.titulo)}</span>
      ${souDono ? `<span class="ownbar"><button class="btn ic sm" data-up="${esc(s.id)}" title="Subir">${ic("cima", "s")}</button><button class="btn ic sm" data-dn="${esc(s.id)}" title="Descer">${ic("baixo", "s")}</button><button class="btn ic sm" data-ren="${esc(s.id)}" title="Renomear">${ic("lapis", "s")}</button><button class="btn ic sm" data-del="${esc(s.id)}" title="Apagar">${ic("lixo", "s")}</button></span>` : `<span class="n">${lida ? "Concluída" : ""}</span>`}</div>`; }).join("")}</div>`).join("") || `<div class="empty">Nenhuma seção ainda.</div>`)
    + (souDono ? `<div style="margin-top:16px"><button class="btn pri" id="novaSec">${ic("mais", "s")}Nova seção</button></div>` : "");
  $$("[data-sec]", corpo).forEach(b => b.addEventListener("click", e => { if (e.target.closest(".ownbar")) return; abreSecao(m.id, b.dataset.sec); }));
  const move = (id, d) => alteraSecoes(m.id, l => { const i = l.findIndex(s => s.id === id), j = i + d; if (j < 0 || j >= l.length) return l; [l[i], l[j]] = [l[j], l[i]]; return l; });
  $$("[data-up]", corpo).forEach(b => b.addEventListener("click", () => move(b.dataset.up, -1)));
  $$("[data-dn]", corpo).forEach(b => b.addEventListener("click", () => move(b.dataset.dn, 1)));
  const gruposL = [...new Set(m.secoes.map(x => x.grupo).filter(Boolean))];
  $$("[data-ren]", corpo).forEach(b => b.addEventListener("click", async () => {
    const s = m.secoes.find(x => x.id === b.dataset.ren);
    const o = await formulario("Renomear seção", [{ k: "titulo", label: "Título", obrig: 1, valor: s.titulo }, { k: "grupo", label: "Grupo (opcional)", valor: s.grupo, lista: gruposL }]);
    if (o) alteraSecoes(m.id, l => l.map(x => x.id === s.id ? { ...x, ...o } : x));
  }));
  $$("[data-del]", corpo).forEach(b => b.addEventListener("click", async () => {
    const s = m.secoes.find(x => x.id === b.dataset.del);
    if (await confirma(`Apagar "${s.titulo}"?`, "A seção deixa de aparecer no site.", "Apagar", true)) alteraSecoes(m.id, l => l.filter(x => x.id !== s.id));
  }));
  $("#novaSec", corpo)?.addEventListener("click", async () => {
    const o = await formulario("Nova seção", [{ k: "titulo", label: "Título", obrig: 1 }, { k: "grupo", label: "Grupo (opcional)", lista: gruposL, ph: "Ex.: Resumo completo" }], "Criar e escrever");
    if (!o) return; const sid = "s" + uid6();
    await alteraSecoes(m.id, l => [...l, { id: sid, titulo: o.titulo, grupo: o.grupo }]);
    await salvaSecao(m.id, sid, "<p></p>");
    sub = { tela: "sec", mat: m.id, sid }; LS.set("sub", sub); editando = true; render();
  });
}
function renderCardsMateria(corpo, m) {
  const shared = cardsCompartilhados(m.id), meus = S.meus[m.id] || [];
  const linha = (c, tipo) => `<div class="cardrow" data-id="${esc(c.id)}" data-tipo="${tipo}"><div class="ce" ${tipo === "ro" ? "" : 'contenteditable="true"'} data-f="frente">${c.frente}</div><div class="ce" ${tipo === "ro" ? "" : 'contenteditable="true"'} data-f="verso" style="color:var(--muted)">${c.verso}</div>${tipo === "ro" ? `<span class="n muted" style="font-size:11px;padding:8px;letter-spacing:.12em;text-transform:uppercase">${S.cards[c.id] ? (S.cards[c.id].b >= 3 ? "dominado" : S.cards[c.id].err ? "rever" : "") : ""}</span>` : `<button class="btn ic sm" data-rm title="Apagar">${ic("lixo", "s")}</button>`}</div>`;
  corpo.innerHTML = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px"><button class="btn pri" id="revMat">${ic("cards", "s")}Revisar esta matéria</button><button class="btn" id="addMeu">${ic("mais", "s")}Card meu</button>${souDono ? `<button class="btn" id="addShared">${ic("mais", "s")}Card para todos</button>` : ""}</div>
    ${meus.length ? `<div class="grupo">Meus cards · só você vê</div><div>${meus.map(c => linha(c, "meu")).join("")}</div>` : ""}
    <div class="grupo">Cards da matéria</div>
    <div>${shared.map(c => linha(c, souDono ? "dono" : "ro")).join("") || '<div class="empty">Nenhum card ainda.</div>'}</div>
    ${souDono ? `<p class="muted" style="font-size:12.5px;font-weight:300;margin:12px 0 0">Clique no texto para editar. Salva quando você sai do campo.</p>` : ""}`;
  $("#revMat").addEventListener("click", () => { revCfg = { mat: m.id, filtro: "rec" }; LS.set("revCfg", revCfg); rodada = null; show("revisao"); });
  $("#addMeu").addEventListener("click", async () => {
    const o = await formulario("Novo card (só seu)", [{ k: "frente", label: "Pergunta", tipo: "area", obrig: 1 }, { k: "verso", label: "Resposta", tipo: "area", obrig: 1 }], "Criar");
    if (!o) return; (S.meus[m.id] ||= []).push({ id: "u" + uid6(), frente: esc(o.frente), verso: esc(o.verso), tag: "Meu card" }); S.criados++; checaTudo(); salvar(); renderCardsMateria(corpo, m);
  });
  $("#addShared")?.addEventListener("click", async () => {
    const o = await formulario("Novo card da matéria", [{ k: "frente", label: "Pergunta", tipo: "area", obrig: 1 }, { k: "verso", label: "Resposta", tipo: "area", obrig: 1 }], "Criar");
    if (!o) return; await salvaCards(m.id, [...shared, { id: "c" + uid6(), frente: esc(o.frente), verso: esc(o.verso), tag: m.sigla || m.nome }]); S.criados++; checaTudo(); salvar(); renderCardsMateria(corpo, m);
  });
  $$(".cardrow", corpo).forEach(r => {
    const id = r.dataset.id, tipo = r.dataset.tipo;
    $$(".ce[contenteditable]", r).forEach(ce => ce.addEventListener("blur", () => {
      const f = ce.dataset.f, val = ce.innerHTML.trim();
      if (tipo === "meu") { const c = S.meus[m.id].find(x => x.id === id); if (c && c[f] !== val) { c[f] = val; salvar(); } }
      else if (tipo === "dono") salvaCards(m.id, cardsCompartilhados(m.id).map(x => x.id === id ? { ...x, [f]: val } : x));
    }));
    $("[data-rm]", r)?.addEventListener("click", async () => {
      if (!(await confirma("Apagar este card?", textoDe(r.querySelector(".ce").innerHTML).slice(0, 120), "Apagar", true))) return;
      if (tipo === "meu") { S.meus[m.id] = S.meus[m.id].filter(x => x.id !== id); salvar(); }
      else await salvaCards(m.id, cardsCompartilhados(m.id).filter(x => x.id !== id));
      renderCardsMateria(corpo, m);
    });
  });
}
function melhoraDoc(pane, mat) {
  $$("table", pane).forEach(t => { if (t.parentNode.classList.contains("tablewrap")) return; const w = document.createElement("div"); w.className = "tablewrap"; t.parentNode.insertBefore(w, t); w.appendChild(t); });
  $$("[style]", pane).forEach(el => el.removeAttribute("style"));
  $$("td[data-bg]", pane).forEach(td => {
    const m = { "#fbebeb": "l1", "#f9ece7": "l2", "#f9eeda": "l3", "#f0efec": "l4" }[td.getAttribute("data-bg")];
    td.removeAttribute("data-bg");
    if (m) { const s = td.querySelector("strong") || td; s.innerHTML = `<span class="lvtag ${m}">${esc(s.textContent)}</span>`; }
  });
  const labels = [[/^Por que é essencial/, "lbl-why"], [/^Entenda primeiro/, "lbl-learn"], [/^Memorize\.?$/, "lbl-mem"], [/^Divergência entre aulas/, "lbl-div"], [/^Para aprofundar/, "lbl-ref"]];
  $$("p", pane).forEach(p => { const s = p.firstElementChild; if (!s || s.tagName !== "STRONG" || p.firstChild !== s) return; const t = s.textContent.trim(); for (const [re, c] of labels) if (re.test(t)) { p.classList.add("lbl", c); s.textContent = t.replace(/[.:]$/, ""); break; } });
  $$(".xref", pane).forEach(x => x.addEventListener("click", () => { const M = materia(mat); if (M && M.secoes.find(s => s.id === x.dataset.sec)) abreSecao(mat, x.dataset.sec); }));
}
function renderLeitura(v) {
  const m = materia(sub.mat), s = m.secoes.find(x => x.id === sub.sid);
  if (!s) { sub = { tela: "mat", mat: m.id }; return renderMateria(v); }
  const k = `${m.id}--${s.id}`, lida = !!S.lidas[k], idx = m.secoes.indexOf(s), prox = m.secoes[idx + 1], ant = m.secoes[idx - 1];
  const html = htmlSecao(m.id, s.id);
  if (editando && souDono) return renderEditor(v, m, s, html);
  v.innerHTML = `<div class="pagina larga">
    <button class="backlink" id="voltar">${ic("seta", "s")} ${esc(m.nome)}</button>
    <div class="leitura">
      <article class="doc vidro">
        <div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap"><div style="flex:1;min-width:220px"><div class="kicker">${esc(s.grupo || m.sigla || "")}</div><h1 class="titulo p" style="font-size:clamp(20px,2.3vw,28px);margin-top:8px;letter-spacing:.14em">${esc(s.titulo)}</h1></div>
        ${souDono ? `<button class="btn sm" id="btEditar2">${ic("lapis", "s")}Editar</button>` : ""}</div>
        <div class="linha"></div>
        <div id="pane">${html || '<p class="muted">Seção vazia.</p>'}</div>
        <div class="leiturafim"><div class="ico ${lida ? "ok" : ""}">${ic(lida ? "check" : "livro", "s")}</div><div class="t"><b style="font-weight:400">${lida ? "Seção concluída" : "Terminou de ler?"}</b><br><small class="muted">${lida ? "Desmarque se quiser rever." : "Marque como concluída e ganhe 20 XP."}</small></div>
          <button class="btn ${lida ? "" : "pri"}" id="btLida">${lida ? "Desmarcar" : "Concluir seção"}</button></div>
        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">${ant ? `<button class="btn" id="btAnt">${ic("seta", "s")}${esc(ant.titulo)}</button>` : ""}<span style="flex:1"></span>${prox ? `<button class="btn" id="btProx">${esc(prox.titulo)}${ic("setad", "s")}</button>` : ""}</div>
      </article>
      <aside class="toc vidro"><div class="kicker" style="padding:0 10px 8px">Nesta seção</div><ul id="tocL"></ul>${S.timer ? "" : `<button class="btn sm" style="margin:12px 6px 4px" data-go="foco">${ic("relogio", "s")}Estudar com foco</button>`}</aside>
    </div></div>`;
  const pane = $("#pane"); melhoraDoc(pane, m.id);
  const ch = (S.checks[k] ||= {});
  $$("li[data-checked]", pane).forEach((li, i) => {
    li.querySelector("input")?.remove();
    const span = document.createElement("span"); span.innerHTML = (li.querySelector("p") || li).innerHTML.trim();
    const cb = document.createElement("input"); cb.type = "checkbox"; li.innerHTML = ""; li.className = "task"; li.append(cb, span);
    const set = val => { cb.checked = val; li.classList.toggle("done", val); ch[i] = val; salvar(); };
    cb.addEventListener("click", e => { e.stopPropagation(); set(cb.checked); }); li.addEventListener("click", () => set(!cb.checked));
    if (ch[i]) { cb.checked = true; li.classList.add("done"); }
  });
  const toc = $("#tocL"), hs = $$("h2,h3", pane);
  if (!hs.length) toc.innerHTML = `<li><a>${esc(s.titulo)}</a></li>`;
  hs.forEach((h, i) => { h.id = "h" + i; const li = document.createElement("li"), a = document.createElement("a"); a.href = "#"; a.textContent = h.textContent; a.addEventListener("click", e => { e.preventDefault(); h.scrollIntoView({ block: "start", behavior: "smooth" }); }); li.append(a); toc.append(li); });
  if (destacar) { realca(pane, destacar); destacar = ""; }
  $("#voltar").addEventListener("click", () => abreMateria(m.id));
  $("#btLida").addEventListener("click", () => marcaLida(m.id, s.id, !lida));
  $("#btProx")?.addEventListener("click", () => abreSecao(m.id, prox.id));
  $("#btAnt")?.addEventListener("click", () => abreSecao(m.id, ant.id));
  $("#btEditar2")?.addEventListener("click", () => { editando = true; render(); });
}
function realca(pane, q) {
  const w = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT), nodes = []; let n; while ((n = w.nextNode())) nodes.push(n);
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"); let first = null;
  nodes.forEach(node => { if (!re.test(node.nodeValue)) return; re.lastIndex = 0; const f = document.createDocumentFragment(); let last = 0, m; const s = node.nodeValue;
    while ((m = re.exec(s))) { f.append(document.createTextNode(s.slice(last, m.index))); const mk = document.createElement("mark"); mk.className = "searchhit"; mk.textContent = m[0]; f.append(mk); first ||= mk; last = m.index + m[0].length; }
    f.append(document.createTextNode(s.slice(last))); node.replaceWith(f); });
  if (first) setTimeout(() => first.scrollIntoView({ block: "center" }), 60);
}
function renderEditor(v, m, s, html) {
  v.innerHTML = `<div class="pagina larga">
    <button class="backlink" id="voltar">${ic("seta", "s")} Sair sem salvar</button>
    <div class="doc vidro">
      <h1 class="titulo p" style="font-size:24px;letter-spacing:.14em">${esc(s.titulo)}</h1>
      <div class="edbar">
        <button data-c="bold"><b>Negrito</b></button><button data-c="italic"><i>Itálico</i></button>
        <button data-c="formatBlock" data-v="H2">Título</button><button data-c="formatBlock" data-v="H3">Subtítulo</button><button data-c="formatBlock" data-v="P">Texto</button>
        <button data-c="insertUnorderedList">Lista</button><button data-c="insertOrderedList">Lista numerada</button><button data-c="formatBlock" data-v="BLOCKQUOTE">Destaque</button>
        <button data-c="removeFormat">Limpar</button><span style="flex:1"></span>
        <button id="edSalvar" style="background:var(--ink);color:#0f1626">Salvar</button>
      </div>
      <div class="editavel" contenteditable="true" id="edArea">${html}</div>
    </div></div>`;
  const area = $("#edArea"); area.focus();
  $$(".edbar [data-c]").forEach(b => b.addEventListener("mousedown", e => { e.preventDefault(); document.execCommand(b.dataset.c, false, b.dataset.v || null); }));
  $("#edSalvar").addEventListener("click", async () => { await salvaSecao(m.id, s.id, area.innerHTML); editando = false; toast("Seção salva."); render(); });
  $("#voltar").addEventListener("click", async () => { if (await confirma("Sair sem salvar?", "As alterações feitas agora serão perdidas.", "Sair", true)) { editando = false; render(); } });
}

/* =========================================================
   flashcards
   ========================================================= */
let revCfg = LS.get("revCfg", { mat: "todas", filtro: "rec" }), rodada = null;
function baralho() {
  let l = todosCards(revCfg.mat); const st = c => S.cards[c.id];
  if (revCfg.filtro === "err") l = l.filter(c => st(c)?.err > 0 && st(c).b < 3);
  else if (revCfg.filtro === "novos") l = l.filter(c => !st(c));
  else if (revCfg.filtro === "rec") l = l.filter(c => (st(c)?.b || 0) < 3);
  return l;
}
function novaRodada() {
  const l = baralho().map(c => ({ c, p: (S.cards[c.id]?.b || 0) * 10 - (S.cards[c.id]?.err || 0) * 3 + Math.random() * 8 })).sort((a, b) => a.p - b.p);
  rodada = { cards: l.slice(0, 20).map(x => x.c), i: 0, ok: 0, err: 0, virado: false, fim: false };
}
function renderRevisao() {
  const v = $("#view-revisao"), ms = materias();
  if (!rodada) novaRodada();
  const R = rodada, c = R.cards[R.i];
  let corpo;
  if (R.fim || !c) {
    const n = R.ok + R.err, pct = n ? Math.round(R.ok / n * 100) : 0;
    corpo = n ? `<div class="vidro card" style="text-align:center;padding:40px 20px"><div class="ico ${pct >= 70 ? "ok" : ""}" style="margin:0 auto;width:64px;height:64px">${ic(pct >= 90 ? "trofeu" : pct >= 70 ? "estrela" : "broto")}</div><div class="tempo-big" style="font-size:72px;margin-top:14px">${pct}%</div><p class="sub">${R.ok} acertos · ${R.err} erros</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px"><button class="btn pri" id="rNova">Nova rodada</button><button class="btn" data-go="mundo">Ver o planeta</button></div></div>`
      : `<div class="vidro card empty">Nenhum card neste filtro.</div>`;
  } else {
    const st = S.cards[c.id], M = materia(c.mat);
    corpo = `
      <div class="roundbar"><span>${R.i + 1} / ${R.cards.length}</span><div class="bar"><i style="width:${R.i / R.cards.length * 100}%"></i></div><span>${R.ok} certos · ${R.err} errados</span></div>
      <div class="fc-card ${R.virado ? "flipped" : ""}" id="fcCard" tabindex="0" role="button" aria-label="Virar cartão"><div class="fc-inner">
        <div class="fc-face vidro"><span class="fc-tag">${esc((M?.sigla || M?.nome || "") + (c.tag ? " · " + textoDe(c.tag) : ""))}</span><span class="fc-box" title="Acertos seguidos">${[0, 1, 2].map(i => `<i class="${(st?.b || 0) > i ? "on" : ""}"></i>`).join("")}</span><div class="fc-q">${c.frente}</div><div class="fc-hint">Toque ou espaço para virar</div></div>
        <div class="fc-face fc-back vidro"><span class="fc-tag">Resposta</span><div class="fc-a">${c.verso}</div><div class="fc-hint">1 errei · 2 acertei</div></div>
      </div></div>
      <div class="fc-nav">${c.meu ? '<span class="kicker">Meu card</span>' : ""}<span class="grow"></span>
        <button class="btn" id="rErr" ${R.virado ? "" : "hidden"}>${ic("x", "s")}Errei</button><button class="btn pri" id="rOk" ${R.virado ? "" : "hidden"}>${ic("check", "s")}Acertei</button><button class="btn pri" id="rVira" ${R.virado ? "hidden" : ""}>Ver resposta</button></div>`;
  }
  v.innerHTML = `<div class="fc-wrap">
    <h1 class="titulo p">Flashcards</h1>
    <p class="intro">Responda de cabeça, vire e seja honesto. Acertar 3 vezes seguidas domina o card.</p>
    <div class="fc-top">
      <select class="f" id="rMat"><option value="todas">Todas as matérias</option>${ms.map(m => `<option value="${esc(m.id)}" ${revCfg.mat === m.id ? "selected" : ""}>${esc(m.nome)}</option>`).join("")}</select>
      <select class="f" id="rFil">${[["rec", "Para dominar"], ["err", "Só os que errei"], ["novos", "Nunca vistos"], ["todos", "Todos"]].map(([k, t]) => `<option value="${k}" ${revCfg.filtro === k ? "selected" : ""}>${t}</option>`).join("")}</select>
      <span class="kicker">${baralho().length} cards</span>
    </div>${corpo}</div>`;
  const reCfg = () => { revCfg = { mat: $("#rMat").value, filtro: $("#rFil").value }; LS.set("revCfg", revCfg); rodada = null; renderRevisao(); };
  $("#rMat").addEventListener("change", reCfg); $("#rFil").addEventListener("change", reCfg);
  $("#rNova")?.addEventListener("click", () => { rodada = null; renderRevisao(); });
  $("#fcCard")?.addEventListener("click", vira); $("#rVira")?.addEventListener("click", vira);
  $("#rOk")?.addEventListener("click", () => responde(true)); $("#rErr")?.addEventListener("click", () => responde(false));
}
function vira() {
  if (!rodada || rodada.fim) return; rodada.virado = !rodada.virado;
  $("#fcCard")?.classList.toggle("flipped", rodada.virado);
  $("#rVira") && ($("#rVira").hidden = rodada.virado); $("#rOk") && ($("#rOk").hidden = !rodada.virado); $("#rErr") && ($("#rErr").hidden = !rodada.virado);
}
function responde(ok) {
  const R = rodada; if (!R || R.fim || !R.virado) return;
  registraCard(R.cards[R.i], ok); if (ok) R.ok++; else R.err++;
  R.i++; R.virado = false;
  if (R.i >= R.cards.length) { R.fim = true; const n = R.ok + R.err; if (n >= 10 && R.ok / n >= .85) conquista("precisao"); salvar(); }
  renderTopo(); renderRevisao();
}
document.addEventListener("keydown", e => {
  if (atual !== "revisao" || modalAberto || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); vira(); }
  if (e.key === "1") responde(false); if (e.key === "2") responde(true);
});

/* =========================================================
   missões
   ========================================================= */
function renderMissoes() {
  const m = metricas(), D = diarias(), h = diaObj();
  $("#view-missoes").innerHTML = `<div class="pagina larga">
    <h1 class="titulo p">Missões</h1>
    <p class="intro">A jornada transforma seu planeta de cristal num mundo vivo. As missões do dia e as conquistas trazem criaturas novas.</p>
    <div class="dois">
      <div class="vidro card"><h2 class="h-sec">Jornada do planeta<span class="grow"></span>${S.jornada} de ${JORNADA.length}</h2>
        ${JORNADA.map((j, i) => { const ok = i < S.jornada, at = i === S.jornada, v = Math.min(j.alvo, j.meta(m));
          return `<div class="jstep ${ok ? "ok" : at ? "atual" : "lock"}"><div class="n">${ok ? ic("check", "s") : i + 1}</div><div class="t"><b>${esc(j.titulo)}</b><small>${esc(j.desc)}</small>
            ${at ? `<div class="bar" style="margin-top:8px"><i style="width:${v / j.alvo * 100}%"></i></div><small>${v} de ${j.alvo}${j.un ? " " + j.un : ""}</small>` : ""}
            <div class="premios">${ok || at ? descrevePremio(j.premio).map(c => `<span>${esc(c)}</span>`).join("") : "<span>Surpresa</span>"}</div></div></div>`; }).join("")}</div>
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="vidro card"><h2 class="h-sec">Hoje</h2>
          ${D.ids.map(id => { const q = DIARIAS.find(x => x.id === id); const v = Math.min(q.alvo, q.meta(h)), ok = !!D.pegas[id];
            return `<div class="miss ${ok ? "done" : ""}"><div class="ico ${ok ? "ok" : ""}">${ic(ok ? "check" : "alvo", "s")}</div><div class="t"><b>${esc(q.txt)}</b><small>${v} de ${q.alvo}</small><div class="bar"><i style="width:${v / q.alvo * 100}%"></i></div></div><span class="rw">+${q.sem} XP</span></div>`; }).join("")}
          <div class="miss ${D.bonus ? "done" : ""}">${icoBox("ovo")}<div class="t"><b>Complete as três</b><small>${D.bonus ? "Criatura conquistada hoje" : "Uma criatura nova nasce no planeta"}</small></div></div></div>
        <div class="vidro card"><h2 class="h-sec">Conquistas<span class="grow"></span>${Object.keys(S.conq).length} de ${CONQUISTAS.length}</h2>
          ${CONQUISTAS.map(c => { const ok = !!S.conq[c.id];
            return `<div class="miss" style="${ok ? "" : "opacity:.6"}">${ok ? icoBox("trofeu") : `<div class="ico">${ic("cadeado", "s")}</div>`}<div class="t"><b>${esc(c.titulo)}</b><small>${esc(c.desc)}</small>${ok ? `<div class="premios">${descrevePremio(c.premio).map(x => `<span>${esc(x)}</span>`).join("")}</div>` : ""}</div></div>`; }).join("")}</div>
      </div>
    </div></div>`;
}

/* =========================================================
   progresso
   ========================================================= */
function renderProgresso() {
  const n = S.totOk + S.totErr, pct = n ? Math.round(S.totOk / n * 100) : 0;
  const dias = [], d = new Date(); d.setDate(d.getDate() - 13);
  for (let i = 0; i < 14; i++) { const k = diaDe(d); dias.push({ k, l: d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3), min: S.dias[k]?.min || 0, cards: S.dias[k]?.cards || 0 }); d.setDate(d.getDate() + 1); }
  const max = Math.max(30, ...dias.map(x => x.min)), W = 560, H = 210, L = 30, B = 26, T = 12, bw = (W - L) / 14;
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Minutos estudados por dia"><defs><linearGradient id="gb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9fe0b0"/><stop offset="1" stop-color="#8fd6ff" stop-opacity=".5"/></linearGradient></defs>`;
  [0, .5, 1].forEach(f => { const y = T + (H - T - B) * (1 - f); svg += `<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.08)"/><text class="ax" x="${L - 6}" y="${y + 4}" text-anchor="end">${Math.round(max * f)}</text>`; });
  dias.forEach((x, i) => { const h = (H - T - B) * x.min / max, X = L + i * bw + bw * .3; svg += `<rect x="${X}" y="${H - B - h}" width="${bw * .4}" height="${Math.max(h, x.min ? 2 : 0)}" rx="3" fill="url(#gb)" opacity="${x.k === hoje() ? 1 : .75}"><title>${x.k}: ${x.min} min, ${x.cards} cards</title></rect><text class="ax" x="${X + bw * .2}" y="${H - 8}" text-anchor="middle">${x.l}</text>`; });
  svg += "</svg>";
  const ms = materias();
  const piores = todosCards().map(c => ({ c, s: S.cards[c.id] })).filter(x => x.s && x.s.err > 0).sort((a, b) => b.s.err - a.s.err || a.s.b - b.s.b).slice(0, 6);
  $("#view-progresso").innerHTML = `<div class="pagina larga">
    <h1 class="titulo p">Progresso</h1>
    <p class="intro">O registro completo do seu estudo: tempo, acertos e erros.</p>
    <div class="vidro card" style="margin-bottom:18px"><div class="stats" style="justify-content:space-between">
      <div class="stat"><b>${fmtMin(S.totMin)}</b><span>de estudo</span></div>
      <div class="stat"><b>${S.totCards}</b><span>cards respondidos</span></div>
      <div class="stat"><b>${pct}%</b><span>de acerto</span></div>
      <div class="stat"><b>${Object.values(S.cards).filter(c => c.b >= 3).length}</b><span>dominados</span></div>
      <div class="stat"><b>${Object.keys(S.lidas).length}</b><span>seções</span></div>
      <div class="stat"><b>${sequencia()}</b><span>dias seguidos</span></div>
    </div></div>
    <div class="dois">
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="vidro card chart"><h2 class="h-sec">Minutos por dia · 2 semanas</h2>${svg}</div>
        <div class="vidro card"><h2 class="h-sec">Por matéria</h2>
          <div style="overflow-x:auto"><table class="tb"><thead><tr><th>Matéria</th><th>Tempo</th><th>Cards</th><th>Certos / errados</th><th>Seções</th></tr></thead><tbody>
          ${ms.map(m => { const s = S.mats[m.id] || { min: 0, cards: 0, ok: 0, err: 0 }, nn = s.ok + s.err, li = m.secoes.filter(x => S.lidas[`${m.id}--${x.id}`]).length;
            return `<tr><td>${esc(m.sigla || m.nome)}</td><td>${fmtMin(s.min)}</td><td>${s.cards}</td><td>${nn ? `<span style="color:var(--ok)">${s.ok}</span> / <span style="color:var(--bad)">${s.err}</span> · ${Math.round(s.ok / nn * 100)}%` : "–"}</td><td>${li} de ${m.secoes.length}</td></tr>`; }).join("")}
          </tbody></table></div></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="vidro card"><h2 class="h-sec">Cards que você mais erra</h2>
          ${piores.length ? `<div class="secs">${piores.map(x => `<div class="sec" style="cursor:default"><span class="t" style="font-weight:300;font-size:14px">${esc(textoDe(x.c.frente))}</span><span class="n" style="color:var(--bad)">${x.s.err}×</span></div>`).join("")}</div><button class="btn sm" style="margin-top:12px" id="pErr">Revisar os que errei</button>` : `<p class="muted" style="margin:0;font-weight:300">Nada por aqui ainda.</p>`}</div>
        <div class="vidro card"><h2 class="h-sec">Últimas sessões</h2>
          ${S.log.length ? `<div class="secs">${S.log.slice(0, 8).map(l => `<div class="sec" style="cursor:default"><span class="t" style="font-weight:300">${new Date(l.t).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · ${l.mat && materia(l.mat) ? esc(materia(l.mat).sigla || materia(l.mat).nome) : "Livre"}</span><span class="n">${fmtMin(l.m)}</span></div>`).join("")}</div>` : `<p class="muted" style="margin:0;font-weight:300">Nenhuma sessão ainda.</p>`}</div>
      </div>
    </div></div>`;
  $("#pErr")?.addEventListener("click", () => { revCfg = { mat: "todas", filtro: "err" }; LS.set("revCfg", revCfg); rodada = null; show("revisao"); });
}

/* =========================================================
   administrador (testes)
   ========================================================= */
function painelAdmin() {
  const teste = modoTeste();
  const m = modal(`<h3>Administrador</h3>
    <p class="muted" style="font-weight:300;margin:0 0 14px">${teste ? "Você está no modo teste: nada daqui vai para a sua conta. Ao sair, seu progresso real volta." : "Entre no modo teste para simular sem estragar seu progresso real."}</p>
    ${teste ? `<div class="grid2">
      <button class="btn" data-a="min30">+30 min de estudo</button>
      <button class="btn" data-a="min120">+2 h de estudo</button>
      <button class="btn" data-a="cards">+20 cards certos</button>
      <button class="btn" data-a="erros">+10 cards errados</button>
      <button class="btn" data-a="secao">Concluir 1 seção</button>
      <button class="btn" data-a="dia">+1 dia na sequência</button>
      <button class="btn" data-a="nivel">Subir 1 nível</button>
      <button class="btn" data-a="ovo">Chocar criatura</button>
      <button class="btn" data-a="missao">Cumprir missão da jornada</button>
      <button class="btn" data-a="diarias">Cumprir missões do dia</button>
      <button class="btn" data-a="tudo">Liberar todas as criaturas</button>
      <button class="btn" data-a="zerar">Planeta do zero</button>
    </div>
    <div class="acts"><button class="btn bad" data-a="sair">Sair do modo teste</button><button class="btn pri" data-fecha>Fechar</button></div>`
    : `<div class="acts"><button class="btn" data-fecha>Fechar</button><button class="btn pri" data-a="entrar">Entrar no modo teste</button></div>`}`);
  $$("[data-a]", m.el).forEach(b => b.addEventListener("click", () => {
    const a = b.dataset.a, h = diaObj();
    if (a === "entrar") { LS.set("backupReal", S); toast("Modo teste ligado"); m.fecha(); renderTopo(); painelAdmin(); return; }
    if (a === "sair") { S = Object.assign(novoEstado(), LS.get("backupReal", {})); LS.del("backupReal"); filaFesta = []; m.fecha(); salvar(); aplicaMundo(); render(); toast("Progresso real restaurado"); return; }
    if (a === "min30" || a === "min120") { const n = a === "min30" ? 30 : 120; m.fecha(); registraFoco(n, materias()[0]?.id); return; }
    if (a === "cards" || a === "erros") { const l = todosCards(); for (let i = 0; i < (a === "cards" ? 20 : 10); i++) registraCard(l[Math.floor(Math.random() * l.length)], a === "cards"); }
    if (a === "secao") { const M = materias()[0]; const s = M?.secoes.find(x => !S.lidas[`${M.id}--${x.id}`]); if (s) { m.fecha(); marcaLida(M.id, s.id, true); return; } }
    if (a === "dia") { const d = new Date(); let k; do { d.setDate(d.getDate() - 1); k = diaDe(d); } while (ativo(k)); S.dias[k] = { min: 20, cards: 0, ok: 0, err: 0, sess: 1, lidas: 0, rev: 0 }; if (!ativo(hoje())) h.min += 5; }
    if (a === "nivel") ganhaXP(nivelXP(S.nivel + 1) - S.xp);
    if (a === "ovo") choca("Ovo de teste");
    if (a === "missao" && S.jornada < JORNADA.length) { const j = JORNADA[S.jornada]; S.jornada++; dar(j.premio); festa({ cria: j.premio.criaturas?.[0], icone: "bussola", titulo: j.titulo, texto: j.historia, chips: descrevePremio(j.premio) }); }
    if (a === "diarias") { const D = diarias(); D.ids.forEach(id => { const q = DIARIAS.find(x => x.id === id); if (!D.pegas[id]) { D.pegas[id] = 1; ganhaXP(q.sem); } }); }
    if (a === "tudo") { Object.keys(CRIATURAS).forEach(k => { if (!S.criaturas.includes(k)) S.criaturas.push(k); }); Object.keys(EFEITOS).forEach(k => S.efeitos[k] = true); }
    if (a === "zerar") { const timer = S.timer; S = novoEstado(); S.timer = timer; }
    m.fecha(); checaTudo(); salvar(); aplicaMundo(); render();
  }));
}

/* =========================================================
   contas (fora do site do Claude)
   ========================================================= */
let loginAberto = false;
function telaLogin(podeFechar = false) {
  if (!contaMod) { toast("Carregando o sistema de contas…"); return; }
  if (loginAberto) return; loginAberto = true;
  let criar = false;
  const m = modal(`<div style="text-align:center"><div class="festa"><div class="im" style="width:120px;height:120px">${FIG.planeta_vazio ? `<img class="fig" src="${FIG.planeta_vazio}" alt="" style="width:110px;height:110px">` : ic("planeta")}</div></div>
      <h3>Planeta de Estudos</h3><p class="muted" style="font-weight:300;margin:0 0 18px">Entre para salvar seu planeta e seu progresso na nuvem. Funciona em qualquer celular ou computador.</p></div>
    <button class="btn pri" id="lgGoogle" style="width:100%;padding:13px">${ic("estrela", "s")}Entrar com Google</button>
    <div class="linha"></div>
    <label class="lb" for="lgEmail">E-mail</label><input class="f" id="lgEmail" type="email" autocomplete="email" placeholder="voce@email.com">
    <label class="lb" for="lgSenha">Senha</label><input class="f" id="lgSenha" type="password" autocomplete="current-password" placeholder="mínimo 6 caracteres">
    <p id="lgErro" style="color:var(--bad);font-size:13px;min-height:18px;margin:10px 0 0"></p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><button class="btn" id="lgEntrar" style="flex:1">Entrar</button><button class="btn" id="lgCriar" style="flex:1">Criar conta</button></div>
    <div style="display:flex;justify-content:space-between;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="backlink" id="lgEsqueci" style="margin:0">Esqueci a senha</button><button class="backlink" id="lgSem" style="margin:0">${podeFechar ? "Fechar" : "Usar sem conta"}</button></div>`, { onClose: () => { loginAberto = false; } });
  const erro = t => { $("#lgErro", m.el).textContent = t || ""; };
  const ocupado = b => $$("button", m.el).forEach(x => x.disabled = b);
  $("#lgGoogle", m.el).addEventListener("click", async () => { erro(); ocupado(true); try { await contaMod.entraGoogle(); m.fecha(); } catch (e) { erro(contaMod.mensagemErro(e)); } ocupado(false); });
  const porEmail = async c => { erro(); const em = $("#lgEmail", m.el).value.trim(), se = $("#lgSenha", m.el).value; if (!em || !se) { erro("Preencha e-mail e senha."); return; } ocupado(true); try { await contaMod.entraEmail(em, se, c); m.fecha(); } catch (e) { erro(contaMod.mensagemErro(e)); } ocupado(false); };
  $("#lgEntrar", m.el).addEventListener("click", () => porEmail(false));
  $("#lgCriar", m.el).addEventListener("click", () => porEmail(true));
  $("#lgSenha", m.el).addEventListener("keydown", e => { if (e.key === "Enter") porEmail(false); });
  $("#lgEsqueci", m.el).addEventListener("click", async () => { const em = $("#lgEmail", m.el).value.trim(); if (!em) { erro("Digite seu e-mail acima e clique de novo."); return; } try { await contaMod.recuperaSenha(em); erro(""); toast("Enviamos um link para redefinir a senha."); } catch (e) { erro(contaMod.mensagemErro(e)); } });
  $("#lgSem", m.el).addEventListener("click", () => { if (!podeFechar) LS.set("semConta", true); m.fecha(); });
}
function menuConta() {
  const m = modal(`<h3>Sua conta</h3>
    <div style="display:flex;align-items:center;gap:14px;margin:8px 0 16px">${conta.foto ? `<img src="${esc(conta.foto)}" alt="" referrerpolicy="no-referrer" style="width:52px;height:52px;border-radius:50%">` : `<div class="ico">${ic("estrela")}</div>`}<div><b style="font-weight:400">${esc(conta.nome || "")}</b><br><small class="muted">${esc(conta.email || "")}</small></div></div>
    <p class="muted" style="font-weight:300;margin:0">${nuvem === "erro" ? "Houve um erro ao salvar. Vamos tentar de novo na próxima ação." : "Seu progresso está salvo na sua conta e aparece em qualquer aparelho em que você entrar."}</p>
    <div class="acts"><button class="btn bad" id="cSair">Sair da conta</button><button class="btn pri" data-fecha>Fechar</button></div>`);
  $("#cSair", m.el).addEventListener("click", async () => { m.fecha(); await contaMod.sai(); });
}
async function aoMudarConta(u) {
  const antes = conta?.uid;
  if (!u) {
    conta = null; contaOk = false; nuvem = "local";
    if (antes) { S = Object.assign(novoEstado(), LS.get("estado", {})); toast("Você saiu da conta"); aplicaMundo(); render(); }
    else if (!LS.get("semConta", false)) setTimeout(() => telaLogin(false), 400);
    renderTopo(); return;
  }
  conta = u; contaOk = false; renderTopo();
  try {
    const remoto = await contaMod.carrega(u.uid);
    let local = LS.get("estado:" + u.uid, null);
    if (!local && !remoto) local = LS.get("estado", null);   // primeira vez: leva o progresso feito sem conta
    const base = remoto && (!local || (remoto.upd || 0) >= (local.upd || 0)) ? remoto : local;
    const timer = S.timer;
    S = Object.assign(novoEstado(), JSON.parse(JSON.stringify(base || {})));
    if (!S.timer && timer) S.timer = timer;
    contaOk = true; nuvem = "ok";
    LS.set("estado:" + u.uid, S);
    if (!remoto || base !== remoto) salvar();
    if (!antes) toast(`Olá, ${u.nome || "bem-vindo"}! Progresso sincronizado.`);
    if (!base) festa({ icone: "planeta_vazio", titulo: "Seu planeta", texto: "Cada minuto de foco, card respondido e seção concluída faz surgir algo novo nele. Comece com 3 minutos de foco." });
    diarias(); checaTudo(); aplicaMundo(); render();
  } catch (e) { console.warn(e); nuvem = "erro"; toast("Não consegui carregar seu progresso da nuvem."); renderTopo(); }
}

/* atalho escondido: 5 cliques no nome do site abrem o painel de administrador */
{ let n = 0, t = null; document.querySelector(".marca").addEventListener("click", () => { n++; clearTimeout(t); t = setTimeout(() => n = 0, 1500); if (n >= 5) { n = 0; painelAdmin(); } }); }
document.querySelector(".marca").style.cursor = "default";

/* =========================================================
   início do app
   ========================================================= */
async function carregaFabrica() {
  try { const r = await fetch("content/mfc.json"); FABRICA = [await r.json()]; } catch (e) { console.warn("conteúdo", e); FABRICA = []; }
}
async function conectaNuvem() {
  if (!window.claude || typeof window.claude.use !== "function") return;
  try { [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]); } catch { db = null; }
  if (user) {
    try { souDono = !!(await Promise.resolve(user.isOwner())); } catch {}
    try { uid = await user.id(); } catch {}
  }
  renderTopo(); if (souDono && atual === "materias") render();
  if (!db) return;
  db.doc("conteudo/indice").onSnapshot(s => { CONT.indice = s.exists ? s.data() : null; if (!editando) atualizaConteudo(); }, () => {});
  db.collection("secoes").onSnapshot(q => { const o = {}; q.docs.forEach(d => o[d.id] = d.data()); CONT.secoes = o; if (!editando) atualizaConteudo(); }, () => {});
  db.collection("cards").onSnapshot(q => { const o = {}; q.docs.forEach(d => o[d.id] = d.data()); CONT.cards = o; if (!editando && atual !== "revisao") atualizaConteudo(); }, () => {});
  if (!uid) { nuvem = "so-local"; renderTopo(); return; }
  if (modoTeste()) { nuvem = "ok"; renderTopo(); return; }
  try {
    const snap = await db.doc(`data/users/${uid}/estado`).get();
    if (snap.exists) {
      const remoto = snap.data();
      if ((remoto.upd || 0) > (S.upd || 0)) { const timer = S.timer; S = Object.assign(novoEstado(), JSON.parse(JSON.stringify(remoto))); if (!S.timer && timer) S.timer = timer; LS.set("estado", S); render(); aplicaMundo(); }
      else if ((S.upd || 0) > (remoto.upd || 0)) await enviaNuvem();
      if (nuvem !== "so-local") nuvem = "ok";
    } else if (S.upd) await enviaNuvem(); else nuvem = "ok";
  } catch { nuvem = "so-local"; }
  renderTopo();
}
let tConteudo = null;
function atualizaConteudo() { clearTimeout(tConteudo); tConteudo = setTimeout(() => { if (atual === "materias" || atual === "inicio") render(); }, 150); }

(async function inicio() {
  await carregaFabrica();
  diarias();
  const v0 = LS.get("view", "inicio");
  show(VIEWS.some(x => x[0] === v0) ? v0 : "inicio");
  await iniciaMundo();
  checaTudo(); atualiza();
  if (S.timer) tick();
  if (!S.upd && !modoConta) setTimeout(() => festa({ icone: "planeta_vazio", titulo: "Seu planeta", texto: "Cada minuto de foco, card respondido e seção concluída faz surgir algo novo nele. Comece com 5 minutos de foco." }), 900);
  if (modoConta) {
    import("./conta.js").then(async mod => { contaMod = mod; await mod.iniciaConta(aoMudarConta); }).catch(e => { console.warn("contas indisponíveis", e); });
  } else conectaNuvem();
})();
