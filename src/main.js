import { createScene } from "./scene.js";
import {
  emptyBoard, winningLine, isFull, cpuMove, loadState, saveState,
} from "./game.js";

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const ui = {
  loader: $("loader"),
  modeBtn: $("modeBtn"), modeLabel: $("modeLabel"), modeIcon: $("modeBtn").querySelector(".chip__icon"),
  soundBtn: $("soundBtn"), soundIcon: $("soundIcon"),
  scoreX: $("scoreX"), scoreD: $("scoreD"), scoreO: $("scoreO"),
  tagX: $("tagX"), tagO: $("tagO"),
  status: $("status"),
  resetBtn: $("resetBtn"), clearBtn: $("clearBtn"),
  banner: $("banner"), bannerEmoji: $("bannerEmoji"),
  bannerTitle: $("bannerTitle"), bannerSub: $("bannerSub"), bannerBtn: $("bannerBtn"),
};

// ---------- state ----------
const defaultState = () => ({
  board: emptyBoard(),
  current: "X",
  mode: "cpu",           // "cpu" | "2p"
  scores: { X: 0, O: 0, draw: 0 },
  sound: true,
  finished: false,
  winner: null,
  line: null,
});

let state = Object.assign(defaultState(), loadState() || {});
// sanitise loaded fields
if (state.mode !== "cpu" && state.mode !== "2p") state.mode = "cpu";
if (!state.scores) state.scores = { X: 0, O: 0, draw: 0 };

const HUMAN = "X", CPU = "O";

// ---------- sound (tiny WebAudio synth) ----------
let audioCtx = null;
function beep(freq, dur = 0.12, type = "sine", gain = 0.06) {
  if (!state.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  } catch { /* ignore */ }
}
const sfx = {
  place: (p) => beep(p === "X" ? 520 : 400, 0.12, "triangle"),
  win: () => [660, 880, 1100].forEach((f, i) => setTimeout(() => beep(f, 0.18, "sine", 0.07), i * 110)),
  draw: () => beep(240, 0.25, "sawtooth", 0.05),
  click: () => beep(700, 0.05, "square", 0.03),
};

// ---------- scene ----------
const scene = createScene($("scene"), { onCellClick: handleMove });

// ---------- rendering of UI ----------
function renderScores() {
  ui.scoreX.textContent = state.scores.X;
  ui.scoreO.textContent = state.scores.O;
  ui.scoreD.textContent = state.scores.draw;
}

function renderMode() {
  if (state.mode === "cpu") {
    ui.modeLabel.textContent = "vs CPU";
    ui.modeIcon.textContent = "🤖";
    ui.tagX.textContent = "Tú";
    ui.tagO.textContent = "CPU";
  } else {
    ui.modeLabel.textContent = "2 jugadores";
    ui.modeIcon.textContent = "👥";
    ui.tagX.textContent = "Jugador X";
    ui.tagO.textContent = "Jugador O";
  }
}

function renderSound() {
  ui.soundIcon.textContent = state.sound ? "🔊" : "🔇";
}

function setStatus(html, isO = false, pop = false) {
  ui.status.innerHTML = html;
  ui.status.classList.toggle("turn-o", isO);
  if (pop) {
    ui.status.classList.remove("pop");
    void ui.status.offsetWidth;
    ui.status.classList.add("pop");
  }
}

function renderTurn() {
  if (state.finished) return;
  if (state.mode === "cpu") {
    setStatus(state.current === HUMAN ? "Tu turno" : "La CPU está pensando…", state.current === "O");
  } else {
    setStatus(`Turno de <b>${state.current}</b>`, state.current === "O");
  }
}

// ---------- game flow ----------
function handleMove(index) {
  if (state.finished || state.board[index]) return;
  if (state.mode === "cpu" && state.current !== HUMAN) return;

  applyMove(index, state.current);
  if (state.finished) return;

  if (state.mode === "cpu" && state.current === CPU) {
    scene.setInteractive(false);
    renderTurn();
    setTimeout(triggerCpu, 520);
  }
}

function applyMove(index, player) {
  state.board[index] = player;
  scene.placePiece(index, player, true);
  sfx.place(player);

  const win = winningLine(state.board);
  if (win) return finish(win.player, win.line);
  if (isFull(state.board)) return finish(null, null);

  state.current = player === "X" ? "O" : "X";
  renderTurn();
  persist();
}

function triggerCpu() {
  if (state.finished) return;
  const move = cpuMove(state.board.slice(), CPU, HUMAN, "hard");
  if (move >= 0) applyMove(move, CPU);
  scene.setInteractive(true);
}

function finish(winner, line) {
  state.finished = true;
  state.winner = winner;
  state.line = line;

  if (winner) {
    state.scores[winner]++;
    scene.highlightWin(line, winner);
    scene.celebrate();
    sfx.win();
  } else {
    state.scores.draw++;
    sfx.draw();
  }
  renderScores();
  persist();
  setTimeout(() => showBanner(winner), winner ? 700 : 350);
  renderResultStatus(winner);
}

function renderResultStatus(winner) {
  if (!winner) { setStatus("¡Empate! 🤝", false, true); return; }
  if (state.mode === "cpu") {
    setStatus(winner === HUMAN ? "¡Ganaste! 🎉" : "Ganó la CPU 🤖", winner === "O", true);
  } else {
    setStatus(`¡Ganó <b>${winner}</b>! 🎉`, winner === "O", true);
  }
}

function showBanner(winner) {
  let emoji, title, sub;
  if (!winner) {
    emoji = "🤝"; title = "¡Empate!"; sub = "Quedó pa' la historia, va de nuevo";
  } else if (state.mode === "cpu") {
    if (winner === HUMAN) {
      emoji = "😎"; title = "¡Ganaste, crack!"; sub = "Le pasaste la aplanadora a la CPU";
    } else {
      emoji = "🤖"; title = "Ganó la CPU"; sub = "Nada que hacerle… ¡revancha altiro!";
    }
  } else {
    emoji = "🎉"; title = `¡Ganó ${winner}!`; sub = winner === "X" ? "Pura pinta nomás" : "Bien jugado";
  }
  ui.bannerEmoji.textContent = emoji;
  ui.bannerTitle.textContent = title;
  ui.bannerSub.textContent = sub;
  ui.banner.classList.add("show");
}

function hideBanner() { ui.banner.classList.remove("show"); }

function newRound() {
  hideBanner();
  scene.clearBoard(true);
  state.board = emptyBoard();
  state.current = "X";
  state.finished = false;
  state.winner = null;
  state.line = null;
  scene.setInteractive(true);
  renderTurn();
  persist();
  sfx.click();
}

function persist() {
  saveState(state);
}

// ---------- restore a saved board into the 3D scene ----------
function restoreBoard() {
  state.board.forEach((p, i) => { if (p) scene.placePiece(i, p, false); });
  if (state.finished) {
    if (state.winner && state.line) scene.highlightWin(state.line, state.winner);
    renderResultStatus(state.winner);
  } else {
    renderTurn();
    // if it's the CPU's turn on reload, let it play
    if (state.mode === "cpu" && state.current === CPU) {
      scene.setInteractive(false);
      setTimeout(triggerCpu, 700);
    }
  }
}

// ---------- wire up controls ----------
ui.resetBtn.addEventListener("click", newRound);
ui.bannerBtn.addEventListener("click", newRound);

ui.clearBtn.addEventListener("click", () => {
  state.scores = { X: 0, O: 0, draw: 0 };
  renderScores();
  persist();
  sfx.click();
});

ui.modeBtn.addEventListener("click", () => {
  state.mode = state.mode === "cpu" ? "2p" : "cpu";
  renderMode();
  sfx.click();
  newRound();
});

ui.soundBtn.addEventListener("click", () => {
  state.sound = !state.sound;
  renderSound();
  if (state.sound) sfx.click();
  persist();
});

// ---------- boot ----------
renderScores();
renderMode();
renderSound();
restoreBoard();

window.addEventListener("load", () => {
  setTimeout(() => ui.loader.classList.add("hidden"), 350);
});
