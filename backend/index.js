// src/index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db.js";
import setupSocket from "./socket.js";
import Game from "./models/Game.js";

dotenv.config();
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

if (process.env.MONGO_URI) {
  connectDB(process.env.MONGO_URI).catch(err => console.error(err));
}

setupSocket(io, { saveToDB: true });

// simple routes
app.get("/", (req, res) => res.send("4 in a Row backend"));

app.get("/leaderboard", async (req, res) => {
  // very simple leaderboard: count wins per username in Game collection
  try {
    const agg = await Game.aggregate([
      { $match: { winner: { $ne: null }}},
      { $group: { _id: "$winner", wins: { $sum: 1 } }},
      { $sort: { wins: -1 } },
      { $limit: 20 }
    ]);
    res.json(agg.map(a => ({ username: a._id, wins: a.wins })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
