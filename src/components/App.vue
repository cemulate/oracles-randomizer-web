<template>
<section id="root" class="section">
  <div class="container">
    <div class="columns is-centered">
      <div class="column is-narrow">
        <div class="block" v-if="!romWritten || detectedGame == 'invalid'">
          <p>Provide a US Oracle of Ages or Oracle of Seasons ROM:</p>
        </div>
        <div class="block">
          <div id="drop-area"
            v-if="!romWritten"
            @drop.prevent="uploadRom('drop', $event)"
            @dragover.prevent="uploadHovering = true"
            @dragleave.prevent="uploadHovering = false"
            v-bind:class="{ 'hover': uploadHovering }">
            <span>Drop ROM here</span>
          </div>
        </div>
        <div class="block">
          <div class="file is-boxed is-fullwidth" v-if="!romWritten">
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
        <div class="block" v-if="romWritten && detectedGame != null">
          <img id="logo-img" v-bind:src="logos[detectedGame]">
        </div>
        <div class="block" v-if="romWritten && detectedGame != null">
          <strong v-html="gameName"></strong> detected.
        </div>
        <div class="block" v-if="romWasInvalid">
          <strong>Invalid ROM</strong> detected.
        </div>
        <div class="block" v-if="runStatus == RunStatus.DONE">
          <strong>Randomizer Finished!</strong>
          <div class="content">
            <ul>
              <li v-if="romDownload != null"><a v-bind:download="romDownload.name" v-bind:href="romDownload.link">Download ROM</a></li>
              <li v-if="logDownload != null"><a v-bind:download="logDownload.name" v-bind:href="logDownload.link">Download Spoiler Log</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="column is-6">
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
                <input type="checkbox" v-model="ropts.useSeed">
                Use custom seed <small>(8-digit hex)</small>
              </label>
              <div class="field">
                <div class="control">
                  <input class="input seed-input" type="text"
                    v-bind:disabled="!ropts.useSeed"
                    v-bind:class="{ 'is-danger': ropts.useSeed && !seedValid }"
                    v-model="ropts.seed"
                    pattern="[0-9a-f]{8}">
                </div>
              </div>
            </div>
            <div class="column is-one-half">
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="ropts.treewarp" title="warp to ember tree by pressing start+B on map screen">
                  Tree Warp
                </label>
              </div>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="ropts.dungeons" title="shuffle dungeon entrances (disabled in entrance rando)">
                  Dungeon Shuffle
                </label>
              </div>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="ropts.portals"
                    v-bind:disabled="detectedGame == 'ages'"
                    title="shuffle subrosia portal connections (seasons)">
                  Portal Shuffle (Seasons)
                </label>
              </div>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="ropts.race">
                  Race
                </label>
              </div>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="ropts.hard" title="enable more difficult logic">
                  Hard Logic
                </label>
              </div>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="ropts.keysanity"
                    v-bind:disabled="branch != 'keysanity'"
                    title="shuffle dungeon keys, maps, and compasses outside their dungeons">
                  Keysanity
                </label>
              </div>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="ropts.entrances"
                    v-bind:disabled="branch != 'entrance-rando'"
                    title="shuffle all entrances">
                  Random Entrances
                </label>
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
        <div class="block is-fullwidth" v-if="romWritten">
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
import { detectGame } from '../lib/util.js';
import ageslogoImage from '../assets/ageslogo.png';
import seasonslogoImage from '../assets/seasonslogo.png';
import branchData from '../lib/branches.json';
import GoWorker from '../lib/go-worker.worker.js';

export default {
    data: () => ({
        workerLoading: true,
        goWorker: null,
        uploadHovering: false,
        logos: {
          ages: ageslogoImage,
          seasons: seasonslogoImage,
        },
        ropts: {
            useSeed: false,
            seed: '',
            race: false,
            hard: false,
            treewarp: true,
            dungeons: false,
            portals: false,
            keysanity: false,
        },
        branchData,
        branch: 'original',
        romWritten: false,
        romWasInvalid: false,
        detectedGame: null,
        romDownload: null,
        logDownload: null,
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
    },
    computed: {
      gameName() {
        if (this.detectedGame == null) return 'Invalid ROM';
        return this.detectedGame == 'ages' ? 'Oracle of Ages' : 'Oracle of Seasons';
      },
      displayedImage() {
        if (this.detectedGame == null) return '';
        return this.detectedGame == 'ages' ? this.logos.ages : this.logos.seasons;
      },
      branchNames() {
        return Object.keys(this.branchData);
      },
      seedValid() {
        return /[0-9a-f]{8}/.test(this.ropts.seed);
      },
      runDisabled() {
        return (this.workerLoading
          || this.runStatus != this.RunStatus.READY
          || !this.romWritten
          || this.detectedGame == 'invalid'
          || (this.ropts.useSeed && !this.seedValid));
      }
    },
    methods: {
        async uploadRom(method, event) {
            this.romWasInvalid = false;
            this.romWritten = false;
            this.uploadHovering = false;
            let rom = method == 'drop' ? event.dataTransfer.files[0] : event.target.files[0];
            let data = await rom.arrayBuffer();
            this.detectedGame = detectGame(data);
            if (this.detectedGame == null) {
              this.romWasInvalid = true;
            } else {
              await writeFile('/rom.gbc', data);
              this.romWritten = true;
            }
        },
        runRandomizer() {
            this.runStatus = this.RunStatus.RUNNING;
            let argv = [''];
            if (this.ropts.treewarp) argv.push('-treewarp');
            if (this.ropts.dungeons) argv.push('-dungeons');
            if (this.ropts.portals && this.detectedGame == 'seasons') argv.push('-portals');
            if (this.ropts.hard) argv.push('-hard');
            if (this.ropts.keysanity) argv.push('-keysanity');
            if (this.ropts.entrances) argv.push('-entrances');
            if (this.ropts.useSeed) argv.push(`-seed=${ this.ropts.seed }`);
            if (this.ropts.race) argv.push('-race');
            argv.push('/rom.gbc');
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
            let files = await readRootDir();

            let romName = files.find(x => x.startsWith('oo') && x.endsWith('gbc'));
            let rom = await readFile(`/${ romName }`);
            let romBlob = new Blob([rom.buffer]);
            this.romDownload = { link: URL.createObjectURL(romBlob, { type: 'application/octet-stream' }), name: romName };
            
            if (!this.ropts.race) {
              let logName = files.find(x => x.startsWith('oo') && x.endsWith('txt'));
              let log = await readFile(`/${ logName }`);
              let logBlob = new Blob([log.buffer]);
              this.logDownload = { link: URL.createObjectURL(logBlob, { type: 'text/plain' }), name: logName };
            } else {
              this.logDownload = null;
            }

            this.runStatus = this.RunStatus.DONE;
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
    height: 272px;
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

  #logo-image {
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
