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
        
        self.wasmModules = {};
        self.wasmInstances = {};

        self.postMessage({ type: 'init', done: true });
    } else if (data.type == 'run') {
        if (!(data.instance in self.wasmInstances)) {
            self.postMessage({ type: 'run', stage: `Fetching ${ data.instance } randomizer ...` });
            let result = await WebAssembly.instantiateStreaming(fetch(`wasm/${ data.instance }.wasm`), self.goRunner.importObject);
            self.wasmModules[data.instance] = result.module;
            self.wasmInstances[data.instance] = result.instance;
        }

        self.postMessage({ type: 'run', stage: 'Running randomizer ...' });
        self.goRunner.argv = data.argv;
        let instance = self.wasmInstances[data.instance];
        try {
            await self.goRunner.run(instance);
        } catch (e) {
            console.error(e);
        }

        self.goRunner = new self.Go();
        self.wasmInstances[data.instance] = await WebAssembly.instantiate(self.wasmModules[data.instance], self.goRunner.importObject);
        
        self.postMessage({ type: 'run', done: true });
    }
};
