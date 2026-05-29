# Times Tables Quest

A times-tables learning game for children, starring **Sparky the Dragon**. It is a single small web app — no installation, no account, and no internet connection required (an internet connection only adds a nicer font).

## How to start the game

**Easiest way:** double-click `index.html`. It opens in any modern browser (Chrome, Edge, Firefox, Safari) on a laptop or tablet.

**Optional (if you prefer a local server):**

```bash
cd times_tables_quest
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

The game works well on tablets — the Lightning mode has a big on-screen number pad designed for touch.

## Putting it on the internet (GitHub Pages)

The game is a fully static site (just HTML, CSS, JavaScript and images), so it can be hosted for free on GitHub Pages without any changes:

1. Create a GitHub repository (it must be **public** unless you have a paid GitHub plan, because Pages on private repositories is a paid feature) and push the contents of this folder to the `main` branch.
2. Either:
   - **Do nothing else** — the included workflow (`.github/workflows/deploy.yml`) publishes the site to GitHub Pages automatically on every push to `main`; or
   - turn the workflow off and instead go to **Settings → Pages** in the repository and choose **Deploy from a branch** → `main` → `/ (root)`.
3. After a minute or two the game is live at `https://<your-username>.github.io/<repository-name>/`.

Notes:

- All paths in the game are relative, so it works when served from a sub-path like `/<repository-name>/`.
- Progress is still saved in each visitor's own browser (localStorage). Hosting the game online does not share progress between devices — use **My Quest → Transfer my save** to carry a profile across.
- The `tests/` folder is only used for development; it is harmless to publish but can be deleted if you prefer.

## What is in the game

| Mode | What it does |
|------|--------------|
| **Learn** | Walks through one times table fact by fact, with groups of stars showing *why* 3 × 4 = 12, and a "Say it" button that reads the fact aloud. |
| **Practice** | 10 friendly multiple-choice questions on a chosen table (or a mix). No timer, gentle feedback, and the game quietly repeats facts she got wrong before. |
| **Type It** | 10 questions where she types the answer herself instead of choosing it — designed for the keyboard (digits, Backspace, Enter to check, Enter again to move on), with an on-screen keypad for tablets. |
| **Lightning** | A 60-second challenge: type as many answers as you can. Best score is saved. |
| **Sparky's Den** | Sparky's home. Every treasure she buys appears here, and Sparky himself grows through six looks (scarf, explorer, hero, royal, golden) as the collection gets bigger. |
| **My Quest** | Shows overall progress: stars earned, table stars, best Lightning score, and prize badges. |
| **Star Shop** | Spend earned stars on collectible treasures, which appear on the home screen. |

The whole game can be driven from the keyboard: Tab moves between buttons (with a clear highlight), Enter presses them, and in Type It and Lightning the answers are typed directly. On the results screen, pressing Enter starts another round.

## How earning works (the important part)

The game is built around visible progress and earning things:

- **Stars** — every correct answer earns 1 star, with a +5 bonus for a perfect Practice or Type It round. Stars are a currency she keeps.
- **Star Shop** — stars can be spent on 17 collectible treasures (from a 15-star Baby Chick up to the 400-star Golden Star). Bought treasures appear on her home screen forever.
- **Sparky grows** — the treasures she collects change Sparky himself: at 3, 6, 10, 14 and 17 treasures he gains a new look (cosy scarf, explorer outfit, hero cape, royal crown, golden dragon). The current Sparky appears on the home screen, and Sparky's Den shows what is needed for the next stage.
- **Table stars** — scoring 8 or more out of 10 in a Practice or Type It round earns one star for that times table, up to 3 per table. Filling all 12 tables (36 stars) completes the "Quest to the castle" progress bar.
- **Prize badges** — 15 badges unlock for milestones such as the first perfect round, a Lightning score of 25, finishing a Type It round, or collecting every treasure.

Progress is saved automatically in the browser (localStorage), and several children can each have their own profile — the game asks for a name on the first screen.

## Notes for parents

- Sound effects can be muted with the speaker button in the top bar.
- The "Say it" button and tapping a Practice question use the browser's built-in text-to-speech.
- Wrong answers are never punished: the game shows the right answer, encourages her, and brings that fact back later.
- Progress is stored per browser. To move her progress to another device or website (for example from a local copy to the GitHub Pages site), open **My Quest → Transfer my save**, copy the save code, then choose **"Import a save code"** on the first screen of the game on the new device.