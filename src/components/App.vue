<template>
<section id="root" class="section">
  <div class="container">
    <div class="columns is-centered">
      <div class="column is-narrow">
        <div class="block">
          <div id="drop-area"
            v-if="!inputRomWritten"
            @drop.prevent="uploadRom('drop', $event)"
            @dragover.prevent="uploadHovering = true"
            @dragleave.prevent="uploadHovering = false"
            v-bind:class="{ 'hover': uploadHovering }">
            <span>Drop ROM here</span>
          </div>
        </div>
        <div class="block">
          <div class="file is-boxed is-fullwidth" v-if="!inputRomWritten">
            <label class="file-label">
              <input class="file-input" type="file" name="resume" @change="uploadRom('file', $event)">
              <span class="file-cta">
                <span class="file-icon">
                  <i class="fas fa-upload"></i>
                </span>
                <span class="file-label" style="text-align: center">
                  Or choose a file ...
                </span>
              </span>
            </label>
          </div>
        </div>
        <div class="block" v-if="inputRomWritten">
          <img v-bind:src="inputRomDetectedGame == 'ages' ? logos.ages : logos.seasons">
        </div>
        <div class="block" v-if="inputRomWritten">
          <strong v-html="gameName"></strong> detected.
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
                  <select>
                    <option v-for="branch in randomizerBranches" v-bind:key="branch" v-html="branch"></option>
                  </select>
                </div>
              </div>
              <label class="checkbox">
                <input type="checkbox" v-model="randomizerOptions.useSeed">
                Use custom seed
              </label>
              <div class="field">
                <div class="control">
                  <input class="input" type="text" v-bind:disabled="!randomizerOptions.useSeed" v-model="randomizerOptions.seed">
                </div>
              </div>
            </div>
            <div class="column is-one-half">
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="randomizerOptions.treewarp" title="warp to ember tree by pressing start+B on map screen">
                  Tree Warp
                </label>
              </div>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="randomizerOptions.dungeons" title="shuffle dungeon entrances">
                  Dungeon Shuffle
                </label>
              </div>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="randomizerOptions.portals"
                    v-bind:disabled="inputRomDetectedGame == 'ages'"
                    title="shuffle subrosia portal connections (seasons)">
                  Portal Shuffle (Seasons)
                </label>
              </div>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="randomizerOptions.race">
                  Race
                </label>
              </div>
              <div class="field">
                <label class="checkbox">
                  <input type="checkbox" v-model="randomizerOptions.hard" title="enable more difficult logic">
                  Hard Logic
                </label>
              </div>
            </div>
          </div>
          <form class="form">
            
            
            <div class="field">
              <div class="control">
                <button class="button is-fullwidth is-link is-large"
                  v-bind:disabled="runStatus == RunStatus.DONE || workerLoading"
                  v-bind:class="{ 'is-loading': runStatus == RunStatus.RUNNING }"
                  @click.prevent="runRandomizer">
                  Randomize
                </button>
              </div>
            </div>
          </form>
        </div>
        <div class="block is-fullwidth" v-if="inputRomWritten">
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

    <!-- <p><span v-html="loading ? 'loading ...' : 'done!'"></span>, <span v-html="inputRomWritten ? 'ROM Ready!' : 'no ROM ...'"></span></p>
    <p>Choose file: <input type="file" @change="uploadRom($event)"></p>
    <p><input class="button" type="button" @click="runRandomizer" v-bind:value="runStatus == RunStatus.RUNNING ? 'Running ...' : 'Randomize'" /></p>
    <p><a v-bind:download="romDownload.name" v-if="runStatus == RunStatus.DONE" v-bind:href="romDownload.link">Download ROM</a></p>
    <p><a v-bind:download="logDownload.name" v-if="runStatus == RunStatus.DONE" v-bind:href="logDownload.link">Download Log</a></p>
    <textarea cols="80" rows="20" readonly v-bind:value="runStdout"></textarea>
    <textarea cols="80" rows="20" readonly v-bind:value="runStderr"></textarea> -->
</section>
</template>

<script>
import { initMainThreadFilesystem, writeFile, readFile, readRootDir, clearRootDir } from '../lib/fs.js';
import { detectGame, buildArgvFlags } from '../lib/util.js';
import ageslogoImage from '../assets/ageslogo.png';
import seasonslogoImage from '../assets/seasonslogo.png';
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
        randomizerOptions: {
            useSeed: false,
            seed: '',
            race: false,
            hard: false,
            treewarp: true,
            dungeons: true,
            portals: false,
        },
        randomizerBranches: ['master', 'keysanity', 'entrance-rando'],
        randomizerBranch: 'master',
        inputRomWritten: false,
        inputRomDetectedGame: null,
        romDownload: null,
        logDownload: null,
        RunStatus: { READY: 0, RUNNING: 1, DONE: 2 },
        runStatus: 0,
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
        if (this.inputRomDetectedGame == null) return 'Invalid ROM';
        return this.inputRomDetectedGame == 'ages' ? 'Oracle of Ages' : 'Oracle of Seasons';
      },
      displayedImage() {
        if (this.inputRomDetectedGame == 'unknown') return '';
        return this.inputRomDetectedGame == 'ages' ? this.logos.ages : this.logos.seasons;
      },
    },
    methods: {
        async uploadRom(method, event) {
            this.inputRomWritten = false;
            this.uploadHovering = false;
            let rom = method == 'drop' ? event.dataTransfer.files[0] : event.target.files[0];
            let data = await rom.arrayBuffer();
            this.inputRomDetectedGame = detectGame(data);
            await writeFile('/rom.gbc', data);
            this.inputRomWritten = true;
        },
        runRandomizer() {
            this.runStatus = this.RunStatus.RUNNING;
            let flags = buildArgvFlags(this.inputRomDetectedGame, this.randomizerOptions);
            console.log(['', ...flags, '/rom.gbc']);
            this.goWorker.postMessage({ type: 'run', instance: this.randomizerBranch, argv: ['', ...flags, '/rom.gbc'] });
        },
        async handleGoWorkerMessage({ data }) {
            if (data.type == 'init' && data.done) {
                this.workerLoading = false;
            } else if (data.type == 'stdout') {
                this.consoleLines.push({ type: 'stdout', content: data.content });
            } else if (data.type == 'stderr') {
                this.consoleLines.push({ type: 'stderr', content: data.content });
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
            
            if (!this.randomizerOptions.race) {
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
</style>
