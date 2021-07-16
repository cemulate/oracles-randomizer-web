# Web Oracles Randomizer

Use it here: [https://cemulate.github.io/oracles-randomizer-web](https://cemulate.github.io/oracles-randomizer-web)

This is a web front-end for [jangler/oracles-randomizer](https://github.com/jangler/oracles-randomizer) and its relevant forks.
Documentation for the randomizer itself can be found [there](https://github.com/jangler/oracles-randomizer#readme).
There are two widely used forks of the randomizer that support additional features; namely, the [keysanity fork](https://github.com/Drenn1/oracles-randomizer) by Drenn1 and the [entrance randomizer fork](https://github.com/vinheim3/oracles-randomizer) by vinheim3.
Each selectable version contains a link to the relevant release/build of that randomizer. 

The randomizer(s) themselves are actually written in Go.
This web interface works by running a WebAssembly build of the actual randomizer(s) entirely client-side in your browser.

## More details 

This idea was made possible by this extremely detailed [blog post](https://github.com/wcchoi/go-wasm-pdfcpu/blob/master/article.md) from wcchoi about running Go command line utilities in the browser through WebAssembly.
Some significant modification to the basic WASM execution script is required to incorporate [BrowserFS](https://github.com/jvilk/BrowserFS) in completely mocking a filesystem so that the WASM binary is convinced it's reading and writing files to disk.
The final product, [src/wasm_exec.js](src/wasm_exec.js), was based mostly on wcchoi's ideas with some additional modifications. 
Finally, the source of each randomizer had to be cosmetically modified to remove the rich terminal UI, as this features utilizes several specialized syscalls that are not implemented in JavaScript (this is why the results include the string "webpatch" with the commit hash identifying the version used to produce the rom).