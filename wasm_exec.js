initializeGo=e=>{if("undefined"!=typeof global);else if("undefined"!=typeof window)window.global=window;else{if("undefined"==typeof self)throw new Error("cannot export Go (neither global, window nor self is defined)");self.global=self}if(global.require||"undefined"==typeof require||(global.require=require),!global.fs&&global.require){const e=require("fs");"object"==typeof e&&null!==e&&0!==Object.keys(e).length&&(global.fs=e)}const t=()=>{const e=new Error("not implemented");return e.code="ENOSYS",e};if(!global.fs){global.Buffer=e.BFSRequire("buffer").Buffer,global.fs=e.BFSRequire("fs"),global.fs.constants={O_RDONLY:0,O_WRONLY:1,O_RDWR:2,O_CREAT:64,O_EXCL:128,O_NOCTTY:256,O_TRUNC:512,O_APPEND:1024,O_DIRECTORY:65536,O_NOATIME:262144,O_NOFOLLOW:131072,O_SYNC:1052672,O_DIRECT:16384,O_NONBLOCK:2048};let t="";global.fs.writeSyncOriginal=global.fs.writeSync,global.fs.writeSync=function(e,s){if(1===e||2===e){t+=i.decode(s);const o=t.lastIndexOf("\n");if(-1!=o){let s;s=null!=global.goStdoutCallback&&1==e?global.goStdoutCallback:null!=global.goStderrCallback&&2==e?global.goStderrCallback:1==e?console.log:console.error,s(t.substr(0,o)),t=t.substr(o+1)}return s.length}return global.fs.writeSyncOriginal(...arguments)},global.fs.writeOriginal=global.fs.write,global.fs.write=function(e,t,s,i,o,l){if(1!==e&&2!==e)return arguments[1]=global.Buffer.from(arguments[1]),global.fs.writeOriginal(...arguments);if(0!==s||i!==t.length||null!==o)throw new Error("not implemented");l(null,this.writeSync(e,t),t)},global.fs.openOriginal=global.fs.open,global.fs.open=function(e,t,s,i){var o="r",l=global.fs.constants;if(t&l.O_WRONLY)o="w",t&l.O_EXCL&&(o="wx");else if(t&l.O_RDWR)o=t&l.O_CREAT&&t&l.O_TRUNC?t&l.O_EXCL?"wx+":"w+":"r+";else if(t&l.O_APPEND)throw"Not implmented";return global.fs.openOriginal(e,o,s,i)},global.fs.fstatOriginal=global.fs.fstat,global.fs.fstat=function(e,t){return global.fs.fstatOriginal(e,(function(){var e=arguments[1];return delete e.fileData,e.atimeMs=e.atime.getTime(),e.mtimeMs=e.mtime.getTime(),e.ctimeMs=e.ctime.getTime(),e.birthtimeMs=e.birthtime.getTime(),t(arguments[0],e)}))},global.fs.closeOriginal=global.fs.close,global.fs.close=function(e,t){return global.fs.closeOriginal(e,(()=>t(null,...Array.from(arguments).slice(1))))}}if(global.process||(global.process={getuid:()=>-1,getgid:()=>-1,geteuid:()=>-1,getegid:()=>-1,getgroups(){throw t()},pid:-1,ppid:-1,umask(){throw t()},cwd:()=>"/",chdir(){throw t()}}),!global.crypto&&global.require){const e=require("crypto");global.crypto={getRandomValues(t){e.randomFillSync(t)}}}if(!global.crypto)throw new Error("global.crypto is not available, polyfill required (getRandomValues only)");if(global.performance||(global.performance={now(){const[e,t]=process.hrtime();return 1e3*e+t/1e6}}),!global.TextEncoder&&global.require&&(global.TextEncoder=require("util").TextEncoder),!global.TextEncoder)throw new Error("global.TextEncoder is not available, polyfill required");if(!global.TextDecoder&&global.require&&(global.TextDecoder=require("util").TextDecoder),!global.TextDecoder)throw new Error("global.TextDecoder is not available, polyfill required");const s=new TextEncoder("utf-8"),i=new TextDecoder("utf-8");if(global.Go=class{constructor(){this.argv=["js"],this.env={},this.exit=e=>{0!==e&&console.warn("exit code:",e)},this._exitPromise=new Promise((e=>{this._resolveExitPromise=e})),this._pendingEvent=null,this._scheduledTimeouts=new Map,this._nextCallbackTimeoutID=1;const e=(e,t)=>{this.mem.setUint32(e+0,t,!0),this.mem.setUint32(e+4,Math.floor(t/4294967296),!0)},t=e=>this.mem.getUint32(e+0,!0)+4294967296*this.mem.getInt32(e+4,!0),o=e=>{const t=this.mem.getFloat64(e,!0);if(0===t)return;if(!isNaN(t))return t;const s=this.mem.getUint32(e,!0);return this._values[s]},l=(e,t)=>{const s=2146959360;if("number"==typeof t&&0!==t)return isNaN(t)?(this.mem.setUint32(e+4,s,!0),void this.mem.setUint32(e,0,!0)):void this.mem.setFloat64(e,t,!0);if(void 0===t)return void this.mem.setFloat64(e,0,!0);let i=this._ids.get(t);void 0===i&&(i=this._idPool.pop(),void 0===i&&(i=this._values.length),this._values[i]=t,this._goRefCounts[i]=0,this._ids.set(t,i)),this._goRefCounts[i]++;let o=0;switch(typeof t){case"object":null!==t&&(o=1);break;case"string":o=2;break;case"symbol":o=3;break;case"function":o=4}this.mem.setUint32(e+4,s|o,!0),this.mem.setUint32(e,i,!0)},n=e=>{const s=t(e+0),i=t(e+8);return new Uint8Array(this._inst.exports.mem.buffer,s,i)},r=e=>{const s=t(e+0),i=t(e+8),l=new Array(i);for(let e=0;e<i;e++)l[e]=o(s+8*e);return l},a=e=>{const s=t(e+0),o=t(e+8);return i.decode(new DataView(this._inst.exports.mem.buffer,s,o))},c=Date.now()-performance.now();this.importObject={go:{"runtime.wasmExit":e=>{e>>>=0;const t=this.mem.getInt32(e+8,!0);this.exited=!0,delete this._inst,delete this._values,delete this._goRefCounts,delete this._ids,delete this._idPool,this.exit(t)},"runtime.wasmWrite":e=>{const s=t(8+(e>>>=0)),i=t(e+16),o=this.mem.getInt32(e+24,!0);fs.writeSync(s,new Uint8Array(this._inst.exports.mem.buffer,i,o))},"runtime.resetMemoryDataView":e=>{this.mem=new DataView(this._inst.exports.mem.buffer)},"runtime.nanotime1":t=>{e(8+(t>>>=0),1e6*(c+performance.now()))},"runtime.walltime":t=>{t>>>=0;const s=(new Date).getTime();e(t+8,s/1e3),this.mem.setInt32(t+16,s%1e3*1e6,!0)},"runtime.scheduleTimeoutEvent":e=>{e>>>=0;const s=this._nextCallbackTimeoutID;this._nextCallbackTimeoutID++,this._scheduledTimeouts.set(s,setTimeout((()=>{for(this._resume();this._scheduledTimeouts.has(s);)console.warn("scheduleTimeoutEvent: missed timeout event"),this._resume()}),t(e+8)+1)),this.mem.setInt32(e+16,s,!0)},"runtime.clearTimeoutEvent":e=>{e>>>=0;const t=this.mem.getInt32(e+8,!0);clearTimeout(this._scheduledTimeouts.get(t)),this._scheduledTimeouts.delete(t)},"runtime.getRandomData":e=>{e>>>=0,crypto.getRandomValues(n(e+8))},"syscall/js.finalizeRef":e=>{e>>>=0;const t=this.mem.getUint32(e+8,!0);if(this._goRefCounts[t]--,0===this._goRefCounts[t]){const e=this._values[t];this._values[t]=null,this._ids.delete(e),this._idPool.push(t)}},"syscall/js.stringVal":e=>{l(24+(e>>>=0),a(e+8))},"syscall/js.valueGet":e=>{e>>>=0;const t=Reflect.get(o(e+8),a(e+16));e=this._inst.exports.getsp()>>>0,l(e+32,t)},"syscall/js.valueSet":e=>{e>>>=0,Reflect.set(o(e+8),a(e+16),o(e+32))},"syscall/js.valueDelete":e=>{e>>>=0,Reflect.deleteProperty(o(e+8),a(e+16))},"syscall/js.valueIndex":e=>{l(24+(e>>>=0),Reflect.get(o(e+8),t(e+16)))},"syscall/js.valueSetIndex":e=>{e>>>=0,Reflect.set(o(e+8),t(e+16),o(e+24))},"syscall/js.valueCall":e=>{e>>>=0;try{const t=o(e+8),s=Reflect.get(t,a(e+16)),i=r(e+32),n=Reflect.apply(s,t,i);e=this._inst.exports.getsp()>>>0,l(e+56,n),this.mem.setUint8(e+64,1)}catch(t){e=this._inst.exports.getsp()>>>0,l(e+56,t),this.mem.setUint8(e+64,0)}},"syscall/js.valueInvoke":e=>{e>>>=0;try{const t=o(e+8),s=r(e+16),i=Reflect.apply(t,void 0,s);e=this._inst.exports.getsp()>>>0,l(e+40,i),this.mem.setUint8(e+48,1)}catch(t){e=this._inst.exports.getsp()>>>0,l(e+40,t),this.mem.setUint8(e+48,0)}},"syscall/js.valueNew":e=>{e>>>=0;try{const t=o(e+8),s=r(e+16),i=Reflect.construct(t,s);e=this._inst.exports.getsp()>>>0,l(e+40,i),this.mem.setUint8(e+48,1)}catch(t){e=this._inst.exports.getsp()>>>0,l(e+40,t),this.mem.setUint8(e+48,0)}},"syscall/js.valueLength":t=>{e(16+(t>>>=0),parseInt(o(t+8).length))},"syscall/js.valuePrepareString":t=>{t>>>=0;const i=s.encode(String(o(t+8)));l(t+16,i),e(t+24,i.length)},"syscall/js.valueLoadString":e=>{const t=o(8+(e>>>=0));n(e+16).set(t)},"syscall/js.valueInstanceOf":e=>{e>>>=0,this.mem.setUint8(e+24,o(e+8)instanceof o(e+16)?1:0)},"syscall/js.copyBytesToGo":t=>{const s=n(8+(t>>>=0)),i=o(t+32);if(!(i instanceof Uint8Array||i instanceof Uint8ClampedArray))return void this.mem.setUint8(t+48,0);const l=i.subarray(0,s.length);s.set(l),e(t+40,l.length),this.mem.setUint8(t+48,1)},"syscall/js.copyBytesToJS":t=>{const s=o(8+(t>>>=0)),i=n(t+16);if(!(s instanceof Uint8Array||s instanceof Uint8ClampedArray))return void this.mem.setUint8(t+48,0);const l=i.subarray(0,s.length);s.set(l),e(t+40,l.length),this.mem.setUint8(t+48,1)},debug:e=>{console.log(e)}}}}async run(e){if(!(e instanceof WebAssembly.Instance))throw new Error("Go.run: WebAssembly.Instance expected");this._inst=e,this.mem=new DataView(this._inst.exports.mem.buffer),this._values=[NaN,0,null,!0,!1,global,this],this._goRefCounts=new Array(this._values.length).fill(1/0),this._ids=new Map([[0,1],[null,2],[!0,3],[!1,4],[global,5],[this,6]]),this._idPool=[],this.exited=!1;let t=4096;const i=e=>{const i=t,o=s.encode(e+"\0");return new Uint8Array(this.mem.buffer,t,o.length).set(o),t+=o.length,t%8!=0&&(t+=8-t%8),i},o=this.argv.length,l=[];this.argv.forEach((e=>{l.push(i(e))})),l.push(0),Object.keys(this.env).sort().forEach((e=>{l.push(i(`${e}=${this.env[e]}`))})),l.push(0);const n=t;if(l.forEach((e=>{this.mem.setUint32(t,e,!0),this.mem.setUint32(t+4,0,!0),t+=8})),t>=8192)throw new Error("command line too long");this._inst.exports.run(o,n),this.exited&&this._resolveExitPromise(),await this._exitPromise}_resume(){if(this.exited)throw new Error("Go program has already exited");this._inst.exports.resume(),this.exited&&this._resolveExitPromise()}_makeFuncWrapper(e){const t=this;return function(){const s={id:e,this:this,args:arguments};return t._pendingEvent=s,t._resume(),s.result}}},"undefined"!=typeof module&&global.require&&global.require.main===module&&global.process&&global.process.versions&&!global.process.versions.electron){process.argv.length<3&&(console.error("usage: go_js_wasm_exec [wasm binary] [arguments]"),process.exit(1));const e=new Go;e.argv=process.argv.slice(2),e.env=Object.assign({TMPDIR:require("os").tmpdir()},process.env),e.exit=process.exit,WebAssembly.instantiate(fs.readFileSync(process.argv[2]),e.importObject).then((t=>(process.on("exit",(t=>{0!==t||e.exited||(e._pendingEvent={id:0},e._resume())})),e.run(t.instance)))).catch((e=>{console.error(e),process.exit(1)}))}};