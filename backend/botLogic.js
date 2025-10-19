// src/botLogic.js
import { ROWS, COLS, cloneBoard, makeMove, checkWin } from "./gameLogic.js";

const COL_ORDER = [3,2,4,1,5,0,6];

export function chooseBotMove(board, botToken="BOT", oppToken="P1"){
  // 1) immediate win
  for (let c=0;c<COLS;c++){
    if (board[0][c]) continue;
    const b = cloneBoard(board);
    makeMove(b,c,botToken);
    if (checkWin(b,botToken)) return c;
  }

  // 2) block opponent immediate win
  for (let c=0;c<COLS;c++){
    if (board[0][c]) continue;
    const b = cloneBoard(board);
    makeMove(b,c,oppToken);
    if (checkWin(b,oppToken)) return c;
  }

  // 3) heuristic: center preference + small evaluate
  let best = -1, bestScore = -Infinity;
  for (const c of COL_ORDER){
    if (board[0][c]) continue;
    const b = cloneBoard(board);
    makeMove(b,c,botToken);
    let score = (3 - Math.abs(3 - c)) * 2; // center preference
    score += evaluateBoard(b, botToken);
    // penalize if opponent can win immediately after this move
    for (let oc=0; oc<COLS; oc++){
      if (b[0][oc]) continue;
      const b2 = cloneBoard(b);
      makeMove(b2, oc, oppToken);
      if (checkWin(b2, oppToken)) score -= 1000;
    }
    if (score > bestScore){ bestScore = score; best = c; }
  }
  if (best === -1){
    for (let c=0;c<COLS;c++) if (!board[0][c]) return c;
  }
  return best;
}

function evaluateBoard(board, token){
  // small heuristic: count contiguous tokens of length 2 or 3
  let score = 0;
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
        if (count === 2) score += 3;
        if (count === 3) score += 30;
      }
    }
  }
  return score;
}
