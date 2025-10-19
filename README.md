4 in a Row — Multiplayer Game

This is a real-time Connect Four game where you can play 1v1 or against a bot if no one joins. The game has a leaderboard, supports reconnects, and saves completed games to MongoDB.

How to Run Locally
1. Clone the repo
git clone https://github.com/yourusername/4-in-a-row.git
cd 4-in-a-row

2. Backend
cd backend
npm install


Create a .env file in backend:

PORT=4000
MONGO_URI=<your-mongo-connection-string>


Run backend:

npm run dev


Backend should now be running on http://localhost:4000.

3. Frontend

Open another terminal:

cd frontend
npm install


Create a .env file in frontend:

VITE_BACKEND_URL=http://localhost:4000


Run frontend:

npm run dev


Open http://localhost:5173 in your browser.

4. How to Play

Enter your username

Click Play (join queue) to wait for an opponent

If no one joins within 10s, a bot will start

Click ↓ on the column you want to drop your disc

Game ends with win/loss/draw

Check the Leaderboard for top players
