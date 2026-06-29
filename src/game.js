// Pure game logic for Cachipún (tres en línea / tic-tac-toe).
// No rendering here — just state, rules, the CPU brain and persistence.

const STORAGE_KEY = "cachipun3d:v1";

export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

export function emptyBoard() {
  return Array(9).fill(null);
}

export function winningLine(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], line };
    }
  }
  return null;
}

export function isFull(board) {
  return board.every((c) => c !== null);
}

export function availableMoves(board) {
  const moves = [];
  for (let i = 0; i < 9; i++) if (!board[i]) moves.push(i);
  return moves;
}

// Minimax CPU. `level` lets us add a little human-beatable randomness on easy.
export function cpuMove(board, cpu, human, level = "hard") {
  const moves = availableMoves(board);
  if (moves.length === 0) return -1;

  // First move: grab a corner or center for a livelier opening.
  if (moves.length === 9) {
    const openers = [0, 2, 4, 6, 8];
    return openers[Math.floor(Math.random() * openers.length)];
  }

  // Easy / medium: sometimes play a random legal move instead of the optimum.
  const slipChance = level === "easy" ? 0.5 : level === "medium" ? 0.2 : 0;
  if (Math.random() < slipChance) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  let bestScore = -Infinity;
  let best = moves[0];
  for (const m of moves) {
    board[m] = cpu;
    const score = minimax(board, 0, false, cpu, human);
    board[m] = null;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

function minimax(board, depth, maximizing, cpu, human) {
  const result = winningLine(board);
  if (result) return result.player === cpu ? 10 - depth : depth - 10;
  if (isFull(board)) return 0;

  if (maximizing) {
    let best = -Infinity;
    for (const m of availableMoves(board)) {
      board[m] = cpu;
      best = Math.max(best, minimax(board, depth + 1, false, cpu, human));
      board[m] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of availableMoves(board)) {
      board[m] = human;
      best = Math.min(best, minimax(board, depth + 1, true, cpu, human));
      board[m] = null;
    }
    return best;
  }
}

// ---------- persistence ----------
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.board) || data.board.length !== 9) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — fail silently */
  }
}
