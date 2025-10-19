// src/App.jsx
import React, { useState } from "react";
import GamePage from "./components/GamePage";
import Leaderboard from "./components/Leaderboard";

export default function App() {
  const [username, setUsername] = useState("");
  const [inGame, setInGame] = useState(false);
  const [gameInfo, setGameInfo] = useState(null);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>4 in a Row — Frontend</h1>

      {!inGame ? (
        <div style={{ maxWidth: 420, margin: "30px auto" }}>
          <label>
            Enter username:
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. navya"
              style={{ display: "block", width: "100%", padding: 8, marginTop: 8 }}
            />
          </label>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                if (!username.trim()) return alert("Please enter username");
                setInGame(true);
                setGameInfo({ username });
              }}
              style={{ padding: "8px 12px" }}
            >
              Play (join queue)
            </button>

            <button
              onClick={() => {
                // Quick local test: allow user to open GamePage with a "local" room id
                if (!username.trim()) return alert("Please enter username");
                setInGame(true);
                setGameInfo({ username, testLocal: true });
              }}
              style={{ padding: "8px 12px" }}
            >
              Play (local test)
            </button>
          </div>

          <div style={{ marginTop: 18 }}>
            <small>Leaderboard (live when backend is connected)</small>
            <Leaderboard />
          </div>
        </div>
      ) : (
        <GamePage
          username={gameInfo.username}
          onExit={() => {
            setInGame(false);
            setGameInfo(null);
          }}
          testLocal={gameInfo.testLocal}
        />
      )}
    </div>
  );
}
