<template>
<div id="root" class="container is-fluid">
  <div class="section">
    <div class="columns is-centered">
      <div class="column is-4-tablet is-4-desktop is-3-widescreen is-3-fullhd">
        <div class="block" v-if="showInstructions">
          <div class="message is-warning">
            <div class="message-header">
              <p>Instructions</p>
              <button class="delete" v-on:click="dismissInstructions"></button>
            </div>
            <div class="message-body">
              If you are new to the randomizer or to the web interface, please
              <a target="_blank" href="https://github.com/cemulate/oracles-randomizer-web#web-oracles-randomizer">read the instructions</a>.
            </div>
          </div>
        </div>
        <div class="block">
          <file-drop class="is-fullwidth" text="Drop/Select ROMs ..." v-on:received-files="gotRoms"></file-drop>
        </div>
        <div class="block" v-if="lastRomWasInvalid">
          <strong>Invalid ROM.</strong>
        </div>
        <div class="block">
          <div class="columns is-mobile is-multiline is-centered">
            <div class="column is-half-mobile is-full-tablet"
              v-if="gamesAvailable.seasons"
              v-bind:class="{ 'is-half-desktop': bothRomsWrittenToFs, 'is-full-desktop': !bothRomsWrittenToFs }">
              <figure class="image is-3by2">
                <img v-bind:src="logos.seasons">
              </figure>
            </div>
            <div class="column is-half-mobile is-full-tablet"
              v-if="gamesAvailable.ages"
              v-bind:class="{ 'is-half-desktop': bothRomsWrittenToFs, 'is-full-desktop': !bothRomsWrittenToFs }">
              <figure class="image is-3by2">
                <img v-bind:src="logos.ages">
              </figure>
            </div>
          </div>
        </div>
        <div class="block" v-if="runStatus == RunStatus.DONE">
          <strong><a class="button is-fullwidth is-success" download="oracles-randomizer.zip" v-bind:href="zipDownload">⬇ Download Results</a></strong>
        </div>
      </div>
      <div class="column is-half-widescreen">
        <div class="block">
          <div class="columns">
            <div class="column is-one-half">
              <div class="field">
                <label class="label">Randomizer Version</label>
                <div class="select is-fullwidth">
                  <select v-model="branch">
                    <option v-for="branchName in branchNames" v-bind:key="branchName">{{ branchName }}</option>
                  </select>
                </div>
              </div>
              <nav class="level is-mobile">
                <div class="level-left">
                  <div class="level-item">
                    <span class="tag is-info">{{ '▶' }} &nbsp; {{ branchData[branch].tag }}</span>
                  </div>
                </div>
                <div class="level-right">
                  <div class="level-right">
                    <a target="_blank" v-bind:href="branchData[branch].url">↗ Release Page</a>
                  </div>
                </div>
              </nav>
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
                    <input type="checkbox" v-model="multiWorld.enabled" v-bind:disabled="branch != 'original'"
                      title="Generate a multi-world seed (see randomizer docs); only supported on the original branch">
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
                  <input type="checkbox" v-bind:disabled="!multiWorld.enabled" v-model="multiWorld.useSameOptions"
                    title="Use the same game and options for all worlds in the seed, or set each individually">
                  Same game/options for all worlds
                </label>
              </div>
              <hr>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="globalOpts.race"
                    title="Don't generate spoiler logs or print full seed in file select screen or filename">
                  Race mode
                </label>
              </div>
            </div>
          </div>
          <nav class="level" style="margin-bottom: 0" v-if="multiWorld.enabled && !multiWorld.useSameOptions">
            <div class="level-left">
              <button class="button is-white" v-on:click="multiWorld.selectedWorld -= 1" v-bind:disabled="multiWorld.selectedWorld == 0">🡄</button>
            </div>
            <div class="level-item">
              <strong>Settings for world <span v-html="multiWorld.selectedWorld + 1"></span></strong>
            </div>
            <div class="level-right">
              <button class="button is-white" v-on:click="multiWorld.selectedWorld += 1" v-bind:disabled="multiWorld.selectedWorld == multiWorld.count - 1">🡆</button>
            </div>
          </nav>
          <div class="box">
            <div class="tabs" v-if="gamesAvailable.seasons || gamesAvailable.ages">
              <ul>
                <li v-bind:class="{ 'is-active': selectedRopts.game == 'seasons' }" v-if="gamesAvailable.seasons">
                  <a v-on:click="updateGame(selectedRopts, 'seasons')">Oracle of Seasons</a>
                </li>
                <li v-bind:class="{ 'is-active': selectedRopts.game == 'ages' }" v-if="gamesAvailable.ages">
                  <a v-on:click="updateGame(selectedRopts, 'ages')">Oracle of Ages</a>
                </li>
              </ul>
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
          <div class="field is-grouped">
            <p class="control is-expanded">
              <button class="button is-fullwidth is-link is-large"
                v-bind:disabled="runDisabled"
                v-bind:class="{ 'is-loading': workerLoading || runStatus == RunStatus.RUNNING }"
                @click.prevent="runRandomizer">
                {{ runStatus == RunStatus.DONE ? 'Finished!' : 'Randomize' }}
              </button>
            </p>
            <p class="control" v-if="runStatus == RunStatus.DONE">
              <button class="button is-large is-success" v-on:click="reset">
                ⭯ Reset
              </button>
            </p>
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
</div>
</template>

<script>
import { initMainThreadFilesystem, writeFile, readFile, readRootDir, removeFilesExcept } from '../lib/fs.js';
import { detectGame, buildMultiworldArgv, buildNormalArgv } from '../lib/util.js';
import ageslogoImage from '../assets/ageslogo.png';
import seasonslogoImage from '../assets/seasonslogo.png';
import branchData from '../lib/branches.json';
import GoWorker from '../lib/go-worker.worker.js';
import JSZip from 'jszip';

import FileDrop from './FileDrop.vue';

export default {
    data: () => ({
        showInstructions: !window.localStorage.getItem('noInstructions'),
        workerLoading: true,
        goWorker: null,
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
            let index = this.multiWorld.enabled ? this.multiWorld.selectedWorld : 0;
            return this.worldRopts[index];
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
        },
    },
    methods: {
        dismissInstructions() {
            window.localStorage.setItem('noInstructions', true);
            this.showInstructions = false;
        },
        gameName(game) {
            if (game == 'seasons') return 'Oracle of Seasons';
            if (game == 'ages') return 'Oracle of Ages';
            return null;
        },
        async gotRoms(roms) {
            this.lastRomWasInvalid = false;
            let found = { seasons: false, ages: false };
            for (let rom of roms) {
                let data = await rom.arrayBuffer();
                let detectedGame = detectGame(data);
                if (detectedGame == null) {
                    this.lastRomWasInvalid = true;
                } else {
                    await writeFile(detectedGame == 'seasons' ? 'seasons.gbc' : 'ages.gbc', data);
                    if (detectedGame == 'seasons') found.seasons = true;
                    if (detectedGame == 'ages') found.ages = true;
                }
            }
            for (let k of ['seasons', 'ages']) {
                if (found[k]) this.gamesAvailable[k] = true;
            }
        },
        worldCountUpdated(event) {
            let defaultOptions = this.worldRopts[0];
            while (this.worldRopts.length < this.multiWorld.count) {
                this.worldRopts.push({ ...defaultOptions });
            }
        },
        updateGame(ropts, game) {
            // Just to check/disable portals if the game is changed to ages
            ropts.game = game;
            if (game == 'ages') ropts.portals = false;
        },
        runRandomizer() {
            this.runStatus = this.RunStatus.RUNNING;
            let argv = this.multiWorld.enabled
                ? buildMultiworldArgv(this.globalOpts, this.worldRopts)
                : buildNormalArgv(this.globalOpts, this.worldRopts[0]);
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
        async reset() {
            console.log('hey');
            await removeFilesExcept(/^(seasons\.gbc|ages\.gbc)$/);
            this.zipDownload = null;
            this.runStatus = this.RunStatus.READY;
            this.workerRunStage = null;
            this.consoleLines = [];
        }
    },
    watch: {
        gamesAvailable: {
            handler: function (newVal) {
                if (!this.multiWorld.enabled || this.multiWorld.useSameOptions) {
                    if (newVal.seasons && !newVal.ages) this.worldRopts[0].game = 'seasons';
                    if (newVal.ages && !newVal.seasons) this.worldRopts[0].game = 'ages';
                }
            },
            deep: true,
        },
        branch: function(newVal) {
            if (newVal != 'original') this.multiWorld.enabled = false;
            for (let ropts of this.worldRopts) {
                if (newVal != 'keysanity') ropts.keysanity = false;
                if (newVal != 'entrance-rando') ropts.entrances = false;
            }
        },
    },
    components: {
        'file-drop': FileDrop,
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
    width: 200px;
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
