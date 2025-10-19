// src/components/GamePage.jsx
import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Board from "./Board";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function GamePage({ username, onExit, testLocal = false }) {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [board, setBoard] = useState(() => Array(6).fill(null).map(() => Array(7).fill(null)));
  const [roomId, setRoomId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [turn, setTurn] = useState(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    if (testLocal) {
      setStatus("started (local)");
      setPlayers([username, "bot"]);
      setRoomId("local-test");
      return;
    }

    const s = io(BACKEND_URL, { transports: ["websocket"] });
    setSocket(s);

    s.on("connect", () => {
      setStatus("connected");
      s.emit("join", username);
    });

    s.on("start", (payload) => {
      setStatus("game-started");
      setRoomId(payload.roomId ?? `room-${Date.now()}`);
      setBoard(payload.board ?? Array(6).fill(null).map(() => Array(7).fill(null)));
      setPlayers(payload.players ?? [username, "bot"]);
      setWinner(null);
    });

    s.on("update", (newBoard) => setBoard(newBoard));
    s.on("end", ({ winner }) => { setWinner(winner); setStatus("ended"); });
    s.on("disconnect", () => setStatus("disconnected"));
    s.on("connect_error", (err) => setStatus("connect-error"));
    return () => s.disconnect();
  }, [username, testLocal]);

  const handleColumnClick = (col) => {
    if (winner) return;
    if (testLocal) {
      setBoard((prev) => {
        const b = prev.map(r => [...r]);
        for (let r = 5; r >= 0; r--) {
          if (!b[r][col]) {
            b[r][col] = "player";
            break;
          }
        }
        return b;
      });
      setTimeout(() => {
        setBoard((prev) => {
          const b = prev.map(r => [...r]);
          for (let c = 0; c < 7; c++) {
            for (let r = 5; r >= 0; r--) {
              if (!b[r][c]) {
                b[r][c] = "bot";
                return b;
              }
            }
          }
          return b;
        });
      }, 300);
      return;
    }

    if (!socket || !roomId) return alert("Socket not connected or room not set yet.");
    socket.emit("move", { roomId, col, player: "player" });
  };

  return (
    <div className="game-container">
      <style>{`
        body {
          background: linear-gradient(135deg, #1f1f1f, #3a3a3a);
          font-family: 'Poppins', sans-serif;
          color: #fff;
          margin: 0;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .game-container {
          max-width: 960px;
          width: 95%;
          background: #222;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 0 20px rgba(255,255,255,0.1);
          text-align: center;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .top-bar strong {
          font-size: 1.2rem;
          color: #ffcc00;
        }

        .status {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        button {
          background: #ffcc00;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
        }

        button:hover {
          background: #ffd633;
          transform: scale(1.05);
        }

        .info {
          margin-top: 16px;
          font-size: 0.95rem;
        }

        h3 {
          margin-top: 12px;
          color: #00ff88;
        }

        @media (max-width: 600px) {
          .game-container {
            padding: 16px;
          }
          .top-bar strong {
            font-size: 1rem;
          }
          button {
            padding: 6px 12px;
          }
        }
      `}</style>

      <div className="top-bar">
        <div><strong>{username}</strong> {players.length ? `vs ${players[1] ?? "—"}` : null}</div>
        <div>
          <small className="status">Status: {status}</small>
          <button onClick={() => { if (socket) socket.disconnect(); onExit(); }}>Exit</button>
        </div>
      </div>

      <Board board={board} onColumnClick={handleColumnClick} currentTurn={turn} />

      <div className="info">
        {winner ? (
          <div>
            <h3>Result: {winner === "player" ? "You won!" : winner === "bot" ? "Bot won" : `${winner} won`}</h3>
            <button onClick={() => window.location.reload()}>Play again</button>
          </div>
        ) : (
          <small>Make your move by clicking the ↓ button above the column.</small>
        )}
      </div>
    </div>
  );
}
