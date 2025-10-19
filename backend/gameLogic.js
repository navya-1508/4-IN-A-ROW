// src/gameLogic.js
export const ROWS = 6;
export const COLS = 7;

export function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function cloneBoard(board) {
  return board.map(r => [...r]);
}

// returns {row, col} or null if invalid
export function makeMove(board, col, token) {
  if (col < 0 || col >= COLS) return null;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) {
      board[r][col] = token;
      return { row: r, col };
    }
  }
  return null;
}

export function isColumnFull(board, col) {
  return !!board[0][col];
}

export function isBoardFull(board) {
  return board[0].every(Boolean);
}

export function checkWin(board, token) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r=0;r<ROWS;r++){
    for (let c=0;c<COLS;c++){
      if (board[r][c] !== token) continue;
      for (const [dr,dc] of dirs){
        let count = 1;
        for (let k=1;k<4;k++){
          const nr = r + dr*k;
          const nc = c + dc*k;
          if (nr<0||nr>=ROWS||nc<0||nc>=COLS) break;
          if (board[nr][nc] === token) count++; else break;
        }
        if (count>=4) return true;
      }
    }
  }
  return false;
}
