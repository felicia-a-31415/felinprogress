# felinprogress

A study companion that runs in the browser: looping ambient sounds, a
timer and stopwatch, and a per-subject study log with weekly and monthly
stats. All data stays in your browser's local storage.

## Commands

- `npm run dev`: start the dev server at http://localhost:5173
- `npm test`: run the unit tests
- `npm run build`: type-check and build the static site into `dist/`
- `npm run lint`: lint

## Layout

- `src/lib`: pure logic (time, storage, stats, clock) with tests
- `src/audio`: the sound list and the looping audio engine
- `public/sounds`: the recordings, with sources and licences in `CREDITS.md`
- `src/state`: app state and persistence hooks
- `src/components`: the screens

Design and plan: `docs/superpowers/`.
