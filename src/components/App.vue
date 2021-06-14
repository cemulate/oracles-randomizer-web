<template>
<section id="root" class="section">
  <div class="container is-fluid">
    <div class="columns is-centered">
      <div class="column is-narrow">
        <div class="block" v-if="!bothRomsWrittenToFs">
          <p>Provide ROM(s) here:</p>
          <small>Oracles of Ages or Oracle of Seasons U.S. version</small>
        </div>
        <div class="block">
          <div id="drop-area"
            v-if="!bothRomsWrittenToFs"
            @drop.prevent="uploadRom('drop', $event)"
            @dragover.prevent="uploadHovering = true"
            @dragleave.prevent="uploadHovering = false"
            v-bind:class="{ 'hover': uploadHovering }">
            <span>Drop ROM here</span>
          </div>
        </div>
        <div class="block">
          <div class="file is-boxed is-fullwidth" v-if="!bothRomsWrittenToFs">
            <label class="file-label">
              <input class="file-input" type="file" name="resume" @change="uploadRom('file', $event)">
              <span class="file-cta">
                <span class="file-label" style="text-align: center">
                  Or choose a file ...
                </span>
              </span>
            </label>
          </div>
        </div>
        <div class="block" v-if="lastRomWasInvalid">
          <strong>Invalid ROM</strong> detected.
        </div>
        <div class="block" v-if="gamesAvailable.seasons">
          <img class="logo-img" v-bind:src="logos.seasons">
          <p><strong>✔ Oracle of Seasons Loaded</strong></p>
        </div>
        <div class="block" v-if="gamesAvailable.ages">
          <img class="logo-img" v-bind:src="logos.ages">
          <p><strong>✔ Oracle of Ages Loaded</strong></p>
        </div>
        <div class="block" v-if="runStatus == RunStatus.DONE">
          <strong><a class="button is-fullwidth is-success" download="oracles-randomizer.zip" v-bind:href="zipDownload">⬇ Download ZIP file</a></strong>
        </div>
      </div>
      <div class="column is-5">
        <div class="block">
          <div class="columns">
            <div class="column is-one-half">
              <div class="field">
                <label class="label">Randomizer Version</label>
                <div class="select is-fullwidth">
                  <select v-model="branch">
                    <option v-for="branchName in branchNames" v-bind:key="branchName" v-html="branchName"></option>
                  </select>
                </div>
              </div>
              <div class="columns">
                <div class="column is-narrow">
                  <em>Version: &nbsp;</em><span class="tag is-info" v-html="branchData[branch].tag"></span>
                </div>
                <div class="column"></div>
                <div class="column is-narrow">
                  <a target="_blank" v-bind:href="branchData[branch].url">Release Page</a>
                </div>
              </div>
              <label class="checkbox">
                <input type="checkbox" v-model="globalOpts.useSeed">
                Use custom seed <small>(8-digit hex)</small>
              </label>
              <div class="field">
                <div class="control">
                  <input class="input seed-input" type="text"
                    v-bind:disabled="!globalOpts.useSeed"
                    v-bind:class="{ 'is-danger': globalOpts.useSeed && !seedValid }"
                    v-model="globalOpts.seed"
                    pattern="[0-9a-f]{8}">
                </div>
              </div>
            </div>
            <div class="column is-one-half">
              <div class="field is-grouped">
                <div class="control is-expanded">
                  <label class="checkbox">
                    <input type="checkbox" v-model="multiWorld.enabled">
                    Multiworld
                  </label>
                </div>
                <div class="control">
                  <input type="number" class="input" v-model="multiWorld.count" min="1" max="99" 
                    v-bind:disabled="!multiWorld.enabled"
                    v-on:change="worldCountUpdated">
                </div>
              </div>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-bind:disabled="!multiWorld.enabled" v-model="multiWorld.useSameOptions">
                  Same game/options for all worlds 
                </label>
              </div>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="globalOpts.race">
                  Race mode
                </label>
              </div>
            </div>
          </div>
          <nav class="level" v-if="multiWorld.enabled && !multiWorld.useSameOptions">
            <div class="level-left">
              <button class="button" v-on:click="multiWorld.selectedWorld -= 1" v-bind:disabled="multiWorld.selectedWorld == 0">⬅</button>
            </div>
            <div class="level-item">
              <strong>Settings for world <span v-html="multiWorld.selectedWorld + 1"></span></strong>
            </div>
            <div class="level-right">
              <button class="button" v-on:click="multiWorld.selectedWorld += 1" v-bind:disabled="multiWorld.selectedWorld == multiWorld.count - 1">➡</button>
            </div>
          </nav>
          <div class="box">
            <div class="field">
              <div class="select">
                <select v-model="selectedRopts.game">
                  <option value="none">Select game ...</option>
                  <option v-for="name in gamesAvailableNames" v-bind:key="name" v-bind:value="name" v-html="gameName(name)"></option>
                </select>
              </div>
            </div>
            <div class="columns">
              <div class="column is-one-half">
                <div class="field">
                  <label class="checkbox">
                    <input type="checkbox" v-model="selectedRopts.treewarp" title="warp to ember tree by pressing start+B on map screen">
                    Tree Warp
                  </label>
                </div>
                <div class="field">
                  <label class="checkbox">
                    <input type="checkbox" v-model="selectedRopts.dungeons" title="shuffle dungeon entrances (disabled in entrance rando)">
                    Dungeon Shuffle
                  </label>
                </div>
                <div class="field">
                  <label class="checkbox">
                    <input type="checkbox" v-model="selectedRopts.portals"
                      v-bind:disabled="selectedRopts.game != 'seasons'"
                      title="shuffle subrosia portal connections (seasons)">
                    Portal Shuffle (Seasons)
                  </label>
                </div>
              </div>
              <div class="column is-one-half">
                <div class="field">
                  <label class="checkbox">
                    <input type="checkbox" v-model="selectedRopts.hard" title="enable more difficult logic">
                    Hard Logic
                  </label>
                </div>
                <div class="field">
                  <label class="checkbox">
                    <input type="checkbox" v-model="selectedRopts.keysanity"
                      v-bind:disabled="branch != 'keysanity'"
                      title="shuffle dungeon keys, maps, and compasses outside their dungeons">
                    Keysanity
                  </label>
                </div>
                <div class="field">
                  <label class="checkbox">
                    <input type="checkbox" v-model="selectedRopts.entrances"
                      v-bind:disabled="branch != 'entrance-rando'"
                      title="shuffle all entrances">
                    Random Entrances
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="columns">
            <div class="column">
              <button class="button is-fullwidth is-link is-large"
                v-bind:disabled="runDisabled"
                v-bind:class="{ 'is-loading': workerLoading || runStatus == RunStatus.RUNNING }"
                @click.prevent="runRandomizer">
                Randomize
              </button>
            </div>
          </div>
        </div>
        <div class="block is-fullwidth" v-if="runStatus != runStatus.READY">
          <strong v-if="workerRunStage != null" class="console-line" v-html="workerRunStage"></strong>
          <span
            class="console-line"
            v-for="(line, index) in consoleLines"
            v-bind:key="index"
            v-bind:class="{ 'red': line.type == 'stderr' }"
            v-html="line.content">
          </span>
        </div>
      </div>
    </div>
  </div>
</section>
</template>

<script>
import { initMainThreadFilesystem, writeFile, readFile, readRootDir, clearRootDir } from '../lib/fs.js';
import { detectGame, buildMultiworldArgv, createDownload } from '../lib/util.js';
import ageslogoImage from '../assets/ageslogo.png';
import seasonslogoImage from '../assets/seasonslogo.png';
import branchData from '../lib/branches.json';
import GoWorker from '../lib/go-worker.worker.js';
import JSZip from 'jszip';

export default {
    data: () => ({
        workerLoading: true,
        goWorker: null,
        uploadHovering: false,
        logos: {
            ages: ageslogoImage,
            seasons: seasonslogoImage,
        },
        globalOpts: {
            race: false,
            useSeed: false,
            seed: '',
        },
        worldRopts: [
            {
                game: 'none',
                treewarp: true,
                hard: false,
                dungeons: false,
                portals: false,
                keysanity: false,
                entrances: false,
            },
        ],
        multiWorld: {
            enabled: false,
            count: 1,
            useSameOptions: true,
            selectedWorld: 0,
        },
        branchData,
        branch: 'original',
        gamesAvailable: {
            seasons: false,
            ages: false,
        },
        lastRomWasInvalid: false,
        zipDownload: null,
        RunStatus: { READY: 0, RUNNING: 1, DONE: 2 },
        runStatus: 0,
        workerRunStage: null,
        consoleLines: [],
    }),
    async created() {
        this.goWorker = new GoWorker();
        this.goWorker.onmessage = this.handleGoWorkerMessage.bind(this);

        // Read and write "files" in memory on the main thread, and attach the web worker
        // so it has access to this filesystem as well.
        // We will use the root directory throughout, as the mocked cwd() method
        // in wasm_exec always reports '/' for the go program.
        await initMainThreadFilesystem(this.goWorker);

        this.goWorker.postMessage({ type: 'init' });

        // Write placeholders for both ROMs
        await Promise.all([writeFile('seasons.gbc', ''), writeFile('ages.gbc', '')]);
    },
    computed: {
        selectedRopts() {
            return this.worldRopts[this.multiWorld.selectedWorld];
        },
        bothRomsWrittenToFs() {
            return this.gamesAvailable.seasons && this.gamesAvailable.ages;
        },
        gamesAvailableNames() {
            return Object.keys(this.gamesAvailable).filter(k => this.gamesAvailable[k]);
        },
        branchNames() {
            return Object.keys(this.branchData);
        },
        seedValid() {
            return /[0-9a-f]{8}/.test(this.globalOpts.seed);
        },
        runDisabled() {
            return (this.workerLoading
            || this.runStatus != this.RunStatus.READY
            || this.worldRopts.some(({ game }) => (game == 'none' || !this.gamesAvailable[game]))
            || (this.globalOpts.useSeed && !this.seedValid));
        }
    },
    methods: {
        gameName(game) {
            if (game == 'seasons') return 'Oracle of Seasons';
            if (game == 'ages') return 'Oracle of Ages';
            return null;
        },
        async uploadRom(method, event) {
            this.lastRomWasInvalid = false;
            this.uploadHovering = false;
            let roms = method == 'drop' ? event.dataTransfer.files : event.target.files;
            for (let rom of roms) {
                let data = await rom.arrayBuffer();
                let detectedGame = detectGame(data);
                if (detectedGame == null) {
                    this.lastRomWasInvalid = true;
                } else {
                    await writeFile(detectedGame == 'seasons' ? 'seasons.gbc' : 'ages.gbc', data);
                    if (detectedGame == 'seasons') this.gamesAvailable.seasons = true;
                    if (detectedGame == 'ages') this.gamesAvailable.ages = true;
                }
            }
        },
        worldCountUpdated(event) {
            let defaultOptions = this.worldRopts[0];
            while (this.worldRopts.length < this.multiWorld.count) {
                this.worldRopts.push({ ...defaultOptions });
            }
        },
        runRandomizer() {
            this.runStatus = this.RunStatus.RUNNING;
            let argv;
            if (this.multiWorld.enabled) {
                argv = buildMultiworldArgv(this.globalOpts, this.worldRopts);
            } else {
                let ropts = this.worldRopts[0];
                argv = [''];
                if (ropts.treewarp) argv.push('-treewarp');
                if (ropts.dungeons) argv.push('-dungeons');
                if (ropts.portals && ropts.game == 'seasons') argv.push('-portals');
                if (ropts.hard) argv.push('-hard');
                if (ropts.keysanity) argv.push('-keysanity');
                if (ropts.entrances) argv.push('-entrances');
                if (this.globalOpts.useSeed) argv.push(`-seed=${ this.globalOpts.seed }`);
                if (this.globalOpts.race) argv.push('-race');
                argv.push(`/${ ropts.game }.gbc`);
            }
            this.goWorker.postMessage({ type: 'run', instance: this.branch, argv });
        },
        async handleGoWorkerMessage({ data }) {
            if (data.type == 'init' && data.done) {
                this.workerLoading = false;
            } else if (data.type == 'stdout') {
                this.consoleLines.push({ type: 'stdout', content: data.content });
            } else if (data.type == 'stderr') {
                this.consoleLines.push({ type: 'stderr', content: data.content });
            } else if (data.type == 'run' && 'stage' in data) {
                this.workerRunStage = data.stage;
            } else if (data.type == 'run' && data.done) {
                this.goWorkerFinished();
            }
        },
        async goWorkerFinished() {
            // We expect the randomized rom & log to be written to the filesystem
            let files = (await readRootDir()).filter(x => /^o(.+)(gbc|txt)$/.test(x));
            let zip = new JSZip();
            for (let f of files) {
                let data = await readFile(`/${ f }`);
                zip.file(f, data.buffer);
            }

            let zipData = await zip.generateAsync({ type: 'uint8array' });
            let blob = new Blob([zipData.buffer]);
            this.zipDownload = URL.createObjectURL(blob, { type: 'application/octet-stream' });

            this.runStatus = this.RunStatus.DONE;
        },
    },
    watch: {
        gamesAvailable: {
            handler: function (oldVal, newVal) {
            if (!this.multiWorld.enabled || this.multiWorld.useSameOptions) {
                if (newVal.seasons && !newVal.ages) this.worldRopts[0].game = 'seasons';
                if (newVal.ages && !newVal.seasons) this.worldRopts[0].game = 'ages';
                console.log('hey');
            }
            },
            deep: true,
        },
    },
};
</script>

<style lang="scss">
  #drop-area {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 400px;
    height: 150px;
    border: 2px dashed gray;
    border-radius: 10px;
    &.hover {
      background: lightgray;
    }
    span {
      font-size: 1.5rem;
      opacity: 0.7;
    }
  }

  .logo-img {
    width: 400px;
    height: 272px;
  }

  .console-line {
    display: block;
    font-family: monospace;
    width: 100%;
    margin: 0;
    padding: 0;
    font-size: 0.85rem;
    &.red {
      color: red;
    }
  }

  .seed-input {
    font-family: monospace;
  }
</style>
