# BHL Year

A 365-day "ready for anything" training program, numbered Day 1 to Day 365, delivered as a phone-first web app. It reproduces the structure and progression logic of a 2019 coached program (BHL) and does the coach's arithmetic for you: ladders start where last week ended, waves and deloads use your tested maxes, and rowing, bike, and run targets come from your own tests.

**Live app:** https://mbocon.github.io/bhl-year/

## Put it on your phone

1. Open the link above in Safari (iPhone) or Chrome (Android).
2. Share → **Add to Home Screen**. It opens full-screen and works offline after the first load.
3. Start on Day 1. Enter what you actually did; the next time a lift or interval comes up, the target is computed from your log.
4. **Back up from Settings every couple of weeks.** Your log lives only on that phone.
5. To share the program, send someone the same link. Their phone gets its own clean Day 1.

Coming back after a month off? Settings → **Start over at Day 1**. History is kept on the Scorecard; progression targets start fresh.

## What's in the repo

- `index.html`, `styles.css`, `js/` — the app (vanilla JavaScript modules, no build step)
- `sw.js`, `manifest.webmanifest`, `icons/` — offline and home-screen packaging
- `docs/bhl_program_analysis.md` — reverse-engineering of the original 2019 program
- `docs/superpowers/specs/` and `docs/superpowers/plans/` — the design and implementation plan
- `tests/` — unit tests for the calendar, schemes, rotations, session generator, target engine, store, and packaging

## Developing

    npm test        # node --test
    npm run serve   # http://localhost:8080

Before pushing a change, bump `VERSION` in `sw.js` so installed phones pick up the new files. GitHub Pages deploys from the `main` branch root.
