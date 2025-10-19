// src/components/Leaderboard.jsx
import React, { useEffect, useState } from "react";

/*
 Once backend adds a /leaderboard API,
 replace mock data and fetch from: http://localhost:4000/leaderboard
*/
export default function Leaderboard() {
  const [rows, setRows] = useState([
    { username: "alice", wins: 5 },
    { username: "bob", wins: 3 },
    { username: "you", wins: 1 },
  ]);

  useEffect(() => {
    fetch("http://localhost:4000/leaderboard")
      .then((r) => r.json())
      .then(setRows);
  }, []);

  return (
    <div className="leaderboard-container">
      <style>{`
        .leaderboard-container {
          margin-top: 24px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          backdrop-filter: blur(8px);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
          color: #fff;
          width: 100%;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
          transition: 0.3s ease;
        }

        .leaderboard-container:hover {
          box-shadow: 0 0 25px rgba(255, 255, 255, 0.2);
        }

        .leaderboard-container strong {
          font-size: 1.4rem;
          color: #ffcc00;
          display: block;
          margin-bottom: 12px;
          text-align: center;
        }

        ol {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        li {
          background: rgba(255, 255, 255, 0.08);
          margin: 8px 0;
          padding: 10px 16px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: 0.3s ease;
          font-size: 1rem;
        }

        li:nth-child(1) {
          background: linear-gradient(90deg, #ffd70055, #ffcc0033);
          border-left: 4px solid #ffd700;
        }

        li:nth-child(2) {
          background: linear-gradient(90deg, #c0c0c055, #cccccc33);
          border-left: 4px solid #c0c0c0;
        }

        li:nth-child(3) {
          background: linear-gradient(90deg, #cd7f3255, #cd853f33);
          border-left: 4px solid #cd7f32;
        }

        li:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.12);
        }

        .username {
          font-weight: 600;
          color: #ffcc00;
        }

        .wins {
          font-weight: 500;
          opacity: 0.9;
        }

        @media (max-width: 600px) {
          .leaderboard-container {
            padding: 16px;
          }
          li {
            font-size: 0.9rem;
            padding: 8px 12px;
          }
        }
      `}</style>

      <strong>🏆 Leaderboard</strong>
      <ol>
        {rows.map((r, i) => (
          <li key={r.username}>
            <span className="username">
              {i + 1}. {r.username}
            </span>
            <span className="wins">{r.wins} wins</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
