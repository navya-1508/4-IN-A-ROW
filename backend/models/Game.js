// src/models/Game.js
import mongoose from "mongoose";

const MoveSchema = new mongoose.Schema({
  by: String,
  col: Number,
  ts: Number,
});

const GameSchema = new mongoose.Schema({
  roomId: { type: String, index: true, unique: true },
  players: [{ username: String, token: String }],
  board: { type: Array }, // store rows as arrays
  winner: { type: String, default: null },
  moves: [MoveSchema],
  createdAt: { type: Date, default: Date.now },
  endedAt: Date,
  durationMs: Number,
});

export default mongoose.models.Game || mongoose.model("Game", GameSchema);
