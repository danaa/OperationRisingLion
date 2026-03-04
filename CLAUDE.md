# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

This is a vanilla HTML5 Canvas game — no build step, no bundler, no npm. To run locally, open `index.html` directly in a browser (or use a local HTTP server like `npx serve .` or VS Code Live Server).

### Local Supabase setup

`config.js` is gitignored. Copy the template and fill in credentials:
```bash
cp config.example.js config.js
# then edit config.js with your Supabase URL and anon key
```

## Architecture

All game code lives in a single class `AirplaneGame` in `game.js` (~2500 lines). There is no module system.

**Game states** (stored in `this.gameState`): `splash` → `playing` → `gameOver` → `nameInput` → `topScores` → back to `splash`.

**Main loop**: `gameLoop()` calls `update()` then `draw()` (dispatched via `gameState`) at 60fps via `requestAnimationFrame`.

**Key subsystems within the class:**
- Asset loading: `loadAssets()` / `loadMusic()` — images loaded into `this.*Image` properties, audio via Web Audio API
- Physics/gameplay: all in `update()` — player movement, projectiles (`this.rockets`), enemies (`this.reactors`, `this.aaGuns`, `this.aaGunBullets`), collision detection, scoring
- Rendering: `draw*()` methods dispatched from `gameLoop()` — one per game state plus helpers
- High scores: async Supabase calls (`loadHighScores`, `addHighScore`, `checkForHighScore`) — top 3 scores stored in `high_scores` table with columns `player_name`, `score`, `created_at`
- Mobile: `setupMobileGame()` / `setupMobileCanvas()` — resizes canvas and repositions elements for vertical phone layout; `this.isMobile` gates all mobile-specific paths
- Input: keyboard (`this.keys`), mouse, and touch events all registered in `setupEventListeners()`; virtual keyboard rendered for name entry on mobile

**Credential injection for production**: `game.js` contains the literal placeholders `{{SUPABASE_URL}}` and `{{SUPABASE_ANON_KEY}}`. The GitHub Actions workflow (`deploy.yml`) replaces these with secrets before deploying to GitHub Pages. Do not replace these placeholders in source — they must remain as-is in the repo.

## Assets

All assets are in `assets/`: PNG images (`splash`, `airplane`, `background`, `reactor`, `damaged_reactor`, `gun`, `start`, `top`, `exit`) and audio (`music.mp3`, `explosion.mp3`). Asset keys used in `loadAssets()` map directly to `this.*Image` properties set in `onAssetLoaded()`.
