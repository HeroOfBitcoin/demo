# Hero of Bitcoin browser demo agent guide

This repository owns the self-contained conference browser demo. `index.html` includes the emulator, game payload, interface, and runtime assets; `rom/HeroOfBitcoin_DEMO.gb` is the canonical standalone demo ROM used to detect accidental artifact drift.

Run `npm run verify` before committing. For runtime changes, serve the repository over HTTP and exercise cartridge start, keyboard input, pause, sound, scanlines, and return-to-landing behavior in a real browser. Keep browser evidence and private notes ignored under `output/` and `.state/todo_local.md`. Do not deploy or push without explicit authorization.
