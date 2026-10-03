Hero of Bitcoin — browser and offline demo
==========================================

```bash
npm ci
HOB_DEMO_ROM_DIR=/absolute/path/to/hash-bound/demo-roms npm run verify
python3 -m http.server 8080
```

Open <http://127.0.0.1:8080>. `npm run build` regenerates `index.html` from
`src/`, the central settings in `config/demo.json`, and the bounded demo ROMs
listed in `rom/demo-manifest.json`. The generated 1.0.2a ROMs stay outside Git.
Set `HOB_DEMO_ROM_DIR` to the bounded `hob-launcher` build output matching that
manifest; the build rejects different hashes or sizes. The original tracked
ROMs remain historical fixtures. Build tools and dependencies are not needed
by players.

The interface supports English, Spanish, Italian, Japanese, German, Korean,
French, Dutch and Finnish. The game selector offers English, Dutch, Finnish and Italian;
interface language and game language can be selected separately. Other game
languages require their own bounded ROM and gameplay acceptance before enabling.

The demo ends when the player leaves the first town. Its completion screen links
to the full game's purchase page; desktop players can also scan a phone QR code.
This package does not change the full game or Raspberry Pi edition.

Use “Download the offline demo” to save one self-contained HTML file with the
selected languages. Open that file in a desktop browser without internet.
The download is named `index.html`. Scripts, fonts, artwork and demo ROMs are
embedded. A release-trailer link appears on the hosted page only and loads
nothing until clicked. The purchase link needs
internet. Browser storage permission affects whether saves persist between
sessions; demo saves are separated from full-game saves and by ROM schema.

Keyboard: arrows move, X is A, Z is B, Enter is START, Shift is SELECT. P pauses,
F toggles fullscreen, M toggles sound and S toggles scanlines. Escape leaves
fullscreen; outside fullscreen it returns to the start screen. Touch controls
are available on touch devices. Browser shortcuts and text selection remain
available.

The original `rom/HeroOfBitcoin_DEMO.gb` remains a historical artifact. It is not
embedded in the current page. The emulator core is preserved from the previous
page; changes are confined to its player shell and isolated save adapter.

© Hero of Bitcoin — All rights reserved.

The Hero of Bitcoin game ROM, emulator implementation, web interface, build system,
artwork, music, story, characters, and all associated intellectual property are
proprietary and owned by Hero of Bitcoin.

All rights reserved. No part of this package may be reproduced, distributed,
or transmitted in any form without prior written permission from Hero of Bitcoin.


THIRD-PARTY ATTRIBUTION
------------------------
Third-party components retain their own licenses: Inter (SIL OFL 1.1),
pako 2.1.0 (MIT and Zlib) and qrcode-generator 2.0.4 (MIT). Their notices live
in `src/licenses/` and are also embedded in each offline HTML file.

This emulator is based on gemuboi-js by Daniel Song (https://danwsong.com/).
Copyright © Daniel Song.

We acknowledge and appreciate the foundational work that made this project possible.


CONTACT INFORMATION
-------------------
For licensing inquiries, usage permissions, or questions about this package:

📧 Email: HeroOfBitcoin@pm.me
🐦 Twitter/X: https://x.com/HeroOfBitcoin
🟣 Nostr: marsmensch@iris.to

We encourage interested parties to reach out for potential collaboration
or usage arrangements.
