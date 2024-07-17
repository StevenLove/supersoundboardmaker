# SuperSoundBoardMaker
### Overview

This project helps you to build a quick soundboard app for web/mobile using expo.
You put .mp3 files into a folder, run a command, and the app generates the soundboard for you.

### Features

- audio normalization so the effects are all the same volume (-10dB)
- automatic trimming of leading silence for snappier playback
- Allows directories of files to create a single button that plays a random sound out of a set of sounds

### Setup

1. Place .mp3 files into the sfx/ folder
2. Optionally, do some minor editing to .mp3 files with a vscode extension like [this](https://marketplace.visualstudio.com/items?itemName=chocolate-pie.sound-editor)
3. Run `just updateSoundBank`
4. Start the expo server with `cd expo-app && yarn start`
5. Navigate to localhost:8081 or scan the QR code to open the app on your phone
