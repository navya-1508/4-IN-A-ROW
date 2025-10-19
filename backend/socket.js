// src/socket.js
import { createEmptyBoard, makeMove, checkWin, cloneBoard, isBoardFull } from "./gameLogic.js";
import { chooseBotMove } from "./botLogic.js";
import GameModel from "./models/Game.js";
import { sendAnalyticsEvent } from "./kafka/producer.js";

const MATCH_TIMEOUT_MS = 10_000; // wait 10s before firing bot
const RECONNECT_WINDOW_MS = 30_000; // 30s to rejoin

const waiting = []; // array of { socket, username, timerId }
const activeGames = new Map(); // roomId -> game object
const socketToRoom = new Map(); // socket.id -> roomId
const userReconnect = new Map(); // username -> { roomId, timerId }

function genRoomId() {
  return `room_${Date.now()}_${Math.floor(Math.random()*10000)}`;
}

function createGameObj(roomId, p1, p2){
  return {
    roomId,
    board: createEmptyBoard(),
    players: [p1, p2], // objects: { id: socket.id OR 'bot', username, token: 'P1'/'P2'/'BOT' }
    turn: 0, // index: 0 or 1
    moves: [],
    startedAt: Date.now()
  };
}

export default function setupSocket(io, { saveToDB = true } = {}) {
  io.on("connection", (socket) => {
    console.log("conn:", socket.id);

    socket.on("join", (usernameRaw) => {
      const username = String(usernameRaw || "anon").slice(0,32);
      console.log("join request:", username, socket.id);

      // 1) if there's a waiting player -> match them
      if (waiting.length > 0) {
        const peer = waiting.shift();
        clearTimeout(peer.timerId);
        const roomId = genRoomId();
        const p1 = { id: peer.socket.id, username: peer.username, token: "P1" };
        const p2 = { id: socket.id, username, token: "P2" };
        const game = createGameObj(roomId,p1,p2);
        activeGames.set(roomId, game);
        socketToRoom.set(peer.socket.id, roomId);
        socketToRoom.set(socket.id, roomId);

        peer.socket.join(roomId);
        socket.join(roomId);

        // emit start to both
        io.to(roomId).emit("start", { roomId, board: game.board, players: [p1.username, p2.username] });

        sendAnalyticsEvent({ type: "GAME_START", roomId, players: [p1.username,p2.username], ts: Date.now() });
        return;
      }

      // 2) otherwise add to waiting, schedule bot fallback
      const timerId = setTimeout(() => {
        // start with bot
        const roomId = genRoomId();
        const p1 = { id: socket.id, username, token: "P1" };
        const p2 = { id: "bot", username: "bot", token: "BOT" };
        const game = createGameObj(roomId, p1, p2);
        activeGames.set(roomId, game);
        socketToRoom.set(socket.id, roomId);

        socket.join(roomId);
        socket.emit("start", { roomId, board: game.board, players: [p1.username, p2.username] });

        sendAnalyticsEvent({ type: "GAME_START", roomId, players: [p1.username,p2.username], ts: Date.now() });
      }, MATCH_TIMEOUT_MS);

      waiting.push({ socket, username, timerId });
      socket.emit("waiting", { message: "Waiting for opponent..." });
    });

    socket.on("move", async ({ roomId, col, player }) => {
      const game = activeGames.get(roomId);
      if (!game) {
        socket.emit("error", { message: "Game not found" });
        return;
      }
      // find player index
      const idx = game.players.findIndex(p => p.id === socket.id || p.username === player || p.token === player);
      if (idx === -1) {
        socket.emit("error", { message: "Not a player in this game" });
        return;
      }
      if (game.turn !== idx) {
        socket.emit("error", { message: "Not your turn" });
        return;
      }

      // attempt move
      const token = game.players[idx].token;
      const res = makeMove(game.board, col, token);
      if (!res) {
        socket.emit("invalid-move", { message: "Column full or invalid" });
        return;
      }

      // record move
      game.moves.push({ by: game.players[idx].username, col, ts: Date.now() });

      // broadcast update
      io.to(roomId).emit("update", game.board);
      sendAnalyticsEvent({ type: "MOVE", roomId, by: game.players[idx].username, col, ts: Date.now() });

      // check win/draw
      if (checkWin(game.board, token)) {
        // winner is current player
        const winnerName = game.players[idx].username;
        io.to(roomId).emit("end", { winner: winnerName });
        await finishGame(game, winnerName, saveToDB);
        return;
      }

      if (isBoardFull(game.board)) {
        io.to(roomId).emit("end", { winner: null, draw: true });
        await finishGame(game, null, saveToDB);
        return;
      }

      // Next turn
      game.turn = 1 - game.turn;

      // If opponent is bot and it's bot's turn -> compute bot move
      const opponent = game.players[game.turn];
      if (opponent.id === "bot") {
        // choose bot move synchronously
        const botCol = chooseBotMove(cloneBoard(game.board), "BOT", token === "P1" ? "P2" : "P1");
        const botRes = makeMove(game.board, botCol, opponent.token);
        game.moves.push({ by: "bot", col: botCol, ts: Date.now() });

        io.to(roomId).emit("update", game.board);
        sendAnalyticsEvent({ type: "MOVE", roomId, by: "bot", col: botCol, ts: Date.now() });

        if (checkWin(game.board, opponent.token)) {
          io.to(roomId).emit("end", { winner: "bot" });
          await finishGame(game, "bot", saveToDB);
          return;
        }

        if (isBoardFull(game.board)) {
          io.to(roomId).emit("end", { winner: null, draw: true });
          await finishGame(game, null, saveToDB);
          return;
        }

        // next turn back to player
        game.turn = 1 - game.turn;
      }
    });

    socket.on("rejoin", (payload) => {
      // payload: { username, roomId }
      const { username, roomId } = payload || {};
      const game = activeGames.get(roomId);
      if (!game) {
        socket.emit("error", { message: "Game not found for rejoin" });
        return;
      }
      // if username matches a player
      const idx = game.players.findIndex(p => p.username === username);
      if (idx === -1) {
        socket.emit("error", { message: "Username not in game" });
        return;
      }
      // reconnect: attach socket, update maps
      game.players[idx].id = socket.id;
      socketToRoom.set(socket.id, roomId);
      socket.join(roomId);

      // cancel any forfeit timer tracked under userReconnect
      const rec = userReconnect.get(username);
      if (rec && rec.timerId) {
        clearTimeout(rec.timerId);
        userReconnect.delete(username);
      }

      socket.emit("rejoin-ok", { roomId, board: game.board, players: game.players.map(p=>p.username) });
      io.to(roomId).emit("info", { message: `${username} rejoined` });
    });

    socket.on("disconnect", () => {
      console.log("disconnect:", socket.id);
      const roomId = socketToRoom.get(socket.id);
      socketToRoom.delete(socket.id);

      if (roomId) {
        const game = activeGames.get(roomId);
        if (!game) return;
        // find which player disconnected
        const idx = game.players.findIndex(p => p.id === socket.id);
        if (idx === -1) return;

        const username = game.players[idx].username;
        // start 30s timer for reconnect
        const timerId = setTimeout(async () => {
          // forfeit: other player wins (or bot)
          const other = game.players[1-idx];
          const winnerName = other.username;
          io.to(roomId).emit("end", { winner: winnerName, reason: "forfeit" });
          await finishGame(game, winnerName, true);
        }, RECONNECT_WINDOW_MS);

        userReconnect.set(username, { roomId, timerId, socketId: socket.id });
        io.to(roomId).emit("info", { message: `${username} disconnected. Waiting 30s to reconnect...` });
      } else {
        // maybe user was in waiting queue -> remove
        const i = waiting.findIndex(w => w.socket.id === socket.id);
        if (i !== -1) {
          clearTimeout(waiting[i].timerId);
          waiting.splice(i,1);
        }
      }
    });
  });

  async function finishGame(game, winnerName, save) {
    try {
      activeGames.delete(game.roomId);
      // persist
      if (save) {
        const endedAt = Date.now();
        const durationMs = endedAt - game.startedAt;
        await GameModel.create({
          roomId: game.roomId,
          players: game.players.map(p => ({ username: p.username, token: p.token })),
          board: game.board,
          winner: winnerName,
          moves: game.moves,
          createdAt: new Date(game.startedAt),
          endedAt: new Date(endedAt),
          durationMs,
        });
      }
      sendAnalyticsEvent({ type: "GAME_END", roomId: game.roomId, winner: winnerName, ts: Date.now(), moves: game.moves.length });
    } catch (err) {
      console.error("finishGame error:", err);
    }
  }
}
