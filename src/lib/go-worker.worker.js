// self.importScripts('wasm_exec.js');
import * as BrowserFS from 'browserfs';
import { initWorkerThreadFilesystem } from './fs.js';
import branches from './branches.json';
self.importScripts('wasm_exec.js');

self.onmessage = async ({ data }) => {
    if (data.type == 'init') {
        initWorkerThreadFilesystem();

        self.goStdoutCallback = (s) => self.postMessage({ type: 'stdout', content: s });
        self.goStderrCallback = (s) => self.postMessage({ type: 'stderr', content: s });
        self.initializeGo(BrowserFS);

        self.goRunner = new self.Go();
        
        self.wasmInstances = {};

        await Promise.all(Object.keys(branches).map(async (k) => {
            let result = await WebAssembly.instantiateStreaming(fetch(`wasm/${ k }.wasm`), self.goRunner.importObject);
            self.wasmInstances[k] = result.instance;
        }));

        self.postMessage({ type: 'init', done: true });
    } else if (data.type == 'run') {
        self.goRunner.argv = data.argv;
        let instance = self.wasmInstances[data.instance];
        try {
            await self.goRunner.run(instance);
        } catch (e) {
            console.error(e);
        }
        
        self.postMessage({ type: 'run', done: true });
    }
};
