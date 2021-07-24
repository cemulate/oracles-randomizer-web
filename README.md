# Web Oracles Randomizer

**Link**: [https://cemulate.github.io/oracles-randomizer-web](https://cemulate.github.io/oracles-randomizer-web)

This is a web interface for running the [oracles-randomizer](https://github.com/jangler/oracles-randomizer) program by [jangler](https://github.com/jangler).
If you are looking for documentation for the main features of the randomizer itself, plase read the [documentation in that repository](https://github.com/jangler/oracles-randomizer#readme).

## How to use the web interface

* Use the ROM upload area/button to upload a U.S. Oracle of Ages or Oracle of Seasons ROM (or both, in the case that you are doing a multiworld randomization).
Logos will be displayed for each game uploaded.
* Select the randomizer version.
There are two forks of jangler's original randomizer that support additional features:
    * The **original** randomizer is jangler's original randomizer mentioned above.
    * The **keysanity** version is a fork by [Drenn1](https://github.com/Drenn1), that supports shuffling keys, maps, and compasses are shuffled outside their dungeons. 
    When using this version of the randomizer, you still must **check the keysanity option** when randomizing to enable it.
    * The **entrance-rando** version is a fork by [vinheim3](https://github.com/vinheim3) that supports shuffling all entrances in teh game. 
    When using this version of the randomizer, you must still **check the Random Entrances option** when randomizing to enable it.
    * Please note that the randomizers are not necessarily up to date with one another, and that the original version is the most stable.
* If randomizing a single game/ROM, you may simply check the appropriate options and click "Randmoize".
The results, a ZIP file including the ROM and the spoiler log, will appear on the left (top of the page on mobile).
* For multiworld seeds (only available on the original randomizer), enable the **Multiworld** option and select the number of ROMs to randomize.
The randomization settings in the box below will be applied to all world(s) by default.
If you uncheck **Same game/options for all worlds**, you will be able to select a different game (Ages or Seasons) and options for **each** world/ROM that you are randomizing.
The results in this case will be a ZIP file contiaining _all_ the randomized ROMs and the spoiler log.
* **Race Mode** prevents the generation of spoiler logs and the printing of the random seed in the game's title screen.
* **Custom Seed** allows the use of a determined random seed.
ROMs generated with the same option and the same seed will be identical.
* Hover over other check-boxes to see brief descriptions of other options.

## Warning:

The randomizer program(s) themselves are actually written in Go.
This web interface works by running a WebAssembly build of the actual randomizer(s) entirely client-side in your browser.
This means
* A **slow network connection** may be prohibitive to run this app, as binaries of the randomizers have to be downloaded over the network
* Running the app on a **mobile device** could be slow, as the it uses the processing power of the device itself entirely in the browser (no server is involved).

## Technical details 

This idea was made possible by this extremely detailed [blog post](https://github.com/wcchoi/go-wasm-pdfcpu/blob/master/article.md) from wcchoi about running Go command line utilities in the browser through WebAssembly.
Some significant modification to the basic WASM execution script is required to incorporate [BrowserFS](https://github.com/jvilk/BrowserFS) in completely mocking a filesystem so that the WASM binary is convinced it's reading and writing files to disk.
The final product, [src/wasm_exec.js](src/wasm_exec.js), was based mostly on wcchoi's ideas with some additional modifications. 
Finally, the source of each randomizer had to be cosmetically modified to remove the rich terminal UI, as this features utilizes several specialized syscalls that are not implemented in JavaScript (this is why the results include the string "webpatch" with the commit hash identifying the version used to produce the rom).