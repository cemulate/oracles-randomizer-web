import * as BrowserFS from 'browserfs';

// Mainly promisify & simplify a small set of functionality from browserfs.

const BFSfs = BrowserFS.BFSRequire('fs');
const BFSBuffer = BrowserFS.BFSRequire('buffer').Buffer;

export function initMainThreadFilesystem(webWorker) {
    return new Promise((resolve, reject) => {
        BrowserFS.configure({ fs: 'InMemory' }, (e) => {
            if (e != null) reject(e);
            BrowserFS.FileSystem.WorkerFS.attachRemoteListener(webWorker);
            resolve();
        });
    });
};

export function initWorkerThreadFilesystem() {
    return new Promise((resolve, reject) => {
        BrowserFS.configure({ fs: "WorkerFS", options: { worker: self }}, (e) => {
            return (e != null) ? reject(e) : resolve();
        });
    });
};

export function writeFile(name, content) {
    return new Promise((resolve, reject) => {
        BFSfs.writeFile(name, BFSBuffer.from(content), (e) => {
            return (e != null) ? reject(e) : resolve();
        });
    });
};

export function readFile(name) {
    return new Promise((resolve, reject) => {
        BFSfs.readFile(name, (e, content) => {
            return (e != null) ? reject(e) : resolve(content);
        });
    });
};

export function readRootDir() {
    return new Promise((resolve, reject) => {
        BFSfs.readdir('/', (e, contents) => {
            return (e != null) ? reject(e) : resolve(contents);
        });
    });
};

export function clearRootDir() {
    return new Promise(async (resolve, reject) => {
        try {
            let files = await readRootDir();
            await Promise.all(files.map(f => {
                return new Promise((resolve, reject) => {
                    BFSfs.rm(`/${ f }`, (e) => {
                        return (e != null) ? reject(e) : resolve();
                    });
                });
            }));
        } catch (e) {
            reject(e);
        }
    });
};

