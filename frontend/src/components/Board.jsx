// src/components/Board.jsx
import React from "react";

export default function Board({ board, onColumnClick, currentTurn }) {
  return (
    <div className="board-wrapper">
      <style>{`
        .column-buttons {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }
        .column-buttons button {
          width: 60px;
          height: 28px;
          margin: 0 4px;
          cursor: pointer;
          border-radius: 6px;
          border: none;
          background: #ffcc00;
          font-weight: bold;
          transition: 0.3s ease;
        }
        .column-buttons button:hover {
          background: #ffd633;
          transform: translateY(-2px);
        }

        .board-grid {
          display: grid;
          grid-template-columns: repeat(7, 64px);
          gap: 6px;
          justify-content: center;
          background: #0a2b3d;
          padding: 6px;
          border-radius: 12px;
        }

        .cell {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          background: #0a2b3d;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.3s ease;
        }

        .disc {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          box-shadow: inset 0 -4px rgba(0,0,0,0.3), 0 2px 5px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }

        .disc.player {
          background: #ff6b6b;
        }
        .disc.opponent {
          background: #4d79ff;
        }
        .disc.bot {
          background: #8e44ad;
        }
        .disc.red {
          background: #ff6b6b;
        }
        .disc.yellow {
          background: #ffd166;
        }

        .current-turn {
          text-align: center;
          margin-top: 12px;
          color: #fff;
          opacity: 0.85;
          font-size: 0.95rem;
        }

        @media (max-width: 600px) {
          .board-grid {
            grid-template-columns: repeat(7, 48px);
            gap: 4px;
          }
          .cell {
            width: 48px;
            height: 48px;
          }
          .disc {
            width: 40px;
            height: 40px;
          }
          .column-buttons button {
            width: 40px;
            height: 24px;
          }
        }
      `}</style>

      <div className="column-buttons">
        {Array.from({ length: 7 }).map((_, c) => (
          <button key={c} onClick={() => onColumnClick(c)} aria-label={`Drop in column ${c + 1}`}>
            ↓
          </button>
        ))}
      </div>

      <div className="board-grid">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div key={`${r}-${c}`} className="cell">
              {cell && <div className={`disc ${cell}`} />}
            </div>
          ))
        )}
      </div>

      <div className="current-turn">
        Current turn: {currentTurn ?? "—"}
      </div>
    </div>
  );
}
