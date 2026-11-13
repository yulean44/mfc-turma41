/* Catálogo do jogo: itens, criaturas, missões e loja */

export const RARIDADE = {
  comum:    { nome: "Comum",    cor: "#7a8a7f", peso: 50 },
  incomum:  { nome: "Incomum",  cor: "#3f8f5a", peso: 28 },
  raro:     { nome: "Raro",     cor: "#3a6fd8", peso: 16 },
  lendario: { nome: "Lendário", cor: "#c27a12", peso: 6 },
};

/* modo: anda | voa | nada (lagos) | ceu (órbita alta) | fixo (decoração) */
/* tam: altura relativa ao planeta (raio 1) */
export const CRIATURAS = {
  pintinho:     { nome: "Pintinho",          emoji: "🐣", r: "comum",    modo: "anda", tam: .05, preco: 60 },
  galinha:      { nome: "Galinha",           emoji: "🐔", r: "comum",    modo: "anda", tam: .07, preco: 70 },
  porquinho:    { nome: "Porquinho",         emoji: "🐷", r: "comum",    modo: "anda", tam: .07, preco: 90 },
  ovelha:       { nome: "Ovelha",            emoji: "🐑", r: "comum",    modo: "anda", tam: .08, preco: 90 },
  gato:         { nome: "Gato",              emoji: "🐱", r: "comum",    modo: "anda", tam: .06, preco: 110 },
  cachorro:     { nome: "Cachorro",          emoji: "🐶", r: "comum",    modo: "anda", tam: .07, preco: 110 },
  ourico:       { nome: "Ouriço",            emoji: "🦔", r: "comum",    modo: "anda", tam: .045 },
  coelho:       { nome: "Coelho",            emoji: "🐰", r: "comum",    modo: "anda", tam: .08, preco: 130 },
  passarinho:   { nome: "Passarinho",        emoji: "🐦", r: "comum",    modo: "anda", tam: .06 },
  pombo:        { nome: "Pombo",             emoji: "🕊️", r: "comum",    modo: "anda", tam: .06, preco: 80 },
  gosma_verde:  { nome: "Gosminha verde",    emoji: "🟢", r: "comum",    modo: "anda", tam: .055 },
  gosma_rosa:   { nome: "Gosminha rosa",     emoji: "🩷", r: "comum",    modo: "anda", tam: .055 },
  peixe1:       { nome: "Peixe-palhaço",     emoji: "🐠", r: "comum",    modo: "nada", tam: .05, preco: 50 },
  peixe2:       { nome: "Peixe-azul",        emoji: "🐟", r: "comum",    modo: "nada", tam: .05, preco: 50 },
  peixe3:       { nome: "Peixe-dourado",     emoji: "🐡", r: "comum",    modo: "nada", tam: .05 },
  cavalo:       { nome: "Cavalo",            emoji: "🐴", r: "incomum",  modo: "anda", tam: .11, preco: 220 },
  guaxinim:     { nome: "Guaxinim",          emoji: "🦝", r: "incomum",  modo: "anda", tam: .065 },
  lobo:         { nome: "Lobo",              emoji: "🐺", r: "incomum",  modo: "anda", tam: .085 },
  sapo:         { nome: "Sapo",              emoji: "🐸", r: "incomum",  modo: "anda", tam: .07, preco: 160 },
  cogumelinho:  { nome: "Cogumelinho",       emoji: "🍄", r: "incomum",  modo: "anda", tam: .06 },
  cactoro:      { nome: "Cactoro",           emoji: "🌵", r: "incomum",  modo: "anda", tam: .08 },
  gosma_espinho:{ nome: "Gosma espinhenta",  emoji: "🦠", r: "incomum",  modo: "anda", tam: .065 },
  abelha:       { nome: "Abelhuda",          emoji: "🐝", r: "incomum",  modo: "voa",  tam: .07 },
  glub:         { nome: "Glub",              emoji: "🫧", r: "incomum",  modo: "voa",  tam: .07 },
  alpaca:       { nome: "Alpaca voadora",    emoji: "🦙", r: "incomum",  modo: "voa",  tam: .08 },
  golfinho:     { nome: "Golfinho",          emoji: "🐬", r: "incomum",  modo: "nada", tam: .07, preco: 180 },
  dino:         { nome: "Dino",              emoji: "🦖", r: "raro",     modo: "anda", tam: .1 },
  macaco:       { nome: "Monkroose",         emoji: "🐒", r: "raro",     modo: "anda", tam: .09 },
  cogumelao:    { nome: "Cogumelão",         emoji: "🍄", r: "raro",     modo: "anda", tam: .08 },
  mago:         { nome: "Mago",              emoji: "🧙", r: "raro",     modo: "anda", tam: .09 },
  lula:         { nome: "Lulinha",           emoji: "🦑", r: "raro",     modo: "voa",  tam: .08 },
  golem:        { nome: "Golenzinho",        emoji: "🪨", r: "raro",     modo: "voa",  tam: .08 },
  hywirl:       { nome: "Hywirl",            emoji: "🌀", r: "raro",     modo: "voa",  tam: .08 },
  fantasma:     { nome: "Fantasminha",       emoji: "👻", r: "raro",     modo: "voa",  tam: .08 },
  abelha_rainha:{ nome: "Abelha rainha",     emoji: "👑", r: "raro",     modo: "voa",  tam: .09 },
  glub_evo:     { nome: "Glub evoluído",     emoji: "💧", r: "raro",     modo: "voa",  tam: .09 },
  alpaca_rei:   { nome: "Rei Alpaca",        emoji: "🦙", r: "raro",     modo: "voa",  tam: .1 },
  dragao:       { nome: "Dragãozinho",       emoji: "🐉", r: "raro",     modo: "voa",  tam: .1 },
  arraia:       { nome: "Arraia celeste",    emoji: "🌌", r: "raro",     modo: "ceu",  tam: .22 },
  rei_cogumelo: { nome: "Rei Cogumelo",      emoji: "🤴", r: "lendario", modo: "anda", tam: .12, ex: 1 },
  yeti:         { nome: "Yeti",              emoji: "❄️", r: "lendario", modo: "anda", tam: .12 },
  alien:        { nome: "Visitante",         emoji: "👽", r: "lendario", modo: "anda", tam: .09, ex: 1 },
  golem_evo:    { nome: "Golem ancestral",   emoji: "🗿", r: "lendario", modo: "voa",  tam: .12 },
  dragao_anciao:{ nome: "Dragão ancião",     emoji: "🐲", r: "lendario", modo: "voa",  tam: .14, ex: 1 },
  baleia:       { nome: "Baleia do céu",     emoji: "🐋", r: "lendario", modo: "ceu",  tam: .35, ex: 1 },
};

/* decorações: proc = feitas por código; glb = modelo do pacote */
export const DECOS = {
  arvore:     { nome: "Árvore",            emoji: "🌳", proc: 1, preco: 25 },
  pinheiro:   { nome: "Pinheiro",          emoji: "🌲", proc: 1, preco: 25 },
  arbusto:    { nome: "Arbusto",           emoji: "🌿", proc: 1, preco: 15 },
  flores:     { nome: "Canteiro de flores",emoji: "🌸", proc: 1, preco: 12 },
  girassois:  { nome: "Flores amarelas",   emoji: "🌼", proc: 1, preco: 12 },
  pedra:      { nome: "Pedra",             emoji: "🪨", proc: 1, preco: 8 },
  toco:       { nome: "Tronco caído",      emoji: "🪵", proc: 1, preco: 15 },
  cogumelos:  { nome: "Cogumelos",         emoji: "🍄", proc: 1, preco: 18 },
  cristal:    { nome: "Cristal",           emoji: "💎", proc: 1, preco: 70 },
  cabana:     { nome: "Cabana de estudos", emoji: "🛖", proc: 1, preco: 200 },
  lanterna:   { nome: "Lanterna",          emoji: "🏮", proc: 1, preco: 45 },
  bau:        { nome: "Baú",               emoji: "🧰", glb: "bau",          tam: .06, preco: 90 },
  bambu:      { nome: "Bambu",             emoji: "🎋", proc: 1, preco: 30 },
  cristal_kit:{ nome: "Cristal gigante",   emoji: "🔮", glb: "cristal_kit",  tam: .12 },
  cogumelo_kit:{nome: "Cogumelo gigante",  emoji: "🍄", glb: "cogumelo_kit", tam: .1 },
};

/* efeitos do planeta */
export const EFEITOS = {
  broto:      { nome: "Vida no planeta",   emoji: "🌱" },
  agua:       { nome: "Lagos",             emoji: "💧" },
  nuvens:     { nome: "Atmosfera e nuvens",emoji: "☁️" },
  borboletas: { nome: "Borboletas",        emoji: "🦋" },
  lua:        { nome: "Lua",               emoji: "🌙" },
  anel:       { nome: "Anel planetário",   emoji: "🪐" },
  aurora:     { nome: "Céu de aurora",     emoji: "🌌" },
};

export const LOJA_DECOS = ["arvore","pinheiro","arbusto","flores","girassois","pedra","toco","cogumelos","bambu","lanterna","cristal","bau","cabana"];
export const LOJA_CRIATURAS = ["pintinho","galinha","pombo","peixe1","peixe2","porquinho","ovelha","gato","cachorro","coelho","sapo","golfinho","cavalo"];
export const PRECO_OVO = 150;

/* ---------- Jornada: missões em sequência ---------- */
/* m = métricas do jogador; cada missão tem meta (valor atual) e alvo */
export const JORNADA = [
  { id: "j1",  titulo: "O primeiro passo",      desc: "Faça uma sessão de foco de pelo menos 3 minutos.", meta: m => m.maxSess, alvo: 3, un: "min",
    premio: { efeitos: ["broto"], decos: { arvore: 1 }, xp: 30, sem: 20 }, historia: "Um brotinho rompeu a rocha. Seu planeta está vivo!" },
  { id: "j2",  titulo: "Abrindo o livro",       desc: "Conclua a leitura de 1 seção.", meta: m => m.lidas, alvo: 1,
    premio: { decos: { flores: 2, girassois: 1 }, xp: 30, sem: 20 }, historia: "Flores nasceram onde você pisou." },
  { id: "j3",  titulo: "Mente afiada",          desc: "Responda 5 flashcards.", meta: m => m.cards, alvo: 5,
    premio: { criaturas: ["pintinho"], xp: 30, sem: 20 }, historia: "Um pintinho saiu do ovo e já está explorando." },
  { id: "j4",  titulo: "Chuva de ideias",       desc: "Acumule 15 minutos de estudo.", meta: m => m.min, alvo: 15, un: "min",
    premio: { efeitos: ["agua"], criaturas: ["peixe1"], xp: 50, sem: 30 }, historia: "Choveu! Lagos se formaram e um peixe chegou." },
  { id: "j5",  titulo: "Constância",            desc: "Estude 2 dias seguidos.", meta: m => m.streak, alvo: 2, un: "dias",
    premio: { efeitos: ["nuvens"], decos: { arbusto: 2 }, xp: 50, sem: 30 }, historia: "Seu planeta ganhou atmosfera e nuvens." },
  { id: "j6",  titulo: "Na mosca",              desc: "Acerte 10 flashcards.", meta: m => m.ok, alvo: 10,
    premio: { criaturas: ["coelho"], xp: 60, sem: 30 }, historia: "Um coelho saltitante veio morar aqui." },
  { id: "j7",  titulo: "Reflorestamento",       desc: "Acumule 45 minutos de estudo.", meta: m => m.min, alvo: 45, un: "min",
    premio: { decos: { arvore: 3, pinheiro: 2 }, verde: .15, xp: 80, sem: 40 }, historia: "Seu planeta acabou de ficar mais reflorestado!" },
  { id: "j8",  titulo: "Bibliotecário",         desc: "Conclua 3 seções.", meta: m => m.lidas, alvo: 3,
    premio: { efeitos: ["lua"], xp: 80, sem: 40 }, historia: "Uma lua começou a orbitar seu planeta." },
  { id: "j9",  titulo: "Hábito de ferro",       desc: "Estude 3 dias seguidos.", meta: m => m.streak, alvo: 3, un: "dias",
    premio: { criaturas: ["cavalo"], xp: 90, sem: 50 }, historia: "Um cavalo galopou pelos seus campos." },
  { id: "j10", titulo: "Quarenta perguntas",         desc: "Responda 40 flashcards.", meta: m => m.cards, alvo: 40,
    premio: { criaturas: ["cogumelinho"], decos: { cogumelos: 3 }, xp: 100, sem: 50 }, historia: "Cogumelos (um deles anda!) brotaram na sombra." },
  { id: "j11", titulo: "Autor",                 desc: "Crie 3 flashcards seus.", meta: m => m.criados, alvo: 3,
    premio: { criaturas: ["passarinho"], xp: 80, sem: 40 }, historia: "Um passarinho veio cantar suas próprias perguntas." },
  { id: "j12", titulo: "Primavera",             desc: "Acumule 2 horas de estudo.", meta: m => m.min, alvo: 120, un: "min",
    premio: { efeitos: ["borboletas"], criaturas: ["abelha"], verde: .15, xp: 140, sem: 70 }, historia: "Borboletas e abelhas: é primavera no seu planeta." },
  { id: "j13", titulo: "Domínio",               desc: "Domine 20 flashcards (acerte 3 vezes seguidas).", meta: m => m.dominados, alvo: 20,
    premio: { criaturas: ["dino"], xp: 150, sem: 80 }, historia: "Um dinossauro apareceu. Cuidado com as flores!" },
  { id: "j14", titulo: "Cinco dias de foco",    desc: "Estude 5 dias seguidos.", meta: m => m.streak, alvo: 5, un: "dias",
    premio: { criaturas: ["dragao"], xp: 180, sem: 100 }, historia: "Um dragãozinho escolheu seu planeta como ninho." },
  { id: "j15", titulo: "Gravidade",             desc: "Acumule 4 horas de estudo.", meta: m => m.min, alvo: 240, un: "min",
    premio: { efeitos: ["anel"], decos: { cristal: 2 }, verde: .2, xp: 220, sem: 120 }, historia: "Um anel de poeira estelar envolveu o planeta." },
  { id: "j16", titulo: "Duzentas perguntas",  desc: "Responda 200 flashcards.", meta: m => m.cards, alvo: 200,
    premio: { criaturas: ["baleia"], xp: 250, sem: 150 }, historia: "Uma baleia passou a nadar pelo céu." },
  { id: "j17", titulo: "Mestre do tempo",       desc: "Acumule 10 horas de estudo.", meta: m => m.min, alvo: 600, un: "min",
    premio: { criaturas: ["dragao_anciao"], efeitos: ["aurora"], xp: 400, sem: 250 }, historia: "O Dragão ancião acordou. O céu ganhou aurora." },
  { id: "j18", titulo: "Lenda",                 desc: "Estude 14 dias seguidos.", meta: m => m.streak, alvo: 14, un: "dias",
    premio: { criaturas: ["rei_cogumelo"], xp: 600, sem: 400 }, historia: "O Rei Cogumelo veio coroar sua disciplina." },
];

/* ---------- Conquistas: em paralelo, desbloqueiam raros ---------- */
export const CONQUISTAS = [
  { id: "coruja",      titulo: "Coruja",           desc: "Termine uma sessão de foco depois das 22h.", premio: { criaturas: ["fantasma"] } },
  { id: "madrugador",  titulo: "Madrugador",       desc: "Termine uma sessão de foco antes das 7h.", premio: { criaturas: ["ourico"] } },
  { id: "maratona",    titulo: "Maratona",         desc: "Faça uma sessão única de 60 minutos.", premio: { criaturas: ["golem"] } },
  { id: "precisao",    titulo: "Precisão cirúrgica", desc: "Termine uma rodada de 10 cards com 85% de acerto.", premio: { criaturas: ["abelha_rainha"] } },
  { id: "persistente", titulo: "Persistente",      desc: "Revise 15 cards que você tinha errado.", premio: { criaturas: ["gosma_verde"] } },
  { id: "fds",         titulo: "Fim de semana útil", desc: "Estude num sábado e no domingo seguinte.", premio: { criaturas: ["guaxinim"] } },
  { id: "explorador",  titulo: "Explorador",       desc: "Estude 3 matérias diferentes.", premio: { criaturas: ["lula"] } },
  { id: "colecionador",titulo: "Colecionador",     desc: "Tenha 8 criaturas no planeta.", premio: { criaturas: ["alien"] } },
  { id: "jardineiro",  titulo: "Jardineiro",       desc: "Tenha 40 elementos no planeta.", premio: { decos: { cristal_kit: 1, cogumelo_kit: 1 } } },
  { id: "diarias10",   titulo: "Rotina de campeão", desc: "Complete todas as missões do dia 5 vezes.", premio: { criaturas: ["yeti"] } },
  { id: "nivel10",     titulo: "Nível 8",          desc: "Chegue ao nível 8.", premio: { criaturas: ["mago"] } },
];

/* ---------- Missões diárias (3 sorteadas por dia) ---------- */
export const DIARIAS = [
  { id: "d_min15",  txt: "Estude 10 minutos hoje",          meta: h => h.min,   alvo: 10, sem: 20 },
  { id: "d_min30",  txt: "Estude 20 minutos hoje",          meta: h => h.min,   alvo: 20, sem: 30 },
  { id: "d_min50",  txt: "Estude 35 minutos hoje",          meta: h => h.min,   alvo: 35, sem: 45 },
  { id: "d_cards15",txt: "Responda 10 flashcards hoje",     meta: h => h.cards, alvo: 10, sem: 20 },
  { id: "d_cards30",txt: "Responda 20 flashcards hoje",     meta: h => h.cards, alvo: 20, sem: 35 },
  { id: "d_ok10",   txt: "Acerte 6 flashcards hoje",        meta: h => h.ok,    alvo: 6, sem: 25 },
  { id: "d_ok20",   txt: "Acerte 12 flashcards hoje",       meta: h => h.ok,    alvo: 12, sem: 35 },
  { id: "d_sess2",  txt: "Faça 2 sessões de foco hoje",     meta: h => h.sess,  alvo: 2,  sem: 30 },
  { id: "d_sec1",   txt: "Conclua 1 seção hoje",            meta: h => h.lidas, alvo: 1,  sem: 30 },
  { id: "d_rev5",   txt: "Revise 3 cards que você errou",   meta: h => h.rev,   alvo: 3,  sem: 25 },
];

export const nivelXP = n => 15 * (n - 1) * (n + 2);   /* XP acumulado para chegar ao nível n */
