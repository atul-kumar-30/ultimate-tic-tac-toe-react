# 🎮 Ultimate Tic-Tac-Toe (React Edition)

A beautifully modern, fully-featured, and highly competitive Tic-Tac-Toe web application built with **React**, **Vite**, and **Supabase**.

## ✨ Features

- **🌐 Global Leaderboards & Local Play:** Play casually against a friend on your local machine using the **Friendly Local Leaderboard** (which securely saves to your browser's local storage), or log in to sync your MMR with the **Global Supabase Database**!
- **👥 Friends System & Unique Tags:** Every player gets a unique `#Tag` (like `Player#1234`). Use the search bar to find friends, view their profiles, send friend requests, and manage your friends list!
- **📊 Player Profiles & Privacy:** View all-time career stats (Wins, Losses, Draws, Win Rate) and join dates for any player. Your own profile securely hides private info (like your email address) from public view!
- **⚔️ Quick Match (Let's Play):** Instantly challenge any player directly from the Leaderboard using the "Let's Play" shortcut to seamlessly set up a local match against their official stats.
- **🏆 Ranked MMR System:** Everyone starts at 1000 RP (Bronze III) and can climb the competitive ladder all the way up to Terminator (2200+ RP).
- **🤖 Advanced AI Engine:** Play PvE against multiple difficulty levels, including an "Impossible" AI powered by the Minimax algorithm.
- **⚡ Blitz Mode:** Only have 5 seconds to make a move. Think fast or automatically lose the game!
- **📏 Dynamic Grids:** Play on standard 3x3, or challenge yourself to match 4-in-a-row on expanded 4x4 and 5x5 grids.
- **🎨 Premium UI:** Custom glassmorphism design, vibrant gradients, fluid animations, and a sleek dark mode interface.

---

## 🚀 Getting Started Locally

Since this project has been fully migrated to a modern React stack, all project dependencies are handled seamlessly via the Node Package Manager (`npm`).

### Installation

1. Ensure you have [Node.js](https://nodejs.org/) installed.
2. Clone this repository and navigate into the project directory in your terminal.
3. Install the required Node dependencies:
   ```bash
   npm install
   ```

### Setup Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Running the App
To start the local development server:
```bash
npm run dev
```
Then, open the provided `http://localhost:5173` link in your browser to play!

---

## 🌍 Deploying to Vercel

This application is fully optimized for **Vercel** zero-config deployments!

1. Push your code to a public or private GitHub repository.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Select your GitHub repository.
4. Expand the **Environment Variables** section and add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Click **Deploy**. Vercel will automatically build and host your game live on the web!

---

## 🛠️ Tech Stack

- **Frontend:** React, Vanilla CSS (Glassmorphism), Vite
- **Backend/Database:** Supabase (Auth, Profiles, Postgres Database)
- **Audio Engine:** Web Audio API (No external MP3s required)
