# It's just a game.

A single-player pixel-character chase game in a 3D room based on Dana's original fourteen-character recreation-room concept.

## Chapter 01
1. Start outside the room and zoom into the seven friends at the beanbags.
2. Choose one of the six original friends; the black/red-haired character is excluded.
3. A cinematic console race ends with the chosen character winning.
4. The red-haired rival repeats "it's just a game", transforming in three stages into a green/yellow monster with red hair details.
5. Escape with the other five friends. Collect three golden exit keys, then reach the green door.

## Controls
- WASD or arrows: move relative to the camera.
- Shift: sprint (stamina limited).
- Space: dash (four-second cooldown).
- Tap the floor: collision-aware movement route.
- Mobile: joystick, sprint and dash buttons.
- P/Escape or pause button: pause/resume.

Three hits end the run; retry immediately or select another character. The five companions flee using pathfinding. The antagonist follows around furniture. Audio and optional English spoken dialogue can be toggled. Personal best escape time is stored on the device.

## Run
Serve this folder with a static HTTP server. No backend, API keys or install step is needed. Three.js 0.187.0 is vendored with its MIT license. WebGL is preferred; a Canvas painter fallback renders the same 3D meshes/camera on devices without WebGL.

```sh
npm run check
```

Tests verify exactly six playable characters, reachability of every key and exit around furniture, collision handling, unique key collection and damage immunity/loss. Browser QA verified loading, character selection, cinematics, transformation, chase and retry/loss on the software renderer. GPU rendering was not available in the QA browser.

The console race is an introductory cinematic, not an interactive licensed Nintendo game. Characters use the actual original transparent pixel-art sheets as camera-facing sprites within the 3D room. The monster uses a dedicated matching pixel-art sprite with three transformation blends. Selection portraits use the same original artwork.

## Elevator lobby update

The room exit now leads to a pixel-art elevator lobby based on the supplied university photo. Three elevators display an upstairs arrow, a basement arrow and an out-of-service mark; their assignment changes each run. Wrong choices stay in the lobby. The correct elevator performs a floor-counter ride and arrives at a playable safe upper-floor area; reaching the green marker finishes the chapter. The monster follows into the lobby but remains downstairs. Players can retry at the lobby checkpoint, pause, use touch controls, or try the lobby directly from the menu.

Pixel characters and the monster now use eight gait frames with independently moving legs, rather than whole-sprite rocking. Unit checks cover opposite leg motion and every correct-elevator permutation. Browser QA verified lobby entry, the elevator ride, the upper-floor area and the safe ending.

## Campus entrance
Day/night pixel campus map with persistent theme switch and a clickable arrow over the upper-left building. The arrow and building open the original game; Campus map returns to the map. Entrance logic: campus.js. Artwork: campus-day.png and campus-night.png. Mobile visitors can pan the panorama.

## Arabic interface and interaction corrections

All runtime interface copy is now Arabic, while the title and original English monster dialogue stay intact. Physical keyboard codes preserve E/WASD/P controls under Arabic keyboard layouts. Shared elevator proximity is used for both keyboard interaction and the action prompt; closing the lock form also clears its focus so E can reopen it. Both Western and Arabic-Indic code digits are accepted.

All twelve NPC girls now leave their seats or pool positions and flee around furniture during the room chase. Seats that overlap furniture are moved to the nearest connected walkable point. Girls continuously select reachable destinations away from the monster and return to their original places when the game resets. The later six-player elevator sequence is unchanged.

`npm run check` includes elevator interaction, physical Arabic keyboard input, code digits, and 25-second continuous navigation simulations for every selectable character.

## Part two

After the six original friends escape outside, the ending offers an Arabic continue-to-part-two button. The main menu also has a direct entry for replay. Players choose one of the other seven girls (IDs 7–13). Short pixel scenes show the monster remembering them, sabotaging downward lift controls, returning to the club floor, and encountering the group. A brief playable chase leads to the right-hand elevator; E, touch action, or click-to-approach boards without a puzzle. All seven gather, the lift automatically ascends to floor 3, and hands off to the third-floor chapter. `part-two.js` renders this sequence; `part-two-state.js` owns its bounded transitions.

### Ground-floor camera correction
The continuation opens immediately on the monster in the actual ground-floor elevator lobby, with a clamped camera zoom and pan. The original elevator artwork is used; duplicate foreground elevator doors have been removed. The monster rises from ground level to the club floor before the seven-character selection. The playable lift interaction matches the existing right-hand doors.

## Third floor

The seven girls arrive by elevator. The guide stops the player with “Tie your shoes!” and the monster retreats before control returns. During the chase, the guide can stop the player for two seconds or make the monster blush and disappear for five. Follow the marked path into the second hall, then find the door between the display cases. The office door unlocks after a binary search puzzle and leads to the elevator to a second college.
